const fs = require('fs');

async function test() {
    // Read env purely for the key
    const env = fs.readFileSync('.env', 'utf8');
    const match = env.match(/CJ_API_KEY="?([^"\n]+)"?/);
    const apiKey = match ? match[1] : null;

    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const authRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
    });
    const authData = await authRes.json();
    const token = authData?.data?.accessToken;

    if (!token) {
        console.error("Auth failed:", authData);
        return;
    }

    const prodRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/listV2?page=1&size=5&keyWord=electronics', {
        headers: {
            'CJ-Access-Token': token,
            'Content-Type': 'application/json'
        }
    });

    const prodData = await prodRes.json();
    console.log("CJ List Response Data:", JSON.stringify(prodData, null, 2));
}

test();
