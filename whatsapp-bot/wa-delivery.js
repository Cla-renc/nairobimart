function normalizeJid(jid) {
  if (!jid) return null;
  return jid.toString().trim();
}

function canonicalJids(jid) {
  const normalized = normalizeJid(jid);
  if (!normalized) return [];
  const result = new Set([normalized]);
  const match = normalized.match(/^(.+?):\d+(@.+)$/);
  if (match) {
    result.add(`${match[1]}${match[2]}`);
  }
  return [...result];
}

function buildReplyTargets(msg, replyJid, phoneJid) {
  const candidates = [];
  const seen = new Set();
  const add = (value) => {
    const normalized = normalizeJid(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  add(replyJid);
  add(phoneJid);

  if (msg?.key?.remoteJid) {
    add(msg.key.remoteJid);
  }
  if (msg?.key?.participant) {
    add(msg.key.participant);
  }
  if (msg?.key?.senderPn) {
    add(msg.key.senderPn);
  }

  return candidates;
}

async function sendWithFallback(socket, candidates, message, sendOptions) {
  let lastError = null;

  for (const jid of candidates) {
    try {
      const result = await socket.sendMessage(jid, message, sendOptions);
      return { jid, result };
    } catch (error) {
      lastError = error;
      console.warn(`[wa-delivery] sendMessage failed for ${jid}:`, error?.message || error);
    }
  }

  throw lastError || new Error('Unable to send WhatsApp message');
}

module.exports = { buildReplyTargets, sendWithFallback, canonicalJids, normalizeJid };
