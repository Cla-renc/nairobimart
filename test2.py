import urllib.request
import json
import base64

username = "Upl4CgskeVTi2Bpgv7ln"
password = "yCVT5mSdkWLolwsXu7cWpHVCktunlUF7QoQ5HCwT"
channel_id = 9371

auth_str = f"{username}:{password}"
auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

url = "https://backend.payhero.co.ke/api/v2/payments"

payload = {
    "amount": 10,
    "phone_number": "254759193674",
    "channel_id": channel_id,
    "provider": "m-pesa",
    "external_reference": "TEST-123",
    "callback_url": "https://nairobimart.vercel.app/api/webhook/payhero"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data)
req.add_header("Content-Type", "application/json")
req.add_header("Authorization", f"Basic {auth_b64}")

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Exception:", str(e))
