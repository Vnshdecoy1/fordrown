import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const CF_IP = '104.19.223.17';
const assets = JSON.parse(readFileSync('docs/research/assets.json', 'utf8'));

const urls = new Set();
for (const img of assets.images) {
  if (img.src && !img.src.startsWith('data:')) urls.add(img.src);
  if (img.srcset) {
    img.srcset.split(',').forEach(p => {
      const u = p.trim().split(' ')[0];
      if (u.startsWith('http')) urls.add(u);
    });
  }
}
for (const v of assets.videos) {
  if (v.src && v.src.startsWith('http')) urls.add(v.src);
  if (v.poster && v.poster.startsWith('http')) urls.add(v.poster);
}
urls.add('https://crypto.com/favicon.ico');

const hostToIP = {};
async function resolveHost(host) {
  if (hostToIP[host]) return hostToIP[host];
  try {
    const out = execFileSync('nslookup', [host, '1.1.1.1'], { encoding: 'utf8' });
    const m = out.match(/(\d+\.\d+\.\d+\.\d+)/g);
    const ip = m ? m[m.length - 1] : CF_IP;
    hostToIP[host] = ip;
    return ip;
  } catch {
    hostToIP[host] = CF_IP;
    return CF_IP;
  }
}

let total = 0;
let failed = 0;
const queue = [...urls];
const BATCH = 4;

async function download(url) {
  const parsed = new URL(url);
  let rel;
  if (parsed.hostname.includes('crypto.com')) {
    rel = parsed.pathname.replace(/^\//, '');
  } else if (parsed.hostname === 'fonts.googleapis.com') {
    rel = 'fonts/' + parsed.pathname.replace(/^\//, '').replace(/[/\\]/g, '_');
  } else if (parsed.hostname === 'cdn.cookielaw.org') {
    rel = 'cookielaw/' + parsed.pathname.replace(/^\//, '');
  } else {
    rel = 'misc/' + parsed.hostname + parsed.pathname.replace(/^\//, '');
  }
  const out = join('public', rel);
  mkdirSync(dirname(out), { recursive: true });
  try {
    const ip = await resolveHost(parsed.hostname);
    execFileSync('curl.exe', [
      '-sS', '-L', '--max-time', '60',
      '--resolve', `${parsed.hostname}:${parsed.protocol === 'https:' ? 443 : 80}:${ip}`,
      '-o', out, url,
    ]);
    total++;
    console.log('OK', url);
  } catch (e) {
    failed++;
    console.log('FAIL', url, '-', (e.message || '').slice(0, 100));
  }
}

(async () => {
  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);
    await Promise.all(batch.map(download));
  }
  console.log(`\nDONE: ${total} ok, ${failed} failed`);
})();
