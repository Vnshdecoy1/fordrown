import { mainScript } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const PROPS = [
  'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
  'textTransform','textDecoration','backgroundColor',
  'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
  'margin','marginTop','marginRight','marginBottom','marginLeft',
  'width','height','maxWidth','minWidth','maxHeight','minHeight',
  'display','flexDirection','justifyContent','alignItems','gap',
  'gridTemplateColumns','gridTemplateRows',
  'borderRadius','borderTop','borderBottom','borderLeft','borderRight',
  'boxShadow','overflow','overflowX','overflowY',
  'position','top','right','bottom','left','zIndex',
  'opacity','transform','transition','cursor',
  'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
  'whiteSpace','backgroundImage','flex','order','alignSelf'
];

const SECTIONS = {
  'hero': `(() => { const h = [...document.querySelectorAll('h1')].find(e => e.textContent.includes('The only crypto platform')); if (!h) return null; let el = h.parentElement; while (el && !String(el.className).includes('overflow-hidden') && el.tagName !== 'BODY') el = el.parentElement; return el; })()`,
  'trustedby': `(() => { const h = [...document.querySelectorAll('h2')].find(e => e.textContent.trim().startsWith('Built for wealth')); return h ? h.closest('div[class*="p-[16px_12px_88px_12px]"]') : null; })()`,
  'liveprices': `(() => { const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('Stay up-to-date')); return h ? h.closest('div[class*="pb-[128px]"]') : null; })()`,
  'appsection': `(() => [...document.querySelectorAll('div')].find(e => String(e.className).includes('overflow-hidden rounded-br-[32px]') && e.getBoundingClientRect().height > 2000))()`,
  'learn': `(() => [...document.querySelectorAll('div')].find(e => String(e.className).includes('max-w-[1280px]') && e.textContent.includes('Crypto beyond trading') && e.getBoundingClientRect().height > 300))()`,
  'advanced': `(() => [...document.querySelectorAll('div')].find(e => String(e.className).includes('mb-[-32px] w-full pb-[32px]') && e.getBoundingClientRect().height > 2000))()`,
  'onchain': `(() => [...document.querySelectorAll('div')].find(e => String(e.className) === 'mb-[-32px] w-full lg:mb-[-64px]' && e.textContent.includes('Onchain') && e.getBoundingClientRect().height > 1500))()`,
  'partners': `(() => [...document.querySelectorAll('div')].find(e => String(e.className) === 'mb-[-32px] w-full lg:mb-[-64px]' && e.textContent.includes('world-class brands') && e.getBoundingClientRect().height > 800))()`,
  'waystotrade': `(() => [...document.querySelectorAll('div')].find(e => String(e.className) === 'z-0 w-full' && e.textContent.includes('One platform, multiple ways')))()`,
  'faq': `(() => [...document.querySelectorAll('div')].find(e => String(e.className) === 'w-full bg-transparent' && e.textContent.includes('FAQ') && e.getBoundingClientRect().height > 600))()`,
  'footer': `(() => document.querySelector('footer'))()`,
};

const which = process.argv[2] || 'all';
const targets = which === 'all' ? Object.entries(SECTIONS) : [[which, SECTIONS[which]]];

await mainScript(async (cdp) => {
  for (const [name, expr] of targets) {
    const script = `(function() {
      const el = ${expr};
      if (!el) return JSON.stringify({ error: 'not found' });
      const props = ${JSON.stringify(PROPS)};
      function extractStyles(element) {
        const cs = getComputedStyle(element);
        const styles = {};
        props.forEach(p => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v; });
        return styles;
      }
      function walk(element, depth) {
        if (depth > 6) return null;
        const children = [...element.children];
        const text = element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 400) : null;
        const img = element.tagName === 'IMG' ? { src: element.src, alt: element.alt, w: element.naturalWidth, h: element.naturalHeight } : null;
        return {
          tag: element.tagName.toLowerCase(),
          cls: (typeof element.className === 'string' ? element.className : '').slice(0, 200),
          text,
          img,
          s: extractStyles(element),
          c: children.slice(0, 30).map(x => walk(x, depth + 1)).filter(Boolean)
        };
      }
      return JSON.stringify({ top: Math.round(el.getBoundingClientRect().top + scrollY), h: Math.round(el.getBoundingClientRect().height), tree: walk(el, 0) });
    })()`;
    try {
      const result = await cdp.eval(script);
      const out = JSON.parse(result);
      if (out.error) { console.log(name, '->', out.error); continue; }
      writeFileSync(`docs/research/${name}.json`, JSON.stringify(out, null, 1));
      console.log(name, '->', out.top, 'h:', out.h);
    } catch (e) {
      console.log(name, 'ERROR:', e.message);
    }
  }
});
