import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = [];
    const q = (el, d) => {
      if (!el || d > 8) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      out.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 130), bg: cs.backgroundColor.slice(0, 32), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), t: (el.textContent || '').trim().slice(0, 36) });
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify(out.filter(o => o.w > 40 && o.h > 0).slice(0, 120));
  })()`);
  console.log(r);
});
