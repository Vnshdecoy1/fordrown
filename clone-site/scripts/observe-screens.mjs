import { mainScript } from './cdp.mjs';

const closeConsent = `(function() {
  const tries = [
    () => document.querySelector('#onetrust-accept-btn-handler'),
    () => document.querySelector('#accept-recommended-btn-handler'),
    () => document.querySelector('.ot-close-icon'),
    () => document.querySelector('button.save-preference-btn-handler'),
  ];
  for (const f of tries) {
    const b = f();
    if (b) { b.click(); return 'clicked: ' + b.id || b.className; }
  }
  return 'nothing found';
})()`;

const dump = `(function() {
  const out = { url: location.href.slice(0, 110), vw: window.innerWidth };
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4')].filter(h => h.textContent.trim().length).map(h => h.textContent.trim().slice(0, 70)).slice(0, 4);
  const otp = document.querySelector('input[aria-label="otp-input"]');
  if (otp) {
    const boxRow = otp.closest('[data-input-otp-container]');
    const boxes = boxRow ? [...boxRow.querySelectorAll('div[data-input-otp-container="true"] > div > div')] : [];
    out.otpBoxes = {
      count: boxes.length,
      w: boxes[0] ? Math.round(boxes[0].getBoundingClientRect().width) : 0,
      h: boxes[0] ? Math.round(boxes[0].getBoundingClientRect().height) : 0,
      borderBottom: boxes[0] ? getComputedStyle(boxes[0]).borderBottom : '',
      gap: boxes.length > 1 ? Math.round(boxes[1].getBoundingClientRect().left - boxes[0].getBoundingClientRect().right) : 0,
      fontSize: boxes[0] ? getComputedStyle(boxes[0]).fontSize : '',
    };
  }
  const q = (el, d) => {
    if (!el || d > 12) return;
    const t = (el.textContent || '').trim();
    if (['P','H1','H2','H3','A','BUTTON'].includes(el.tagName) && t.length > 2) out.texts = out.texts || [], out.texts.push(t.slice(0, 90));
    Array.from(el.children).forEach(c => q(c, d + 1));
  };
  q(document.body, 0);
  out.texts = [...new Set(out.texts || [])].slice(0, 10);
  out.inputs = [...document.querySelectorAll('input')].filter(i => i.offsetParent !== null).map(i => ({ ph: i.placeholder, t: i.type, w: Math.round(i.getBoundingClientRect().width) })).slice(0, 5);
  out.buttons = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && b.textContent.trim()).map(b => ({ t: b.textContent.trim().slice(0, 40), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), cls: (b.className || '').toString().slice(0, 40) })).slice(0, 6);
  return JSON.stringify(out);
})()`;

await mainScript(async (cdp) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  await cdp.setViewport(1440, 1200);
  await cdp.navigate('https://accounts.crypto.com/en/authentication/email-verify-otp?from=mainapp-web');
  await wait(8000);
  await cdp.eval(closeConsent);
  await wait(2500);
  console.log('=== DESKTOP OTP ===');
  console.log(await cdp.eval(dump));

  await cdp.setViewport(390, 844);
  await wait(2000);
  console.log('\n=== MOBILE OTP ===');
  console.log(await cdp.eval(dump));

  for (const path of ['email-verify-passcode', 'email-verify-password', 'authentication/passcode']) {
    await cdp.navigate(`https://accounts.crypto.com/en/${path}?from=mainapp-web`);
    await wait(6000);
    await cdp.eval(closeConsent);
    await wait(1500);
    const r = await cdp.eval(dump);
    console.log(`\n=== ${path} ===`);
    console.log(r.slice(0, 1200));
  }
});
