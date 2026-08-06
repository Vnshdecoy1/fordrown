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
    setter.call(emailInput, 'style-capture@example.com');
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
    return 'entered';
  })()`);

  let captured = null;
  for (let i = 0; i < 25; i++) {
    await wait(70);
    const s = await cdp.eval(`(function() {
      const ov = document.querySelector('.mantine-LoadingOverlay-root');
      if (!ov) return null;
      const ocs = getComputedStyle(ov);
      const overlay = ov.querySelector('.mantine-LoadingOverlay-overlay');
      const o2 = overlay ? getComputedStyle(overlay) : null;
      const loader = ov.querySelector('.mantine-Loader-root');
      const lcs = loader ? getComputedStyle(loader) : null;
      const wrap = ov.parentElement;
      return JSON.stringify({
        rect: ov.getBoundingClientRect().width + 'x' + ov.getBoundingClientRect().height,
        overlayBg: o2 ? o2.backgroundColor : null,
        overlayBlur: o2 ? o2.backdropFilter : null,
        overlayOpacity: o2 ? o2.opacity : null,
        loaderSize: lcs ? lcs.width : null,
        loaderColor: lcs ? lcs.borderTopColor : null,
        loaderBorder: lcs ? lcs.borderWidth + ' ' + lcs.borderStyle : null,
        parentRect: wrap ? wrap.getBoundingClientRect().width + 'x' + Math.round(wrap.getBoundingClientRect().height) : null,
      });
    })()`);
    if (s) { captured = s; }
    const done = await cdp.eval(`(function() {
      return [...document.querySelectorAll('p,div,span')].some(e => e.children.length === 0 && /Invalid code/i.test(e.textContent || ''));
    })()`);
    if (done) break;
  }
  console.log('OVERLAY STYLES:', captured);
});
