const fs = require('fs');
const path = require('path');
const https = require('https');

function readEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const raw = fs.readFileSync(p, 'utf8');
  const out = {};
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^=]+)=(.*)$/);
    if (m) {
      out[m[1].trim()] = m[2].trim();
    }
  });
  return out;
}

function getAuthHeader(env) {
  if (env.PAYHERO_AUTH_TOKEN) {
    return env.PAYHERO_AUTH_TOKEN.startsWith('Basic ') ? env.PAYHERO_AUTH_TOKEN : `Basic ${env.PAYHERO_AUTH_TOKEN}`;
  }
  if (env.PAYHERO_API_USERNAME && env.PAYHERO_API_PASSWORD) {
    return `Basic ${Buffer.from(`${env.PAYHERO_API_USERNAME}:${env.PAYHERO_API_PASSWORD}`).toString('base64')}`;
  }
  return null;
}

async function fetchText(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  const envLocal = readEnvLocal();
  const env = { ...process.env, ...envLocal };

  const auth = getAuthHeader(env);
  if (!auth) {
    console.error('No PayHero auth found. Set PAYHERO_AUTH_TOKEN or PAYHERO_API_USERNAME/PAYHERO_API_PASSWORD in environment or .env.local');
    process.exit(1);
  }

  const base = 'https://backend.payhero.co.ke';

  console.log('Calling PayHero /api/v2/payment_channels');
  const accountHeader = env.PAYHERO_ACCOUNT_ID ? { 'X-AUTH-ACCOUNT-ID': String(env.PAYHERO_ACCOUNT_ID) } : {};
  try {
    const channelsRes = await fetchText(`${base}/api/v2/payment_channels`, {
      method: 'GET',
      headers: Object.assign({ Authorization: auth, 'Content-Type': 'application/json' }, accountHeader)
    });
    console.log('Status:', channelsRes.status);
    console.log('Headers:', channelsRes.headers);
    console.log('Body:', channelsRes.body);
  } catch (e) {
    console.error('Failed to fetch payment_channels:', e);
  }

  const allowTest = (env.ALLOW_PAYHERO_TEST || 'false').toLowerCase() === 'true';
  if (!allowTest) {
    console.log('\nALLOW_PAYHERO_TEST is not true — skipping test POST to /api/v2/payments.\nSet ALLOW_PAYHERO_TEST=true in .env.local to enable.');
    return;
  }

  // Build a safe test payload
  const phone = env.TEST_PAYHERO_PHONE || env.TEST_PHONE || '0710000000';
  const channelId = env.PAYHERO_CHANNEL_ID;
  if (!channelId) {
    console.error('PAYHERO_CHANNEL_ID not set in environment (.env.local).');
    process.exit(1);
  }

  const payload = {
    amount: 1,
    phone_number: phone,
    channel_id: Number(channelId),
    provider: 'm-pesa',
    external_reference: `DIAG-${Date.now()}`,
    callback_url: env.PAYHERO_CALLBACK_URL || (env.NEXT_PUBLIC_URL ? `${env.NEXT_PUBLIC_URL}/api/webhook/payhero` : 'https://example.com/webhook'),
    customer_name: 'Diag Test'
  };

  console.log('\nPosting safe test payment (amount=1) — this may trigger an STK push if channel supports it.');
  try {
    const postRes = await fetchText(`${base}/api/v2/payments`, {
      method: 'POST',
      headers: Object.assign({ Authorization: auth, 'Content-Type': 'application/json' }, accountHeader),
      body: JSON.stringify(payload)
    });
    console.log('Status:', postRes.status);
    console.log('Headers:', postRes.headers);
    console.log('Body:', postRes.body);
  } catch (e) {
    console.error('Failed to POST payment:', e);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
