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

    def execute_killswitch_sequence(self) -> bool:
        """
        Full sequence: cancel → flatten → activate kill switch.
        Returns True if sequence completed successfully (or dry_run=True).
        """
        prefix = "[DRY-RUN] " if self.dry_run else ""
        logger.info("%sStarting kill-switch sequence", prefix)

        self._cancel_pending_orders()
        self._flatten_positions()

        if not self.dry_run:
            flat = self._wait_for_flat()
            if not flat:
                logger.error("Positions did not flatten within %ds — aborting killswitch activation", FLATTEN_MAX_WAIT)
                return False

        self._activate_kill_switch()
        return True

    # ------------------------------------------------------------------
    # Step 1: Cancel pending orders
    # ------------------------------------------------------------------

    def _cancel_pending_orders(self):
        if self.dry_run:
            pending = self._client.get_pending_orders()
            logger.info("[DRY-RUN] Would cancel %d pending orders: %s",
                        len(pending),
                        [o.get("orderId") for o in pending])
            return

        pending = self._client.get_pending_orders()
        if not pending:
            logger.info("No pending orders to cancel")
            return

        logger.info("Cancelling %d pending orders", len(pending))
        for order in pending:
            order_id = order.get("orderId")
            try:
                resp = self._client.cancel_order(order_id)
                logger.info("Cancelled order %s: %s", order_id, resp)
            except Exception as exc:
                logger.error("Failed to cancel order %s: %s", order_id, exc)

    # ------------------------------------------------------------------
    # Step 2: Flatten all open positions
    # ------------------------------------------------------------------

    def _flatten_positions(self):
        positions = self._client.get_positions()
        open_positions = [p for p in positions if int(p.get("netQty", 0) or 0) != 0]

        if not open_positions:
            logger.info("No open positions to flatten")
            return

        if self.dry_run:
            logger.info("[DRY-RUN] Would flatten %d positions:", len(open_positions))
            for pos in open_positions:
                side = "SELL" if int(pos.get("netQty", 0)) > 0 else "BUY"
                logger.info("  [DRY-RUN] %s %s qty=%s @ MARKET",
                            side, pos.get("tradingSymbol"), abs(int(pos.get("netQty", 0))))
            return

        logger.info("Flattening %d open positions", len(open_positions))
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
                logger.info("Flatten order placed for %s (qty=%d): %s", symbol, abs(net_qty), resp)
            except Exception as exc:
                logger.error("Failed to flatten position %s: %s", symbol, exc)

    # ------------------------------------------------------------------
    # Step 3: Wait for flat
    # ------------------------------------------------------------------

    def _wait_for_flat(self) -> bool:
        deadline = time.monotonic() + FLATTEN_MAX_WAIT
        while time.monotonic() < deadline:
            positions = self._client.get_positions()
            open_pos = [p for p in positions if int(p.get("netQty", 0) or 0) != 0]
            if not open_pos:
                logger.info("All positions are flat")
                return True
            logger.info("Waiting for %d positions to go flat...", len(open_pos))
            time.sleep(FLATTEN_POLL_INTERVAL)
        return False

    # ------------------------------------------------------------------
    # Step 4: Activate kill switch
    # ------------------------------------------------------------------

    def _activate_kill_switch(self):
        if self.dry_run:
            logger.info("[DRY-RUN] Would call dhan.kill_switch('ACTIVATE')")
            return
        try:
            resp = self._client.activate_kill_switch()
            logger.info("Kill switch activated: %s", resp)
        except Exception as exc:
            logger.error("Failed to activate kill switch: %s", exc)
            raise
