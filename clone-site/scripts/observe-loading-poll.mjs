import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await wait(9000);
  await cdp.eval(`(function() {
    const close = document.querySelector('.ot-close-icon');
    if (close) close.click();
    const emailTab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Email');
    if (emailTab) emailTab.click();
    return 'ok';
  })()`);
  await wait(2500);

  await cdp.eval(`(function() {
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder === 'Enter your email address');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, 'poll-capture@example.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.className.includes('Button_root'));
    btn.click();
    return 'ok';
  })()`);
  await wait(6000);

  await cdp.eval(`(function() {
    const inp = document.querySelector('input[aria-label="otp-input"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '111111');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return 'code entered';
  })()`);

  const samples = [];
  for (let i = 0; i < 20; i++) {
    await wait(120);
    const s = await cdp.eval(`(function() {
      const out = {};
      const classes = [];
      document.querySelectorAll('*').forEach(el => {
        const c = el.className?.toString ? el.className.toString() : '';
        if (/spinner|loader|loading|Loader/i.test(c)) classes.push(c.slice(0, 60));
      });
      out.spinnerLike = [...new Set(classes)].slice(0, 5);
      out.error = [...document.querySelectorAll('p,div,span')].some(e => e.children.length === 0 && /Invalid code/i.test(e.textContent || ''));
      out.boxBorder = (() => {
        const b = document.querySelector('div[data-input-otp-container="true"] > div > div');
        return b ? getComputedStyle(b).borderBottom : '';
      })();
      return JSON.stringify(out);
    })()`);
    samples.push(`t${(i + 1) * 120}ms ${s}`);
    if (s.includes('"error":true')) break;
  }
  console.log(samples.join('\n'));
});
