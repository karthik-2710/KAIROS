"""
Predefined Farm Scenarios
These define the targets for the telemetry simulation.
"""

SCENARIOS = {
    "Healthy Farm": {
        "temperature": 27.0,
        "humidity": 65.0,
        "soil_moisture": 60.0,
        "light": 800.0,
        "mq135": 120.0,
        "ndvi": 0.84,
        "rain": False,
        "ai_prediction": "Healthy",
        "ai_confidence": (96.0, 99.0),
        "risk": "Low"
    },
    "Water Stress": {
        "temperature": 36.0,
        "humidity": 42.0,
        "soil_moisture": 18.0,
        "light": 900.0,
        "mq135": 180.0,
        "ndvi": 0.24,
        "rain": False,
        "ai_prediction": "Healthy",
        "ai_confidence": (96.0, 99.0),
        "risk": "High"
    },
    "Early Blight": {
        "temperature": 30.0,
        "humidity": 91.0,
        "soil_moisture": 55.0,
        "light": 400.0,
        "mq135": 300.0,
        "ndvi": 0.58,
        "rain": True,
        "ai_prediction": "Early Blight",
        "ai_confidence": (95.0, 99.0),
        "risk": "Critical"
    },
    "Late Blight": {
        "temperature": 27.0,
        "humidity": 94.0,
        "soil_moisture": 65.0,
        "light": 350.0,
        "mq135": 420.0,
        "ndvi": 0.43,
        "rain": True,
        "ai_prediction": "Late Blight",
        "ai_confidence": (94.0, 99.0),
        "risk": "Critical"
    },
    "Heat Wave": {
        "temperature": 39.0,
        "humidity": 40.0,
        "soil_moisture": 15.0,
        "light": 1000.0,
        "mq135": 210.0,
        "ndvi": 0.22,
        "rain": False,
        "ai_prediction": "Healthy",
        "ai_confidence": (96.0, 99.0),
        "risk": "Critical"
    },
    "Nutrient Deficiency": {
        "temperature": 28.0,
        "humidity": 65.0,
        "soil_moisture": 52.0,
        "light": 750.0,
        "mq135": 160.0,
        "ndvi": 0.48,
        "rain": False,
        "ai_prediction": "Healthy",
        "ai_confidence": (96.0, 99.0),
        "risk": "Medium"
    }
}
