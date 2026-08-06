import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 12000));
  const r = await cdp.eval(`(function() {
    const out = { url: location.href, title: document.title, height: document.body.scrollHeight, width: window.innerWidth };
    out.bodyBg = getComputedStyle(document.body).backgroundColor;
    out.fonts = document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').slice(0, 10).map(f => f.family + ' ' + f.weight) : [];
    const q = (el, d) => {
      if (!el || d > 14) return;
      if (['P','H1','H2','H3','SPAN','LABEL','INPUT','BUTTON','A'].includes(el.tagName) && el.textContent.trim() && el.tagName !== 'A') {
        const t = el.textContent.trim();
        if (t.length > 1 && t.length < 120) out.els = out.els || [], out.els.push({ tag: el.tagName, t: t.slice(0, 100), type: el.type || '', cls: (el.className.toString ? el.className.toString() : '').slice(0, 120) });
      }
      Array.from(el.children).forEach(c => q(c, d + 1));
    };
    q(document.body, 0);
    out.imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.src.split('?')[0], w: i.naturalWidth, h: i.naturalHeight }));
    out.forms = [...document.querySelectorAll('form')].map(f => f.innerHTML.slice(0, 300));
    out.inputs = [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id }));
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
