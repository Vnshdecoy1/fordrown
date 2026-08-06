import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  const hover = await cdp.eval(`(function() {
    const items = [...document.querySelectorAll('nav div')].filter(e => e.textContent.trim() === 'Individuals');
    const el = items[0];
    const panel = document.querySelector('div[class*="absolute top-0 left-0 z-299"]');
    if (!el || !panel) return 'not found';
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.stringify({
          afterHover: getComputedStyle(panel).opacity + '/' + getComputedStyle(panel).visibility + '/' + getComputedStyle(panel).transform,
          transition: getComputedStyle(panel).transition
        }));
      }, 500);
    });
  })()`);
  console.log('HOVER DROPDOWN:', hover);

  const faqClick = await cdp.eval(`(function() {
    const qs = [...document.querySelectorAll('div')].find(e => e.textContent.trim().startsWith('FAQ') && e.children.length < 5 && e.getBoundingClientRect().height > 500);
    if (!qs) return 'no root';
    const btn = qs.querySelector('button');
    if (!btn) return 'no button';
    const btnBefore = getComputedStyle(btn).transition;
    btn.click();
    return new Promise((resolve) => {
      setTimeout(() => {
        const answers = [...qs.querySelectorAll('div')].filter(d => d.style && d.style.maxHeight === 'none' || (d.scrollHeight > 200 && !d.textContent.includes('FAQ')));
        const expanded = qs.querySelector('svg[data-custom="true"]');
        resolve(JSON.stringify({ btnBefore, contentNow: qs.textContent.trim().slice(0, 400), rotatedIcon: expanded ? expanded.outerHTML.slice(0, 120) : 'none' }));
      }, 600);
    });
  })()`);
  console.log('FAQ CLICK:', faqClick);

  const tabs = await cdp.eval(`(function() {
    const btns = [...document.querySelectorAll('button, a, div')].filter(e => ['Trending', 'Top Movers'].includes(e.textContent.trim()) && e.children.length < 3);
    return JSON.stringify(btns.map(b => ({ tag: b.tagName, txt: b.textContent.trim(), cls: b.className.toString ? b.className.toString().slice(0, 100) : '' })));
  })()`);
  console.log('TABS:', tabs);

  const scroll = await cdp.eval(`(function() {
    const header = document.querySelector('header');
    return new Promise((resolve) => {
      const before = JSON.stringify({ bg: getComputedStyle(header).backgroundColor, shadow: getComputedStyle(header).boxShadow, h: header.getBoundingClientRect().height });
      window.scrollTo(0, 800);
      setTimeout(() => {
        const after = JSON.stringify({ bg: getComputedStyle(header).backgroundColor, shadow: getComputedStyle(header).boxShadow, h: header.getBoundingClientRect().height, scrolled: scrollY });
        window.scrollTo(0, 0);
        setTimeout(() => resolve(JSON.stringify({ before, after })), 400);
      }, 800);
    });
  })()`);
  console.log('SCROLL:', scroll);
});
