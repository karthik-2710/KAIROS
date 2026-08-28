import os
import sys
from pathlib import Path
import json

# Add backend to sys path so absolute imports work
sys.path.append(str(Path(__file__).resolve().parent))

from app.recommendation_engine.engine import AgronomicDecisionEngine

def print_section(title):
    print("\n" + "="*50)
    print(title)
    print("="*50)

def run_scenario(name, ai_data, ndvi_data, sensor_data, weather_data):
    print_section(f"TEST SCENARIO: {name}")
    
    print(f"CROP: {ai_data.get('crop')}")
    print(f"MODEL: {ai_data.get('model_version')}")
    print(f"AI PREDICTION: {ai_data.get('prediction', 'Healthy')}")
    print(f"AI CONFIDENCE: {ai_data.get('confidence', 0)}%")
    
    print(f"\nSATELLITE")
    print(f"NDVI: {ndvi_data.get('ndvi_mean')}")
    print(f"NDRE: {ndvi_data.get('ndre_mean')}")
    
    print(f"\nIOT")
    print(f"Soil Moisture: {sensor_data.get('soil_moisture')}%")
    print(f"N: {sensor_data.get('nitrogen')} P: {sensor_data.get('phosphorus')} K: {sensor_data.get('potassium')}")
    
    print(f"\nWEATHER")
    print(f"Humidity: {weather_data.get('humidity')}%")
    
    rec = AgronomicDecisionEngine.generate(ai_data, ndvi_data, sensor_data, weather_data)
    
    print("\n-----------------------------------------------")
    print("RECOMMENDATION ENGINE")
    print("-----------------------------------------------")
    
    print(f"Health Score: {rec.get('health_score')}")
    print(f"Status: {rec.get('overall_status')}")
    print(f"Risk Severity: {rec.get('severity')}")
    print(f"Primary Issue: {rec.get('primary_issue')}")
    print(f"Secondary Issue: {rec.get('secondary_issue')}")
    print(f"Diagnostic Summary: {rec.get('diagnostic_summary')}")
    
    assessments = rec.get('assessments', {})
    if 'shap_explanation' in assessments:
        print("\nTop contributing factors:")
        top_factors = assessments['shap_explanation'].get('top_factors', [])
        for i, factor in enumerate(top_factors):
            print(f"{i+1}. {factor['feature']} ({factor['direction']})")
    
    print("\n-----------------------------------------------")
    print("FINAL RECOMMENDATION")
    print("-----------------------------------------------")
    for action in rec.get('recommended_actions', []):
        print(f"- {action}")
        
    print(f"- Prevention: {rec.get('follow_up')}")

if __name__ == "__main__":
    # Scenario A: Strong disease evidence
    run_scenario(
        "SCENARIO A - Strong disease evidence",
        ai_data={"crop": "rice", "model_version": "rice_v1.0.0", "prediction": "Rice Blast", "confidence": 94},
        ndvi_data={"ndvi_mean": 0.42, "ndre_mean": 0.28, "ndwi_mean": 0.17},
        sensor_data={"soil_moisture": 31, "nitrogen": 18, "phosphorus": 25, "potassium": 42},
        weather_data={"temperature": 29, "humidity": 86, "rain_forecast_mm": 12}
    )
    
    # Scenario B: Weak disease evidence
    run_scenario(
        "SCENARIO B - Weak disease evidence",
        ai_data={"crop": "rice", "model_version": "rice_v1.0.0", "prediction": "Rice Blast", "confidence": 55},
        ndvi_data={"ndvi_mean": 0.75, "ndre_mean": 0.60, "ndwi_mean": 0.35},
        sensor_data={"soil_moisture": 50, "nitrogen": 30, "phosphorus": 35, "potassium": 45},
        weather_data={"temperature": 25, "humidity": 55, "rain_forecast_mm": 0}
    )
    
    # Scenario C: Nutrient Stress
    run_scenario(
        "SCENARIO C - Nutrient Stress",
        ai_data={"crop": "rice", "model_version": "rice_v1.0.0", "prediction": "Healthy", "confidence": 98},
        ndvi_data={"ndvi_mean": 0.55, "ndre_mean": 0.20, "ndwi_mean": 0.35},
        sensor_data={"soil_moisture": 60, "nitrogen": 5, "phosphorus": 10, "potassium": 15},
        weather_data={"temperature": 26, "humidity": 60, "rain_forecast_mm": 0}
    )
    
    # Scenario D: Conflicting Evidence
    run_scenario(
        "SCENARIO D - Conflicting evidence (AI says disease, environment is healthy)",
        ai_data={"crop": "banana", "model_version": "banana_v1.0.0", "prediction": "Banana Sigatoka", "confidence": 85},
        ndvi_data={"ndvi_mean": 0.85, "ndre_mean": 0.70, "ndwi_mean": 0.55},
        sensor_data={"soil_moisture": 65, "nitrogen": 45, "phosphorus": 40, "potassium": 50},
        weather_data={"temperature": 24, "humidity": 45, "rain_forecast_mm": 0}
    )
