"""
Thin wrapper around the dhanhq SDK.
All raw API calls live here; the rest of the engine uses this interface.
"""

import os
import logging
from dhanhq import DhanContext, Order, Portfolio, Funds, TraderControl

logger = logging.getLogger(__name__)

_PROXY_SANITY_URL = "https://api.ipify.org"


class DhanClient:
    def __init__(self, use_proxy: bool = False):
        client_id = os.environ["DHAN_CLIENT_ID"]
        access_token = os.environ["DHAN_ACCESS_TOKEN"]

        if use_proxy:
            self._configure_proxy()
        else:
            logger.info("Proxy disabled — using direct connection")

        # dhanhq v2.2.x: DhanContext + service classes
        self._ctx = DhanContext(client_id, access_token)
        self._order = Order(self._ctx)
        self._portfolio = Portfolio(self._ctx)
        self._funds = Funds(self._ctx)
        self._trader = TraderControl(self._ctx)
        logger.info("DhanClient initialised (client_id=%s)", client_id)

    @staticmethod
    def _configure_proxy():
        """
        Configure HTTP(S)_PROXY env vars for the requests library.
        The dhanhq SDK uses `requests` internally and respects these vars.
        Never log the full proxy URL — it contains credentials.
        """
        import time
        import requests
        
        user = os.environ.get("BRD_PROXY_USER")
        password = os.environ.get("BRD_PROXY_PASS")
        host = os.environ.get("BRD_PROXY_HOST", "brd.superproxy.io")
        port = os.environ.get("BRD_PROXY_PORT", "33335")
        pin_ip = os.environ.get("BRD_PIN_IP")
        
        import socket, subprocess
        if host == "brd.superproxy.io":
            try:
                out = subprocess.check_output(f"nslookup {host}", text=True, shell=True)
                found_name = False
                for line in out.splitlines():
                    if "Name:" in line:
                        found_name = True
                    elif found_name and "Address" in line:
                        parts = line.split()
                        if len(parts) >= 2:
                            host = parts[-1].strip()
                            break
            except Exception:
                pass

        if not user or not password:
            logger.error(
                "Proxy enabled in config but BRD_PROXY_USER / BRD_PROXY_PASS "
                "are missing in .env. Bailing out for safety."
            )
            raise RuntimeError("Proxy enabled but credentials missing")

        # Append pinned IP suffix so Bright Data routes through the static IP
        # that Dhan has whitelisted. BRD_PIN_IP must match exactly.
        if pin_ip:
            user = f"{user}-ip-{pin_ip}"

        proxy_url = f"http://{user}:{password}@{host}:{port}"
        os.environ["HTTP_PROXY"] = proxy_url
        os.environ["HTTPS_PROXY"] = proxy_url
        os.environ["http_proxy"] = proxy_url
        os.environ["https_proxy"] = proxy_url

        logger.info("Proxy configured: %s:%s (credentials masked)", host, port)

        DhanClient._verify_proxy_ip(pin_ip)

    @staticmethod
    def _verify_proxy_ip(pin_ip: str | None):
        """
        One-time sanity check: confirm the proxy is routing through the expected IP.
        Two retries with 1s backoff. Raises RuntimeError on failure.
        Never logs the proxy URL or password.
        """
        import time
        import requests

        last_exc = None
        for attempt in range(3):
            try:
                resp = requests.get(_PROXY_SANITY_URL, timeout=10)
                resp.raise_for_status()
                actual_ip = resp.text.strip()
                logger.info("Proxy sanity check passed: routing through IP %s", actual_ip)

                if pin_ip and actual_ip != pin_ip:
                    raise RuntimeError(
                        f"Proxy is routing through {actual_ip} but expected "
                        f"{pin_ip}. Dhan will reject orders. Check zone configuration."
                    )
                return
            except RuntimeError:
                raise
            except Exception as exc:
                last_exc = exc
                if attempt < 2:
                    logger.warning(
                        "Proxy sanity check attempt %d/3 failed: %s — retrying in 1s",
                        attempt + 1, exc,
                    )
                    time.sleep(1)

        raise RuntimeError(
            "Bright Data proxy unreachable. Check BRD_* in .env and that your "
            "laptop IP is allowed in Bright Data's account allowlist (or that the "
            "allowlist is empty)."
        ) from last_exc

    # ------------------------------------------------------------------
    # Account
    # ------------------------------------------------------------------

    def get_fund_limits(self) -> dict:
        return self._funds.get_fund_limits()

    # ------------------------------------------------------------------
    # Positions
    # ------------------------------------------------------------------

    def get_positions(self) -> list[dict]:
        """Return list of position dicts from Dhan."""
        resp = self._portfolio.get_positions()
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
        resp = self._order.get_order_list()
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
        return self._order.cancel_order(order_id)

    def place_exit_order(self, security_id, exchange_segment,
                         transaction_type, quantity, product_type) -> dict:
        return self._order.place_order(
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
        return self._trader.kill_switch("ACTIVATE")
