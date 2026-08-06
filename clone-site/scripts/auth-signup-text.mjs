import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/signup?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const out = { url: location.href };
    const q = (el, d) => {
      if (!el || d > 16) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['P','H1','H2','H3','LABEL','A','BUTTON','INPUT','SPAN'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 130);
        const rr = el.getBoundingClientRect();
        if ((t.length > 1 && rr.width > 30) || el.tagName === 'INPUT') {
          out.items = out.items || [];
          out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 60), t: t.slice(0, 110), fs: cs.fontSize, fw: cs.fontWeight, color: cs.color.slice(0, 22), top: Math.round(rr.top), placeholder: el.placeholder || '', checked: el.type === 'checkbox' ? el.checked : undefined });
        }
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
