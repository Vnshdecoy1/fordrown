import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const sec = [...document.querySelectorAll('div')].find(e => String(e.className).includes('overflow-hidden rounded-br-[32px]'));
    if (!sec) return JSON.stringify({ err: 'sec not found' });
    const els = [...sec.querySelectorAll('p')].filter(p => p.className.includes('text-[11px]'));
    return JSON.stringify(els.map(p => ({ html: p.innerHTML.slice(0, 600) })));
  })()`);
  console.log(r);
});
