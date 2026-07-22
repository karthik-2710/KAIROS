def classify_temperature(temp):
    if temp is None: return "Unknown", 0
    if temp < 15: return "Cold", 40
    if 15 <= temp <= 22: return "Warm", 80
    if 22 < temp <= 30: return "Optimal", 100
    if 30 < temp <= 35: return "Hot", 60
    return "Extreme Heat", 20

def classify_humidity(hum):
    if hum is None: return "Unknown", 0
    if hum < 30: return "Low", 40
    if 30 <= hum <= 60: return "Optimal", 100
    if 60 < hum <= 80: return "High", 70
    return "Very High", 30

def classify_soil_moisture(moisture):
    if moisture is None: return "Unknown", 0
    if moisture < 20: return "Dry", 20
    if 20 <= moisture <= 40: return "Moderate", 60
    if 40 < moisture <= 70: return "Optimal", 100
    return "Waterlogged", 30

def classify_light(light):
    if light is None: return "Unknown", 0
    if light < 200: return "Night", 20
    if 200 <= light < 500: return "Evening/Morning", 60
    if 500 <= light < 800: return "Afternoon", 80
    return "Optimal Photosynthesis", 100

def classify_mq135(mq135):
    # Interpreted as Air Quality indicator
    if mq135 is None: return "Unknown", 0
    if mq135 < 150: return "Excellent", 100
    if 150 <= mq135 <= 250: return "Good", 80
    if 250 < mq135 <= 400: return "Moderate", 50
    return "Poor", 20

def generate_insights(temp_class, hum_class, moisture_class, light_class, air_quality_class):
    insights = []
    
    # Temp
    if temp_class == "Extreme Heat" or temp_class == "Hot":
        insights.append("High temperature increases evaporation. Heat stress risk detected.")
    
    # Humidity
    if hum_class == "Very High" or hum_class == "High":
        insights.append("High humidity increases fungal disease risk.")
    elif hum_class == "Optimal":
        insights.append("Humidity is within optimal crop range.")
        
    # Moisture
    if moisture_class == "Dry":
        insights.append("Water stress likely. Irrigation recommended.")
    elif moisture_class == "Waterlogged":
        insights.append("Risk of root rot.")
    elif moisture_class == "Optimal":
        insights.append("Root zone moisture is adequate.")
        
    # Light
    if light_class == "Optimal Photosynthesis":
        insights.append("High solar radiation detected. Photosynthesis conditions are optimal.")
    elif light_class == "Night":
        insights.append("Low light conditions detected.")
        
    # Air Quality
    if air_quality_class == "Poor":
        insights.append("Poor air quality detected. Possible greenhouse ventilation issue.")
    elif air_quality_class == "Moderate":
        insights.append("Possible accumulation of organic gases.")
        
    return insights

def analyze_environment(sensor_data):
    if not sensor_data:
        return None
        
    temp_class, temp_score = classify_temperature(sensor_data.get('temperature'))
    hum_class, hum_score = classify_humidity(sensor_data.get('humidity'))
    moisture_class, moisture_score = classify_soil_moisture(sensor_data.get('soil_moisture'))
    light_class, light_score = classify_light(sensor_data.get('light'))
    air_quality_class, air_score = classify_mq135(sensor_data.get('mq135'))
    
    # Weights for overall index
    weights = {'temp': 0.25, 'hum': 0.2, 'moisture': 0.35, 'light': 0.1, 'air': 0.1}
    
    health_index = (
        temp_score * weights['temp'] +
        hum_score * weights['hum'] +
        moisture_score * weights['moisture'] +
        light_score * weights['light'] +
        air_score * weights['air']
    )
    
    health_index = round(health_index, 1)
    
    return {
        "health_index": health_index,
        "temp_class": temp_class,
        "hum_class": hum_class,
        "moisture_class": moisture_class,
        "light_class": light_class,
        "air_quality_class": air_quality_class,
        "insights": generate_insights(temp_class, hum_class, moisture_class, light_class, air_quality_class)
    }
