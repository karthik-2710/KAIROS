# Swapping Digital Twin for Real ESP32 Hardware

The KAIROS Digital Twin simulator runs a background thread generating realistic IoT, Satellite, and AI predictions. Once you are ready to connect real hardware (like an ESP32) for your farm, follow these exact steps to gracefully swap out the simulation for live sensor telemetry.

## 1. Disable the Digital Twin Scheduler

The simulator runs automatically via `scheduler.start()` in the main Flask application entrypoint. To disable it, simply comment it out.

**File:** `backend/run.py`
```python
    # Start Digital Twin Scheduler
    # Comment this block out to disable the simulator
    # try:
    #     from modules.digital_twin.scheduler import scheduler
    #     scheduler.start()
    # except Exception as e:
    #     print(f"[KAIROS] Digital Twin scheduler failed to start: {e}")
```

## 2. Route ESP32 Telemetry to the IoT Endpoint

By default, the backend has an endpoint dedicated to receiving live sensor data via HTTP POST. 

**Endpoint:** `POST /api/sensor/upload`
**Payload Format:**
```json
{
  "farm_id": 1,
  "temperature": 28.5,
  "humidity": 64.2,
  "soil_moisture": 45.1,
  "light": 850,
  "rain_detected": false
}
```

Point your ESP32's `WiFiClient` or `HTTPClient` to this endpoint. The `app.routes.sensor` module will natively handle the data insertion into the `sensor_data` table, identical to how the simulator did it. 

## 3. Real Satellite and AI Integrations

Once the simulator is disabled, the system will naturally stop writing simulated values into `satellite_data` and `disease_predictions`.

1. **Satellite (NDVI):** Will return to fetching live data from the Sentinel Hub API (via `backend/app/satellite/ndvi_processor.py`) when requested by the dashboard. Ensure `SENTINEL_HUB_CLIENT_ID` and `SENTINEL_HUB_CLIENT_SECRET` are present in your `.env`.
2. **AI Leaf Scanning:** Will strictly rely on user uploads via the Leaf Analysis page (`/api/ai/analyze-leaf`).

## 4. The Recommendation Engine

Because the KAIROS Recommendation Engine reads its inputs strictly from the `sensor_data`, `satellite_data`, and `disease_predictions` tables, **no changes are required to the agronomic engine**. 
It will simply read the new real rows injected by your ESP32 instead of the simulated rows, exactly as intended by the transparent architecture.

## ESP32 Reference C++ Snippet

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

void sendTelemetry() {
    HTTPClient http;
    http.begin("http://<YOUR_SERVER_IP>:5000/api/sensor/upload");
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["farm_id"] = 1;
    doc["temperature"] = readTemperature();
    doc["humidity"] = readHumidity();
    doc["soil_moisture"] = readSoilMoisture();
    doc["light"] = readLDR();
    doc["rain_detected"] = isRaining();

    String requestBody;
    serializeJson(doc, requestBody);
    int httpResponseCode = http.POST(requestBody);
    http.end();
}
```
