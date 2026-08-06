import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const root = [...document.querySelectorAll('div')].find(e => e.textContent.includes('Stay up-to-date with live crypto prices') && e.getBoundingClientRect().height > 800);
    if (!root) return 'no root';
    const walk = (el, depth) => {
      if (depth > 3) return [];
      const out = [];
      for (const c of el.children) {
        const cls = c.className.toString ? c.className.toString().slice(0, 110) : '';
        const t = (c.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
        out.push({ d: depth, tag: c.tagName.toLowerCase(), cls, t });
        out.push(...walk(c, depth + 1));
      }
      return out;
    };
    return JSON.stringify(walk(root, 0));
  })()`);
  const list = JSON.parse(r);
  console.log('elements:', list.length);
  for (const e of list) console.log(' '.repeat(e.d) + '<' + e.tag + '> ' + e.cls + (e.t ? ' | ' + e.t : ''));
});
