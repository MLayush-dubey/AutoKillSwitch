"""
Preflight check — run this every morning before market open.

Verifies:
  1. Bright Data proxy is reachable and routing through the pinned IP.
  2. Dhan API accepts requests through the proxy (get_fund_limits succeeds).

Usage:
    python scripts/preflight.py

Exit 0 if both checks pass, 1 otherwise.
"""

import os
import sys

# Ensure project root is on path when run as a script
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv()

import requests


def _redact(value: str | None, keep: int = 4) -> str:
    if not value:
        return "(not set)"
    if len(value) <= keep:
        return "*" * len(value)
    return value[:keep] + "*" * (len(value) - keep)


def _parse_zone_info(proxy_user: str | None) -> tuple[str, str]:
    """Extract customer_id and zone_name from BRD_PROXY_USER."""
    if not proxy_user:
        return "(not set)", "(not set)"
    # Format: brd-customer-{customer_id}-zone-{zone_name}[-ip-{ip}]
    parts = proxy_user.split("-zone-")
    zone_part = parts[1].split("-ip-")[0] if len(parts) > 1 else "(unknown)"
    cust_part = parts[0].replace("brd-customer-", "") if parts[0].startswith("brd-customer-") else parts[0]
    return cust_part, zone_part


def check_proxy_ip(proxy_user: str, proxy_pass: str, proxy_host: str,
                   proxy_port: str, pin_ip: str | None) -> bool:
    username = proxy_user
    if pin_ip:
        username = f"{proxy_user}-ip-{pin_ip}"

    proxies = {
        "http": f"http://{username}:{proxy_pass}@{proxy_host}:{proxy_port}",
        "https": f"http://{username}:{proxy_pass}@{proxy_host}:{proxy_port}",
    }

    print("\n[Step 1] Checking proxy IP via api.ipify.org ...")
    try:
        resp = requests.get("https://api.ipify.org", proxies=proxies, timeout=15)
        resp.raise_for_status()
        actual_ip = resp.text.strip()
        print(f"  Resolved IP : {actual_ip}")

        if pin_ip:
            if actual_ip == pin_ip:
                print(f"  Expected IP : {pin_ip}  [OK]  PASS")
                return True
            else:
                print(f"  Expected IP : {pin_ip}  [X]  FAIL")
                print(
                    "  HINT: The proxy is not routing through your pinned IP. "
                    "Check the Bright Data zone configuration and that BRD_PIN_IP is correct."
                )
                return False
        else:
            print("  BRD_PIN_IP not set — skipping IP match check.  PASS (partial)")
            return True
    except Exception as exc:
        print(f"  [X]  FAIL: {exc}")
        return False

def check_dhan_api() -> bool:        
    print("\n[Step 2] Calling Dhan get_fund_limits() through proxy ...")
    try:
        from dhanhq import DhanContext, Funds
        client_id = os.environ.get("DHAN_CLIENT_ID", "")
        access_token = os.environ.get("DHAN_ACCESS_TOKEN", "")
        if not client_id or not access_token:
            print("  [X]  FAIL: DHAN_CLIENT_ID or DHAN_ACCESS_TOKEN not set in .env")
            return False
        ctx = DhanContext(client_id, access_token)
        funds = Funds(ctx)
        result = funds.get_fund_limits()
        if isinstance(result, dict) and result.get("status") == "failure":
            error_code = result.get("errorCode", "")
            print(f"  [X]  FAIL: Dhan returned error: {result}")
            if "DH-905" in str(error_code) or "905" in str(error_code):
                print(
                    "  HINT: DH-905 means Dhan has not whitelisted the proxy IP yet. "
                    "Log in to Dhan's API console and whitelist the IP shown in Step 1."
                )
            return False
        print(f"  Response: {result}")
        print("  [OK]  PASS")
        return True
    except Exception as exc:
        print(f"  [X]  FAIL: {exc}")
        return False
        return False


def main():
    proxy_user = os.environ.get("BRD_PROXY_USER", "")
    proxy_pass = os.environ.get("BRD_PROXY_PASS", "")
    proxy_host = os.environ.get("BRD_PROXY_HOST", "brd.superproxy.io")
    proxy_port = os.environ.get("BRD_PROXY_PORT", "33335")
    pin_ip = os.environ.get("BRD_PIN_IP") or None

    # Force nslookup bypass for Bright Data's massive DNS records since Windows native DNS fails intermittently
    import socket, subprocess
    if proxy_host == "brd.superproxy.io":
        try:
            out = subprocess.check_output(f"nslookup {proxy_host}", text=True, shell=True)
            found_name = False
            for line in out.splitlines():
                if "Name:" in line:
                    found_name = True
                elif found_name and "Address" in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        proxy_host = parts[-1].strip()
                        break
        except Exception:
            pass

    customer_id, zone_name = _parse_zone_info(proxy_user)

    print("=" * 60)
    print("Dhan KillSwitch — Preflight Check")
    print("=" * 60)
    print(f"  Customer ID : {customer_id}")
    print(f"  Zone        : {zone_name}")
    print(f"  Gateway     : {proxy_host}:{proxy_port}")
    print(f"  Pinned IP   : {pin_ip or '(not set)'}")
    print(f"  Proxy user  : {_redact(proxy_user, 20)}")

    if not proxy_user or not proxy_pass:
        print("\n[X]  FAIL: BRD_PROXY_USER or BRD_PROXY_PASS not set in .env")
        sys.exit(1)

    # Wire proxy into env so dhanhq SDK picks it up for Step 2
    username = proxy_user
    if pin_ip:
        username = f"{proxy_user}-ip-{pin_ip}"
    proxy_url = f"http://{username}:{proxy_pass}@{proxy_host}:{proxy_port}"
    os.environ["HTTP_PROXY"] = proxy_url
    os.environ["HTTPS_PROXY"] = proxy_url
    os.environ["http_proxy"] = proxy_url
    os.environ["https_proxy"] = proxy_url

    step1 = check_proxy_ip(proxy_user, proxy_pass, proxy_host, proxy_port, pin_ip)
    step2 = check_dhan_api()

    print("\n" + "=" * 60)
    if step1 and step2:
        print("All checks PASSED. System is ready for live trading.")
        sys.exit(0)
    else:
        failed = [s for s, ok in [("Step 1 (proxy IP)", step1), ("Step 2 (Dhan API)", step2)] if not ok]
        print(f"FAILED checks: {', '.join(failed)}")
        print("Resolve the issues above before starting main.py in live mode.")
        sys.exit(1)


if __name__ == "__main__":
    main()
