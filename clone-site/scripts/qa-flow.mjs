import { mainScript } from './cdp.mjs';

const setVal = (selector, value) => `(function() {
  const inp = document.querySelector(${JSON.stringify(selector)});
  if (!inp) return 'NOT FOUND';
  inp.focus();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, ${JSON.stringify(value)});
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  return 'OK';
})()`;

const dump = (cdp, label) => cdp.eval(`(function() {
  const out = { url: location.href, h: Math.round(document.body.getBoundingClientRect().height) };
  const h2 = document.querySelector('h2');
  out.heading = h2 ? h2.textContent.trim() : '';
  out.errors = [...document.querySelectorAll('p')].filter(p => p.textContent.includes('Invalid')).map(p => p.textContent.trim());
  out.spinner = !!document.querySelector('.animate-spin');
  out.otpBoxes = document.querySelectorAll('input[aria-label*="verification"]').length ? document.querySelectorAll('input[aria-label*="verification"]')[0].closest('.relative').querySelectorAll('.border-b-2').length : 0;
  out.focusedOtp = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('aria-label')?.includes('verification');
  return JSON.stringify(out);
})()`).then((r) => console.log(`\n=== ${label} ===\n${r}`));

await mainScript(async (cdp) => {
  const base = 'http://localhost:3002';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await cdp.navigate(`${base}/login`);
  await wait(3500);

  await cdp.eval(`(function() {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const email = document.querySelector('input[placeholder*="email"]');
    if (!email) return 'NOT FOUND email';
    email.focus();
    setter.call(email, 'flow-demo@example.com');
    email.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form button[type="submit"]').click();
    return 'OK';
  })()`);
  await wait(500);
  await dump(cdp, '1. LOGIN SUBMITTED (loading)');

  await wait(2000);
  await dump(cdp, '2. AFTER LOADING -> OTP');

  const clickBox = await cdp.eval(`(function() {
    const box = document.querySelector('input[aria-label*="verification"]').closest('.relative');
    const firstBox = box.querySelector('.border-b-2');
    firstBox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return document.activeElement === document.querySelector('input[aria-label*="verification"]') ? 'FOCUSED ON CLICK' : 'NOT FOCUSED';
  })()`);
  console.log('click test:', clickBox);

  console.log(await cdp.eval(setVal('input[aria-label*="verification"]', '000000')));
  await wait(1500);
  await dump(cdp, '3. WRONG EMAIL CODE');

  console.log(await cdp.eval(setVal('input[aria-label*="verification"]', '123456')));
  await wait(500);
  await dump(cdp, '4. CORRECT EMAIL CODE (overlay loading)');
  await wait(1500);
  await dump(cdp, '5. PASSCODE SCREEN');

  console.log(await cdp.eval(setVal('input[aria-label*="verification"]', '000000')));
  await wait(1500);
  await dump(cdp, '6. WRONG PASSCODE');

  console.log(await cdp.eval(setVal('input[aria-label*="verification"]', '987654')));
  await wait(500);
  await dump(cdp, '7. CORRECT PASSCODE (overlay loading)');
  await wait(1500);
  await dump(cdp, '8. COMPLETE SCREEN');

  await cdp.navigate(`${base}/signup`);
  await wait(3000);
  await cdp.eval(`(function() {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const email = document.querySelector('input[placeholder*="email"]');
    email.focus();
    setter.call(email, 'flow-signup@example.com');
    email.dispatchEvent(new Event('input', { bubbles: true }));
    const ref = document.querySelector('input[placeholder="Referral Code"]');
    ref.focus();
    setter.call(ref, 'VN-999');
    ref.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form button[type="submit"]').click();
    return 'OK';
  })()`);
  await wait(500);
  await dump(cdp, '7. SIGNUP SUBMITTED (loading)');
  await wait(2000);
  await dump(cdp, '8. SIGNUP -> OTP');
});
