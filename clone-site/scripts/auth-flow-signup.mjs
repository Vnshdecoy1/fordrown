import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = {};
    const cards = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).backgroundColor === 'rgb(21, 29, 50)');
    const card = cards.find(c => c.getBoundingClientRect().width === 556);
    if (!card) return JSON.stringify({ err: 'card not found' });
    const inputs = [...card.querySelectorAll('input')];
    out.inputs = inputs.map(i => ({ type: i.type, placeholder: i.placeholder, name: i.name, checked: i.checked, cls: (i.className.toString ? i.className.toString() : '').slice(0, 80) }));
    const emailInput = inputs.find(i => i.type === 'text' || i.type === 'email') || inputs.find(i => i.placeholder.includes('@'));
    if (emailInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(emailInput, 'clone-test-user@example.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      out.set = true;
    }
    return JSON.stringify(out);
  })()`);
  console.log('fill:', r);
  await new Promise((res) => setTimeout(res, 1000));
  const r2 = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Create Account with Email'));
    if (!btn) return JSON.stringify({ err: 'btn not found' });
    btn.click();
    return JSON.stringify({ clicked: true });
  })()`);
  console.log(r2);
  await new Promise((res) => setTimeout(res, 6000));
  const r3 = await cdp.eval(`(function() {
    const out = { url: location.href };
    const q = (el, d) => {
      if (!el || d > 14) return;
      const cs = getComputedStyle(el);
      const cls = el.className.toString ? el.className.toString() : '';
      if (['BUTTON','INPUT','LABEL','A','P','H1','H2','H3','H4','SPAN','DIV'].includes(el.tagName)) {
        const t = (el.textContent || '').trim().slice(0, 80);
        const rr = el.getBoundingClientRect();
        if (t && t.length > 1 && rr.width > 40) out.items = out.items || [], out.items.push({ tag: el.tagName.toLowerCase(), cls: cls.slice(0, 70), t: t.slice(0, 60), fs: cs.fontSize, h: Math.round(rr.height) });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    out.inputs = [...document.querySelectorAll('input')].map(i => ({ type: i.type, placeholder: i.placeholder, maxLength: i.maxLength, cls: (i.className.toString ? i.className.toString() : '').slice(0, 60) }));
    return JSON.stringify(out);
  })()`);
  console.log(r3);
});
