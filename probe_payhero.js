const https = require('https');
const http = require('http');
const url = require('url');
function fetch(urlStr) {
  return new Promise((resolve, reject) => {
    const lib = url.parse(urlStr).protocol === 'https:' ? https : http;
    lib.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
(async () => {
  try {
    const html = await fetch('https://docs.payhero.co.ke/');
    const m = html.match(/src="([^" ]*index-[^" ]*\.js)"/);
    console.log('script match', !!m, m && m[1]);
    if (m) {
      let jsUrl = m[1];
      if (!jsUrl.startsWith('http')) jsUrl = 'https://docs.payhero.co.ke' + jsUrl;
      console.log('bundle', jsUrl);
      const js = await fetch(jsUrl);
      const pat = /(till|till_number|paybill|account_reference|provider|channel_id|mpesa|m-pesa|phone_number|callback_url|external_reference|business_short_code|business_shortcode|account_number|destination_account|receiver|recipient)/i;
      js.split(/\r?\n/).forEach((line, i) => {
        if (pat.test(line)) {
          console.log(i+1, line.trim());
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
})();
