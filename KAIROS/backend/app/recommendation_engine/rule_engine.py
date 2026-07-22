from .disease_rules import evaluate as eval_disease
from .ndvi_rules import evaluate as eval_ndvi
from .sensor_rules import evaluate as eval_sensor
from .weather_rules import evaluate as eval_weather

def evaluate_all(ai_data, ndvi_data, sensor_data, weather_data):
    """
    Evaluates all data sources and performs cross-verification logic
    to eliminate false positives and create unified, confident recommendations.
    """
    cross_issues = []
    
    # 1. Run individual domain rules
    env_data = {}
    if sensor_data: env_data.update(sensor_data)
    if weather_data: env_data.update(weather_data)
    
    domain_flags = []
    domain_flags.extend(eval_disease(ai_data, env_data))
    domain_flags.extend(eval_ndvi(ndvi_data, env_data))
    domain_flags.extend(eval_sensor(sensor_data))
    domain_flags.extend(eval_weather(weather_data))
    
    # 2. Extract base variables for cross-verification
    disease = ai_data.get('disease', 'Healthy') if ai_data else 'Healthy'
    ai_conf = ai_data.get('confidence', 0) if ai_data else 0
    ndvi = ndvi_data.get('ndvi_mean', 1.0) if ndvi_data else 1.0
    soil = sensor_data.get('soil_moisture', 50) if sensor_data else 50
    temp = sensor_data.get('temperature', 25) if sensor_data else 25
    hum = sensor_data.get('humidity', 50) if sensor_data else 50
    light = sensor_data.get('light', 0) if sensor_data else 0
    mq135 = sensor_data.get('mq135', 0) if sensor_data else 0
    rain = weather_data.get('rain_forecast_mm', 0) > 0 if weather_data else False
    if sensor_data and sensor_data.get('rain_detected'):
        rain = True

    # Get environmental classification
    from app.services.env_intelligence import analyze_environment
    env_intel = analyze_environment(sensor_data) if sensor_data else None

    # Node Status & Irrigation Predictions
    node_status = sensor_data.get('node_status', {}).get('status', 'Offline') if sensor_data else 'Offline'
    irr_pred = sensor_data.get('irrigation_prediction', {}) if sensor_data else {}
    
    # If node is offline, we should heavily mistrust sensor data
    stale_sensors = node_status == 'Offline'
        
    # Rule 1: Water Stress (Healthy Leaf, Low NDVI, Low soil moisture, high heat, high light)
    if disease == 'Healthy' and ndvi < 0.35 and soil < 30 and temp > 33 and light > 800:
        cross_issues.append({
            'issue': 'Water Stress',
            'severity': 'Critical',
            'evidence': ['AI Disease Detection', 'NDVI Analysis', 'Soil Moisture', 'Temperature', 'Light'],
            'diagnostic': f"Healthy leaf. Low NDVI ({ndvi:.2f}). Low soil moisture ({soil}%). High heat ({temp}°C). High solar radiation.",
            'actions': ["Increase irrigation", "Mulching recommended"]
        })
        
    # Rule 2: High Disease Risk (Disease + High Humidity + Low NDVI)
    elif disease != 'Healthy' and hum > 85 and ndvi < 0.5:
        cross_issues.append({
            'issue': 'High Disease Risk',
            'severity': 'Critical',
            'evidence': ['AI Disease Detection', 'Humidity', 'NDVI Analysis'],
            'diagnostic': f"AI confirms {disease} ({ai_conf:.1f}%). High humidity ({hum}%) supports fungal growth. NDVI indicates vegetation decline.",
            'actions': ["Apply fungicide", "Inspect nearby plants", "Reduce overhead irrigation"]
        })
        
    # Rule 3: Poor Environmental Conditions (Poor Air Quality + High Humidity + Rain)
    elif env_intel and env_intel['air_quality_class'] == 'Poor' and hum > 90 and rain and not stale_sensors:
        cross_issues.append({
            'issue': 'Poor Environmental Conditions',
            'severity': 'High',
            'evidence': ['Air Quality', 'Humidity', 'Rain Sensor', 'Environmental Health Index'],
            'diagnostic': "Air quality has deteriorated. Humidity remains excessive. Potential greenhouse ventilation issue.",
            'actions': ["Increase airflow", "Inspect enclosed growing area"]
        })
        
    # Rule 3.5: Predictive Irrigation Trigger
    elif irr_pred and irr_pred.get('status') in ['Critical', 'Warning'] and not stale_sensors:
        cross_issues.append({
            'issue': 'Irrigation Required',
            'severity': irr_pred['status'],
            'evidence': ['Soil Moisture', 'Sensor Trends', 'Temperature'],
            'diagnostic': f"{irr_pred['prediction']} {irr_pred.get('trend_analysis', '')}",
            'actions': [f"Schedule {irr_pred['recommended_liters']}L of irrigation", "Check water lines"]
        })
        
    # Rule 4: Localized Disease (Disease detected but vegetation healthy)
    elif disease != 'Healthy' and ai_conf > 85 and ndvi > 0.6:
        cross_issues.append({
            'issue': 'Localized Disease',
            'severity': 'Moderate',
            'evidence': ['AI Disease Detection', 'NDVI Analysis'],
            'diagnostic': f"Disease ({disease}) detected on individual plant with high confidence ({ai_conf:.1f}%), while satellite vegetation remains healthy (NDVI {ndvi:.2f}).",
            'actions': ["Isolate and inspect affected plants", "Recommend localized treatment (e.g., targeted fungicide)", "Avoid field-wide spraying"]
        })
        
    # If no cross-verified issues matched, rely on the individual domain flags
    if not cross_issues:
        cross_issues.extend(domain_flags)
        
    # Return best issue or healthy
    if not cross_issues:
        cross_issues.append({
            'issue': 'Healthy Crop',
            'severity': 'None',
            'evidence': ['AI Disease Detection', 'NDVI', 'Temperature', 'Humidity', 'Soil Moisture', 'Environmental Health Index'],
            'diagnostic': "Leaf AI confirms healthy crop. NDVI indicates vigorous vegetation. Environmental conditions are optimal.",
            'actions': ["Maintain current irrigation schedule"]
        })
        
    # Sort by severity
    severity_order = {'Critical': 4, 'High': 3, 'Moderate': 2, 'Low': 1, 'None': 0}
    cross_issues.sort(key=lambda x: severity_order.get(x.get('severity', 'Low'), 0), reverse=True)
    
    return cross_issues
