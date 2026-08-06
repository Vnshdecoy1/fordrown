import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const out = { url: location.href };
    const q = (el, d) => {
      if (!el || d > 16) return;
      const rr = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['P','H1','H2','H3','H4','A','BUTTON','IMG'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 140);
        if ((t.length > 1 && rr.width > 60) || el.tagName === 'IMG') {
          out.items = out.items || [];
          out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 70), t: t.slice(0, 110), fs: cs.fontSize, fw: cs.fontWeight, w: Math.round(rr.width), h: Math.round(rr.height), top: Math.round(rr.top), left: Math.round(rr.left), img: el.tagName === 'IMG' ? el.src.slice(0, 90) : '' });
        }
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    const seen = new Set();
    out.items = (out.items || []).filter(i => { const k = i.t + i.left + i.top; if (seen.has(k)) return false; seen.add(k); return true; });
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
