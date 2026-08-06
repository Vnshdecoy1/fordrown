import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const card = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).backgroundColor === 'rgb(21, 29, 50)' && d.getBoundingClientRect().height === 556);
    const out = { cardRadius: getComputedStyle(card).borderRadius, cardBorder: getComputedStyle(card).borderColor + ' ' + getComputedStyle(card).borderWidth, cardPad: getComputedStyle(card).padding };
    const q = (el, d) => {
      if (!el || d > 12) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','LABEL','A','P','H1','H2','H3','SVG'].includes(el.tagName) || cls.includes('mantine-Input') || cls.includes('mantine-Button')) {
        const t = (el.textContent || '').trim().slice(0, 44);
        const r = el.getBoundingClientRect();
        out.items = out.items || [];
        out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 110), bg: cs.backgroundColor.slice(0, 30), color: cs.color.slice(0, 20), fs: cs.fontSize, fw: cs.fontWeight, radius: cs.borderRadius, h: Math.round(r.height), t: t, placeholder: el.placeholder || '' });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(card, 0);
    const footer = document.querySelector('footer');
    out.footerText = footer ? footer.textContent.trim().slice(0, 200) : '';
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
