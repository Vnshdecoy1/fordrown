import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const r = await cdp.eval(`(function() {
    const positives = [...document.querySelectorAll('p')].filter(p => p.textContent.trim().startsWith('+') && p.textContent.trim().length < 12);
    const negatives = [...document.querySelectorAll('p')].filter(p => p.textContent.trim().startsWith('-') && p.textContent.trim().length < 12);
    return JSON.stringify({
      posColors: [...new Set(positives.slice(0, 8).map(p => getComputedStyle(p).color))],
      negColors: [...new Set(negatives.slice(0, 8).map(p => getComputedStyle(p).color))],
      samplePos: positives[0] ? positives[0].textContent.trim() : null,
      sampleNeg: negatives[0] ? negatives[0].textContent.trim() : null
    });
  })()`);
  console.log(r);
});
