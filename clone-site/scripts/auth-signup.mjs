import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const labels = [...document.querySelectorAll('label')];
    const signup = labels.find(l => l.textContent.trim() === 'Sign Up');
    if (!signup) return JSON.stringify({ err: 'no signup label' });
    signup.click();
    return JSON.stringify({ ok: true });
  })()`);
  console.log('clicked:', r);
  await new Promise((res) => setTimeout(res, 2500));
  const r2 = await cdp.eval(`(function() {
    const card = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).backgroundColor === 'rgb(21, 29, 50)' && d.getBoundingClientRect().height === 556);
    const out = { items: [] };
    const q = (el, d) => {
      if (!el || d > 12) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','LABEL','A','P','H1','H2','H3','H4','SVG'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 80);
        const r = el.getBoundingClientRect();
        if (t || el.tagName === 'INPUT') out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 90), t, fs: cs.fontSize, fw: cs.fontWeight, h: Math.round(r.height), type: el.type || '', placeholder: el.placeholder || '' });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(card, 0);
    return JSON.stringify(out);
  })()`);
  console.log(r2);
});
