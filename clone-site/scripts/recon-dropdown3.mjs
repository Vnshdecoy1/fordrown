import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const panel = document.querySelector('div[class*="absolute top-0 left-0 z-299"]');
    const cards = [...panel.querySelectorAll('a')].filter(a => a.textContent.includes('Get Started') || a.textContent.includes('Go to Onchain'));
    if (!cards.length) return 'no cards';
    const c = cards[0];
    const walk = (el, depth) => {
      if (depth > 3) return [];
      const out = [];
      for (const x of el.children) {
        const cls = x.className.toString ? x.className.toString().slice(0, 110) : '';
        const t = (x.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
        const img = x.tagName === 'IMG' ? ' [IMG ' + x.src + ']' : '';
        out.push({ d: depth, tag: x.tagName.toLowerCase(), cls, t: t + img });
        out.push(...walk(x, depth + 1));
      }
      return out;
    };
    return JSON.stringify(walk(c.parentElement, 0));
  })()`);
  const list = JSON.parse(r);
  for (const e of list) console.log(' '.repeat(e.d) + '<' + e.tag + '> ' + e.cls + (e.t ? ' | ' + e.t : ''));
});
