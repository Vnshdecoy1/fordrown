import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/authentication/email-verify-otp?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const banner = document.querySelector('#onetrust-banner-sdk') || document.querySelector('[id*="onetrust"]') || document.body;
    const btns = [...banner.querySelectorAll('button')].map(b => ({
      t: b.textContent.trim().slice(0, 40),
      id: b.id,
      cls: (b.className || '').toString().slice(0, 60),
      w: Math.round(b.getBoundingClientRect().width),
    })).filter(b => b.w > 0);
    const out = { hasBanner: !!document.querySelector('#onetrust-banner-sdk') };
    out.buttons = btns.slice(0, 12);
    out.appText = (document.body.innerText || '').slice(0, 200);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
