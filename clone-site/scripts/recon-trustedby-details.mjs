import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const sec = [...document.querySelectorAll('div')].find(e => String(e.className).includes('p-[16px_12px_88px_12px]') && e.getBoundingClientRect().height > 500);
    const h2 = sec.querySelector('h2');
    const stats = [...sec.querySelectorAll('div')].filter(d => d.querySelectorAll('img').length === 1 && d.querySelectorAll('p').length >= 2 && d.children.length < 6 && d.getBoundingClientRect().height > 100);
    const statsInfo = stats.slice(0, 4).map(d => {
      const ps = [...d.querySelectorAll('p')].map(p => ({ t: p.textContent.trim(), cls: p.className.toString ? p.className.toString().slice(0, 130) : '' }));
      const img = d.querySelector('img');
      const cs = getComputedStyle(d);
      return { ps, img: img ? img.src : null, cls: d.className.toString ? d.className.toString().slice(0, 130) : '', pad: cs.padding, bg: cs.backgroundColor, radius: cs.borderRadius, border: cs.borderTopColor };
    });
    return JSON.stringify({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      secBg: getComputedStyle(sec).backgroundColor,
      h2: { t: h2.textContent.trim(), color: getComputedStyle(h2).color, margin: getComputedStyle(h2).margin, fontSize: getComputedStyle(h2).fontSize, textAlign: getComputedStyle(h2).textAlign },
      stats: statsInfo
    });
  })()`);
  console.log(r);
});
