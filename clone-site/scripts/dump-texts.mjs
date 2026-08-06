import { mainScript } from './cdp.mjs';

async function dumpSection(cdp, findExpr, label) {
  const r = await cdp.eval(`(function() {
    const root = ${findExpr};
    if (!root) return 'NO ROOT';
    const texts = [...root.querySelectorAll('h1,h2,h3,h4,p,a,span,button')].map(e => (e.textContent || '').trim().replace(/\\s+/g, ' ')).filter(t => t.length > 1);
    const imgs = [...root.querySelectorAll('img')].map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
    const videos = [...root.querySelectorAll('video')].map(v => v.currentSrc || v.src);
    return JSON.stringify({ texts: [...new Set(texts)], imgs, videos });
  })()`);
  const d = JSON.parse(r);
  console.log('########## ' + label + ' ##########');
  if (d === 'NO ROOT') { console.log(d); return; }
  for (const t of d.texts) console.log(' T:', t.slice(0, 200));
  for (const v of d.videos) console.log(' V:', v);
  for (const i of d.imgs.filter(x => x.w > 0)) console.log(' I:', i.w + 'x' + i.h, i.src);
}

await mainScript(async (cdp) => {
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className).includes('p-[16px_12px_88px_12px]') && e.getBoundingClientRect().height > 500)`, 'TRUSTEDBY');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className).includes('mb-[-32px] w-full pb-[32px]') && e.getBoundingClientRect().height > 2000)`, 'ADVANCED');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className) === 'mb-[-32px] w-full lg:mb-[-64px]' && e.textContent.includes('Onchain') && e.getBoundingClientRect().height > 1500)`, 'ONCHAIN');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className) === 'z-0 w-full' && e.textContent.includes('One platform, multiple ways'))`, 'WAYSTOTRADE');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className) === 'w-full bg-transparent' && e.textContent.includes('FAQ') && e.getBoundingClientRect().height > 600)`, 'FAQ');
  await dumpSection(cdp, `document.querySelector('footer')`, 'FOOTER');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className).includes('max-w-[1280px]') && e.textContent.includes('Crypto beyond trading'))`, 'LEARN');
  await dumpSection(cdp, `[...document.querySelectorAll('div')].find(e => String(e.className) === 'mb-[-32px] w-full lg:mb-[-64px]' && e.textContent.includes('world-class brands') && e.getBoundingClientRect().height > 800)`, 'PARTNERS');
});
