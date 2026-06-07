type GaItem = { item_id?: string; item_name?: string; price?: number; quantity?: number };

export async function sendGaPurchaseEvent(options: {
  clientId?: string | null;
  transactionId: string;
  value: number;
  currency?: string;
  items?: GaItem[];
}) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_SERVER_API_SECRET;
  if (!measurementId || !apiSecret) return;
  const client_id = options.clientId || `server-${Math.floor(Math.random() * 1000000000)}`;

  const body = {
    client_id,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: options.transactionId,
          value: options.value,
          currency: options.currency || 'KES',
          items: options.items || []
        }
      }
    ]
  };

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('GA MP collect returned non-ok', res.status, text);
    } else {
      // success
    }
  } catch (err) {
    console.warn('Failed to send GA purchase event', err);
  }
}
