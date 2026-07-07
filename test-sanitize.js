// Quick diagnostic to verify JID sanitization works
const { sanitizeJid } = require('./whatsapp-bot/wa-delivery');

console.log('🔍 Testing JID Sanitization:\n');

const testCases = [
  '248176548290605alid',
  '254176548290605as.whatsapp.net',
  '248176548290605ag.us',
  '248176548290605',
  '248176548290605@s.whatsapp.net',
  '248176548290605@lid',
];

testCases.forEach(jid => {
  const sanitized = sanitizeJid(jid);
  const status = sanitized && sanitized.includes('@') ? '✅' : '❌';
  console.log(`${status} "${jid}" → "${sanitized}"`);
});

console.log('\n✅ If all show ✅, sanitizeJid is working correctly.');
console.log('❌ If any show ❌, there\'s an issue with the function.');
