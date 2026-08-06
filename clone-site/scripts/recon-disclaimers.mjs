import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const els = [...document.querySelectorAll('p')].filter(p => getComputedStyle(p).fontSize === '11px');
    return JSON.stringify(els.map(p => p.textContent.trim().slice(0, 400)));
  })()`);
  console.log(r);
});
