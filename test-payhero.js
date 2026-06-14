const username = "Upl4CgskeVTi2Bpgv7ln";
const password = "yCVT5mSdkWLolwsXu7cWpHVCktunlUF7QoQ5HCwT";
const channelId = 9338;
const auth = Buffer.from(`${username}:${password}`).toString('base64');

async function test() {
    try {
        const payload = {
            amount: 1,
            phone_number: "0759193674",
            channel_id: channelId,
            provider: "m-pesa",
            external_reference: "TEST-001",
            callback_url: "https://nairobimart-gwna-20z44orhd-yaaclarence-gmailcoms-projects.vercel.app/api/webhook/payhero"
        };

        const response = await fetch("https://backend.payhero.co.ke/api/v2/payments/initiate-stk-push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
