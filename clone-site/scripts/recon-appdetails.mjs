import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const root = [...document.querySelectorAll('div')].find(e => String(e.className).includes('overflow-hidden rounded-br-[32px]') && e.getBoundingClientRect().height > 2000);
    const texts = [...root.querySelectorAll('h1,h2,h3,h4,p,a,span')].map(e => (e.textContent || '').trim().replace(/\\s+/g, ' ')).filter(t => t.length > 2);
    const videos = [...root.querySelectorAll('video')].map(v => ({ src: v.currentSrc || v.src, poster: v.poster }));
    const imgs = [...root.querySelectorAll('img')].map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
    return JSON.stringify({ texts: [...new Set(texts)], videos, imgs });
  })()`);
  const d = JSON.parse(r);
  console.log('=== TEXTS ===');
  for (const t of d.texts) console.log(t.slice(0, 120));
  console.log('=== VIDEOS ===');
  for (const v of d.videos) console.log(v.src, '| poster:', v.poster);
  console.log('=== IMGS ===');
  for (const i of d.imgs) console.log(i.w + 'x' + i.h, i.src, '|', i.alt);
});
