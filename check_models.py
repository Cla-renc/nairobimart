import urllib.request
import json
import os

req = urllib.request.Request(
    'https://api.groq.com/openai/v1/models',
    headers={'Authorization': f"Bearer {os.environ.get('GROQ_API_KEY')}"}
)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for model in data['data']:
            print(model['id'])
except Exception as e:
    print("Error:", e)
