const fs = require('fs');

const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const username = env.PAYHERO_API_USERNAME;
const password = env.PAYHERO_API_PASSWORD;
const channelId = env.PAYHERO_CHANNEL_ID;

const auth = Buffer.from(`${username}:${password}`).toString('base64');

const payload = {
    amount: 1,
    phone_number: "0712345678",
    channel_id: parseInt(channelId, 10),
    provider: "m-pesa",
    external_reference: "TEST-123",
    callback_url: "https://google.com"
};

fetch("https://backend.payhero.co.ke/api/v2/payments", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
    },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
    console.log("Pay Hero Response:");
    console.dir(data, { depth: null });
})
.catch(err => {
    console.error("Fetch Error:", err);
});
