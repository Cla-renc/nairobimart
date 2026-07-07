// Test the inline sanitization function from bot.js
function inlineSanitizeJid(jid) {
  if (!jid) return null;
  let normalized = jid.toString().trim();
  
  // Fix malformed JIDs: 248176548290605alid -> 248176548290605@lid
  if (normalized.includes('alid') && !normalized.includes('@lid')) {
    normalized = normalized.replace('alid', '@lid');
  }
  if (normalized.includes('as.whatsapp.net') && !normalized.includes('@s.whatsapp.net')) {
    normalized = normalized.replace('as.whatsapp.net', '@s.whatsapp.net');
  }
  if (normalized.includes('ag.us') && !normalized.includes('@g.us')) {
    normalized = normalized.replace('ag.us', '@g.us');
  }
  if (normalized.includes('1lId') && !normalized.includes('@lid')) {
    normalized = normalized.replace('1lId', '@lid');
  }
  if (normalized.includes('1s.whatsapp.net') && !normalized.includes('@s.whatsapp.net')) {
    normalized = normalized.replace('1s.whatsapp.net', '@s.whatsapp.net');
  }
  
  // Ensure JID has a valid domain suffix
  if (!normalized.includes('@')) {
    if (/^\d+$/.test(normalized)) {
      normalized = `${normalized}@s.whatsapp.net`;
    }
  }
  
  return normalized;
}

console.log('🔍 Testing Inline JID Sanitization with values from your logs:\n');

const testCases = [
  '2481765482906051lId',           // From your logs - should become @lid
  '254759193674as.whatsapp.net',   // From your logs - should become @s.whatsapp.net
  '248176548290605alid',
  '254176548290605as.whatsapp.net',
  '248176548290605',
  '248176548290605@s.whatsapp.net',
  '248176548290605@lid',
];

testCases.forEach(jid => {
  const sanitized = inlineSanitizeJid(jid);
  const status = sanitized && sanitized.includes('@') ? '✅' : '❌';
  console.log(`${status} "${jid}"`);
  console.log(`   → "${sanitized}"\n`);
});

console.log('✅ If all have @ symbols, the fix is working.');
console.log('❌ If any don\'t, there\'s still an issue.\n');
