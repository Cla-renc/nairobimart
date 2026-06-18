const https = require('https');
const url = 'https://docs.payhero.co.ke/';
function fetchText(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      let d='';
      res.on('data',c=>d+=c);
      res.on('end',()=>resolve(d));
      res.on('error',reject);
    }).on('error',reject);
  });
}
(async()=>{
  try{
    const html = await fetchText(url);
    const m = html.match(/src=["']([^"']*index-[^"']*\.js)["']/);
    if(!m) throw new Error('bundle not found');
    let jsUrl = m[1];
    if(!jsUrl.startsWith('http')) jsUrl = 'https://docs.payhero.co.ke'+jsUrl;
    const js = await fetchText(jsUrl);
    const patterns = [
      /post-initiate-mpesa-stk-push-request[\s\S]{1,400}/,
      /Initiate MPESA STK Push[\s\S]{1,400}/,
      /credential_id[\s\S]{1,200}/,
      /account_id[\s\S]{1,200}/,
      /external_reference[\s\S]{1,200}/,
      /channel_id[\s\S]{1,200}/,
      /phone_number[\s\S]{1,200}/
    ];
    for(const pat of patterns){
      const match = js.match(pat);
      console.log('\n=== PATTERN: '+pat+' ===');
      console.log(match ? match[0] : 'NOT FOUND');
    }
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
