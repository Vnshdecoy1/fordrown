import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/signup?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const out = [];
    const all = [...document.querySelectorAll('*')];
    for (const el of all) {
      const cs = getComputedStyle(el);
      const rr = el.getBoundingClientRect();
      const t = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
      if ((el.tagName === 'INPUT' || t.startsWith('Referral') || t.startsWith('Email') || t.startsWith('Create Account') || el.tagName === 'LABEL') && rr.width > 40 && rr.top > 180 && rr.top < 650) {
        out.push({ tag: el.tagName.toLowerCase(), t: t.slice(0, 35), top: Math.round(rr.top), h: Math.round(rr.height), w: Math.round(rr.width), fs: cs.fontSize, ph: el.placeholder || '', bg: cs.backgroundColor.slice(0, 24), cls: (el.className.toString() || '').slice(0, 50) });
      }
    }
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
