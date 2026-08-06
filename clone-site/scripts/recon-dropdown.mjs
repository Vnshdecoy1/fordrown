import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const panel = document.querySelector('div[class*="absolute top-0 left-0 z-299"]');
    if (!panel) return 'no panel';
    const cols = [...panel.querySelectorAll('div')].filter(d => d.children.length > 2 && d.querySelectorAll('a').length >= 2 && !d.querySelector('div'));
    const groups = [];
    for (const c of cols.slice(0, 8)) {
      const title = c.children[0] ? c.children[0].textContent.trim() : '';
      const links = [...c.querySelectorAll('a')].map(a => ({ t: a.textContent.trim().slice(0, 60), href: a.href }));
      groups.push({ title, links });
    }
    const allLinks = [...panel.querySelectorAll('a')].map(a => a.textContent.trim().slice(0, 60));
    return JSON.stringify({ cols: groups, allLinks: [...new Set(allLinks)] });
  })()`);
  const d = JSON.parse(r);
  writeFileSync('docs/research/header-dropdown.json', JSON.stringify(d, null, 1));
  console.log('=== DROPDOWN PANEL ===');
  for (const g of d.cols) {
    console.log('-- ' + g.title + ':');
    for (const l of g.links) console.log('   ' + l.t + ' -> ' + l.href);
  }
  console.log('ALL:', d.allLinks.join(', '));
});
