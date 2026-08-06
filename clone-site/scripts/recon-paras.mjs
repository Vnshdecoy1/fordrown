import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = [];
    const q = (el, d) => {
      if (!el || d > 12) return;
      if (el.tagName === 'P') { const t = el.textContent.trim(); if (t && t.length > 30) out.push(t.slice(0, 500)); }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify([...new Set(out)]);
  })()`);
  console.log(r);
});
