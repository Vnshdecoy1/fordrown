import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

async function getCards(cdp, label) {
  const r = await cdp.eval(`(function() {
    const scroller = [...document.querySelectorAll('div')].find(e => String(e.className).includes('no-scrollbar overflow-x-auto') && e.getBoundingClientRect().height > 300);
    if (!scroller) return 'NO SCROLLER';
    const row = scroller.children[0];
    const cards = [...row.children];
    return JSON.stringify(cards.map(c => {
      const imgs = [...c.querySelectorAll('img')].map(i => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }));
      const btnTxt = (c.textContent || '').trim().replace(/\\s+/g, ' ');
      const btn = c.closest('div');
      return { text: btnTxt.slice(0, 260), imgs, w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) };
    }));
  })()`);
  const cards = JSON.parse(r);
  writeFileSync('docs/research/' + label + '.json', JSON.stringify(cards, null, 1));
  console.log('=== ' + label + ': ' + cards.length + ' cards ===');
  for (const c of cards) {
    console.log('[' + c.w + 'x' + c.h + ']', c.text);
    for (const i of c.imgs) console.log('    img:', i.src);
  }
}

await mainScript(async (cdp) => {
  await cdp.eval('window.scrollTo(0, 2400)');
  await new Promise(r => setTimeout(r, 500));
  await getCards(cdp, 'tab-trending');

  const move = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Top Movers');
    if (!btn) return 'NO';
    btn.click();
    return 'clicked';
  })()`);
  console.log('switch to Top Movers:', move);
  await new Promise(r => setTimeout(r, 1500));
  await getCards(cdp, 'tab-movers');

  const trendAgain = await cdp.eval(`(function() {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Trending');
    if (!btn) return 'NO';
    btn.click();
    return 'clicked';
  })()`);
  console.log('switch back to Trending:', trendAgain);
  await new Promise(r => setTimeout(r, 1000));
  const pager = await cdp.eval(`(function() {
    const scroller = [...document.querySelectorAll('div')].find(e => String(e.className).includes('no-scrollbar overflow-x-auto') && e.getBoundingClientRect().height > 300);
    const row = scroller.children[0];
    const before = row.scrollLeft;
    const navBtns = [...scroller.parentElement.querySelectorAll('button')].filter(b => !['Trending','Top Movers'].includes(b.textContent.trim()));
    const next = navBtns[1];
    next.click();
    return new Promise(resolve => setTimeout(() => resolve(JSON.stringify({ before, after: row.scrollLeft, navCount: navBtns.length })), 700));
  })()`);
  console.log('PAGER:', pager);
});
