import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const scroller = [...document.querySelectorAll('div')].find(e => String(e.className).includes('no-scrollbar overflow-x-auto') && e.getBoundingClientRect().height > 300);
    const card = scroller.children[0].children[0];
    const walk = (el, depth) => {
      if (depth > 4) return [];
      const out = [];
      for (const x of el.children) {
        const cls = x.className.toString ? x.className.toString().slice(0, 120) : '';
        const t = (x.childNodes.length === 1 ? x.textContent.trim().replace(/\\s+/g, ' ') : '').slice(0, 40);
        const cs = getComputedStyle(x);
        const s = {};
        ['color','backgroundColor','fontSize','fontWeight','borderRadius','padding','gap','width','height'].forEach(p => { const v = cs[p]; if (v && v !== '0px' && v !== 'normal') s[p] = v; });
        const img = x.tagName === 'IMG' ? ' [IMG ' + x.src + ']' : '';
        out.push({ d: depth, tag: x.tagName.toLowerCase(), cls, t: t + img, s });
        out.push(...walk(x, depth + 1));
      }
      return out;
    };
    return JSON.stringify(walk(card, 0));
  })()`);
  const list = JSON.parse(r);
  for (const e of list) console.log(' '.repeat(e.d) + '<' + e.tag + '> ' + e.cls + (e.t ? ' | ' + e.t : '') + (e.s ? ' [' + Object.entries(e.s).map(([k, v]) => k + '=' + v).join(' ') + ']' : ''));
});
