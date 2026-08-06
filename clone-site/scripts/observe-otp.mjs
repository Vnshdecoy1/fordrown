import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/authentication/email-verify-otp?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 9000));
  await cdp.eval(`(function() {
    const close = document.querySelector('.ot-close-icon');
    if (close) { close.click(); }
    return 'ok';
  })()`);
  await new Promise((r) => setTimeout(r, 2500));
  const r = await cdp.eval(`(async function() {
    const out = { url: location.href.slice(0, 90) };
    out.headings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(h => h.textContent.trim().length).map(h => ({ t: h.textContent.trim().slice(0, 80), cls: (h.className || '').toString().slice(0, 60) }));
    const inp = document.querySelector('input[aria-label="otp-input"]');
    if (inp) {
      let el = inp;
      for (let i = 0; i < 4 && el; i++) el = el.parentElement;
      const html = el ? el.outerHTML : '';
      out.domTail = html.slice(2200, 4500);
      out.placeholder = inp.getAttribute('placeholder');
      const box = el?.querySelector('div[data-input-otp-container="true"] .relative, div[data-input-otp-container="true"] > div > div');
      if (box) {
        const bcs = getComputedStyle(box);
        out.box = {
          w: Math.round(box.getBoundingClientRect().width),
          h: Math.round(box.getBoundingClientRect().height),
          borderBottom: bcs.borderBottom,
          width: bcs.width,
          fs: bcs.fontSize,
          radius: bcs.borderRadius,
          color: bcs.color,
        };
        out.boxCount = el.querySelectorAll('div[data-input-otp-container="true"] > div > div').length;
      }
      // fill it and see how digits render
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, '123456');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      out.afterFill = (function() {
        const b = document.querySelectorAll('div[data-input-otp-container="true"] > div > div');
        const texts = [...b].map(x => x.textContent.trim());
        const cs = getComputedStyle(b[0]);
        return JSON.stringify({ boxTexts: texts, boxColor: cs.color, boxShadow: cs.textShadow, inputVal: inp.value, inputColor: getComputedStyle(inp).color });
      })();
    }
    const q = (el, d) => {
      if (!el || d > 10) return;
      const t = (el.textContent || '').trim();
      if (['P','H1','H2','H3'].includes(el.tagName) && t.length > 2) out.texts = out.texts || [], out.texts.push(t.slice(0, 110));
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    out.texts = (out.texts || []).slice(0, 6);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
