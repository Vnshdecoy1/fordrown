import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const card = [...document.querySelectorAll('div')].find(e => String(e.className).includes('rounded-[32px]') && String(e.className).includes('bg-[#0B1426]'));
    const out = [];
    const q = (el, d) => {
      if (!el || d > 4) return;
      const cs = getComputedStyle(el);
      out.push({ tag: el.tagName.toLowerCase(), cls: (el.className.toString ? el.className.toString() : '').slice(0, 170), t: (el.textContent || '').trim().slice(0, 40) });
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(card, 0);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
