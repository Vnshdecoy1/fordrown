import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder === 'Enter your email address');
    if (!emailInput) return JSON.stringify({ err: 'email input not found' });
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, 'qa-clone-demo@example.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    return JSON.stringify({ filled: emailInput.value });
  })()`);
  console.log('fill:', r);
  await new Promise((res) => setTimeout(res, 1500));
  const r2 = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Create Account with Email'));
    if (!btn) return JSON.stringify({ err: 'btn not found' });
    btn.click();
    return JSON.stringify({ clicked: true });
  })()`);
  console.log(r2);
  await new Promise((res) => setTimeout(res, 10000));
  const r3 = await cdp.eval(`(function() {
    const out = { url: location.href };
    const q = (el, d) => {
      if (!el || d > 14) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','LABEL','A','P','H1','H2','H3','H4','SPAN'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 100);
        const rr = el.getBoundingClientRect();
        if (t && t.length > 1 && rr.width > 40) out.items = out.items || [], out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 70), t: t.slice(0, 70), fs: cs.fontSize, h: Math.round(rr.height) });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    out.inputs = [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder, maxLength: i.maxLength, name: i.name, inputmode: i.inputMode }));
    return JSON.stringify(out);
  })()`);
  console.log(r3);
});
