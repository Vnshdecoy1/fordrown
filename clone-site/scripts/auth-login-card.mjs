import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const out = { url: location.href };
    const all = [...document.querySelectorAll('*')];
    const card = all.find(el => getComputedStyle(el).backgroundColor === 'rgb(21, 29, 50)' || (getComputedStyle(el).backgroundColor === 'rgba(255, 255, 255, 0.05)' && el.getBoundingClientRect().width > 400));
    const cardBg = all.filter(el => el.getBoundingClientRect().width > 450 && el.getBoundingClientRect().height > 400);
    out.candidates = cardBg.slice(0, 6).map(el => ({ tag: el.tagName, cls: (el.className.toString() || '').slice(0, 70), bg: getComputedStyle(el).backgroundColor.slice(0, 28), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), left: Math.round(el.getBoundingClientRect().left), top: Math.round(el.getBoundingClientRect().top) }));
    const btn = all.find(el => el.tagName === 'BUTTON' && el.textContent.trim() === 'Log In');
    if (btn) {
      const cs = getComputedStyle(btn);
      out.btn = { bg: cs.backgroundImage.slice(0, 90), bgc: cs.backgroundColor.slice(0, 30), radius: cs.borderRadius, border: cs.border.slice(0, 50), fs: cs.fontSize, fw: cs.fontWeight, h: Math.round(btn.getBoundingClientRect().height), shadow: cs.boxShadow.slice(0, 80) };
    }
    const seg = all.find(el => (el.className.toString() || '').includes('SegmentedControl'));
    if (seg) out.segCls = seg.className.toString().slice(0, 120);
    const labels = all.filter(el => el.tagName === 'LABEL' || (el.className.toString() || '').includes('InputLabel'));
    out.labels = labels.slice(0, 8).map(l => ({ t: (l.textContent || '').trim().slice(0, 50), cls: (l.className.toString() || '').slice(0, 60) }));
    const links = all.filter(el => el.tagName === 'A' && el.getBoundingClientRect().width > 40 && el.getBoundingClientRect().top > 180 && el.getBoundingClientRect().top < 700);
    out.links = links.map(l => ({ t: (l.textContent || '').trim().slice(0, 50), href: l.href.slice(0, 90), top: Math.round(l.getBoundingClientRect().top), left: Math.round(l.getBoundingClientRect().left) })).filter(x => x.t);
    const logo = all.find(el => el.tagName === 'A' && el.getBoundingClientRect().top < 65);
    if (logo) out.logoSvg = logo.innerHTML.slice(0, 1500);
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
