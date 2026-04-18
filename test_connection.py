"""
test_connection.py — verify Dhan API connectivity.

Connects using credentials from .env, then fetches:
  - Fund limits
  - Positions
  - Order book

Prints results. Empty responses are fine for sandbox.
"""

import os
import sys
import json

from dotenv import load_dotenv

load_dotenv()


def check_env():
    missing = [v for v in ("DHAN_CLIENT_ID", "DHAN_ACCESS_TOKEN") if not os.environ.get(v)]
    if missing:
        print(f"ERROR: Missing env vars: {missing}")
        print("Make sure .env has DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN set.")
        sys.exit(1)
    print(f"  Client ID : {os.environ['DHAN_CLIENT_ID']}")
    print(f"  Token     : {os.environ['DHAN_ACCESS_TOKEN'][:8]}...****")


def pretty(label: str, data):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str))
    else:
        print(data)


def main():
    print("\n=== Dhan API Connection Test ===\n")

    print("[1] Checking environment variables...")
    check_env()

    print("\n[2] Initialising DhanClient...")
    from engine.dhan_client import DhanClient
    client = DhanClient()
    print("  OK — DhanClient created")

    print("\n[3] Fetching fund limits...")
    try:
        funds = client.get_fund_limits()
        pretty("Fund Limits", funds)
    except Exception as exc:
        print(f"  ERROR: {exc}")

    print("\n[4] Fetching positions...")
    try:
        positions = client.get_positions()
        pretty("Positions", positions)
        pnl = client.compute_pnl()
        print(f"\n  Computed P&L: {pnl:.2f}")
    except Exception as exc:
        print(f"  ERROR: {exc}")

    print("\n[5] Fetching order list...")
    try:
        orders = client.get_order_list()
        pretty("Orders", orders)
        traded = client.count_traded_orders()
        pending = client.get_pending_orders()
        print(f"\n  Traded orders : {traded}")
        print(f"  Pending orders: {len(pending)}")
    except Exception as exc:
        print(f"  ERROR: {exc}")

    print("\n[6] Checking kill switch status...")
    try:
        ks_status = client.get_kill_switch_status()
        pretty("Kill Switch Status", ks_status)
    except Exception as exc:
        print(f"  ERROR: {exc}")

    print("\n=== Connection test complete ===\n")


if __name__ == "__main__":
    main()
