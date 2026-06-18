/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
const https = require('https');
const url = 'https://docs.payhero.co.ke/';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  try {
    const html = await fetchText(url);
    const m = html.match(/src=['\"]([^'\"]*index-[^'\"]*\.js)['\"]/);
    console.log('bundle:', m ? m[1] : 'NOT FOUND');
    if (!m) return;
    let jsUrl = m[1];
    if (!jsUrl.startsWith('http')) jsUrl = 'https://docs.payhero.co.ke' + jsUrl;
    console.log('fetching js', jsUrl);
    const js = await fetchText(jsUrl);
    const terms = ['provider', 'callback_url', 'phone_number', 'channel_id', 'external_reference', 'amount', 'credential_id', 'account_id', 'till_number', 'account_reference'];
    for (const term of terms) {
      console.log('\n===', term, '===');
      const lines = js.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(term)) {
          console.log(i + 1, lines[i].trim());
          if (i > 20) break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
