from .rule_engine import evaluate_all
from .recommendation_builder import build_recommendation

class AgronomicDecisionEngine:
    @staticmethod
    def generate(ai_data, ndvi_data, sensor_data, weather_data):
        """
        Main entry point for generating agronomic recommendations.
        """
        # 1. Evaluate rules across all data sources
        flags = evaluate_all(ai_data, ndvi_data, sensor_data, weather_data)
        
        # 2. Build final structured JSON response
        recommendation = build_recommendation(flags, ai_data, ndvi_data, sensor_data, weather_data)
        
        return recommendation
        
def generate_recommendation(satellite_data, sensor_data, weather_data, ai_prediction):
    """
    Backwards-compatible wrapper.
    """
    return AgronomicDecisionEngine.generate(ai_prediction, satellite_data, sensor_data, weather_data)
