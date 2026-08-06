import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

await mainScript(async (cdp) => {
  const topology = await cdp.eval(`(function() {
    const out = [];
    const main = document.querySelector('main') || document.body;
    const walk = (el, depth) => {
      if (depth > 2) return;
      for (const child of el.children) {
        const cls = (typeof child.className === 'string' ? child.className : '').trim().slice(0, 120);
        const id = child.id ? '#' + child.id : '';
        const text = (child.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
        const rect = child.getBoundingClientRect();
        out.push({ depth, tag: child.tagName.toLowerCase(), id, cls, top: Math.round(rect.top + scrollY), h: Math.round(rect.height), text: text.slice(0, 60) });
        walk(child, depth + 1);
      }
    };
    walk(main, 0);
    return JSON.stringify(out);
  })()`);
  writeFileSync('docs/research/raw-topology-2.json', topology);
  const sections = JSON.parse(topology);
  for (const s of sections.filter((x) => x.depth === 0)) {
    console.log(s.top, 'h:' + s.h, '|', s.cls.slice(0, 90), '|', s.text.slice(0, 50));
  }
});
