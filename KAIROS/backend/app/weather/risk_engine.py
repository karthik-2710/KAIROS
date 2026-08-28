import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Configurable Agricultural Weather Thresholds based on ICAR Agronomy Guidelines
WEATHER_THRESHOLDS = {
    "rain_arriving_mm": 5.0,
    "heavy_rain_mm": 25.0,
    "torrential_rain_mm": 50.0,
    "wet_spell_days": 3,
    "wet_spell_daily_rain_mm": 3.0,
    "temp_increase_delta_c": 5.0,
    "heat_stress_temp_c": 36.0,
    "temp_drop_delta_c": -5.0,
    "frost_risk_temp_c": 8.0,
    "high_humidity_rh": 82.0,
    "dry_spell_days": 5,
    "high_wind_speed_kmh": 35.0
}

# Crop Specific Pathogen & Pest Susceptibility Profiles (ICAR / SAU Maharashtra & Tamil Nadu)
CROP_WEATHER_VULNERABILITIES = {
    "Rice": {
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Blast & Bacterial Leaf Blight",
            "why_it_matters": "Sustained moisture (>80% RH) and rainfall create optimal spore germination conditions for fungal Blast and bacterial blight.",
            "why_it_matters_mr": "जास्त आर्द्रता (>८०%) आणि सततच्या पावसामुळे करपा आणि जिवाणूजन्य करपा रोगाचा प्रादुर्भाव वाढू शकतो.",
            "why_it_matters_hi": "अधिक नमी (>80%) और बारिश के कारण झुलसा और जीवाणु पत्ती झुलसा रोग का खतरा बढ़ सकता है।",
            "why_it_matters_ta": "அதிக ஈரப்பதம் மற்றும் மழை காரணமாக குலைநோய் மற்றும் பாக்டீரியா இலைக்கருகல் நோய் பரவ வாய்ப்புள்ளது.",
            "recommended_action": "Drain excess standing water. Monitor leaves for spindle-shaped lesions. Avoid excess nitrogen application.",
            "recommended_action_mr": "शेतातील अतिरिक्त पाणी काढून टाका. पानांचे निरीक्षण करा आणि नत्र खतांचा अतिवापर टाळा.",
            "recommended_action_hi": "खेत से अतिरिक्त पानी निकालें। पत्तियों की निगरानी करें और यूरिया का अधिक उपयोग न करें।",
            "recommended_action_ta": "வயலில் தேங்கியுள்ள தண்ணீரை வடிக்கவும். இலைகளில் புள்ளிகள் உள்ளதா என கண்காணிக்கவும்.",
            "severity": "High"
        },
        "heavy_rain": {
            "risk_type": "Agronomic",
            "threat": "Waterlogging & Nutrient Leaching",
            "why_it_matters": "Heavy rainfall causes water stagnation and nutrient runoff in active paddy tillers.",
            "why_it_matters_mr": "मुसळधार पावसामुळे शेतात पाणी साचून खतांचे वाहून जाणे होऊ शकते.",
            "why_it_matters_hi": "भारी बारिश से खेत में जलभराव और पोषक तत्वों का बहाव हो सकता है।",
            "why_it_matters_ta": "கனமழையினால் வயலில் நீர் தேங்கி சத்துக்கள் அடித்துச் செல்லப்படலாம்.",
            "recommended_action": "Ensure field drainage channels are clear before downpours.",
            "recommended_action_mr": "पावसापूर्वी शेतातील पाण्याचा निचरा होणारे चर मोकळे करा.",
            "recommended_action_hi": "बारिश से पहले जल निकासी की नालियों को साफ रखें।",
            "recommended_action_ta": "மழைக்கு முன் வடிகால் வாய்க்கால்களை தூர்வாரவும்.",
            "severity": "Moderate"
        }
    },
    "Cotton": {
        "heat_and_dry": {
            "risk_type": "Pest",
            "threat": "Whitefly & Sucking Pests",
            "why_it_matters": "High temperature and dry canopy conditions accelerate whitefly and thrips reproduction.",
            "why_it_matters_mr": "जास्त तापमान आणि कोरड्या हवेमुळे पांढरी माशी आणि रसशोषक किडींचा प्रादुर्भाव वाढतो.",
            "why_it_matters_hi": "उच्च तापमान और शुष्क मौसम से सफेद मक्खी और रस चूसक कीटों का प्रकोप बढ़ता है।",
            "why_it_matters_ta": "அதிக வெப்பம் மற்றும் வறண்ட சூழல் காரணமாக வெள்ளை ஈ மற்றும் பூச்சிகள் அதிகரிக்கலாம்.",
            "recommended_action": "Install yellow sticky traps (15/ha) and check leaf undersides for nymph colonies.",
            "recommended_action_mr": "पिवळे चिकट सापळे लावा आणि पानांच्या खालच्या बाजूला किडींची पाहणी करा.",
            "recommended_action_hi": "पीले चिपचिपे प्रपंच लगाएं और पत्तियों के नीचे कीटों की जांच करें।",
            "recommended_action_ta": "மஞ்சள் ஒட்டும் பொறிகளை வைத்து இலைகளின் அடிப்பகுதியை கண்காணிக்கவும்.",
            "severity": "High"
        },
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Boll Rot & Grey Mildew",
            "why_it_matters": "Persistent rain and humidity during boll formation promote microbial rotting.",
            "why_it_matters_mr": "बोंड भरण्याच्या काळात जास्त पावसामुळे बोंड सडणे व दहिया रोगाचा धोका वाढतो.",
            "why_it_matters_hi": "कपास के गूलर बनने के समय अधिक नमी से गूलर सड़न रोग का खतरा रहता है।",
            "why_it_matters_ta": "காய் பிடிக்கும் தருணத்தில் அதிக மழையினால் காய் அழுகல் நோய் ஏற்படலாம்.",
            "recommended_action": "Improve airflow in canopy. Inspect lower bolls for blackening or water-soaked spots.",
            "recommended_action_mr": "हवेचा वावर राहील याची काळजी घ्या. खालच्या बोंडांची तपासणी करा.",
            "recommended_action_hi": "फसल में हवा का संचार ठीक रखें। निचले गूलरों की जांच करें।",
            "recommended_action_ta": "பயிர்களுக்கு இடையே காற்றோட்டத்தை பராமரித்து காய்களை கண்காணிக்கவும்.",
            "severity": "Moderate"
        }
    },
    "Soybean": {
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Soybean Rust & Anthracnose",
            "why_it_matters": "Prolonged leaf wetness and warm temperatures trigger rapid Asian Soybean Rust spread.",
            "why_it_matters_mr": "पानांवर जास्त काळ ओलावा राहिल्याने तांबेरा व अँथ्रॅकनोज रोगाचा प्रादुर्भाव वेगाने वाढतो.",
            "why_it_matters_hi": "पत्तियों पर लगातार नमी रहने से सोयाबीन गेरुई रोग का प्रसार तेजी से होता है।",
            "why_it_matters_ta": "இலைகளில் தொடர் ஈரப்பதம் காரணமாக துரு நோய் விரைவாக பரவக்கூடும்.",
            "recommended_action": "Scout lower canopy for tiny tan lesions. Ensure proper field aeration.",
            "recommended_action_mr": "झाडाच्या खालच्या पानांवर तांबूस ठिपक्यांची पाहणी करा.",
            "recommended_action_hi": "निचली पत्तियों पर भूरे धब्बों की जांच करें।",
            "recommended_action_ta": "கீழ் இலைகளில் துரு போன்ற புள்ளிகள் உள்ளதா என கண்காணிக்கவும்.",
            "severity": "High"
        }
    },
    "Banana": {
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Sigatoka Leaf Spot",
            "why_it_matters": "Rain splashes spread fungal Sigatoka spores across broad banana canopies.",
            "why_it_matters_mr": "पावसाच्या पाण्यामुळे करपा (सिगाटोका) रोगाचे बीजाणू इतर झाडांवर वेगाने पसरतात.",
            "why_it_matters_hi": "बारिश की बूंदों से सिगाटोका पर्ण दाग रोग के बीजाणु तेजी से फैलते हैं।",
            "why_it_matters_ta": "மழைத்துளிகள் மூலம் சிகடோகா இலைப்புள்ளி நோய் எளிதில் பரவுகிறது.",
            "recommended_action": "Remove and destroy severely spotted lower leaves. Ensure drainage.",
            "recommended_action_mr": "रोगट झालेली खालची पाने कापून नष्ट करा. पाण्याचा निचरा करा.",
            "recommended_action_hi": "रोगग्रस्त निचली पत्तियों को काटकर नष्ट करें। जल निकासी सुधारे।",
            "recommended_action_ta": "பாதிக்கப்பட்ட அடி இலைகளை அகற்றி அழிக்கவும். வடிகால் வசதி செய்யவும்.",
            "severity": "High"
        },
        "high_wind": {
            "risk_type": "Agronomic",
            "threat": "Pseudostem Lodging",
            "why_it_matters": "Wind gusts exceeding 35 km/h can topple heavy fruiting banana trees.",
            "why_it_matters_mr": "३५ किमी/तास पेक्षा जास्त वेगाच्या वाऱ्यामुळे केळीचे घड पडण्याचा धोका असतो.",
            "why_it_matters_hi": "तेज हवाओं (35 किमी/घंटा से अधिक) से भारी फल वाले केले के पेड़ गिर सकते हैं।",
            "why_it_matters_ta": "அதிவேக காற்றினால் குலை தள்ளிய வாழை மரங்கள் சாய வாய்ப்புள்ளது.",
            "recommended_action": "Provide bamboo or wooden props to propped bunches.",
            "recommended_action_mr": "घड असलेल्या झाडांना बांबूचा किंवा लाकडाचा आधार द्या.",
            "recommended_action_hi": "फलों वाले पेड़ों को बांस या लकड़ी का सहारा दें।",
            "recommended_action_ta": "வாழை மரங்களுக்கு முட்டுக்கொடுத்து பாதுகாக்கவும்.",
            "severity": "High"
        }
    },
    "Wheat": {
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Yellow / Brown Rust",
            "why_it_matters": "Cool wet conditions during tillering favor rust pustule development.",
            "why_it_matters_mr": "थंड आणि दमट हवामानामुळे गव्हावरील तांबेरा रोगाचा प्रसार होतो.",
            "why_it_matters_hi": "ठंडे और नम मौसम में गेहूं में पीला या भूरा रतुआ रोग फैल सकता है।",
            "why_it_matters_ta": "குளிர்ந்த ஈரப்பதமான சூழல் கோதுமை துரு நோய்க்கு சாதகமாக உள்ளது.",
            "recommended_action": "Inspect leaves for parallel yellow-orange stripes.",
            "recommended_action_mr": "पानांवर पिवळ्या-नारंगी पट्ट्यांची तपासणी करा.",
            "recommended_action_hi": "पत्तियों पर पीली-नारंगी धारियों की जांच करें।",
            "recommended_action_ta": "இலைகளில் மஞ்சள் நிற வரிகள் உள்ளதா என கண்காணிக்கவும்.",
            "severity": "High"
        }
    },
    "Onion": {
        "high_humidity_rain": {
            "risk_type": "Disease",
            "threat": "Purple Blotch & Downy Mildew",
            "why_it_matters": "Cloudy, rainy weather triggers purple blotch and stem rotting in bulb crops.",
            "why_it_matters_mr": "ढगाळ व पावसाळी वातावरणामुळे कांद्यावरील जांभळा करपा आणि करपा रोगाचा प्रादुर्भाव होतो.",
            "why_it_matters_hi": "बादल और बारिश से प्याज में बैंगनी धब्बा और झुलसा रोग फैलता है।",
            "why_it_matters_ta": "மேகமூட்டம் மற்றும் மழையால் வெங்காயத்தில் ஊதா நிற கருகல் நோய் ஏற்படலாம்.",
            "recommended_action": "Avoid overhead sprinkler irrigation; maintain ridge drainage.",
            "recommended_action_mr": "तुषार सिंचन टाळा आणि पाण्याचा निचरा योग्य ठेवा.",
            "recommended_action_hi": "फव्वारा सिंचाई से बचें और जल निकासी की व्यवस्था रखें।",
            "recommended_action_ta": "தெளிப்பு நீர் பாசனத்தை தவிர்த்து வடிகால் வசதியை உறுதி செய்யவும்.",
            "severity": "High"
        }
    }
}


class WeatherRiskEngine:
    """
    Deterministic Agricultural Weather Intelligence & Alert Evaluation Engine.
    Combines:
      - Live forecast trends (24h & 7d)
      - Farm crop vulnerability profiles
      - Real ESP32 IoT telemetry
      - Anti-spam deduplication & multilingual formatting
    """

    @staticmethod
    def detect_weather_changes(weather_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Compares upcoming forecast against current baseline to detect meaningful changes.
        """
        changes = []
        if not weather_data or not weather_data.get("is_real"):
            return changes

        curr_temp = weather_data.get("temperature", 25.0)
        curr_hum = weather_data.get("humidity", 60.0)
        curr_rain = weather_data.get("rainfall", 0.0)
        rain_24h = weather_data.get("rain_forecast_mm", 0.0)
        
        hourly_24h = weather_data.get("hourly_24h", [])
        daily_7d = weather_data.get("daily_7d", [])

        # 1. Rain Arrival / Heavy Rain Detection
        if rain_24h >= WEATHER_THRESHOLDS["torrential_rain_mm"]:
            changes.append({
                "type": "torrential_rain",
                "label": "Torrential Rainfall Imminent",
                "magnitude": f"{rain_24h:.1f} mm in 24h",
                "severity": "CRITICAL",
                "rain_24h_mm": rain_24h
            })
        elif rain_24h >= WEATHER_THRESHOLDS["heavy_rain_mm"]:
            changes.append({
                "type": "heavy_rain",
                "label": "Heavy Rainfall Expected",
                "magnitude": f"{rain_24h:.1f} mm in 24h",
                "severity": "HIGH",
                "rain_24h_mm": rain_24h
            })
        elif rain_24h >= WEATHER_THRESHOLDS["rain_arriving_mm"] and curr_rain < 1.0:
            changes.append({
                "type": "rain_arriving",
                "label": "Rainfall Arriving",
                "magnitude": f"{rain_24h:.1f} mm in 24h",
                "severity": "MODERATE",
                "rain_24h_mm": rain_24h
            })

        # 2. Extended Wet Spell in 7-day forecast
        if len(daily_7d) >= 3:
            rainy_days = sum(1 for d in daily_7d if d.get("precipitation_sum_mm", 0) >= WEATHER_THRESHOLDS["wet_spell_daily_rain_mm"])
            if rainy_days >= WEATHER_THRESHOLDS["wet_spell_days"]:
                changes.append({
                    "type": "extended_wet_spell",
                    "label": f"Extended Wet Period ({rainy_days} rainy days)",
                    "magnitude": f"{rainy_days} days of precipitation",
                    "severity": "HIGH"
                })

        # 3. High Humidity Conditions
        if hourly_24h:
            avg_hum_24h = sum(h.get("humidity", 0) for h in hourly_24h) / len(hourly_24h)
            if avg_hum_24h >= WEATHER_THRESHOLDS["high_humidity_rh"]:
                changes.append({
                    "type": "high_humidity",
                    "label": "Sustained High Humidity",
                    "magnitude": f"Avg {avg_hum_24h:.0f}% RH over next 24h",
                    "severity": "HIGH" if rain_24h > 3.0 else "MODERATE"
                })

        # 4. Temperature Spikes / Heat Stress
        if daily_7d:
            max_future_temp = max((d.get("temp_max", curr_temp) for d in daily_7d[:3]), default=curr_temp)
            min_future_temp = min((d.get("temp_min", curr_temp) for d in daily_7d[:3]), default=curr_temp)

            if max_future_temp >= WEATHER_THRESHOLDS["heat_stress_temp_c"]:
                changes.append({
                    "type": "heat_stress",
                    "label": "High Temperature / Heat Stress",
                    "magnitude": f"Max {max_future_temp:.1f}°C expected",
                    "severity": "HIGH"
                })
            elif max_future_temp >= curr_temp + WEATHER_THRESHOLDS["temp_increase_delta_c"]:
                changes.append({
                    "type": "temp_increase",
                    "label": "Significant Temperature Increase",
                    "magnitude": f"+{max_future_temp - curr_temp:.1f}°C rise",
                    "severity": "MODERATE"
                })

            if min_future_temp <= WEATHER_THRESHOLDS["frost_risk_temp_c"]:
                changes.append({
                    "type": "frost_risk",
                    "label": "Cold Spell / Low Temperature Risk",
                    "magnitude": f"Min {min_future_temp:.1f}°C expected",
                    "severity": "HIGH"
                })

        # 5. High Wind Speed
        if daily_7d:
            max_wind = max((d.get("wind_speed_max_kmh", 0) for d in daily_7d[:3]), default=0)
            if max_wind >= WEATHER_THRESHOLDS["high_wind_speed_kmh"]:
                changes.append({
                    "type": "high_wind",
                    "label": "Strong Wind Gusts",
                    "magnitude": f"{max_wind:.1f} km/h max wind",
                    "severity": "HIGH"
                })

        return changes

    @classmethod
    def evaluate_agricultural_risk(cls, farm: Dict[str, Any], weather_data: Dict[str, Any], esp32_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Interprets detected weather changes in the context of the farm's crop,
        ESP32 IoT sensor readings, and generates structured alert recommendations.
        """
        crop = farm.get("crop_type", "Rice")
        farm_id = farm.get("id", 1)
        farm_name = farm.get("name", "My Farm")

        weather_changes = cls.detect_weather_changes(weather_data)
        crop_vulns = CROP_WEATHER_VULNERABILITIES.get(crop, CROP_WEATHER_VULNERABILITIES["Rice"])

        alerts = []
        highest_severity = "INFO"
        severity_rank = {"INFO": 0, "LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}

        # Check for matching agricultural risks
        has_rain_event = any(c["type"] in ["heavy_rain", "torrential_rain", "rain_arriving", "extended_wet_spell"] for c in weather_changes)
        has_humidity_event = any(c["type"] == "high_humidity" for c in weather_changes)
        has_heat_event = any(c["type"] in ["heat_stress", "temp_increase"] for c in weather_changes)
        has_wind_event = any(c["type"] == "high_wind" for c in weather_changes)

        # 1. High Moisture & Disease Risk Convergence
        if (has_rain_event or has_humidity_event) and "high_humidity_rain" in crop_vulns:
            vuln = crop_vulns["high_humidity_rain"]
            sev = "HIGH" if (has_rain_event and has_humidity_event) else "MODERATE"
            if severity_rank[sev] > severity_rank[highest_severity]:
                highest_severity = sev
            alerts.append({
                "alert_type": "Disease_Risk",
                "severity": sev,
                "title": f"⚠️ Elevated {crop} Disease Risk ({vuln['threat']})",
                "crop": crop,
                "threat": vuln["threat"],
                "why_it_matters": vuln["why_it_matters"],
                "why_it_matters_mr": vuln["why_it_matters_mr"],
                "why_it_matters_hi": vuln["why_it_matters_hi"],
                "why_it_matters_ta": vuln["why_it_matters_ta"],
                "recommended_action": vuln["recommended_action"],
                "recommended_action_mr": vuln["recommended_action_mr"],
                "recommended_action_hi": vuln["recommended_action_hi"],
                "recommended_action_ta": vuln["recommended_action_ta"],
                "trigger_weather": "Heavy rainfall & sustained humidity forecasted"
            })

        # 2. Heat & Sucking Pest Risk Convergence
        if has_heat_event and "heat_and_dry" in crop_vulns:
            vuln = crop_vulns["heat_and_dry"]
            sev = "HIGH"
            if severity_rank[sev] > severity_rank[highest_severity]:
                highest_severity = sev
            alerts.append({
                "alert_type": "Pest_Risk",
                "severity": sev,
                "title": f"⚠️ High Temperature & {crop} Sucking Pest Risk",
                "crop": crop,
                "threat": vuln["threat"],
                "why_it_matters": vuln["why_it_matters"],
                "why_it_matters_mr": vuln["why_it_matters_mr"],
                "why_it_matters_hi": vuln["why_it_matters_hi"],
                "why_it_matters_ta": vuln["why_it_matters_ta"],
                "recommended_action": vuln["recommended_action"],
                "recommended_action_mr": vuln["recommended_action_mr"],
                "recommended_action_hi": vuln["recommended_action_hi"],
                "recommended_action_ta": vuln["recommended_action_ta"],
                "trigger_weather": "Temperature spike and low humidity forecasted"
            })

        # 3. High Wind Risk Convergence
        if has_wind_event and "high_wind" in crop_vulns:
            vuln = crop_vulns["high_wind"]
            sev = "HIGH"
            if severity_rank[sev] > severity_rank[highest_severity]:
                highest_severity = sev
            alerts.append({
                "alert_type": "Agronomic_Risk",
                "severity": sev,
                "title": f"⚠️ High Wind Alert ({crop})",
                "crop": crop,
                "threat": vuln["threat"],
                "why_it_matters": vuln["why_it_matters"],
                "why_it_matters_mr": vuln["why_it_matters_mr"],
                "why_it_matters_hi": vuln["why_it_matters_hi"],
                "why_it_matters_ta": vuln["why_it_matters_ta"],
                "recommended_action": vuln["recommended_action"],
                "recommended_action_mr": vuln["recommended_action_mr"],
                "recommended_action_hi": vuln["recommended_action_hi"],
                "recommended_action_ta": vuln["recommended_action_ta"],
                "trigger_weather": "Wind gusts exceeding 35 km/h"
            })

        # Default Info Alert if no critical threshold was reached
        if not alerts:
            if weather_changes:
                lead_change = weather_changes[0]
                alerts.append({
                    "alert_type": "Weather_Info",
                    "severity": lead_change.get("severity", "INFO"),
                    "title": f"🌧️ Weather Update: {lead_change['label']}",
                    "crop": crop,
                    "threat": "None",
                    "why_it_matters": f"Upcoming change: {lead_change['magnitude']}. No severe crop risk detected at current growth stage.",
                    "why_it_matters_mr": f"पुढील बदल: {lead_change['magnitude']}. पिकावर कोणताही गंभीर परिणाम जाणवत नाही.",
                    "why_it_matters_hi": f"आगामी बदलाव: {lead_change['magnitude']}। फसल पर कोई गंभीर खतरा नहीं है।",
                    "why_it_matters_ta": f"வானிலை மாற்றம்: {lead_change['magnitude']}. பயிருக்கு உடனடி ஆபத்து இல்லை.",
                    "recommended_action": "Continue routine field monitoring.",
                    "recommended_action_mr": "नियमित शेती कामे चालू ठेवा.",
                    "recommended_action_hi": "नियमित खेत की निगरानी जारी रखें।",
                    "recommended_action_ta": "வழக்கமான பயிர் பராமரிப்பை தொடரவும்.",
                    "trigger_weather": lead_change["label"]
                })
            else:
                alerts.append({
                    "alert_type": "Weather_Stable",
                    "severity": "INFO",
                    "title": "☀️ Stable Weather Conditions",
                    "crop": crop,
                    "threat": "None",
                    "why_it_matters": "Weather forecast indicates stable, favorable growing conditions over the next 7 days.",
                    "why_it_matters_mr": "पुढील ७ दिवसांत हवामान स्थिर आणि पिकासाठी अनुकूल राहण्याचा अंदाज आहे.",
                    "why_it_matters_hi": "अगले 7 दिनों में मौसम स्थिर और फसल के लिए अनुकूल रहने का अनुमान है।",
                    "why_it_matters_ta": "அடுத்த 7 நாட்களுக்கு வானிலை சீராகவும் பயிருக்கு உகந்ததாகவும் இருக்கும்.",
                    "recommended_action": "Maintain planned irrigation schedule.",
                    "recommended_action_mr": "नियोजनानुसार पाणी व्यवस्थापन सुरू ठेवा.",
                    "recommended_action_hi": "योजनानुसार सिंचाई जारी रखें।",
                    "recommended_action_ta": "திட்டமிட்டபடி பாசனம் மேற்கொள்ளவும்.",
                    "trigger_weather": "Stable"
                })

        # Compare with IoT ESP32 Telemetry (if available)
        iot_comparison = None
        if esp32_data:
            iot_temp = esp32_data.get("temperature")
            iot_hum = esp32_data.get("humidity")
            iot_rain = esp32_data.get("rain", {}).get("isRaining") if isinstance(esp32_data.get("rain"), dict) else esp32_data.get("rain_detected", False)
            
            iot_comparison = {
                "forecast_temp_c": weather_data.get("temperature"),
                "field_esp32_temp_c": iot_temp,
                "forecast_humidity_pct": weather_data.get("humidity"),
                "field_esp32_humidity_pct": iot_hum,
                "field_rain_sensor_active": bool(iot_rain),
                "is_aligned": abs(float(weather_data.get("temperature", 0)) - float(iot_temp or 0)) < 4.0 if iot_temp is not None else True
            }

        return {
            "farm_id": farm_id,
            "farm_name": farm_name,
            "crop": crop,
            "overall_severity": highest_severity,
            "weather_changes_detected": weather_changes,
            "alerts": alerts,
            "iot_comparison": iot_comparison,
            "evaluated_at": datetime.utcnow().isoformat() + "Z"
        }

    @classmethod
    def format_whatsapp_message(cls, alert: Dict[str, Any], language: str = "en") -> str:
        """
        Formats short, actionable WhatsApp messages adhering strictly to Requirement 17 & 18.
        Supports English, Marathi (मराठी), Hindi (हिन्दी), and Tamil (தமிழ்).
        """
        lang = str(language).lower()
        crop = alert.get("crop", "Rice")
        threat = alert.get("threat", "General Weather")
        sev = alert.get("severity", "HIGH").upper()
        
        if lang in ["mr", "marathi"]:
            sev_text = "जास्त" if sev in ["HIGH", "CRITICAL"] else ("मध्यम" if sev == "MODERATE" else "कमी")
            msg = (
                f"🌧️ *KAIROS हवामान कृषी सूचना*\n\n"
                f"पीक: *{crop}*\n"
                f"रोगाचा / किडीचा धोका: *{threat}*\n\n"
                f"*याचा परिणाम:*\n"
                f"{alert.get('why_it_matters_mr') or alert.get('why_it_matters')}\n\n"
                f"*KAIROS अंदाज:*\n"
                f"धोका पातळी — *{sev_text}*\n\n"
                f"*कृती:*\n"
                f"{alert.get('recommended_action_mr') or alert.get('recommended_action')}\n\n"
                f"📱 _संपूर्ण विश्लेषणासाठी KAIROS उघडा._"
            )
        elif lang in ["hi", "hindi"]:
            sev_text = "अधिक" if sev in ["HIGH", "CRITICAL"] else ("मध्यम" if sev == "MODERATE" else "कम")
            msg = (
                f"🌧️ *KAIROS मौसम कृषि चेतावनी*\n\n"
                f"फसल: *{crop}*\n"
                f"रोग / कीट का खतरा: *{threat}*\n\n"
                f"*इसका महत्व:*\n"
                f"{alert.get('why_it_matters_hi') or alert.get('why_it_matters')}\n\n"
                f"*KAIROS पूर्वानुमान:*\n"
                f"जोखिम स्तर — *{sev_text}*\n\n"
                f"*कार्रवाई:*\n"
                f"{alert.get('recommended_action_hi') or alert.get('recommended_action')}\n\n"
                f"📱 _पूरे विश्लेषण के लिए KAIROS खोलें।_"
            )
        elif lang in ["ta", "tamil"]:
            sev_text = "அதிகம்" if sev in ["HIGH", "CRITICAL"] else ("மிதமானது" if sev == "MODERATE" else "குறைவு")
            msg = (
                f"🌧️ *KAIROS வானிலை விவசாய எச்சரிக்கை*\n\n"
                f"பயிர்: *{crop}*\n"
                f"நோய் / பூச்சி ஆபத்து: *{threat}*\n\n"
                f"*ஏன் முக்கியம்:*\n"
                f"{alert.get('why_it_matters_ta') or alert.get('why_it_matters')}\n\n"
                f"*KAIROS மதிப்பீடு:*\n"
                f"ஆபத்து நிலை — *{sev_text}*\n\n"
                f"*பரிந்துரைக்கப்படும் நடவடிக்கை:*\n"
                f"{alert.get('recommended_action_ta') or alert.get('recommended_action')}\n\n"
                f"📱 _முழு விவரங்களை KAIROS தளத்தில் பார்க்கவும்._"
            )
        else:
            # Default English
            msg = (
                f"🌧️ *KAIROS Weather Agricultural Alert*\n\n"
                f"Crop: *{crop}*\n"
                f"Identified Risk: *{threat}*\n\n"
                f"*Why it matters:*\n"
                f"{alert.get('why_it_matters')}\n\n"
                f"*KAIROS Forecast:*\n"
                f"Risk Level — *{sev}*\n\n"
                f"*Action:*\n"
                f"{alert.get('recommended_action')}\n\n"
                f"📱 _Open KAIROS for full analysis & recommendations._"
            )
            
        return msg
