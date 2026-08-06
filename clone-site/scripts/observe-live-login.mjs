import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 9000));
  await cdp.eval(`(function() {
    const close = document.querySelector('.ot-close-icon');
    if (close) { close.click(); }
    return 'ok';
  })()`);
  await new Promise((r) => setTimeout(r, 3000));

  const { frameTree } = await cdp.send('Page.getFrameTree');
  const walk = (node, acc) => {
    acc.push({ id: node.frame.id, url: node.frame.url.slice(0, 100), name: node.frame.name || '' });
    (node.childFrames || []).forEach((c) => walk(c, acc));
  };
  const frames = [];
  walk(frameTree, frames);
  console.log('frames:', JSON.stringify(frames));

  const target = frames.find((f) => f.url.includes('prod-alfred') || f.url.includes('alfred'));
  if (!target) return console.log('no alfred frame');

  const { executionContextId } = await cdp.send('Page.createIsolatedWorld', { frameId: target.id, worldName: 'qa' });
  const res = await cdp.send('Runtime.evaluate', {
    contextId: executionContextId,
    expression: `(function() {
      const out = { url: location.href, title: document.title };
      out.buttons = [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 12);
      out.inputs = [...document.querySelectorAll('input')].map(i => ({ ph: i.placeholder, t: i.type })).slice(0, 8);
      out.headings = [...document.querySelectorAll('h1,h2,h3')].map(h => h.textContent.trim().slice(0, 60));
      out.body = (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 250);
      return JSON.stringify(out);
    })()`,
    returnByValue: true,
  });
  console.log('alfred frame:', res.exceptionDetails ? JSON.stringify(res.exceptionDetails.exception?.description || res.exceptionDetails.text) : res.result?.value);
});
