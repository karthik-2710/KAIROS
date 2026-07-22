/*
 * KAIROS ESP32 Firmware
 * ======================
 * Reads DHT11 (Temperature + Humidity), Soil Moisture, and Rain Sensor.
 * Sends data to KAIROS Flask backend every 30 seconds via HTTP POST.
 *
 * Hardware Connections:
 *   DHT11        → GPIO 4
 *   Soil Sensor  → GPIO 34 (Analog)
 *   Rain Sensor  → GPIO 35 (Analog)
 *
 * Libraries Required (install via Arduino Library Manager):
 *   - DHT sensor library (by Adafruit)
 *   - ArduinoJson (by Benoit Blanchon)
 *   - HTTPClient (built-in ESP32)
 *   - WiFi (built-in ESP32)
 *
 * Author: KAIROS Team
 * Board: ESP32 Dev Module
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* KAIROS_SERVER_URL = "http://192.168.1.100:5000/sensor";  // Your Flask IP
const int   FARM_ID = 1;          // Your farm ID from KAIROS
const int   SEND_INTERVAL_MS = 30000;  // 30 seconds
const bool  MOCK_SENSOR_MODE = true;   // Set to true to simulate sensor data without hardware

// ─── SENSOR PINS ─────────────────────────────────────────────────────────────
#define DHT_PIN          4
#define DHT_TYPE         DHT11
#define SOIL_SENSOR_PIN  34    // Analog input
#define RAIN_SENSOR_PIN  35    // Analog input

// ─── CALIBRATION ─────────────────────────────────────────────────────────────
#define SOIL_DRY         3500   // ADC value for completely dry soil
#define SOIL_WET         1200   // ADC value for saturated soil
#define RAIN_THRESHOLD   2000   // ADC value below = rain detected

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSendTime = 0;
int failCount = 0;

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n🌿 KAIROS ESP32 Sensor Node Starting...");

  // Initialize DHT
  dht.begin();
  delay(2000);  // DHT stabilization

  // Configure ADC
  analogReadResolution(12);  // 12-bit ADC (0–4095)

  // Connect WiFi
  connectWiFi();

  Serial.println("✅ KAIROS Sensor Node Ready!");
  Serial.printf("📡 Sending data every %d seconds\n", SEND_INTERVAL_MS / 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Read sensors
    SensorReading reading = readSensors();

    if (reading.valid) {
      printReading(reading);
      bool success = sendToServer(reading);

      if (success) {
        failCount = 0;
        Serial.println("✅ Data sent successfully");
      } else {
        failCount++;
        Serial.printf("❌ Send failed (%d consecutive failures)\n", failCount);

        // Reconnect WiFi after 5 consecutive failures
        if (failCount >= 5) {
          Serial.println("🔄 Reconnecting WiFi...");
          connectWiFi();
          failCount = 0;
        }
      }
    } else {
      Serial.println("⚠️  Sensor read error — DHT data invalid");
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
struct SensorReading {
  float temperature;
  float humidity;
  int   soilMoistureRaw;
  float soilMoisturePct;
  int   rainRaw;
  bool  rainDetected;
  bool  valid;
};

SensorReading readSensors() {
  SensorReading r;

  if (MOCK_SENSOR_MODE) {
    // Generate realistic mock data
    r.temperature = 28.0 + random(-30, 50) / 10.0;
    r.humidity = 65.0 + random(-100, 150) / 10.0;
    r.soilMoisturePct = 45.0 + random(-50, 100) / 10.0;
    
    // Reverse map percentage to raw ADC for consistency
    r.soilMoistureRaw = map(r.soilMoisturePct, 0, 100, SOIL_DRY, SOIL_WET);
    
    // 10% chance of rain
    r.rainDetected = (random(0, 100) < 10);
    r.rainRaw = r.rainDetected ? random(500, RAIN_THRESHOLD - 100) : random(RAIN_THRESHOLD + 100, 4000);
    
    r.valid = true;
    return r;
  }

  // DHT11 — Temperature & Humidity
  r.humidity    = dht.readHumidity();
  r.temperature = dht.readTemperature();

  if (isnan(r.humidity) || isnan(r.temperature)) {
    r.valid = false;
    return r;
  }

  // Soil Moisture (ADC)
  // Average 10 readings to reduce noise
  long soilSum = 0;
  for (int i = 0; i < 10; i++) {
    soilSum += analogRead(SOIL_SENSOR_PIN);
    delay(10);
  }
  r.soilMoistureRaw = soilSum / 10;

  // Map ADC value to 0–100% (inverted: high ADC = dry)
  r.soilMoisturePct = map(
    constrain(r.soilMoistureRaw, SOIL_WET, SOIL_DRY),
    SOIL_DRY, SOIL_WET, 0, 100
  );
  r.soilMoisturePct = constrain(r.soilMoisturePct, 0.0f, 100.0f);

  // Rain Sensor (ADC)
  r.rainRaw      = analogRead(RAIN_SENSOR_PIN);
  r.rainDetected = (r.rainRaw < RAIN_THRESHOLD);

  r.valid = true;
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
bool sendToServer(SensorReading& reading) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    return false;
  }

  HTTPClient http;
  http.begin(KAIROS_SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["farm_id"]       = FARM_ID;
  doc["temperature"]   = round(reading.temperature * 10.0) / 10.0;
  doc["humidity"]      = round(reading.humidity * 10.0) / 10.0;
  doc["soil_moisture"] = round(reading.soilMoisturePct * 10.0) / 10.0;
  doc["rain_detected"] = reading.rainDetected;
  doc["rain_raw"]      = reading.rainRaw;
  doc["soil_raw"]      = reading.soilMoistureRaw;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  http.end();

  return (httpCode == 200 || httpCode == 201);
}

// ─────────────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("📡 Connecting to WiFi: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi connection failed. Will retry...");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
void printReading(SensorReading& r) {
  Serial.println("─────────────────────────");
  Serial.printf("🌡️  Temperature : %.1f °C\n",  r.temperature);
  Serial.printf("💧 Humidity    : %.1f %%\n",   r.humidity);
  Serial.printf("🌱 Soil Moist  : %.1f %% (ADC: %d)\n", r.soilMoisturePct, r.soilMoistureRaw);
  Serial.printf("🌧️  Rain        : %s (ADC: %d)\n", r.rainDetected ? "YES" : "NO", r.rainRaw);
  Serial.println("─────────────────────────");
}
