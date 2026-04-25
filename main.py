"""
Dhan KillSwitch — entry point.

Usage:
    python main.py                 # runs with config.yaml (dry_run: true by default)
    python main.py --live          # override dry_run → False (CAUTION: live trading)
    python main.py --no-proxy      # disable proxy override (WILL cause DH-905 in live)
"""

import argparse
import logging
import os
import sys

import yaml
from dotenv import load_dotenv

# Load .env before importing engine (engine reads env vars at init)
load_dotenv()


def setup_logging(log_dir: str):
    os.makedirs(log_dir, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )


def load_config(path: str = "config.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def main():
    parser = argparse.ArgumentParser(description="Dhan KillSwitch Monitor")
    parser.add_argument("--config", default="config.yaml", help="Path to config file")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Override dry_run=false (executes real orders & kill switch)",
    )
    parser.add_argument(
        "--no-proxy",
        action="store_true",
        dest="no_proxy",
        help="Disable proxy (overrides config). WARNING: orders WILL fail with DH-905 in live trading.",
    )
    args = parser.parse_args()

    config = load_config(args.config)

    if args.live:
        config.setdefault("safety", {})["dry_run"] = False

    if args.no_proxy:
        config.setdefault("proxy", {})["enabled"] = False

    dry_run = config.get("safety", {}).get("dry_run", True)
    use_proxy = config.get("proxy", {}).get("enabled", True)
    log_dir = config.get("logging", {}).get("log_dir", "logs")
    setup_logging(log_dir)

    logger = logging.getLogger(__name__)
    logger.info("=== Dhan KillSwitch starting (%s) ===", "DRY-RUN" if dry_run else "LIVE")

    if not dry_run:
        logger.warning("LIVE MODE ENABLED — real orders will be placed and kill switch will fire!")

    if args.no_proxy:
        print(
            "\nWARNING: Running without proxy — orders WILL fail with DH-905 in live trading.\n",
            flush=True,
        )

    # Validate proxy credentials before attempting to start
    if use_proxy:
        missing = [
            v for v in ("BRD_PROXY_USER", "BRD_PROXY_PASS", "BRD_PIN_IP")
            if not os.environ.get(v)
        ]
        if missing:
            logger.error(
                "Proxy is enabled but the following required env vars are missing: %s. "
                "Set them in .env or pass --no-proxy (not recommended for live trading).",
                ", ".join(missing),
            )
            sys.exit(1)

    # Import here so env is loaded first
    from engine.dhan_client import DhanClient
    from engine.executor import Executor
    from engine.monitor import Monitor
    from engine.rules import RuleEngine
    from notifications import build_notifiers

    client = DhanClient(use_proxy=use_proxy)
    rule_engine = RuleEngine(config["rules"])
    executor = Executor(client, dry_run=dry_run)
    notifiers = build_notifiers(config)

    monitor = Monitor(
        client=client,
        rule_engine=rule_engine,
        executor=executor,
        notifiers=notifiers,
        config=config,
    )

    try:
        monitor.run()
    except KeyboardInterrupt:
        logger.info("KillSwitch monitor stopped by user (Ctrl+C)")


if __name__ == "__main__":
    main()
