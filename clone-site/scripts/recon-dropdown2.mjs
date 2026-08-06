import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const panel = document.querySelector('div[class*="absolute top-0 left-0 z-299"]');
    const walk = (el, depth) => {
      if (depth > 3) return [];
      const out = [];
      for (const c of el.children) {
        const cls = c.className.toString ? c.className.toString().slice(0, 100) : '';
        const t = (c.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 70);
        out.push({ d: depth, tag: c.tagName.toLowerCase(), cls, t });
        out.push(...walk(c, depth + 1));
      }
      return out;
    };
    return JSON.stringify(walk(panel, 0));
  })()`);
  const list = JSON.parse(r);
  for (const e of list) console.log(' '.repeat(e.d) + '<' + e.tag + '> ' + e.cls + (e.t ? ' | ' + e.t : ''));
});
