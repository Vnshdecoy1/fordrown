import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  await cdp.navigate('https://accounts.crypto.com/en/login?from=mainapp-web');
  await new Promise((r) => setTimeout(r, 8000));
  const r = await cdp.eval(`(function() {
    const out = {};
    const seg = document.querySelector('.mantine-SegmentedControl-root');
    if (seg) {
      const cs = getComputedStyle(seg);
      out.seg = { bg: cs.backgroundColor.slice(0, 30), radius: cs.borderRadius, p: cs.padding, h: Math.round(seg.getBoundingClientRect().height) };
      const labels = [...seg.querySelectorAll('.mantine-SegmentedControl-label')].map(l => ({ t: l.textContent.trim(), cls: l.className.toString().slice(0, 60) }));
      out.segLabels = labels;
      const active = seg.querySelector('[data-active]');
      const activeSeg = seg.querySelector('.mantine-SegmentedControl-indicator');
      if (activeSeg) {
        const acs = getComputedStyle(activeSeg);
        out.indicator = { bg: acs.backgroundColor.slice(0, 30), radius: acs.borderRadius, shadow: acs.boxShadow.slice(0, 60), w: Math.round(activeSeg.getBoundingClientRect().width) };
      }
      const activeLabel = labels.find(l => l.cls.includes('active'));
      out.activeLabel = activeLabel ? activeLabel.t : null;
    }
    const tabs = document.querySelectorAll('._styles_containerTabs__jCBR_, [class*="containerTabs"]');
    out.tabs = [...tabs].slice(0, 4).map(t => {
      const cs = getComputedStyle(t);
      return { tag: t.tagName, cls: t.className.toString().slice(0, 80), bg: cs.backgroundColor.slice(0, 26), border: cs.border.slice(0, 50), radius: cs.borderRadius, h: Math.round(t.getBoundingClientRect().height) };
    });
    const tabButtons = [...document.querySelectorAll('[role="tab"], .mantine-Tabs-tab')].map(t => {
      const cs = getComputedStyle(t);
      return { t: (t.textContent || '').trim().slice(0, 20), cls: t.className.toString().slice(0, 90), color: cs.color.slice(0, 22), border: cs.borderBottom.slice(0, 60), active: t.getAttribute('data-active'), h: Math.round(t.getBoundingClientRect().height) };
    });
    out.tabButtons = tabButtons;
    const emailInput = [...document.querySelectorAll('input')].find(i => i.placeholder === 'Enter your email address');
    if (emailInput) {
      const cs = getComputedStyle(emailInput);
      out.input = { h: Math.round(emailInput.getBoundingClientRect().height), bg: cs.backgroundColor.slice(0, 30), border: cs.border.slice(0, 60), radius: cs.borderRadius, fs: cs.fontSize, phColor: cs.color, ph: emailInput.placeholder };
    }
    return JSON.stringify(out);
  })()`);
  console.log(r);
});
