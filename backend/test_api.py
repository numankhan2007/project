import requests

url = "https://web-production-3c29.up.railway.app/api/auth/verify/20124UBCA081"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
