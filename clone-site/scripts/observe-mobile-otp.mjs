import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await cdp.setViewport(390, 844);
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
    setter.call(emailInput, 'mob-capture@example.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.className.includes('Button_root'));
    btn.click();
    return 'ok';
  })()`);
  await wait(6000);

  const otp = await cdp.eval(`(function() {
    const out = { url: location.href.slice(0, 80), vw: window.innerWidth };
    const inp = document.querySelector('input[aria-label="otp-input"]');
    if (inp) {
      const row = inp.closest('[data-input-otp-container]');
      const boxes = row ? [...row.querySelectorAll('div[data-input-otp-container="true"] > div > div')] : [];
      out.boxes = {
        count: boxes.length,
        widths: boxes.map(b => Math.round(b.getBoundingClientRect().width)),
        h: boxes[0] ? Math.round(boxes[0].getBoundingClientRect().height) : 0,
        gap: boxes.length > 1 ? Math.round(boxes[1].getBoundingClientRect().left - boxes[0].getBoundingClientRect().right) : 0,
      };
    }
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '111111');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return JSON.stringify(out);
  })()`);
  console.log('MOBILE OTP + code filled:', otp);
  await wait(300);
  const loading = await cdp.eval(`(function() {
    const btns = [...document.querySelectorAll('button')].map(b => ({
      t: b.textContent.trim().slice(0, 30),
      html: b.innerHTML.slice(0, 220).replace(/\\s+/g, ' '),
      w: Math.round(b.getBoundingClientRect().width),
    })).filter(b => b.w > 0);
    const loader = document.querySelector('.mantine-Loader-root, .mantine-Button-loader');
    return JSON.stringify({ hasMantineLoader: !!loader, buttons: btns.slice(0, 5) });
  })()`);
  console.log('LOADING STATE after OTP submit:', loading);
  await wait(3000);
  const error = await cdp.eval(`(function() {
    const err = [...document.querySelectorAll('p,div,span')].filter(e => /(invalid|incorrect|wrong)/i.test(e.textContent || '') && e.children.length === 0).map(e => e.textContent.trim().slice(0, 60));
    return JSON.stringify({ errors: [...new Set(err)].slice(0, 4) });
  })()`);
  console.log('AFTER ERROR:', error);
});
