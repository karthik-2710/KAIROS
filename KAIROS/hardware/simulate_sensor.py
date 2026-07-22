import time
import random
import requests
import argparse
from datetime import datetime

# Configuration
DEFAULT_URL = "http://localhost:5000/sensor"
DEFAULT_FARM_ID = 1
INTERVAL = 30  # seconds

def generate_mock_data(farm_id):
    """Generates realistic mock sensor data with slight variations."""
    # Base values
    base_temp = 28.0
    base_humidity = 65.0
    base_soil_pct = 45.0
    
    # Add random noise
    temperature = round(base_temp + random.uniform(-3.0, 5.0), 1)
    humidity = round(base_humidity + random.uniform(-10.0, 15.0), 1)
    soil_moisture_pct = round(base_soil_pct + random.uniform(-5.0, 10.0), 1)
    
    # 10% chance of rain
    rain_detected = random.random() < 0.1
    
    # Raw ADC values simulated
    soil_dry, soil_wet = 3500, 1200
    rain_threshold = 2000
    
    # Map percentage back to raw (approximate)
    soil_raw = int(soil_dry - (soil_moisture_pct / 100.0) * (soil_dry - soil_wet))
    
    if rain_detected:
        rain_raw = random.randint(500, rain_threshold - 100)
    else:
        rain_raw = random.randint(rain_threshold + 100, 4000)

    return {
        "farm_id": farm_id,
        "temperature": temperature,
        "humidity": humidity,
        "soil_moisture": soil_moisture_pct,
        "rain_detected": rain_detected,
        "rain_raw": rain_raw,
        "soil_raw": soil_raw
    }

def main():
    parser = argparse.ArgumentParser(description="KAIROS Sensor Simulator")
    parser.add_argument("--url", default=DEFAULT_URL, help="Backend API URL for sensor data")
    parser.add_argument("--farm-id", type=int, default=DEFAULT_FARM_ID, help="Farm ID to simulate")
    parser.add_argument("--interval", type=int, default=INTERVAL, help="Interval in seconds between sends")
    
    args = parser.parse_args()
    
    print("🌿 KAIROS Mock Sensor Node Starting...")
    print(f"📡 Target URL: {args.url}")
    print(f"🌾 Farm ID: {args.farm_id}")
    print(f"⏱️  Interval: {args.interval} seconds")
    print("──────────────────────────────────────────")

    while True:
        try:
            payload = generate_mock_data(args.farm_id)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending data...")
            print(f"🌡️  Temp: {payload['temperature']}°C | 💧 Hum: {payload['humidity']}% | 🌱 Soil: {payload['soil_moisture']}% | 🌧️  Rain: {'YES' if payload['rain_detected'] else 'NO'}")
            
            response = requests.post(args.url, json=payload, timeout=5)
            
            if response.status_code in (200, 201):
                print("✅ Data sent successfully\n")
            else:
                print(f"❌ Server returned status {response.status_code}: {response.text}\n")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error. Is the Flask backend running?\n")
        except Exception as e:
            print(f"❌ Unexpected error: {e}\n")
            
        time.sleep(args.interval)

if __name__ == "__main__":
    main()
