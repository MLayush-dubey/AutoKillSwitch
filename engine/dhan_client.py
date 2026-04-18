"""
Thin wrapper around the dhanhq SDK.
All raw API calls live here; the rest of the engine uses this interface.
"""

import os
import logging
from dhanhq import dhanhq

logger = logging.getLogger(__name__)


class DhanClient:
    def __init__(self, use_proxy: bool = False):
        client_id = os.environ["DHAN_CLIENT_ID"]
        access_token = os.environ["DHAN_ACCESS_TOKEN"]

        if use_proxy:
            self._configure_proxy()
        else:
            logger.info("Proxy disabled — using direct connection")

        # dhanhq v2.0.x constructor: dhanhq(client_id, access_token)
        self._dhan = dhanhq(client_id, access_token)
        logger.info("DhanClient initialised (client_id=%s)", client_id)

    @staticmethod
    def _configure_proxy():
        """
        Configure HTTP(S)_PROXY env vars for the requests library.
        The dhanhq SDK uses `requests` internally and respects these vars.
        Never log the full proxy URL — it contains credentials.
        """
        user = os.environ.get("BRD_PROXY_USER")
        password = os.environ.get("BRD_PROXY_PASS")
        host = os.environ.get("BRD_PROXY_HOST", "brd.superproxy.io")
        port = os.environ.get("BRD_PROXY_PORT", "33335")

        if not user or not password:
            logger.error(
                "Proxy enabled in config but BRD_PROXY_USER / BRD_PROXY_PASS "
                "are missing in .env. Bailing out for safety."
            )
            raise RuntimeError("Proxy enabled but credentials missing")

        proxy_url = f"http://{user}:{password}@{host}:{port}"
        os.environ["HTTP_PROXY"] = proxy_url
        os.environ["HTTPS_PROXY"] = proxy_url
        os.environ["http_proxy"] = proxy_url
        os.environ["https_proxy"] = proxy_url

        logger.info("Proxy configured: %s:%s (credentials masked)", host, port)

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

