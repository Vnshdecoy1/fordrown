import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://crypto.com/en');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() { return JSON.stringify({ url: location.href, title: document.title }); })()`);
  console.log(r);
});
