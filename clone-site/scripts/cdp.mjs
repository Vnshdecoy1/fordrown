import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PORT = 9222;

async function getTab() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json`);
  const tabs = await res.json();
  const page = tabs.find((t) => t.type === 'page' && !t.url.startsWith('chrome-'));
  if (!page) throw new Error('No page tab found: ' + JSON.stringify(tabs.map((t) => t.url)));
  return page;
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
  }
  static async connect() {
    const tab = await getTab();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (e) => reject(new Error('WS error: ' + (e?.message || 'unknown')));
    });
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    return cdp;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('JS error: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
    }
    return res.result?.value;
  }
  async navigate(url) {
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 4000));
  }
  async setViewport(width, height, dpr = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: false,
    });
  }
  async screenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log('screenshot ->', outPath);
  }
  async close() {
    try {
      this.ws.close();
    } catch {}
  }
}

export async function mainScript(runner) {
  const cdp = await CDP.connect();
  try {
    await runner(cdp);
  } finally {
    await cdp.close();
  }
}
