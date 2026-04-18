"""Console notifier — prints messages to stdout with a timestamp."""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConsoleNotifier:
    def send(self, message: str):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{ts}] KILLSWITCH ALERT: {message}")
        logger.info("Console notification sent: %s", message)
