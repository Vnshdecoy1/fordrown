import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.setViewport(390, 844);
  await cdp.navigate('http://localhost:3002/email-code?email=m%40x.com&mode=login');
  await new Promise((r) => setTimeout(r, 3000));
  const r = await cdp.eval(`(function() {
    const boxes = [...document.querySelectorAll('.border-b-2')];
    if (!boxes.length) return JSON.stringify({ err: 'no boxes' });
    return JSON.stringify({
      count: boxes.length,
      widths: boxes.map(b => Math.round(b.getBoundingClientRect().width)),
      row: Math.round(boxes[0].parentElement.getBoundingClientRect().width),
      overflow: document.body.scrollWidth > window.innerWidth,
    });
  })()`);
  console.log(r);
});
