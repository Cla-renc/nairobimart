const fetch = require('node-fetch'); // wait, node 18+ has native fetch

async function testPayHero() {
    try {
        const username = "Upl4CgskeVTi2Bpgv7ln";
        const password = "yCVT5mSdkWLolwsXu7cWpHVCktunlUF7QoQ5HCwT";
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

        const payload = {
            amount: 10,
            phone_number: "254759193674",
            channel_id: 9371,
            provider: "m-pesa",
            external_reference: "TEST1234",
            callback_url: "https://nairobimart.vercel.app/api/webhook/payhero"
        };

        const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", text);
    } catch (e) {
        console.error("ERROR:", e);
    }
}

testPayHero();
