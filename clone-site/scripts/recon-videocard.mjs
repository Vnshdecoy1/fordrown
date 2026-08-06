import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const videos = [...document.querySelectorAll('video')];
    const out = videos.map(v => {
      const card = v.closest('div[class*="rounded-4"]');
      const txts = [];
      const q = (el, d) => {
        if (!el || d > 8) return;
        if (['P','H3','H2','H4'].includes(el.tagName)) { const t = el.textContent.trim(); if (t) txts.push(el.tagName + ': ' + t.slice(0, 100)); }
        (el.children || []).forEach(c => q(c, d + 1));
      };
      q(card, 0);
      return { src: v.src.split('/').pop(), cardTexts: txts };
    });
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
