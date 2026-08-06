import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/authentication/email-verify-otp?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 7000));
  const r = await cdp.eval(`(function() {
    const header = document.querySelector('header');
    const out = { headerCls: header ? header.className.toString().slice(0, 80) : null };
    if (!header) return JSON.stringify(out);
    out.inner = [];
    const q = (el, d) => {
      if (!el || d > 6) return;
      const t = (el.textContent || '').trim().slice(0, 30);
      const rr = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (el.tagName !== 'HEADER' && rr.width > 10 && (t.length > 0 || el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'BUTTON')) {
        out.inner.push({ tag: el.tagName.toLowerCase(), cls: (el.className.toString() || '').slice(0, 60), t: t.slice(0, 25), w: Math.round(rr.width), h: Math.round(rr.height), top: Math.round(rr.top), img: el.tagName === 'IMG' ? el.src : '', svg: el.tagName === 'SVG' ? el.outerHTML.slice(0, 200) : '' });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(header, 0);
    const logo = header.querySelector('a, img');
    if (logo) out.logoHref = logo.href || logo.src || '';
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
