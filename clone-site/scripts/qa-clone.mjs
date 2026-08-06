import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('http://localhost:3002');
  await new Promise((r) => setTimeout(r, 9000));
  const r = await cdp.eval(`(function() {
    const out = { url: location.href, title: document.title, height: document.body.scrollHeight };
    out.headings = [...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ': ' + h.textContent.trim().slice(0, 60));
    const mains = [...document.querySelectorAll('main div')].filter(d => d.children.length < 3 && d.textContent.length > 10);
    const sections = [...document.querySelectorAll('main > div, main > header')].map(d => {
      const cs = getComputedStyle(d);
      return { cls: (d.className.toString ? d.className.toString() : '').slice(0, 90), bg: cs.backgroundColor.slice(0, 30), h: Math.round(d.getBoundingClientRect().height), text: d.textContent.trim().slice(0, 40) };
    });
    out.sections = sections;
    const videos = [...document.querySelectorAll('video')].map(v => v.src || (v.querySelector('source')?.src || ''));
    out.videos = videos;
    const imgs = [...document.querySelectorAll('img')].map(i => i.src.replace('http://localhost:3002', '')).filter(s => !s.includes('data:')).slice(0, 40);
    out.imgs = imgs;
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
