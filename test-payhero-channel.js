const username = "YOUR_USERNAME"; // Replace with actual
const password = "YOUR_PASSWORD"; // Replace with actual

const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Test: Get all payment channels to verify channel 9371 exists
fetch("https://backend.payhero.co.ke/api/v2/payment-channels", {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
    }
})
.then(res => res.json())
.then(data => {
    console.log("Available channels:");
    console.dir(data, { depth: null });
})
.catch(err => console.error("Error:", err));
