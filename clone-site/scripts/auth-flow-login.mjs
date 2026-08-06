import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder === 'Enter your email address');
    if (!emailInput) return JSON.stringify({ err: 'email input not found', url: location.href });
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, 'qa-clone-demo@example.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    return JSON.stringify({ filled: emailInput.value });
  })()`);
  console.log('fill:', r);
  await new Promise((res) => setTimeout(res, 1500));
  const r2 = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.className.includes('Button_root'));
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
      if (['BUTTON','INPUT','A','P','H1','H2','H3','SPAN'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 100);
        const rr = el.getBoundingClientRect();
        if (t && t.length > 1 && rr.width > 40) out.items = out.items || [], out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 70), t: t.slice(0, 65), fs: cs.fontSize, fw: cs.fontWeight, color: cs.color.slice(0, 22) });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    out.inputs = [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder, maxLength: i.maxLength, inputmode: i.inputMode, autocomplete: i.autocomplete }));
    return JSON.stringify(out);
  })()`);
  console.log(r3);
});
