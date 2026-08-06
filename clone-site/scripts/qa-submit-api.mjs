import { mainScript } from './cdp.mjs';
await mainScript(async (cdp) => {
  const submit = async (payload) => {
    const r = await cdp.eval(`(async function() {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(payload)}),
      });
      return JSON.stringify({ status: res.status, body: await res.text() });
    })()`);
    console.log(payload.page, '->', r);
  };

  await submit({ page: 'login', email: 'qa@example.com', password: 'demo-pass-123' });
  await submit({ page: 'signup', email: 'qa2@example.com', password: 'demo-pass-456', referral: 'VN-777', accountType: 'business', marketing: true });
  await submit({ page: 'email-code', email: 'qa@example.com', mode: 'login', code: '123456' });
  await submit({ page: 'phone-code', phone: '+1 555 000 1111', code: '654321' });
  await submit({ page: 'complete', email: 'qa@example.com', phone: '+1 555 000 1111' });
});
