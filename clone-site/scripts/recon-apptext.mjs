import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const sec = [...document.querySelectorAll('div')].find(e => String(e.className).includes('overflow-hidden rounded-br-[32px]') );
    const out = [];
    const q = (el, d) => {
      if (d > 8) return;
      if (el.tagName === 'IMG' && el.src) out.push('IMG ' + el.naturalWidth + 'x' + el.naturalHeight + ' ' + el.src.split('/').pop() + ' | alt=' + (el.alt||'').slice(0,40));
      if (el.tagName === 'P' || el.tagName === 'H2' || el.tagName === 'H3') {
        const t = el.textContent.trim(); if (t) out.push(el.tagName + ': ' + t.slice(0, 100));
      }
      [...el.children].forEach(c => q(c, d + 1));
    };
    q(sec, 0);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
