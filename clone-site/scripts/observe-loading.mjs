import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.setViewport(1440, 1200);
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 9000));
  await cdp.eval(`(function() {
    const close = document.querySelector('.ot-close-icon');
    if (close) { close.click(); }
    const emailTab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Email');
    if (emailTab) emailTab.click();
    return 'ok';
  })()`);
  await new Promise((r) => setTimeout(r, 3000));

  await cdp.eval(`(function() {
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder === 'Enter your email address');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(emailInput, 'otp-style-demo@example.com');
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    return 'filled';
  })()`);
  await new Promise((r) => setTimeout(r, 1000));
  await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Log In' && b.className.includes('Button_root'));
    btn.click();
    return 'clicked';
  })()`);
  await new Promise((r) => setTimeout(r, 700));

  const loader = await cdp.eval(`(function() {
    const span = document.querySelector('.mantine-Button-loader');
    if (!span) return 'no loader';
    const cs = getComputedStyle(span.querySelector('svg, div') || span);
    return JSON.stringify({
      html: span.outerHTML.slice(0, 1200),
      size: span.getBoundingClientRect().width + 'x' + span.getBoundingClientRect().height,
      childTag: span.firstElementChild ? span.firstElementChild.tagName : null,
      childHtml: span.firstElementChild ? span.firstElementChild.outerHTML.slice(0, 800) : null,
      animation: getComputedStyle(span).animation,
    });
  })()`);
  console.log('LOADER:', loader);

  await new Promise((r) => setTimeout(r, 2500));
  const otp = await cdp.eval(`(function() {
    const out = { url: location.href.slice(0, 90) };
    out.headings = [...document.querySelectorAll('h1,h2,h3')].map(h => ({ t: h.textContent.trim(), cls: h.className.toString ? h.className.toString().slice(0, 60) : '' }));
    out.paragraphs = [...document.querySelectorAll('p')].map(p => p.textContent.trim().slice(0, 120)).slice(0, 4);
    out.inputs = [...document.querySelectorAll('input')].map(i => ({ type: i.type, ph: i.placeholder, inputmode: i.inputMode, maxLength: i.maxLength, cls: i.className.toString ? i.className.toString().slice(0, 80) : '', aria: i.getAttribute('aria-label') }));
    out.buttons = [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 50)).filter(Boolean).slice(0, 8);
    out.divs = [...document.querySelectorAll('div')].filter(d => d.children.length === 0 && d.textContent.trim().length === 1).length;
    return JSON.stringify(out);
  })()`);
  console.log('OTP SCREEN:', otp);
  await cdp.screenshot('C:\\Users\\vansh\\AppData\\Local\\Temp\\opencode\\live-otp.png');
});
