import { readFileSync, writeFileSync } from 'node:fs';

const files = ['trustedby', 'liveprices', 'appsection', 'learn', 'advanced', 'onchain', 'partners', 'waystotrade', 'faq', 'footer'];

function formatNode(n, depth, out) {
  const pad = '  '.repeat(depth);
  let line = pad + '<' + n.tag;
  if (n.cls) line += ' class="' + n.cls.slice(0, 120) + '"';
  line += '>';
  if (n.text) line += ' "' + n.text.slice(0, 120) + '"';
  const s = n.s || {};
  const keys = ['fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'padding', 'margin', 'borderRadius', 'gap', 'width', 'height', 'maxWidth', 'backgroundImage', 'opacity', 'transform', 'boxShadow', 'flexDirection', 'justifyContent', 'alignItems', 'position', 'display'];
  const extras = [];
  for (const k of keys) {
    const v = s[k];
    if (v && !['0px', 'none', 'auto', 'normal', 'rgba(0, 0, 0, 0)', 'static', 'fill', 'clip', '1', 'row'].includes(v) && v !== undefined) {
      extras.push(k + '=' + v.slice(0, 90));
    }
  }
  if (extras.length) line += ' [' + extras.join(' | ') + ']';
  if (n.img) line += ' [IMG ' + n.img.w + 'x' + n.img.h + ' ' + n.img.src + ']';
  out.push(line);
  for (const c of (n.c || [])) formatNode(c, depth + 1, out);
}

for (const f of files) {
  try {
    const j = JSON.parse(readFileSync('docs/research/' + f + '.json', 'utf8'));
    const out = [];
    formatNode(j.tree, 0, out);
    writeFileSync('docs/research/' + f + '.tree.txt', out.join('\n'));
    console.log('--- ' + f + ' (' + out.length + ' nodes) ---');
    console.log(out.slice(0, 12).join('\n'));
  } catch (e) {
    console.log(f, 'ERROR', e.message);
  }
}
