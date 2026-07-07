const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReplyTargets, sendWithFallback } = require('../../whatsapp-bot/wa-delivery');

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

test('sendWithFallback retries the next candidate after the first send fails', async () => {
  const attempted = [];
  const socket = {
    sendMessage: async (jid) => {
      attempted.push(jid);
      if (jid === '1234567890@lid') {
        throw new Error('463: Reach-out Time-lock');
      }
      return { key: { id: 'sent' } };
    }
  };

  const result = await sendWithFallback(
    socket,
    ['1234567890@lid', '254700000000@s.whatsapp.net'],
    { text: 'hello' },
    { quoted: { key: { id: 'incoming' } } }
  );

  assert.equal(result.jid, '254700000000@s.whatsapp.net');
  assert.deepEqual(attempted, ['1234567890@lid', '254700000000@s.whatsapp.net']);
});
