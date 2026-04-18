from notifications.console import ConsoleNotifier
from notifications.telegram import TelegramNotifier


def build_notifiers(config: dict) -> list:
    """Factory: return list of enabled notifiers based on config."""
    notifiers = []
    notif_cfg = config.get("notifications", {})

    if notif_cfg.get("console", True):
        notifiers.append(ConsoleNotifier())

    tg = notif_cfg.get("telegram", {})
    if tg.get("enabled", False):
        notifiers.append(TelegramNotifier(
            bot_token=tg.get("bot_token", ""),
            chat_id=tg.get("chat_id", ""),
        ))

    return notifiers


__all__ = ["build_notifiers", "ConsoleNotifier", "TelegramNotifier"]
