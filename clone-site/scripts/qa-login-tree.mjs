import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const base = 'http://localhost:3002';
  await cdp.navigate(`${base}/login`);
  await new Promise((r) => setTimeout(r, 4000));
  const r = await cdp.eval(`(function() {
    const out = [];
    let el = document.querySelector('[class*="bg-auth-card"]');
    while (el && el.tagName !== 'BODY' && out.length < 6) {
      const cs = getComputedStyle(el);
      const rr = el.getBoundingClientRect();
      out.push({ cls: (el.className.toString() || '').slice(0, 110), tag: el.tagName.toLowerCase(), display: cs.display, gridCols: cs.gridTemplateColumns.slice(0, 50), w: Math.round(rr.width), left: Math.round(rr.left), maxW: cs.maxWidth.slice(0, 20), radius: cs.borderRadius.slice(0, 12) });
      el = el.parentElement;
    }
    const main = document.querySelector('main');
    if (main) {
      const cs = getComputedStyle(main);
      out.push({ tag: 'MAIN', cls: main.className.toString().slice(0, 90), display: cs.display, paddingLeft: cs.paddingLeft, w: Math.round(main.getBoundingClientRect().width) });
    }
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
