import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`JSON.stringify([...document.querySelectorAll('h1,h2,h3')].map(h => ({ t: h.textContent.trim().replace(/\\s+/g,' ').slice(0,70), cls: (h.className||'').toString().slice(0,80) })))`);
  const list = JSON.parse(r);
  list.forEach((x, i) => console.log(i, JSON.stringify(x.t), '|', x.cls));
});
