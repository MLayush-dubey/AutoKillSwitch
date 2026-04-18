"""
Dhan API Key Auth Flow — auto token renewal.

Usage:
    python auth_flow.py

Steps:
    1. POST /app/generate-consent  → consentAppId
    2. Open browser for user login → redirect to localhost:8000/callback?tokenId=...
    3. POST /app/consumeApp-consent → access_token
    4. Write new DHAN_ACCESS_TOKEN to .env
"""

import http.server
import os
import re
import sys
import threading
import time
import webbrowser
from urllib.parse import parse_qs, urlparse

import requests
from dotenv import load_dotenv

load_dotenv()

AUTH_BASE = "https://auth.dhan.co"
CALLBACK_HOST = "localhost"
CALLBACK_PORT = 8000
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")


# ─────────────────────────────────────────────────────────────
# Step 1: Generate consent
# ─────────────────────────────────────────────────────────────
def generate_consent(app_id: str, app_secret: str, client_id: str) -> str:
    """POST to generate-consent and return consentAppId."""
    url = f"{AUTH_BASE}/app/generate-consent?client_id={client_id}"
    headers = {
        "Content-Type": "application/json",
        "app_id": app_id,
        "app_secret": app_secret,
    }
    resp = requests.post(url, headers=headers, json={}, timeout=15)
    if resp.status_code != 200:
        print(f"[ERROR] generate-consent returned {resp.status_code}: {resp.text}")
        sys.exit(1)
    data = resp.json()

    consent_app_id = data.get("consentAppId") or data.get("consent_app_id")
    if not consent_app_id:
        print(f"[ERROR] Unexpected response from generate-consent: {data}")
        sys.exit(1)

    print(f"[Step 1] Consent generated → consentAppId = {consent_app_id}")
    return consent_app_id


# ─────────────────────────────────────────────────────────────
# Step 2: Local callback server + browser open
# ─────────────────────────────────────────────────────────────
class _CallbackHandler(http.server.BaseHTTPRequestHandler):
    """Handles the redirect from Dhan after user logs in."""

    token_id: str | None = None  # class-level; set once callback arrives

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        token_id = params.get("tokenId", [None])[0]
        if token_id:
            _CallbackHandler.token_id = token_id
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(
                b"<html><body style='font-family:sans-serif;text-align:center;padding:60px'>"
                b"<h1>&#9989; Token Captured!</h1>"
                b"<p>You can close this tab and return to the terminal.</p>"
                b"</body></html>"
            )
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Missing tokenId in callback")

    # Suppress default request logging
    def log_message(self, format, *args):
        pass


def wait_for_callback(consent_app_id: str) -> str:
    """Start local HTTP server, open browser, and block until tokenId arrives."""
    server = http.server.HTTPServer((CALLBACK_HOST, CALLBACK_PORT), _CallbackHandler)
    server.timeout = 1  # so we can poll _CallbackHandler.token_id

    consent_url = f"{AUTH_BASE}/login/consentApp-login?consentAppId={consent_app_id}"
    print(f"[Step 2] Opening browser for login...\n         {consent_url}")
    webbrowser.open(consent_url)

    print("         Waiting for callback on http://localhost:8000/callback ...")

    # Block until token captured (max 5 minutes)
    deadline = time.monotonic() + 300
    while _CallbackHandler.token_id is None and time.monotonic() < deadline:
        server.handle_request()

    server.server_close()

    if _CallbackHandler.token_id is None:
        print("[ERROR] Timed out waiting for login callback (5 min). Please try again.")
        sys.exit(1)

    print(f"[Step 2] Token ID captured → {_CallbackHandler.token_id[:12]}...")
    return _CallbackHandler.token_id


# ─────────────────────────────────────────────────────────────
# Step 3: Exchange tokenId for access_token
# ─────────────────────────────────────────────────────────────
def consume_consent(app_id: str, app_secret: str, token_id: str) -> str:
    """POST to consumeApp-consent and return access_token."""
    url = f"{AUTH_BASE}/app/consumeApp-consent?tokenId={token_id}"
    headers = {
        "Content-Type": "application/json",
        "app_id": app_id,
        "app_secret": app_secret,
    }
    resp = requests.post(url, headers=headers, json={}, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    access_token = data.get("access_token") or data.get("accessToken")
    if not access_token:
        print(f"[ERROR] Unexpected response from consumeApp-consent: {data}")
        sys.exit(1)

    print(f"[Step 3] Access token received → {access_token[:20]}...")
    return access_token


# ─────────────────────────────────────────────────────────────
# Step 4: Update .env
# ─────────────────────────────────────────────────────────────
def update_env_token(new_token: str):
    """Replace DHAN_ACCESS_TOKEN value in .env file."""
    with open(ENV_FILE, "r") as f:
        content = f.read()

    # Replace existing token line
    if re.search(r"^DHAN_ACCESS_TOKEN=", content, re.MULTILINE):
        content = re.sub(
            r"^DHAN_ACCESS_TOKEN=.*$",
            f"DHAN_ACCESS_TOKEN={new_token}",
            content,
            flags=re.MULTILINE,
        )
    else:
        # Token line doesn't exist yet — add it after DHAN_CLIENT_ID
        content = content.rstrip("\n") + f"\nDHAN_ACCESS_TOKEN={new_token}\n"

    with open(ENV_FILE, "w") as f:
        f.write(content)

    print(f"[Step 4] .env updated with new DHAN_ACCESS_TOKEN")


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
def main():
    app_id = os.environ.get("DHAN_API_KEY")
    app_secret = os.environ.get("DHAN_API_SECRET")
    client_id = os.environ.get("DHAN_CLIENT_ID")

    if not app_id or not app_secret:
        print("[ERROR] DHAN_API_KEY and DHAN_API_SECRET must be set in .env")
        sys.exit(1)
    if not client_id:
        print("[ERROR] DHAN_CLIENT_ID must be set in .env")
        sys.exit(1)

    print("=" * 50)
    print("  Dhan Token Renewal")
    print("=" * 50)
    print()

    # Step 1
    consent_app_id = generate_consent(app_id, app_secret, client_id)

    # Step 2
    token_id = wait_for_callback(consent_app_id)

    # Step 3
    access_token = consume_consent(app_id, app_secret, token_id)

    # Step 4
    update_env_token(access_token)

    print()
    print("✅ Token refreshed successfully!")
    print("   You can now run: python main.py")


if __name__ == "__main__":
    main()
