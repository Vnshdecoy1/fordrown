import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const root = document.querySelector('div.relative.overflow-hidden');
    const bottomFade = root.querySelector('div.absolute.z-20');
    const cta = [...root.querySelectorAll('a')].find(a => a.textContent.includes('Get Started'));
    const ctaHover = cta ? getComputedStyle(cta, ':hover') : null;
    const subtitle = [...root.querySelectorAll('h1')][0];
    const scrollInfo = root.getBoundingClientRect();
    return JSON.stringify({
      rootGradient: getComputedStyle(root).backgroundImage,
      rootHeight: scrollInfo.height,
      bottomFadeGradient: bottomFade ? getComputedStyle(bottomFade).backgroundImage : null,
      bottomFadeBg: bottomFade ? getComputedStyle(bottomFade).backgroundColor : null,
      cta: cta ? { bg: getComputedStyle(cta).backgroundColor, radius: getComputedStyle(cta).borderRadius, shadow: getComputedStyle(cta).boxShadow } : null,
      ctaHover: ctaHover ? { bg: ctaHover.backgroundColor, opacity: ctaHover.opacity } : null,
      imgPosition: root.querySelector('img') ? getComputedStyle(root.querySelector('img').parentElement.parentElement).margin : null
    });
  })()`);
  console.log(r);
});
