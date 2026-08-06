import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = {};
    const q = (el, d) => {
      if (!el || d > 14) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','A','P','H2','H1','SPAN','SVG','IMG'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 70);
        const rr = el.getBoundingClientRect();
        if ((t && t.length > 1) || el.tagName === 'INPUT' || el.tagName === 'SVG' || el.tagName === 'IMG') {
          out.items = out.items || [];
          out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 100), t: t.slice(0, 60), fs: cs.fontSize, fw: cs.fontWeight, color: cs.color.slice(0, 24), bg: cs.backgroundColor.slice(0, 28), radius: cs.borderRadius, h: Math.round(rr.height), w: Math.round(rr.width), placeholder: el.placeholder || '', inputmode: el.inputMode || '' });
        }
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
