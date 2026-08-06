import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const inp = [...document.querySelectorAll('input')].find(i => i.maxLength === 6 && i.inputMode === 'numeric');
    if (!inp) return JSON.stringify({ err: 'otp input not found' });
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '000000');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return JSON.stringify({ filled: inp.value });
  })()`);
  console.log('fill:', r);
  await new Promise((res) => setTimeout(res, 1500));
  const r2 = await cdp.eval(`(function() {
    const out = { btnCandidates: [] };
    const inp = [...document.querySelectorAll('input')].find(i => i.maxLength === 6);
    let p = inp;
    for (let i = 0; i < 6 && p; i++) {
      const cs = getComputedStyle(p);
      const rr = p.getBoundingClientRect();
      out.branch = out.branch || [];
      out.branch.push({ tag: p.tagName.toLowerCase(), cls: (p.className.toString() || '').slice(0, 80), bg: cs.backgroundColor.slice(0, 26), border: cs.border.slice(0, 40), radius: cs.borderRadius, w: Math.round(rr.width), h: Math.round(rr.height), flex: cs.display });
      p = p.parentElement;
    }
    const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    document.querySelectorAll('input')[0].dispatchEvent(evt);
    [...document.querySelectorAll('input')].forEach(i => i.dispatchEvent(evt));
    out.form = !!document.querySelector('form');
    out.forms = [...document.querySelectorAll('form')].map(f => f.className.toString().slice(0, 80));
    return JSON.stringify(out);
  })()`);
  console.log('structure:', r2);
  await new Promise((res) => setTimeout(res, 9000));
  const r3 = await cdp.eval(`(function() {
    const out = { url: location.href };
    const q = (el, d) => {
      if (!el || d > 14) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','A','P','H1','H2','H3','SPAN','DIV'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 100);
        const rr = el.getBoundingClientRect();
        if (t && t.length > 1 && rr.width > 40) {
          const red = cs.color.includes('255, 69, 70') || cs.backgroundColor.includes('255, 69, 70');
          if (red || cs.fontWeight === '700' || cls.includes('error') || cls.includes('invalid') || cs.fontSize === '14px' || cs.fontSize === '12px') {
            out.items = out.items || [];
            out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 80), t: t.slice(0, 80), fs: cs.fontSize, fw: cs.fontWeight, color: cs.color.slice(0, 26), bg: cs.backgroundColor.slice(0, 26) });
          }
        }
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    return JSON.stringify(out);
  })()`);
  console.log('errors:', r3);
  await cdp.navigate('https://accounts.crypto.com/en/forgot-password?from=mainapp-web');
  await new Promise((res) => setTimeout(res, 7000));
  const r4 = await cdp.eval(`(function() {
    return JSON.stringify({ url: location.href, h1: document.querySelector('h1, h2') ? (document.querySelector('h1, h2').textContent || '').trim().slice(0, 60) : '' });
  })()`);
  console.log('forgot:', r4);
});
