"""
Executor: the action sequence when a rule triggers.

Order of operations (CRITICAL — Dhan requires this):
  1. Cancel all pending/open orders
  2. Close all open positions (place opposite market orders)
  3. Wait until net qty == 0 for all positions
  4. Activate kill switch
"""

import logging
import time

from engine.dhan_client import DhanClient

logger = logging.getLogger(__name__)

FLATTEN_POLL_INTERVAL = 2    # seconds between position checks while waiting to flatten
FLATTEN_MAX_WAIT = 120       # seconds max to wait for positions to go flat


class Executor:
    def __init__(self, client: DhanClient, dry_run: bool = True):
        self._client = client
        self.dry_run = dry_run

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def execute_killswitch_sequence(self) -> dict:
        """
        Full sequence: cancel → flatten → activate kill switch.
        Returns a structured result dict describing what happened.

        Manual test: if all flatten orders return DH-905 (status != "success")
        but positions later go to zero because the user intervenes manually,
        fully_automated will be False even though positions_went_flat=True.
        This is by design — we distinguish automated success from a lucky outcome.
        """
        prefix = "[DRY-RUN] " if self.dry_run else ""
        logger.info("%sStarting kill-switch sequence", prefix)

        cancel_attempted, cancel_succeeded = self._cancel_pending_orders()
        flatten_attempted, flatten_succeeded = self._flatten_positions()

        positions_went_flat = False
        auto_flattened = False
        kill_switch_called = False
        kill_switch_was_already_on = False

        if self.dry_run:
            positions_went_flat = True
            auto_flattened = flatten_succeeded > 0
            kill_switch_called = True
        else:
            positions_went_flat, auto_flattened = self._wait_for_flat(flatten_succeeded)
            if not positions_went_flat:
                logger.error(
                    "Positions did not flatten within %ds — aborting killswitch activation",
                    FLATTEN_MAX_WAIT,
                )
            else:
                kill_switch_called, kill_switch_was_already_on = self._activate_kill_switch()

        fully_automated = (
            flatten_attempted > 0
            and flatten_attempted == flatten_succeeded
            and positions_went_flat
            and kill_switch_called
            and not kill_switch_was_already_on
        )

        return {
            "orders_cancelled_attempted": cancel_attempted,
            "orders_cancelled_succeeded": cancel_succeeded,
            "flatten_attempted": flatten_attempted,
            "flatten_succeeded": flatten_succeeded,
            "positions_went_flat": positions_went_flat,
            "auto_flattened": auto_flattened,
            "kill_switch_called": kill_switch_called,
            "kill_switch_was_already_on": kill_switch_was_already_on,
            "fully_automated": fully_automated,
        }

    # ------------------------------------------------------------------
    # Step 1: Cancel pending orders
    # ------------------------------------------------------------------

    def _cancel_pending_orders(self) -> tuple[int, int]:
        pending = self._client.get_pending_orders()

        if self.dry_run:
            logger.info("[DRY-RUN] Would cancel %d pending orders: %s",
                        len(pending),
                        [o.get("orderId") for o in pending])
            return len(pending), len(pending)

        if not pending:
            logger.info("No pending orders to cancel")
            return 0, 0

        logger.info("Cancelling %d pending orders", len(pending))
        attempted = len(pending)
        succeeded = 0
        for order in pending:
            order_id = order.get("orderId")
            try:
                resp = self._client.cancel_order(order_id)
                logger.info("Cancelled order %s: %s", order_id, resp)
                succeeded += 1
            except Exception as exc:
                logger.error("Failed to cancel order %s: %s", order_id, exc)
        return attempted, succeeded

    # ------------------------------------------------------------------
    # Step 2: Flatten all open positions
    # ------------------------------------------------------------------

    def _flatten_positions(self) -> tuple[int, int]:
        positions = self._client.get_positions()
        open_positions = [p for p in positions if int(p.get("netQty", 0) or 0) != 0]

        if not open_positions:
            logger.info("No open positions to flatten")
            return 0, 0

        if self.dry_run:
            logger.info("[DRY-RUN] Would flatten %d positions:", len(open_positions))
            for pos in open_positions:
                side = "SELL" if int(pos.get("netQty", 0)) > 0 else "BUY"
                logger.info("  [DRY-RUN] %s %s qty=%s @ MARKET",
                            side, pos.get("tradingSymbol"), abs(int(pos.get("netQty", 0))))
            return len(open_positions), len(open_positions)

        logger.info("Flattening %d open positions", len(open_positions))
        attempted = len(open_positions)
        succeeded = 0
        for pos in open_positions:
            net_qty = int(pos.get("netQty", 0) or 0)
            if net_qty == 0:
                continue
            closing_side = "SELL" if net_qty > 0 else "BUY"
            symbol = pos.get("tradingSymbol")
            security_id = pos.get("securityId")
            exchange = pos.get("exchangeSegment")

            try:
                resp = self._client.place_exit_order(
                    security_id=security_id,
                    exchange_segment=exchange,
                    transaction_type=closing_side,
                    quantity=abs(net_qty),
                    product_type=pos.get("productType", "INTRADAY"),
                )
                if resp.get("status") == "success":
                    succeeded += 1
                    logger.info("Flatten order placed for %s (qty=%d): %s", symbol, abs(net_qty), resp)
                else:
                    error_code = resp.get("errorCode") or resp.get("error_code", "UNKNOWN")
                    error_msg = resp.get("errorMessage") or resp.get("error_message", "No details")
                    logger.error(
                        "Flatten order FAILED for %s: error_code=%s message=%s",
                        symbol, error_code, error_msg,
                    )
            except Exception as exc:
                logger.error("Failed to flatten position %s: %s", symbol, exc)
        return attempted, succeeded

    # ------------------------------------------------------------------
    # Step 3: Wait for flat
    # ------------------------------------------------------------------

    def _wait_for_flat(self, flatten_succeeded: int) -> tuple[bool, bool]:
        auto = flatten_succeeded > 0
        deadline = time.monotonic() + FLATTEN_MAX_WAIT
        while time.monotonic() < deadline:
            positions = self._client.get_positions()
            open_pos = [p for p in positions if int(p.get("netQty", 0) or 0) != 0]
            if not open_pos:
                logger.info("All positions are flat")
                if not auto:
                    logger.warning(
                        "Positions went flat but no flatten order succeeded — "
                        "likely manual intervention by user."
                    )
                return True, auto
            logger.info("Waiting for %d positions to go flat...", len(open_pos))
            time.sleep(FLATTEN_POLL_INTERVAL)
        return False, auto

    # ------------------------------------------------------------------
    # Step 4: Activate kill switch
    # ------------------------------------------------------------------

    def _activate_kill_switch(self) -> tuple[bool, bool]:
        if self.dry_run:
            logger.info("[DRY-RUN] Would call dhan.kill_switch('ACTIVATE')")
            return True, False
        try:
            resp = self._client.activate_kill_switch()
            kill_switch_status = (resp.get("data") or {}).get("killSwitchStatus", "")
            was_already_on = kill_switch_status == "Kill Switch is already activated"
            if was_already_on:
                logger.warning("Kill switch was already activated: %s", resp)
            else:
                logger.info("Kill switch activated: %s", resp)
            return True, was_already_on
        except Exception as exc:
            logger.error("Failed to activate kill switch: %s", exc)
            raise
