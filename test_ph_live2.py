import urllib.request
import json
import base64

def test_endpoint(phone):
    username = "kRxhllmGz3ZcIufO7ocN"
    password = "IMUAeJWklZXb10RzSCN9baPXh91dt3OcgttGBkvo"
    channel_id = 9371

    auth_str = f"{username}:{password}"
    auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    url = "https://backend.payhero.co.ke/api/v2/payments"

    payload = {
        "amount": 10,
        "phone_number": phone,
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
            with open("c:\\PROJECTS\\NairobiMart\\py_out.txt", "a") as f:
                f.write(f"Phone: {phone} -> Status: {response.status}\n")
                f.write(f"Response: {response.read().decode('utf-8')}\n")
    except urllib.error.HTTPError as e:
        with open("c:\\PROJECTS\\NairobiMart\\py_out.txt", "a") as f:
            f.write(f"Phone: {phone} -> HTTP Error: {e.code}\n")
            f.write(f"Error Body: {e.read().decode('utf-8')}\n")
    except Exception as e:
        with open("c:\\PROJECTS\\NairobiMart\\py_out.txt", "a") as f:
            f.write(f"Exception: {str(e)}\n")

open("c:\\PROJECTS\\NairobiMart\\py_out.txt", "w").close()
test_endpoint("0759193674")
test_endpoint("254759193674")
