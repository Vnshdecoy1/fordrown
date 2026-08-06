import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const base = 'http://localhost:3002';
  await cdp.navigate(`${base}/login`);
  await new Promise((r) => setTimeout(r, 4000));
  const r = await cdp.eval(`(function() {
    const out = {};
    const card = document.querySelector('[class*="bg-auth-card"]');
    if (card) {
      const rr = card.getBoundingClientRect();
      const cs = getComputedStyle(card);
      out.card = { w: Math.round(rr.width), left: Math.round(rr.left), top: Math.round(rr.top), radius: cs.borderRadius, border: cs.border.slice(0, 50) };
    }
    const grid = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).display === 'grid' && d.getBoundingClientRect().width > 800);
    if (grid) {
      out.grid = { cols: getComputedStyle(grid).gridTemplateColumns.slice(0, 60), w: Math.round(grid.getBoundingClientRect().width), left: Math.round(grid.getBoundingClientRect().left) };
    }
    const seg = document.querySelector('[class*="bg-auth-seg-bg"]');
    if (seg) out.segW = Math.round(seg.getBoundingClientRect().width);
    const banner = document.querySelector('main img');
    if (banner) out.banner = { w: Math.round(banner.getBoundingClientRect().width), h: Math.round(banner.getBoundingClientRect().height), pos: getComputedStyle(banner).position, parentPos: getComputedStyle(banner.parentElement).position, parentCls: banner.parentElement.className.toString().slice(0, 60) };
    out.viewport = window.innerWidth;
    const forms = [...document.querySelectorAll('form')].map(f => f.className.toString());
    out.forms = forms;
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
