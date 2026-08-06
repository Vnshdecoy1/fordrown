import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const divs = [...document.querySelectorAll('div')];
    const hits = [];
    for (const d of divs) {
      const t = (d.textContent || '');
      const h = Math.round(d.getBoundingClientRect().height);
      if (t.includes('latency') || t.includes('Advanced Trading') || t.includes('Power meets precision')) {
        if (h > 100) hits.push({ h, cls: String(d.className).slice(0, 80), t: t.replace(/\\s+/g, ' ').slice(0, 80) });
      }
    }
    return JSON.stringify(hits.slice(0, 20));
  })()`);
  const hits = JSON.parse(r);
  for (const h of hits) console.log('h:' + h.h, '|', h.cls, '|', h.t);
});
