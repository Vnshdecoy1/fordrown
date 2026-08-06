import { mainScript } from './cdp.mjs';

await mainScript(async (cdp) => {
  // 1. Header dropdown behavior: hover on "Individuals"
  const dd = await cdp.eval(`(function() {
    const navItems = [...document.querySelectorAll('nav a, nav div')].filter(e => ['Individuals','Businesses','Discover'].includes(e.textContent.trim()));
    const el = navItems[0];
    if (!el) return 'no nav item';
    const panel = document.querySelector('div[class*="absolute top-0 left-0 z-299"]');
    const before = panel ? getComputedStyle(panel).opacity + '/' + getComputedStyle(panel).visibility : 'no panel';
    return JSON.stringify({ target: el.textContent.trim(), panelBefore: before, panelCls: panel ? panel.className.slice(0,100) : '' });
  })()`);
  console.log('DROPDOWN:', dd);

  // 2. FAQ accordion: find first FAQ item and click it
  const faq = await cdp.eval(`(function() {
    const qs = [...document.querySelectorAll('div')].filter(e => e.textContent.trim().startsWith('FAQ') && e.children.length < 5 && e.getBoundingClientRect().height > 500);
    const root = qs[0];
    if (!root) return 'no faq root';
    const buttons = [...root.querySelectorAll('button')];
    return JSON.stringify({ count: buttons.length, labels: buttons.slice(0, 8).map(b => b.textContent.trim().slice(0, 70)) });
  })()`);
  console.log('FAQ:', faq);
});
