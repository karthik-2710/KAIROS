import time
import uuid
import os
import threading
import logging
from datetime import datetime
from app.weather.weather_client import get_weather_for_farm
from app.weather.risk_engine import WeatherRiskEngine
from app.notifications.whatsapp_provider import WhatsAppProvider
from app.database.db import get_db

logger = logging.getLogger(__name__)

# Global state for Active Language per farm
ACTIVE_FARM_LANGUAGES = {}
LAST_DISPATCH_TIMESTAMPS = {}
AUTO_DISPATCH_INTERVAL_SECONDS = 600  # 10 minutes

_dispatcher_thread = None
_dispatcher_running = False
_whatsapp_provider = WhatsAppProvider()


def set_farm_active_language(farm_id: int, language_code: str):
    """Stores the language currently selected by the user on the website."""
    lang_map = {
        "en": "en",
        "mr": "mr",
        "hi": "hi",
        "ta": "ta",
        "english": "en",
        "marathi": "mr",
        "hindi": "hi",
        "tamil": "ta"
    }
    clean_lang = lang_map.get(str(language_code).lower(), "en")
    ACTIVE_FARM_LANGUAGES[farm_id] = clean_lang
    logger.info(f"[AutoDispatcher] Updated active language for Farm {farm_id} -> {clean_lang}")


def get_farm_active_language(farm_id: int, fallback: str = "en") -> str:
    return ACTIVE_FARM_LANGUAGES.get(farm_id, fallback)


def dispatch_weather_message_for_farm(farm: dict, language: str = None) -> dict:
    """
    Executes a single automated 10-minute weather update dispatch to the phone number linked to the farm.
    """
    farm_id = farm.get("id", 1)
    target_phone = farm.get("whatsapp") or farm.get("phone") or "+919962109473"
    lang = language or get_farm_active_language(farm_id, farm.get("preferred_language", "en"))
    
    # 1. Fetch real-time farm weather
    weather_data = get_weather_for_farm(farm)
    
    # 2. Evaluate agricultural risk
    risk_analysis = WeatherRiskEngine.evaluate_agricultural_risk(farm, weather_data)
    alerts = risk_analysis.get("alerts", [])
    lead_alert = alerts[0] if alerts else {
        "crop": farm.get("crop_type", "Rice"),
        "threat": "Stable Weather Conditions",
        "severity": "INFO",
        "why_it_matters": f"Current temp {weather_data.get('temperature')}°C, humidity {weather_data.get('humidity')}%. Conditions remain favorable.",
        "why_it_matters_mr": f"सध्याचे तापमान {weather_data.get('temperature')}°C, आर्द्रता {weather_data.get('humidity')}%. हवामान पिकासाठी अनुकूल आहे.",
        "why_it_matters_hi": f"वर्तमान तापमान {weather_data.get('temperature')}°C, नमी {weather_data.get('humidity')}%। मौसम फसल के लिए अनुकूल है।",
        "why_it_matters_ta": f"தற்போதைய வெப்பநிலை {weather_data.get('temperature')}°C, ஈரப்பதம் {weather_data.get('humidity')}%. வானிலை சீராக உள்ளது.",
        "recommended_action": "Maintain scheduled field operations.",
        "recommended_action_mr": "नियमित शेती कामे चालू ठेवा.",
        "recommended_action_hi": "नियमित कृषि कार्य जारी रखें।",
        "recommended_action_ta": "வழக்கமான விவசாய பணிகளை தொடரவும்."
    }

    # 3. Format message in user's active website language
    formatted_msg = WeatherRiskEngine.format_whatsapp_message(lead_alert, language=lang)
    
    # Append 10-min interval telemetry tag
    curr_time_str = datetime.now().strftime("%I:%M %p")
    formatted_msg += f"\n\n⏱️ _Automated 10-Min Weather Update &bull; {curr_time_str}_"

    # 4. Dispatch via Twilio WhatsApp API
    delivery_res = _whatsapp_provider.send_text(target_phone, formatted_msg)
    alert_uid = f"AUTO-{uuid.uuid4().hex[:8].upper()}"

    # 5. Persist to database log
    try:
        db = get_db()
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
                farm.get("crop_type", "Rice"),
                "10_Min_Automated_Weather_Alert",
                lead_alert.get("severity", "INFO"),
                lead_alert.get("title", f"Weather Update for {farm.get('name')}"),
                lead_alert.get("threat", "General Weather"),
                lead_alert.get("why_it_matters"),
                lead_alert.get("recommended_action"),
                f"{weather_data.get('temperature')}°C, {weather_data.get('humidity')}% RH, {weather_data.get('description')}",
                f"{weather_data.get('rain_forecast_mm', 0)} mm rain in 24h",
                lead_alert.get("severity", "INFO"),
                lang,
                formatted_msg,
                "DELIVERED" if delivery_res.get("success") else "FAILED"
            )
        )
        db.commit()
        db.close()
    except Exception as db_err:
        logger.error(f"[AutoDispatcher] Error logging alert to DB: {db_err}")

    LAST_DISPATCH_TIMESTAMPS[farm_id] = time.time()
    logger.info(f"[AutoDispatcher] Dispatched 10-min weather alert to {target_phone} (Lang: {lang})")
    
    return {
        "success": delivery_res.get("success", False),
        "farm_id": farm_id,
        "phone": target_phone,
        "language": lang,
        "alert_id": alert_uid,
        "delivery_result": delivery_res,
        "message": formatted_msg,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


def _auto_dispatcher_worker():
    """Background worker thread that runs every 10 minutes."""
    global _dispatcher_running
    logger.info("[AutoDispatcher] Background 10-minute WhatsApp weather dispatcher started.")
    
    while _dispatcher_running:
        try:
            # Query all farms
            db = get_db()
            farms = [dict(r) for r in db.execute("SELECT * FROM farms").fetchall()]
            db.close()

            for farm in farms:
                farm_id = farm["id"]
                target_phone = farm.get("whatsapp") or farm.get("phone")
                # If farm has a phone or is active
                if target_phone or farm_id in ACTIVE_FARM_LANGUAGES:
                    last_time = LAST_DISPATCH_TIMESTAMPS.get(farm_id, 0)
                    now = time.time()
                    # Check if 10 minutes (600s) have passed since last dispatch
                    if now - last_time >= AUTO_DISPATCH_INTERVAL_SECONDS:
                        try:
                            dispatch_weather_message_for_farm(farm)
                        except Exception as e:
                            logger.error(f"[AutoDispatcher] Error sending to Farm {farm_id}: {e}")
        except Exception as loop_err:
            logger.error(f"[AutoDispatcher] Worker error: {loop_err}")

        # Sleep for 15 seconds before checking timestamps again
        time.sleep(15)


def start_auto_dispatcher():
    """Starts the background 10-minute dispatcher thread if not already running."""
    global _dispatcher_thread, _dispatcher_running
    if _dispatcher_running:
        return
    _dispatcher_running = True
    _dispatcher_thread = threading.Thread(target=_auto_dispatcher_worker, daemon=True)
    _dispatcher_thread.start()
    logger.info("[AutoDispatcher] Thread initialized and active.")
