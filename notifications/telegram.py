"""Telegram notifier — sends messages via Telegram Bot API."""

import logging
import os

import requests

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


class TelegramNotifier:
    def __init__(self, bot_token: str = "", chat_id: str = ""):
        # Allow override via environment variables
        self._bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", bot_token)
        self._chat_id = os.environ.get("TELEGRAM_CHAT_ID", chat_id)

        if not self._bot_token or not self._chat_id:
            raise ValueError(
                "Telegram notifier requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. "
                "Set them in .env or config.yaml."
            )

    def send(self, message: str):
        url = TELEGRAM_API_URL.format(token=self._bot_token)
        payload = {
            "chat_id": self._chat_id,
            "text": f"KillSwitch Alert\n\n{message}",
            "parse_mode": "HTML",
        }
        try:
            resp = requests.post(url, json=payload, timeout=10)
            resp.raise_for_status()
            logger.info("Telegram notification sent (chat_id=%s)", self._chat_id)
        except requests.RequestException as exc:
            logger.error("Telegram notification failed: %s", exc)
            raise
