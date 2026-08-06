import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const sec = [...document.querySelectorAll('div')].find(e => String(e.className).includes('p-[16px_12px_88px_12px]') && e.getBoundingClientRect().height > 500);
    const chain = [];
    let el = sec;
    for (let i = 0; i < 6 && el; i++) {
      const cs = getComputedStyle(el);
      chain.push({ tag: el.tagName.toLowerCase(), cls: (el.className.toString ? el.className.toString() : '').slice(0, 80), bg: cs.backgroundColor, height: Math.round(el.getBoundingClientRect().height) });
      el = el.parentElement;
    }
    const h2 = sec.querySelector('h2');
    const h2chain = [];
    el = h2;
    for (let i = 0; i < 5 && el; i++) {
      const cs = getComputedStyle(el);
      h2chain.push({ tag: el.tagName.toLowerCase(), cls: (el.className.toString ? el.className.toString() : '').slice(0, 90), bg: cs.backgroundColor });
      el = el.parentElement;
    }
    return JSON.stringify({ secChain: chain, h2Chain: h2chain, mainBg: getComputedStyle(document.querySelector('main') || document.body).backgroundColor });
  })()`);
  console.log(r);
});
