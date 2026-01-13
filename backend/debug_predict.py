import requests
import os

# Ensure the backend is running at this URL
url = "http://localhost:8000/predict"
image_path = "mobile/assets/images/icon.png"

if not os.path.exists(image_path):
    print(f"Image not found at {image_path}")
    exit(1)

print(f"Sending {image_path} to {url}...")

try:
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)

except Exception as e:
    print(f"Request failed: {e}")
