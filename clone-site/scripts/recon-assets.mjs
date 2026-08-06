import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

await mainScript(async (cdp) => {
  const result = await cdp.eval(`(function() {
    const images = [...document.querySelectorAll('img')].map(img => ({
      src: img.src, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight,
      loading: img.loading, srcset: img.getAttribute('srcset') || ''
    }));
    const videos = [...document.querySelectorAll('video')].map(v => ({
      src: v.src || v.querySelector('source')?.src, poster: v.poster, autoplay: v.autoplay, loop: v.loop, muted: v.muted
    }));
    const bgImages = [...document.querySelectorAll('*')].filter(el => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none';
    }).map(el => ({
      url: getComputedStyle(el).backgroundImage,
      el: el.tagName + '.' + String(el.className || '').split(' ')[0]
    })).filter(x => x.url.includes('url('));
    const fonts = [...new Set([...document.querySelectorAll('*')].slice(0, 400).map(el => getComputedStyle(el).fontFamily))];
    const favicons = [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() }));
    const fontLinks = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
    return JSON.stringify({ images, videos, bgImages, fonts, favicons, fontLinks });
  })()`);
  writeFileSync('docs/research/assets.json', result);
  const a = JSON.parse(result);
  console.log('IMAGES:', a.images.length);
  console.log('VIDEOS:', a.videos.length);
  console.log('BG:', a.bgImages.length);
  console.log('FONTS:', a.fonts);
  console.log('FAVICONS:', a.favicons);
  console.log('STYLESHEETS:', a.fontLinks);
  console.log('--- first 15 images ---');
  a.images.slice(0, 15).forEach(i => console.log(i.w + 'x' + i.h, i.src.slice(0, 120)));
});
