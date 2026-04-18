"""
Thin wrapper around the dhanhq SDK.
All raw API calls live here; the rest of the engine uses this interface.
"""

import os
import logging
from dhanhq import dhanhq

logger = logging.getLogger(__name__)


class DhanClient:
    def __init__(self):
        client_id = os.environ["DHAN_CLIENT_ID"]
        access_token = os.environ["DHAN_ACCESS_TOKEN"]
        # dhanhq v2.0.x constructor: dhanhq(client_id, access_token)
        self._dhan = dhanhq(client_id, access_token)
        logger.info("DhanClient initialised (client_id=%s)", client_id)

    # ------------------------------------------------------------------
    # Account
    # ------------------------------------------------------------------

    def get_fund_limits(self) -> dict:
        return self._dhan.get_fund_limits()

    # ------------------------------------------------------------------
    # Positions
    # ------------------------------------------------------------------

    def get_positions(self) -> list[dict]:
        """Return list of position dicts from Dhan."""
        resp = self._dhan.get_positions()
        if isinstance(resp, dict):
            data = resp.get("data", [])
            return data if isinstance(data, list) else []
        if isinstance(resp, list):
            return resp
        return []

    def compute_pnl(self) -> float:
        """Sum realizedProfit + unrealizedProfit across all positions."""
        positions = self.get_positions()
        total = 0.0
        for pos in positions:
            if not isinstance(pos, dict):
                continue
            total += float(pos.get("realizedProfit", 0) or 0)
            total += float(pos.get("unrealizedProfit", 0) or 0)
        return total

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------

    def get_order_list(self) -> list[dict]:
        resp = self._dhan.get_order_list()
        if isinstance(resp, dict):
            data = resp.get("data", [])
            return data if isinstance(data, list) else []
        if isinstance(resp, list):
            return resp
        return []

    def count_traded_orders(self) -> int:
        orders = self.get_order_list()
        return sum(1 for o in orders if o.get("orderStatus") == "TRADED")

    def get_pending_orders(self) -> list[dict]:
        pending_statuses = {"PENDING", "OPEN", "TRIGGER_PENDING"}
        return [o for o in self.get_order_list() if o.get("orderStatus") in pending_statuses]

    def cancel_order(self, order_id: str) -> dict:
        return self._dhan.cancel_order(order_id)

    def place_exit_order(self, security_id, exchange_segment,
                         transaction_type, quantity, product_type) -> dict:
        return self._dhan.place_order(
            security_id=security_id,
            exchange_segment=exchange_segment,
            transaction_type=transaction_type,
            quantity=quantity,
            order_type="MARKET",
            product_type=product_type,
            price=0,
        )

    # ------------------------------------------------------------------
    # Kill Switch
    # ------------------------------------------------------------------

    def activate_kill_switch(self) -> dict:
        """Activate Dhan killswitch. Requires zero positions & no pending orders."""
        return self._dhan.kill_switch("ACTIVATE")

    def get_kill_switch_status(self) -> dict:
        return self._dhan.kill_switch("GET_STATUS")
