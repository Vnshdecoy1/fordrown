import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const video = document.querySelector('video');
    const cards = [...document.querySelectorAll('div[class*="rounded-4"]')];
    const videoCard = cards.find(c => c.querySelector('video'));
    const txts = [];
    const q = (el, d) => {
      if (!el || d > 10) return;
      if (['P','H3','H2','H4','SPAN'].includes(el.tagName)) { const t = el.textContent.trim(); if (t) txts.push(el.tagName + ': ' + t.slice(0, 90)); }
      if (el.tagName === 'IMG' && el.src) txts.push('IMG: ' + el.src.split('/').pop());
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(videoCard, 0);
    return JSON.stringify({ videoCardTexts: txts });
  })()`);
  console.log(r);
});
