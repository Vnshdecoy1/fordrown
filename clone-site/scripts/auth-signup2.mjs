import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r2 = await cdp.eval(`(function() {
    const cards = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).backgroundColor === 'rgb(21, 29, 50)');
    const out = [];
    cards.forEach((card, ci) => {
      const r = card.getBoundingClientRect();
      out.push('CARD' + ci + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height));
      const q = (el, d) => {
        if (!el || d > 12) return;
        const cs = getComputedStyle(el);
        const cls = el.className.toString ? el.className.toString() : '';
        if (['BUTTON','INPUT','LABEL','A','P','H1','H2','H3','H4','SPAN'].includes(el.tagName)) {
          const t = (el.textContent || '').trim().slice(0, 90);
          const rr = el.getBoundingClientRect();
          if (t && t.length > 1 && rr.width > 30) out.push('  ' + el.tagName.toLowerCase() + ' [' + cls.slice(0, 80) + '] "' + t.slice(0, 60) + '" fs=' + cs.fontSize + ' fw=' + cs.fontWeight + ' c=' + cs.color.slice(0, 20));
        }
        Array.from(el.children).forEach(c => q(c, d + 1));
      };
      q(card, 0);
    });
    const segActive = [...document.querySelectorAll('label')].find(l => l.textContent.trim() === 'Sign Up');
    out.push('segActive color: ' + (segActive ? getComputedStyle(segActive).color : 'none'));
    const segIndicator = document.querySelector('.mantine-SegmentedControl-indicator');
    if (segIndicator) out.push('indicator bg: ' + getComputedStyle(segIndicator).backgroundColor + ' w=' + Math.round(segIndicator.getBoundingClientRect().width));
    return JSON.stringify(out);
  })()`);
  console.log(r2);
});
