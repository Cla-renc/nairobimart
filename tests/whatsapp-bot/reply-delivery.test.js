const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReplyTargets, sendWithFallback, sanitizeJid } = require('../../whatsapp-bot/wa-delivery');

test('sanitizeJid fixes malformed JIDs by adding missing @ symbols', () => {
  assert.equal(sanitizeJid('248176548290605alid'), '248176548290605@lid');
  assert.equal(sanitizeJid('248176548290605as.whatsapp.net'), '248176548290605@s.whatsapp.net');
  assert.equal(sanitizeJid('248176548290605ag.us'), '248176548290605@g.us');
  assert.equal(sanitizeJid('248176548290605@s.whatsapp.net'), '248176548290605@s.whatsapp.net');
  assert.equal(sanitizeJid('248176548290605'), '248176548290605@s.whatsapp.net');
});

test('buildReplyTargets prefers the WhatsApp lid JID and falls back to the phone JID', () => {
  const targets = buildReplyTargets(
    {
      key: {
        remoteJid: '1234567890@lid',
        participant: '254700000000@s.whatsapp.net'
      }
    },
    '1234567890@lid',
    '254700000000@s.whatsapp.net'
  );

  assert.deepEqual(targets, ['1234567890@lid', '254700000000@s.whatsapp.net']);
});

test('sendWithFallback sanitizes candidates and retries after failure', async () => {
  const attempted = [];
  const socket = {
    sendMessage: async (jid) => {
      attempted.push(jid);
      if (jid === '1234567890@lid') {
        throw new Error('463: Reach-out Time-lock');
      }
      return { key: { id: 'sent', status: 1 } };
    }
  };

  const result = await sendWithFallback(
    socket,
    ['1234567890@lid', '254700000000as.whatsapp.net'], // Note: malformed @s.whatsapp.net
    { text: 'hello' },
    { quoted: { key: { id: 'incoming' } } },
    {}
  );

  // Verify: should have tried first JID and failed, then succeeded with sanitized second JID
  assert.equal(result.jid, '254700000000@s.whatsapp.net');
  assert(attempted.length >= 2, 'Should have tried at least 2 candidates');
  assert.equal(attempted[0], '1234567890@lid');
  assert.equal(attempted[1], '254700000000@s.whatsapp.net');
});

