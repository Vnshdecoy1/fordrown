import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.setViewport(1440, 900, 1);
  const info = await cdp.eval(`JSON.stringify({
    url: location.href,
    title: document.title,
    w: innerWidth,
    h: innerHeight,
    scrollH: document.documentElement.scrollHeight,
    fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 300).map(el => getComputedStyle(el).fontFamily))],
    imgs: document.querySelectorAll('img').length,
    svgs: document.querySelectorAll('svg').length,
    videos: document.querySelectorAll('video').length
  })`);
  console.log(info);
  await cdp.screenshot('docs/design-references/crypto-home-desktop-top.png');
});
