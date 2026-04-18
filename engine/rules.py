"""
Rule evaluation logic.
Returns TRIGGER / WARNING / OK decisions without side-effects.
"""

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class Decision(Enum):
    OK = "ok"
    WARN = "warn"
    TRIGGER = "trigger"


@dataclass
class EvalResult:
    decision: Decision
    rule: Optional[str] = None    # which rule fired
    message: str = ""
    pnl: float = 0.0
    trade_count: int = 0


class RuleEngine:
    def __init__(self, rules_cfg: dict):
        self.max_loss = float(rules_cfg["max_loss"])          # e.g. -5000
        self.max_profit = float(rules_cfg["max_profit"])      # e.g. +10000
        self.max_trades = int(rules_cfg["max_trades"])        # e.g. 10

        self.warn_loss_pct = float(rules_cfg.get("warn_loss_pct", 0.80))
        self.warn_profit_pct = float(rules_cfg.get("warn_profit_pct", 0.80))
        self.warn_trades_pct = float(rules_cfg.get("warn_trades_pct", 0.80))
        self.warn_cooldown = int(rules_cfg.get("warn_cooldown_seconds", 300))

        # Track last warning time per rule key to avoid spamming
        self._last_warned: dict[str, float] = {}

    def _can_warn(self, key: str) -> bool:
        """Return True if enough time has passed since the last warning for this key."""
        now = time.monotonic()
        last = self._last_warned.get(key, 0.0)
        if now - last >= self.warn_cooldown:
            self._last_warned[key] = now
            return True
        return False

    def evaluate(self, pnl: float, trade_count: int) -> EvalResult:
        base = EvalResult(decision=Decision.OK, pnl=pnl, trade_count=trade_count)

        # --- TRIGGER checks (hard limits) ---
        if pnl <= self.max_loss:
            return EvalResult(
                decision=Decision.TRIGGER,
                rule="max_loss",
                message=f"P&L {pnl:.2f} hit max-loss limit {self.max_loss:.2f}",
                pnl=pnl,
                trade_count=trade_count,
            )

        if pnl >= self.max_profit:
            return EvalResult(
                decision=Decision.TRIGGER,
                rule="max_profit",
                message=f"P&L {pnl:.2f} hit max-profit limit {self.max_profit:.2f}",
                pnl=pnl,
                trade_count=trade_count,
            )

        if trade_count >= self.max_trades:
            return EvalResult(
                decision=Decision.TRIGGER,
                rule="max_trades",
                message=f"Trade count {trade_count} hit limit {self.max_trades}",
                pnl=pnl,
                trade_count=trade_count,
            )

        # --- WARNING checks (80% thresholds, deduplicated) ---
        warn_loss_threshold = self.max_loss * self.warn_loss_pct
        if pnl <= warn_loss_threshold and self._can_warn("warn_loss"):
            return EvalResult(
                decision=Decision.WARN,
                rule="warn_loss",
                message=f"P&L {pnl:.2f} is at {self.warn_loss_pct*100:.0f}% of max-loss limit ({warn_loss_threshold:.2f})",
                pnl=pnl,
                trade_count=trade_count,
            )

        warn_profit_threshold = self.max_profit * self.warn_profit_pct
        if pnl >= warn_profit_threshold and self._can_warn("warn_profit"):
            return EvalResult(
                decision=Decision.WARN,
                rule="warn_profit",
                message=f"P&L {pnl:.2f} is at {self.warn_profit_pct*100:.0f}% of max-profit limit ({warn_profit_threshold:.2f})",
                pnl=pnl,
                trade_count=trade_count,
            )

        warn_trades_threshold = int(self.max_trades * self.warn_trades_pct)
        if trade_count >= warn_trades_threshold and self._can_warn("warn_trades"):
            return EvalResult(
                decision=Decision.WARN,
                rule="warn_trades",
                message=f"Trade count {trade_count} is at {self.warn_trades_pct*100:.0f}% of limit ({self.max_trades})",
                pnl=pnl,
                trade_count=trade_count,
            )

        return base
