import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const out = {};
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder.includes('email'));
    const cs = getComputedStyle(emailInput);
    out.input = { border: cs.border, borderColor: cs.borderColor, borderWidth: cs.borderWidth, bg: cs.backgroundColor, radius: cs.borderRadius, h: cs.height };
    const loginBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.className.includes('Button_root'));
    if (loginBtn) { const bcs = getComputedStyle(loginBtn); out.loginBtn = { bg: bcs.backgroundColor, hover: bcs.backgroundColor, radius: bcs.borderRadius, h: bcs.height, fs: bcs.fontSize, fw: bcs.fontWeight }; }
    const socialBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Continue with Google'));
    out.socialSvg = socialBtn ? socialBtn.querySelector('svg')?.outerHTML.slice(0, 800) : null;
    const seg = document.querySelector('.mantine-SegmentedControl-root');
    if (seg) {
      const active = seg.querySelector('.mantine-SegmentedControl-itemActive, [data-active]') || seg.querySelector('label[data-checked]');
      out.seg = { bg: getComputedStyle(seg).backgroundColor, h: getComputedStyle(seg).height, radius: getComputedStyle(seg).borderRadius, inner: seg.innerHTML.slice(0, 600) };
    }
    const tabs = document.querySelector('.mantine-Tabs-root');
    if (tabs) out.tabs = { html: tabs.innerHTML.slice(0, 900) };
    const headerLogo = document.querySelector('header svg');
    out.headerLogo = headerLogo ? { w: headerLogo.getAttribute('width'), h: headerLogo.getAttribute('height'), viewBox: headerLogo.getAttribute('viewBox'), outer: headerLogo.outerHTML.slice(0, 400) } : null;
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
