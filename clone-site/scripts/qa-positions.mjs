import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const base = 'http://localhost:3002';
  await cdp.navigate(`${base}/login`);
  await new Promise((r) => setTimeout(r, 3500));
  const r = await cdp.eval(`(function() {
    const out = {};
    const seg = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.getBoundingClientRect().width > 100);
    if (seg) { const rr = seg.getBoundingClientRect(); out.segTop = Math.round(rr.top); }
    const tabs = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'QR Code');
    if (tabs) out.tabTop = Math.round(tabs.getBoundingClientRect().top);
    const card = document.querySelector('[class*="bg-auth-card"]');
    if (card) { const rr = card.getBoundingClientRect(); out.cardTop = Math.round(rr.top); out.cardW = Math.round(rr.width); }
    return JSON.stringify(out);
  })()`);
  console.log('LOGIN:', r);
  await cdp.navigate(`${base}/signup`);
  await new Promise((r) => setTimeout(r, 3000));
  const r2 = await cdp.eval(`(function() {
    const out = {};
    const ind = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === 'Individual');
    if (ind) out.individualTop = Math.round(ind.getBoundingClientRect().top);
    const inp = document.querySelector('input[placeholder="Enter your email address"]');
    if (inp) out.emailInputTop = Math.round(inp.getBoundingClientRect().top);
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Create Account with Email');
    if (btn) out.createBtnTop = Math.round(btn.getBoundingClientRect().top);
    return JSON.stringify(out);
  })()`);
  console.log('SIGNUP:', r2);
});
