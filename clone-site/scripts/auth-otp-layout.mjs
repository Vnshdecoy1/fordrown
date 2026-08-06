import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = [];
    const q = (el, d) => {
      if (!el || d > 6) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      const rr = el.getBoundingClientRect();
      if (rr.width > 200 && rr.height > 20 && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
        out.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 100), bg: cs.backgroundColor.slice(0, 26), w: Math.round(rr.width), h: Math.round(rr.height), top: Math.round(rr.top) });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify(out.slice(0, 40));
  })()`);
  console.log(r);
});
