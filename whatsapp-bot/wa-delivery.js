function sanitizeJid(jid) {
  if (!jid) return null;
  let normalized = jid.toString().trim();
  
  // Fix malformed JIDs: 248176548290605alid -> 248176548290605@lid
  // Replace 'alid' with '@lid' if @ is missing
  if (normalized.includes('alid') && !normalized.includes('@lid')) {
    normalized = normalized.replace('alid', '@lid');
  }
  // Replace 'as.whatsapp.net' with '@s.whatsapp.net' if @ is missing
  if (normalized.includes('as.whatsapp.net') && !normalized.includes('@s.whatsapp.net')) {
    normalized = normalized.replace('as.whatsapp.net', '@s.whatsapp.net');
  }
  // Replace 'ag.us' with '@g.us' if @ is missing
  if (normalized.includes('ag.us') && !normalized.includes('@g.us')) {
    normalized = normalized.replace('ag.us', '@g.us');
  }
  
  // Ensure JID has a valid domain suffix
  if (!normalized.includes('@')) {
    // If no @ at all, assume it's a phone number for @s.whatsapp.net
    if (/^\d+$/.test(normalized)) {
      normalized = `${normalized}@s.whatsapp.net`;
    }
  }
  
  return normalized;
}

function normalizeJid(jid) {
  return sanitizeJid(jid);
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

async function sendWithFallback(socket, candidates, message, sendOptions, tcTokenStore = {}) {
  let lastError = null;
  // Sanitize all candidates first, then filter valid ones
  const validCandidates = candidates
    .filter(c => c) // Remove null/undefined
    .map(c => sanitizeJid(c)) // Sanitize to fix malformed JIDs
    .filter(c => c && c.includes('@')); // Keep only valid JIDs

  if (validCandidates.length === 0) {
    throw new Error('No valid candidates after sanitization');
  }

  for (const jid of validCandidates) {
    try {
      console.log(`[wa-delivery] Attempting send to ${jid}`);
      
      // Try to attach tcToken if available
      const options = { ...sendOptions };
      const tcToken = tcTokenStore[jid];
      if (tcToken) {
        options.tcToken = tcToken;
        console.log(`[wa-delivery] Attached tcToken for ${jid}`);
      }
      
      const result = await socket.sendMessage(jid, message, options);
      if (result) {
        console.log(`[wa-delivery] ✅ Send succeeded to ${jid}`);
        return { jid, result };
      }
    } catch (error) {
      lastError = error;
      console.warn(`[wa-delivery] sendMessage failed for ${jid}:`, error?.message || error);
    }
  }

  throw lastError || new Error('Unable to send WhatsApp message to any candidate');
}

module.exports = { buildReplyTargets, sendWithFallback, canonicalJids, normalizeJid, sanitizeJid };
