import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/authentication/email-verify-otp?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 9000));
  const r = await cdp.eval(`(() => {
    const srcs = [...document.querySelectorAll('script[src]')].map(s => s.src).filter(s => s.includes('accounts-static'));
    const otp = srcs.filter(s => s.includes('verify') || s.includes('otp') || s.includes('passcode') || s.includes('password'));
    return JSON.stringify({ all: srcs.length, otp: otp.map(s => s.split('/chunks/')[1]) });
  })()`);
  console.log(r);
});
