import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const root = [...document.querySelectorAll('div')].find(e => String(e.className) === 'w-full bg-transparent' && e.textContent.includes('FAQ') && e.getBoundingClientRect().height > 600);
    const items = [...root.querySelectorAll('div.border-b')].map(d => ({
      q: d.querySelector('p') ? d.querySelector('p').textContent.trim() : '',
      a: (() => { const ans = d.querySelector('div[class*="grid"]'); return ans ? ans.textContent.trim().replace(/\\s+/g, ' ') : ''; })()
    }));
    return JSON.stringify(items);
  })()`);
  const items = JSON.parse(r);
  writeFileSync('docs/research/faq-full.json', JSON.stringify(items, null, 1));
  console.log('FAQ items:', items.length);
  for (const i of items) console.log('Q:', i.q, '\n  A:', i.a.slice(0, 250));

  const f = await cdp.eval(`(function() {
    const footer = document.querySelector('footer');
    const cols = [];
    for (const d of footer.querySelectorAll('div')) {
      const cls = d.className.toString ? d.className.toString() : '';
      if (cls.includes('flex-col') && d.querySelectorAll('a').length > 3 && d.querySelectorAll('a').length < 25 && d.children.length < 5) {
        const title = d.children[0] ? d.children[0].textContent.trim() : '';
        const links = [...d.querySelectorAll('a')].map(a => a.textContent.trim());
        cols.push({ title, links });
      }
    }
    return JSON.stringify(cols);
  })()`);
  const cols = JSON.parse(f);
  writeFileSync('docs/research/footer-columns.json', JSON.stringify(cols, null, 1));
  console.log('FOOTER COLS:', cols.length);
  for (const c of cols) console.log('--', c.title, ':', c.links.join(', '));
});
