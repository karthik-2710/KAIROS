import json
import uuid
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.weather.weather_client import get_weather_for_farm, get_weather_by_coords
from app.weather.risk_engine import WeatherRiskEngine, WEATHER_THRESHOLDS
from app.notifications.whatsapp_provider import WhatsAppProvider
from app.utils.auth import require_auth
from app.database.db import get_db

logger = logging.getLogger(__name__)

weather_bp = Blueprint('weather', __name__, url_prefix='/weather')
whatsapp_provider = WhatsAppProvider()


@weather_bp.route('', methods=['GET'])
@weather_bp.route('/farm/<int:farm_id>', methods=['GET'])
def get_farm_weather(farm_id=None):
    """
    Fetches real farm-specific weather + 24h hourly + 7d daily forecasts
    + deterministic agricultural risk assessment.
    """
    if farm_id is None:
        farm_id = request.args.get('farm_id', type=int)

    farm = {'id': farm_id or 1, 'name': 'KAIROS Farm', 'crop_type': 'Rice', 'polygon': None}
    esp32_data = None

    if farm_id:
        db = get_db()
        try:
            row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
            if row:
                farm = dict(row)
            
            # Fetch latest ESP32 sensor reading if available
            sensor_row = db.execute(
                "SELECT * FROM sensor_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1",
                (farm_id,)
            ).fetchone()
            if sensor_row:
                esp32_data = dict(sensor_row)
        finally:
            db.close()

    weather_data = get_weather_for_farm(farm)
    risk_analysis = WeatherRiskEngine.evaluate_agricultural_risk(farm, weather_data, esp32_data)

    return jsonify({
        "success": True,
        "farm": {
            "id": farm.get("id"),
            "name": farm.get("name"),
            "crop_type": farm.get("crop_type", "Rice"),
            "polygon": farm.get("polygon")
        },
        "weather": weather_data,
        "risk_analysis": risk_analysis
    }), 200


@weather_bp.route('/alerts/<int:farm_id>', methods=['GET'])
def get_weather_alerts(farm_id):
    """
    Returns stored agricultural weather alerts and delivery logs for a given farm.
    """
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM weather_alerts WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 20",
            (farm_id,)
        ).fetchall()
        alerts = [dict(r) for r in rows]
        return jsonify({"success": True, "farm_id": farm_id, "alerts": alerts}), 200
    finally:
        db.close()


@weather_bp.route('/alerts/evaluate', methods=['POST'])
def evaluate_and_notify_alerts():
    """
    Evaluates weather risk for a farm, checks anti-spam cooldown,
    stores alert in DB, and dispatches via WhatsApp if configured.
    """
    data = request.get_json() or {}
    farm_id = data.get('farm_id', 1)
    force_send = data.get('force_send', False)
    target_language = data.get('language', 'en')

    db = get_db()
    try:
        farm_row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
        farm = dict(farm_row) if farm_row else {'id': farm_id, 'name': 'Farm', 'crop_type': 'Rice', 'polygon': None}
        
        pref_row = db.execute("SELECT * FROM notification_preferences WHERE farm_id = ?", (farm_id,)).fetchone()
        prefs = dict(pref_row) if pref_row else {'whatsapp': 1, 'weather_alerts': 1}

        sensor_row = db.execute(
            "SELECT * FROM sensor_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1",
            (farm_id,)
        ).fetchone()
        esp32_data = dict(sensor_row) if sensor_row else None
    finally:
        db.close()

    weather_data = get_weather_for_farm(farm)
    risk_analysis = WeatherRiskEngine.evaluate_agricultural_risk(farm, weather_data, esp32_data)
    alerts = risk_analysis.get('alerts', [])

    results = []
    for alert in alerts:
        sev = alert.get('severity', 'INFO')
        # Only dispatch MODERATE, HIGH, CRITICAL unless forced
        if sev in ['MODERATE', 'HIGH', 'CRITICAL'] or force_send:
            # Check for recent duplicate within 12 hours (Anti-spam)
            db = get_db()
            should_dispatch = True
            try:
                if not force_send:
                    recent = db.execute(
                        """
                        SELECT id, severity FROM weather_alerts 
                        WHERE farm_id = ? AND title = ? AND timestamp >= datetime('now', '-12 hours')
                        ORDER BY timestamp DESC LIMIT 1
                        """,
                        (farm_id, alert.get('title'))
                    ).fetchone()
                    if recent:
                        # If duplicate and same severity, skip
                        should_dispatch = False
            finally:
                db.close()

            if should_dispatch:
                lang = target_language or farm.get('preferred_language', 'English')
                formatted_msg = WeatherRiskEngine.format_whatsapp_message(alert, language=lang)
                alert_uid = f"ALERT-{uuid.uuid4().hex[:8].upper()}"

                # Send via WhatsApp Provider
                target_phone = farm.get('whatsapp') or farm.get('phone') or "+919876543210"
                delivery_res = whatsapp_provider.send_text(target_phone, formatted_msg)

                # Persist to database
                db = get_db()
                try:
                    db.execute(
                        """
                        INSERT INTO weather_alerts (
                            alert_id, farm_id, crop, alert_type, severity, title,
                            threat, why_it_matters, recommended_action, weather_observation,
                            forecast_summary, model_risk, language, whatsapp_message, delivery_status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            alert_uid,
                            farm_id,
                            farm.get('crop_type', 'Rice'),
                            alert.get('alert_type', 'Weather_Risk'),
                            sev,
                            alert.get('title'),
                            alert.get('threat'),
                            alert.get('why_it_matters'),
                            alert.get('recommended_action'),
                            f"{weather_data.get('temperature')}°C, {weather_data.get('humidity')}% RH, {weather_data.get('description')}",
                            f"{weather_data.get('rain_forecast_mm')} mm rain in 24h",
                            sev,
                            lang,
                            formatted_msg,
                            "DELIVERED" if delivery_res.get('success') else "FAILED"
                        )
                    )
                    db.commit()
                finally:
                    db.close()

                results.append({
                    "alert_id": alert_uid,
                    "title": alert.get('title'),
                    "severity": sev,
                    "whatsapp_delivery": delivery_res,
                    "message": formatted_msg
                })

    return jsonify({
        "success": True,
        "farm_id": farm_id,
        "alerts_evaluated": len(alerts),
        "alerts_dispatched": len(results),
        "dispatches": results,
        "risk_analysis": risk_analysis
    }), 200


@weather_bp.route('/alerts/send-whatsapp', methods=['POST'])
def send_test_whatsapp():
    """
    Direct endpoint to test formatted agricultural WhatsApp alerts in English, Marathi, Hindi, or Tamil.
    """
    data = request.get_json() or {}
    phone = data.get('phone', '+919876543210')
    crop = data.get('crop', 'Rice')
    language = data.get('language', 'en')
    severity = data.get('severity', 'HIGH')

    alert_sample = {
        "crop": crop,
        "threat": "Blast & Bacterial Leaf Blight",
        "severity": severity,
        "why_it_matters": "Heavy rainfall (28mm in 24h) and sustained high humidity (>85% RH) create favorable infection conditions for fungal blast spores.",
        "why_it_matters_mr": "मुसळधार पाऊस (२८ मिमी) आणि जास्त हवेतील आर्द्रता (>८५%) यामुळे भातावरील करपा रोगाचा प्रादुर्भाव वाढू शकतो.",
        "why_it_matters_hi": "भारी बारिश (24 घंटों में 28 मिमी) और अत्यधिक नमी (>85%) के कारण धान में झुलसा रोग का खतरा बढ़ सकता है।",
        "why_it_matters_ta": "கனமழை மற்றும் அதிக ஈரப்பதம் காரணமாக நெற்பயிரில் குலைநோய் பரவும் அபாயம் உள்ளது.",
        "recommended_action": "Drain excess water from field. Monitor lower leaves for spindle-shaped lesions. Avoid urea top-dressing during downpours.",
        "recommended_action_mr": "शेतातून पाण्याचा निचरा करा. पानांचे नियमित निरीक्षण करा आणि पावसाच्या काळात युरियाचा वापर टाळा.",
        "recommended_action_hi": "खेत से अतिरिक्त पानी निकालें। पत्तियों की नियमित जांच करें और यूरिया का छिड़काव रोकें।",
        "recommended_action_ta": "வயலில் இருந்து அதிகப்படியான தண்ணீரை வடிக்கவும். இலைகளில் நோய் அறிகுறிகள் உள்ளதா என கண்காணிக்கவும்."
    }

    message = WeatherRiskEngine.format_whatsapp_message(alert_sample, language=language)
    res = whatsapp_provider.send_text(phone, message)

    return jsonify({
        "success": res.get("success", False),
        "phone": phone,
        "language": language,
        "message": message,
        "delivery_result": res
    }), 200


@weather_bp.route('/thresholds', methods=['GET'])
def get_thresholds():
    """
    Returns configurable meteorological and agronomic thresholds.
    """
    return jsonify({
        "success": True,
        "thresholds": WEATHER_THRESHOLDS,
        "source": "ICAR Agrometeorology Advisory Standards & KAIROS Knowledge Base"
    }), 200


@weather_bp.route('/auto-dispatch/sync-language', methods=['POST'])
def sync_farm_language():
    """
    Synchronizes the active website language for a farm so 10-minute automated alerts
    are dispatched in the exact language currently selected on the site.
    """
    data = request.get_json() or {}
    farm_id = data.get('farm_id', 1)
    language = data.get('language', 'en')
    
    from app.weather.auto_dispatcher import set_farm_active_language
    set_farm_active_language(farm_id, language)
    
    return jsonify({
        "success": True,
        "farm_id": farm_id,
        "active_language": language,
        "status": "Synchronized with 10-Min Weather Dispatcher"
    }), 200


@weather_bp.route('/auto-dispatch/trigger', methods=['POST'])
def trigger_immediate_auto_dispatch():
    """
    Immediately dispatches a 10-minute weather update to the number linked to the farm
    using the language currently selected on the website.
    """
    data = request.get_json() or {}
    farm_id = data.get('farm_id', 1)
    language = data.get('language')

    db = get_db()
    farm_row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
    db.close()

    farm = dict(farm_row) if farm_row else {'id': farm_id, 'name': 'Farm', 'crop_type': 'Rice', 'polygon': None, 'whatsapp': '+919962109473'}
    
    from app.weather.auto_dispatcher import dispatch_weather_message_for_farm, set_farm_active_language
    if language:
        set_farm_active_language(farm_id, language)

    result = dispatch_weather_message_for_farm(farm, language=language)
    return jsonify(result), 200

