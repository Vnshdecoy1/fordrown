import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const dump = async (cdp, label, file) => {
  const r = await cdp.eval(`(function() {
    const root = [...document.querySelectorAll('div')].find(e => String(e.className).includes('mt-16 lg:mt-[160px]') && e.getBoundingClientRect().height > 400);
    if (!root) return 'NO ROOT';
    const cards = [...root.querySelectorAll('div')].filter(d => {
      const s = getComputedStyle(d);
      return d.children.length > 3 && d.children.length < 20 && s.padding !== '0px' && (d.textContent.includes('$') || d.textContent.includes('BTC'));
    });
    return JSON.stringify(cards.slice(0, 30).map(c => ({
      text: (c.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 300),
      w: Math.round(c.getBoundingClientRect().width),
      h: Math.round(c.getBoundingClientRect().height),
      cls: c.className.toString ? c.className.toString().slice(0, 130) : ''
    })));
  })()`);
  writeFileSync(file, r);
  const data = JSON.parse(r);
  console.log('=== ' + label + ' ===');
  for (const c of data) console.log('[' + c.w + 'x' + c.h + ']', c.text, '\n   cls:', c.cls);
  return data;
};

await mainScript(async (cdp) => {
  await cdp.eval('window.scrollTo(0, 2400)');
  await new Promise(r => setTimeout(r, 800));
  const trending = await dump(cdp, 'TRENDING (default)', 'docs/research/tab-trending.json');
  const topMovers = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Top Movers');
    if (!btn) return 'NO BTN';
    btn.click();
    return 'clicked';
  })()`);
  console.log(topMovers);
  await new Promise(r => setTimeout(r, 1200));
  const movers = await dump(cdp, 'TOP MOVERS', 'docs/research/tab-movers.json');
});
