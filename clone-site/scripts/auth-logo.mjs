import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const header = document.querySelector('header');
    if (!header) return JSON.stringify({ err: 'no header' });
    const a = header.querySelector('a');
    if (!a) return JSON.stringify({ err: 'no anchor', html: header.innerHTML.slice(0, 300) });
    return JSON.stringify({ href: a.href, inner: a.innerHTML.slice(0, 3000) });
  })()`);
  console.log(r);
});
