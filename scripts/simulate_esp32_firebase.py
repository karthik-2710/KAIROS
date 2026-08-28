"""
ESP32 Firebase RTDB Simulation & Verification Utility.
Allows testing the real-time pipeline:
ESP32 -> Firebase RTDB -> React onValue Listener -> Dashboard State

Tests the 4 physical sensors:
1. Temperature (°C)
2. Humidity (%)
3. Rain Sensor (Detected / Not Detected)
4. Gas Sensor (ADC raw integer)
"""

import urllib.request
import urllib.error
import json
import time
import sys

FIREBASE_URL = "https://kairos-15394-default-rtdb.asia-southeast1.firebasedatabase.app"


def write_sensor_data(temperature=29.5, humidity=68.0, rain=0, gas=420, path="sensorData"):
    """
    Writes a sensor data payload to the Firebase Realtime Database.
    """
    payload = {
        "temperature": temperature,
        "humidity": humidity,
        "rain": rain,
        "gas": gas,
        "timestamp": int(time.time() * 1000)
    }
    
    url = f"{FIREBASE_URL}/{path}.json"
    data_bytes = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            print(f"[SUCCESS] Wrote to {url}: {res_body}")
            return True, json.loads(res_body)
    except urllib.error.HTTPError as e:
        print(f"[HTTP ERROR {e.code}] {e.reason}")
        return False, str(e)
    except Exception as e:
        print(f"[ERROR] {e}")
        return False, str(e)


def read_sensor_data(path="sensorData"):
    """
    Reads the current sensor data payload from Firebase RTDB.
    """
    url = f"{FIREBASE_URL}/{path}.json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            data = json.loads(res_body)
            print(f"[READ] From {url}: {data}")
            return True, data
    except urllib.error.HTTPError as e:
        print(f"[HTTP ERROR {e.code}] {e.reason}")
        return False, str(e)
    except Exception as e:
        print(f"[ERROR] {e}")
        return False, str(e)


if __name__ == "__main__":
    print("Testing Firebase RTDB communication...")
    ok, res = write_sensor_data(temperature=31.2, humidity=75.5, rain=1, gas=458)
    if ok:
        print("Test write succeeded!")
        read_sensor_data()
    else:
        print("Note: If Firebase rules require authentication, the frontend SDK with client credentials/anonymous auth will be used.")
