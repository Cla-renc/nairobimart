const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const [key, ...rest] = trimmed.split('=');
  if (!key) return;
  let value = rest.join('=');
  value = value.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  env[key.trim()] = value;
});

const auth = env.PAYHERO_AUTH_TOKEN || `Basic ${Buffer.from(`${env.PAYHERO_API_USERNAME}:${env.PAYHERO_API_PASSWORD}`).toString('base64')}`;
console.log('AUTH header sample:', auth.slice(0, 20), auth.endsWith('==') ? '...==' : '');
const payload = {
  amount: 1226,
  phone_number: '0759193674',
  channel_id: Number(env.PAYHERO_CHANNEL_ID),
  provider: 'm-pesa',
  external_reference: 'ORD-DEBUG-123',
  callback_url: env.PAYHERO_CALLBACK_URL || 'https://nairobimart-gwna.vercel.app/api/webhook/payhero',
};
console.log('payload', payload);

(async () => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: auth,
    };
    if (env.PAYHERO_ACCOUNT_ID) {
      headers['X-AUTH-ACCOUNT-ID'] = env.PAYHERO_ACCOUNT_ID;
      console.log('Using X-AUTH-ACCOUNT-ID:', env.PAYHERO_ACCOUNT_ID);
    }
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    console.log('status', response.status, response.statusText);
    console.log('headers', Object.fromEntries(response.headers.entries()));
    console.log('body', text);
  } catch (err) {
    console.error('fetch error', err);
  }
})();
