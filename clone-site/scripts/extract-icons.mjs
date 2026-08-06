import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

await mainScript(async (cdp) => {
  const result = await cdp.eval(`(function() {
    const svgs = [...document.querySelectorAll('svg')];
    return JSON.stringify(svgs.map((s, i) => ({
      i,
      cls: (s.className && s.className.toString ? s.className.toString() : '').slice(0, 80),
      outer: s.outerHTML.slice(0, 900),
      parentText: (s.parentElement && s.parentElement.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60)
    })));
  })()`);
  writeFileSync('docs/research/svgs.json', result);
  const svgs = JSON.parse(result);
  console.log('TOTAL SVGS:', svgs.length);
  const uniq = {};
  for (const s of svgs) {
    const key = s.outer.replace(/[0-9a-f-]{8,}/g, 'X');
    if (!uniq[key]) uniq[key] = [];
    uniq[key].push(s);
  }
  console.log('UNIQUE SVGS:', Object.keys(uniq).length);
  let idx = 0;
  const iconDefs = [];
  for (const [key, group] of Object.entries(uniq)) {
    idx++;
    const sample = group[0];
    const paths = sample.outer.replace(/\s+/g, ' ');
    iconDefs.push({ id: idx, count: group.length, sample: paths, ctx: sample.parentText || sample.cls });
  }
  writeFileSync('docs/research/svgs-unique.json', JSON.stringify(iconDefs, null, 1));
  for (const d of iconDefs) console.log('#' + d.id, 'x' + d.count, '|', d.ctx, '|', d.sample.slice(0, 160));
});
