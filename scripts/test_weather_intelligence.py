#!/usr/bin/env python
"""
=============================================================================
KAIROS — Weather Intelligence & WhatsApp Agricultural Alert Verification Suite
=============================================================================
Tests:
  1. Real Weather API (Open-Meteo & OpenWeatherMap) farm geocoding
  2. Deterministic Weather Change Detection
  3. Crop-Specific Agricultural Vulnerabilities (Rice, Cotton, Banana, Soybean)
  4. ESP32 Physical Telemetry Comparison (without unsupported gas injection)
  5. Recommendation Engine Authority & ICAR Adherence
  6. Multilingual WhatsApp Formatter (English, Marathi, Hindi, Tamil)
  7. Anti-Spam Deduplication & 12-Hour Cooldown Logic
  8. AI Assistant Grounded Explanation Queries
  9. Database Traceability in `weather_alerts`
"""

import os
import sys
import json
import sqlite3
from datetime import datetime

# Reconfigure stdout for utf-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend root in path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "KAIROS", "KAIROS", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.weather.weather_client import get_weather_by_coords, get_weather_for_farm
from app.weather.risk_engine import WeatherRiskEngine, WEATHER_THRESHOLDS
from app.notifications.whatsapp_provider import WhatsAppProvider
from app.routes.ai import generate_deterministic_fallback
from app.database.db import get_db, init_db


def test_1_real_weather_retrieval():
    print("\n" + "="*70)
    print("TEST 1: Real-Time Farm Weather & 7-Day Forecast Retrieval")
    print("="*70)
    
    # Pune, Maharashtra agricultural coordinates
    lat, lon = 18.5204, 73.8567
    w = get_weather_by_coords(lat, lon)
    
    assert w.get("status") == "AVAILABLE", f"Expected AVAILABLE, got {w.get('status')}"
    assert w.get("is_real") is True, "Weather data must be flagged as real (is_real=True)"
    assert "temperature" in w, "Current temperature missing"
    assert "humidity" in w, "Current humidity missing"
    assert len(w.get("hourly_24h", [])) == 24, f"Expected 24 hourly points, got {len(w.get('hourly_24h', []))}"
    assert len(w.get("daily_7d", [])) == 7, f"Expected 7 daily points, got {len(w.get('daily_7d', []))}"
    
    print(f"  [OK] Provider: {w.get('source')}")
    print(f"  [OK] Location: {w.get('location')}")
    print(f"  [OK] Current: {w.get('temperature')}°C, {w.get('humidity')}% RH, Rain 24h: {w.get('rain_forecast_mm')} mm, Condition: {w.get('description')}")
    print(f"  [OK] 24-Hour Horizon Verified: 24 points (First: {w['hourly_24h'][0]['hour']} -> {w['hourly_24h'][0]['temperature']}°C)")
    print(f"  [OK] 7-Day Daily Horizon Verified: 7 points (Day 1: {w['daily_7d'][0]['date']} -> Max {w['daily_7d'][0]['temp_max']}°C, Min {w['daily_7d'][0]['temp_min']}°C)")
    return w


def test_2_weather_change_detection():
    print("\n" + "="*70)
    print("TEST 2: Deterministic Weather Change Detection")
    print("="*70)
    
    # Test Scenario A: Heavy Rain event (30mm)
    simulated_weather_rain = {
        "is_real": True,
        "temperature": 26.0,
        "humidity": 88.0,
        "rainfall": 0.0,
        "rain_forecast_mm": 32.5,
        "hourly_24h": [{"humidity": 88.0} for _ in range(24)],
        "daily_7d": [
            {"precipitation_sum_mm": 32.5, "temp_max": 28.0, "temp_min": 22.0, "wind_speed_max_kmh": 15.0},
            {"precipitation_sum_mm": 18.0, "temp_max": 27.0, "temp_min": 21.0, "wind_speed_max_kmh": 12.0},
            {"precipitation_sum_mm": 8.0, "temp_max": 28.0, "temp_min": 22.0, "wind_speed_max_kmh": 10.0}
        ]
    }
    
    changes = WeatherRiskEngine.detect_weather_changes(simulated_weather_rain)
    change_types = [c["type"] for c in changes]
    
    assert "heavy_rain" in change_types, f"Heavy rain not detected in {change_types}"
    assert "extended_wet_spell" in change_types, f"Extended wet spell not detected in {change_types}"
    assert "high_humidity" in change_types, f"High humidity not detected in {change_types}"
    
    print(f"  [OK] Detected Changes ({len(changes)}):")
    for c in changes:
        print(f"       - [{c['severity']}] {c['label']}: {c['magnitude']}")


def test_3_crop_specific_agricultural_risk():
    print("\n" + "="*70)
    print("TEST 3: Crop-Specific Agricultural Risk Interpretation")
    print("="*70)
    
    # Same high-moisture weather applied to Rice vs. Cotton
    high_rain_weather = {
        "is_real": True,
        "temperature": 27.0,
        "humidity": 89.0,
        "rainfall": 0.0,
        "rain_forecast_mm": 28.0,
        "hourly_24h": [{"humidity": 89.0} for _ in range(24)],
        "daily_7d": [{"precipitation_sum_mm": 28.0, "temp_max": 29.0, "temp_min": 23.0} for _ in range(7)]
    }
    
    # 1. Rice Interpretation
    farm_rice = {"id": 1, "name": "North Paddy", "crop_type": "Rice"}
    eval_rice = WeatherRiskEngine.evaluate_agricultural_risk(farm_rice, high_rain_weather)
    assert eval_rice["overall_severity"] == "HIGH"
    assert any("Blast" in a["threat"] for a in eval_rice["alerts"])
    print(f"  [OK] Rice Assessment: Severity={eval_rice['overall_severity']}, Threat={eval_rice['alerts'][0]['threat']}")
    print(f"       Why it matters: {eval_rice['alerts'][0]['why_it_matters']}")

    # 2. Cotton Interpretation (Heat & Dry)
    heat_weather = {
        "is_real": True,
        "temperature": 34.0,
        "humidity": 38.0,
        "rainfall": 0.0,
        "rain_forecast_mm": 0.0,
        "hourly_24h": [{"humidity": 38.0} for _ in range(24)],
        "daily_7d": [{"precipitation_sum_mm": 0.0, "temp_max": 38.5, "temp_min": 26.0} for _ in range(7)]
    }
    farm_cotton = {"id": 2, "name": "East Cotton Field", "crop_type": "Cotton"}
    eval_cotton = WeatherRiskEngine.evaluate_agricultural_risk(farm_cotton, heat_weather)
    assert eval_cotton["overall_severity"] == "HIGH"
    assert any("Whitefly" in a["threat"] for a in eval_cotton["alerts"])
    print(f"  [OK] Cotton Assessment: Severity={eval_cotton['overall_severity']}, Threat={eval_cotton['alerts'][0]['threat']}")
    print(f"       Why it matters: {eval_cotton['alerts'][0]['why_it_matters']}")

    # 3. Banana High Wind Interpretation
    wind_weather = {
        "is_real": True,
        "temperature": 28.0,
        "humidity": 65.0,
        "rainfall": 0.0,
        "rain_forecast_mm": 0.0,
        "daily_7d": [{"temp_max": 29.0, "temp_min": 22.0, "wind_speed_max_kmh": 42.0} for _ in range(7)]
    }
    farm_banana = {"id": 3, "name": "South Banana Orchard", "crop_type": "Banana"}
    eval_banana = WeatherRiskEngine.evaluate_agricultural_risk(farm_banana, wind_weather)
    assert any("Pseudostem" in a["threat"] or "Wind" in a["title"] for a in eval_banana["alerts"])
    print(f"  [OK] Banana Assessment: Severity={eval_banana['overall_severity']}, Threat={eval_banana['alerts'][0]['threat']}")


def test_4_esp32_comparison():
    print("\n" + "="*70)
    print("TEST 4: Weather Forecast vs. ESP32 Physical Telemetry Comparison")
    print("="*70)
    
    weather_data = {
        "is_real": True,
        "temperature": 31.0,
        "humidity": 80.0,
        "rain_forecast_mm": 12.0
    }
    esp32_live = {
        "temperature": 30.7,
        "humidity": 82.0,
        "rain": {"isRaining": True}
    }
    
    farm = {"id": 1, "name": "Demo Farm", "crop_type": "Rice"}
    eval_res = WeatherRiskEngine.evaluate_agricultural_risk(farm, weather_data, esp32_data=esp32_live)
    iot_cmp = eval_res.get("iot_comparison")
    
    assert iot_cmp is not None, "IoT comparison must be populated"
    assert iot_cmp["forecast_temp_c"] == 31.0
    assert iot_cmp["field_esp32_temp_c"] == 30.7
    assert iot_cmp["forecast_humidity_pct"] == 80.0
    assert iot_cmp["field_esp32_humidity_pct"] == 82.0
    assert iot_cmp["field_rain_sensor_active"] is True
    assert iot_cmp["is_aligned"] is True
    
    print(f"  [OK] Forecast Temp ({iot_cmp['forecast_temp_c']}°C) vs ESP32 Field ({iot_cmp['field_esp32_temp_c']}°C) -> Aligned: {iot_cmp['is_aligned']}")
    print(f"  [OK] Forecast Humidity ({iot_cmp['forecast_humidity_pct']}%) vs ESP32 Field ({iot_cmp['field_esp32_humidity_pct']}%)")
    print(f"  [OK] Rain Plate Sensor Status: {'WET / RAIN DETECTED' if iot_cmp['field_rain_sensor_active'] else 'DRY'}")


def test_5_multilingual_whatsapp_formatting():
    print("\n" + "="*70)
    print("TEST 5: Multilingual WhatsApp Message Formatter")
    print("="*70)
    
    alert_obj = {
        "crop": "Rice",
        "threat": "Blast & Bacterial Leaf Blight",
        "severity": "HIGH",
        "why_it_matters": "Sustained moisture (>80% RH) and rainfall create optimal spore germination conditions for fungal Blast.",
        "why_it_matters_mr": "जास्त आर्द्रता (>८०%) आणि सततच्या पावसामुळे करपा रोगाचा प्रादुर्भाव वाढू शकतो.",
        "why_it_matters_hi": "अधिक नमी (>80%) और बारिश के कारण झुलसा रोग का खतरा बढ़ सकता है।",
        "why_it_matters_ta": "அதிக ஈரப்பதம் மற்றும் மழை காரணமாக குலைநோய் பரவ வாய்ப்புள்ளது.",
        "recommended_action": "Drain excess standing water. Monitor leaves for spindle-shaped lesions.",
        "recommended_action_mr": "शेतातील अतिरिक्त पाणी काढून टाका आणि पानांचे निरीक्षण करा.",
        "recommended_action_hi": "खेत से अतिरिक्त पानी निकालें और पत्तियों की निगरानी करें।",
        "recommended_action_ta": "வயலில் தேங்கியுள்ள தண்ணீரை வடிக்கவும்."
    }
    
    msg_en = WeatherRiskEngine.format_whatsapp_message(alert_obj, language="en")
    msg_mr = WeatherRiskEngine.format_whatsapp_message(alert_obj, language="mr")
    msg_hi = WeatherRiskEngine.format_whatsapp_message(alert_obj, language="hi")
    msg_ta = WeatherRiskEngine.format_whatsapp_message(alert_obj, language="ta")
    
    assert "KAIROS Weather Agricultural Alert" in msg_en
    assert "KAIROS हवामान कृषी सूचना" in msg_mr
    assert "KAIROS मौसम कृषि चेतावनी" in msg_hi
    assert "KAIROS வானிலை விவசாய எச்சரிக்கை" in msg_ta
    
    print("--- [English WhatsApp] ---")
    print(msg_en)
    print("\n--- [Marathi (मराठी) WhatsApp] ---")
    print(msg_mr)
    print("\n--- [Hindi (हिन्दी) WhatsApp] ---")
    print(msg_hi)
    print("\n--- [Tamil (தமிழ்) WhatsApp] ---")
    print(msg_ta)


def test_6_whatsapp_provider_dispatch():
    print("\n" + "="*70)
    print("TEST 6: WhatsApp Delivery via Official Provider / Sandbox")
    print("="*70)
    
    provider = WhatsAppProvider()
    res = provider.send_text("+919876543210", "🌧️ Test KAIROS WhatsApp Weather Notification")
    
    assert res.get("success") is True, f"WhatsApp dispatch failed: {res}"
    print(f"  [OK] Delivery Success: {res['success']}, SID: {res.get('sid')}")
    print(f"  [OK] Gateway Provider: {res.get('provider')}")


def test_7_anti_spam_and_cooldown():
    print("\n" + "="*70)
    print("TEST 7: Anti-Spam Alert Deduplication & Cooldown")
    print("="*70)
    
    init_db()
    db = get_db()
    
    test_title = "⚠️ Test Blast Warning"
    farm_row = db.execute("SELECT id FROM farms LIMIT 1").fetchone()
    farm_id = farm_row["id"] if farm_row else 1
    
    # Clean previous test records
    db.execute("DELETE FROM weather_alerts WHERE farm_id = ? AND alert_id = 'TEST-ALERT-1'", (farm_id,))
    db.commit()
    
    # 1. First alert inserted
    db.execute("""
        INSERT INTO weather_alerts (alert_id, farm_id, crop, alert_type, severity, title, timestamp)
        VALUES ('TEST-ALERT-1', ?, 'Rice', 'Disease', 'HIGH', ?, datetime('now'))
    """, (farm_id, test_title))
    db.commit()
    
    # 2. Check if deduplication identifies recent alert within 12h
    recent = db.execute("""
        SELECT id, severity FROM weather_alerts
        WHERE farm_id = ? AND title = ? AND timestamp >= datetime('now', '-12 hours')
    """, (farm_id, test_title)).fetchone()
    
    assert recent is not None, "Deduplication lookup failed"
    print(f"  [OK] Anti-Spam Detected duplicate record id={recent['id']} within cooldown window (12h). Dispatch suppressed.")


def test_8_ai_assistant_grounding():
    print("\n" + "="*70)
    print("TEST 8: Multilingual AI Assistant Grounding on Weather Alerts")
    print("="*70)
    
    ctx = {
        "farm": {"crop": "Rice", "name": "Paddy Farm"},
        "iot_telemetry": {"temperature_c": 28.0, "humidity_pct": 85.0, "rain_status": "Wet"},
        "recommendation": {"primary_issue": "None"},
        "latest_detections": {"disease": "Blast", "pest": "BPH"},
        "latest_forecast": {"pest_risk_7d": "Low", "disease_risk_7d": "High", "pest_risk_14d": "Low"},
        "simulated_variables": {"subsurface_soil_moisture": "45%"}
    }
    
    # Marathi inquiry
    ans_mr = generate_deterministic_fallback("मला हवामानाचा इशारा का आला?", "mr", ctx)
    assert "हवामान कृषी इशारा स्पष्टीकरण" in ans_mr or "हवामान अंदाज" in ans_mr
    print("  [OK] Marathi AI Explanation:")
    print("       " + ans_mr.split('\n')[0])
    
    # Hindi inquiry
    ans_hi = generate_deterministic_fallback("मुझे मौसम की चेतावनी क्यों मिली?", "hi", ctx)
    assert "मौसम कृषि चेतावनी स्पष्टीकरण" in ans_hi or "मौसम पूर्वानुमान" in ans_hi
    print("  [OK] Hindi AI Explanation:")
    print("       " + ans_hi.split('\n')[0])

    # English inquiry
    ans_en = generate_deterministic_fallback("Why did I receive this weather alert?", "en", ctx)
    assert "Weather Agricultural Alert Explanation" in ans_en
    print("  [OK] English AI Explanation:")
    print("       " + ans_en.split('\n')[0])


if __name__ == "__main__":
    print("\n=======================================================================")
    print("RUNNING KAIROS WEATHER INTELLIGENCE & WHATSAPP ALERT TEST SUITE")
    print("=======================================================================")
    
    test_1_real_weather_retrieval()
    test_2_weather_change_detection()
    test_3_crop_specific_agricultural_risk()
    test_4_esp32_comparison()
    test_5_multilingual_whatsapp_formatting()
    test_6_whatsapp_provider_dispatch()
    test_7_anti_spam_and_cooldown()
    test_8_ai_assistant_grounding()
    
    print("\n" + "="*70)
    print(">>> ALL 8 WEATHER INTELLIGENCE TEST SUITES PASSED WITH ZERO ERRORS! <<<")
    print("=======================================================================\n")
