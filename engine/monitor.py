"""
Monitor: the main polling loop.

Runs every `poll_interval` seconds during market hours (IST).
Each cycle: fetch P&L + trade count → evaluate rules → act if triggered.
Each cycle result is appended to logs/YYYY-MM-DD.json as newline-delimited JSON.
"""

import json
import logging
import os
import time
from datetime import datetime, date

import pytz

from engine.dhan_client import DhanClient
from engine.executor import Executor
from engine.rules import Decision, RuleEngine

logger = logging.getLogger(__name__)

IST = pytz.timezone("Asia/Kolkata")


class Monitor:
    def __init__(
        self,
        client: DhanClient,
        rule_engine: RuleEngine,
        executor: Executor,
        notifiers: list,
        config: dict,
    ):
        self._client = client
        self._rules = rule_engine
        self._executor = executor
        self._notifiers = notifiers

        mon_cfg = config.get("monitoring", {})
        self._poll_interval = int(mon_cfg.get("poll_interval", 10))
        self._market_open = mon_cfg.get("market_open", "09:15")
        self._market_close = mon_cfg.get("market_close", "15:30")

        log_cfg = config.get("logging", {})
        self._log_dir = log_cfg.get("log_dir", "logs")
        os.makedirs(self._log_dir, exist_ok=True)

        self._dry_run = config.get("safety", {}).get("dry_run", True)
        self._triggered = False

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def run(self):
        mode = "DRY-RUN" if self._dry_run else "LIVE"
        logger.info("Monitor starting [%s] — market hours %s–%s IST, poll every %ds",
                    mode, self._market_open, self._market_close, self._poll_interval)
        self._notify(f"KillSwitch monitor started [{mode}]")

        while True:
            if self._triggered:
                logger.info("Kill switch already triggered today — monitor idle")
                time.sleep(60)
                continue

            now_ist = datetime.now(IST)
            if not self._is_market_hours(now_ist):
                logger.info("Outside market hours (%s IST) — sleeping 30s", now_ist.strftime("%H:%M:%S"))
                time.sleep(30)
                continue

            self._poll_cycle(now_ist)
            time.sleep(self._poll_interval)

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    def _is_market_hours(self, now_ist: datetime) -> bool:
        open_h, open_m = map(int, self._market_open.split(":"))
        close_h, close_m = map(int, self._market_close.split(":"))
        t = now_ist.time()
        from datetime import time as dtime
        return dtime(open_h, open_m) <= t <= dtime(close_h, close_m)

    def _poll_cycle(self, now_ist: datetime):
        cycle_ts = now_ist.isoformat()
        log_entry = {"ts": cycle_ts, "event": "poll"}

        try:
            pnl = self._client.compute_pnl()
            trade_count = self._client.count_traded_orders()
            log_entry.update({"pnl": pnl, "trade_count": trade_count})

            result = self._rules.evaluate(pnl, trade_count)
            log_entry["decision"] = result.decision.value
            log_entry["rule"] = result.rule

            logger.info("[POLL] P&L=%.2f  trades=%d  → %s%s",
                        pnl, trade_count, result.decision.value,
                        f" ({result.rule})" if result.rule else "")

            if result.decision == Decision.WARN:
                self._notify(f"WARNING: {result.message}")
                log_entry["message"] = result.message

            elif result.decision == Decision.TRIGGER:
                log_entry["event"] = "trigger"
                log_entry["message"] = result.message
                logger.warning("TRIGGER: %s", result.message)
                self._notify(f"TRIGGER: {result.message}\nStarting kill-switch sequence...")

                ks_result = self._executor.execute_killswitch_sequence()
                log_entry["kill_switch_result"] = ks_result
                # Backwards-compat key: True only if everything was fully automated.
                kill_switch_success = ks_result.get("fully_automated", False)
                log_entry["kill_switch_success"] = kill_switch_success
                self._triggered = True

                if kill_switch_success:
                    self._notify("Kill switch sequence completed. Monitor stopped for today.")
                else:
                    logger.warning(
                        "Kill switch sequence completed but fully_automated=False — "
                        "manual intervention may have been required. result=%s", ks_result
                    )
                    self._notify("Kill switch sequence FAILED or required manual intervention!")

        except Exception as exc:
            logger.exception("Error in poll cycle: %s", exc)
            log_entry["error"] = str(exc)

        self._write_log(log_entry)

    def _write_log(self, entry: dict):
        today = date.today().isoformat()
        path = os.path.join(self._log_dir, f"{today}.json")
        with open(path, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def _notify(self, message: str):
        for notifier in self._notifiers:
            try:
                notifier.send(message)
            except Exception as exc:
                logger.error("Notifier %s failed: %s", type(notifier).__name__, exc)
