import { mainScript } from './cdp.mjs';

const PROPS = [
  'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
  'textTransform','textDecoration','backgroundColor','background',
  'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
  'margin','marginTop','marginRight','marginBottom','marginLeft',
  'width','height','maxWidth','minWidth','maxHeight','minHeight',
  'display','flexDirection','justifyContent','alignItems','gap',
  'gridTemplateColumns','gridTemplateRows',
  'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
  'boxShadow','overflow','overflowX','overflowY',
  'position','top','right','bottom','left','zIndex',
  'opacity','transform','transition','cursor',
  'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
  'whiteSpace','textOverflow',
  'backgroundImage'
];

const expr = process.argv[2];
const outFile = process.argv[3];

await mainScript(async (cdp) => {
  const script = `(function() {
    const el = ${expr};
    if (!el) return JSON.stringify({ error: 'Element not found: ' + ${JSON.stringify(expr)} });
    const props = ${JSON.stringify(PROPS)};
    function extractStyles(element) {
      const cs = getComputedStyle(element);
      const styles = {};
      props.forEach(p => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v; });
      return styles;
    }
    function walk(element, depth) {
      if (depth > 5) return null;
      const children = [...element.children];
      const text = element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 300) : null;
      const img = element.tagName === 'IMG' ? { src: element.src, alt: element.alt, w: element.naturalWidth, h: element.naturalHeight } : null;
      return {
        tag: element.tagName.toLowerCase(),
        classes: (element.className?.toString() || '').slice(0, 150),
        text,
        img,
        styles: extractStyles(element),
        childCount: children.length,
        children: children.slice(0, 25).map(c => walk(c, depth + 1)).filter(Boolean)
      };
    }
    return JSON.stringify(walk(el, 0));
  })()`;
  const result = await cdp.eval(script);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outFile, JSON.stringify(JSON.parse(result), null, 2));
  console.log('extracted ->', outFile);
});
