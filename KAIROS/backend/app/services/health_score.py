from typing import Dict, Any

class HealthScoreService:
    @staticmethod
    def calculate_health_score(analysis_data: Dict[str, Any]) -> int:
        """
        Calculates an intelligent composite Farm Health Score.
        Weights:
        - 35% Satellite NDVI
        - 30% Leaf AI Confidence (if available)
        - 20% IoT
        - 15% Weather
        
        If Leaf AI is missing, its weight is distributed proportionally.
        """
        
        scores = {}
        weights = {}
        
        # 1. Satellite NDVI Score (0-100)
        # NDVI ranges roughly from 0 to 1. 0.8 is great, <0.3 is bad.
        sat_data = analysis_data.get('satellite')
        if sat_data and sat_data.get('ndvi_mean') is not None:
            ndvi = sat_data['ndvi_mean']
            # Map NDVI 0.2-0.8 to 0-100 score
            sat_score = max(0, min(100, (ndvi - 0.2) / 0.6 * 100))
            scores['sat'] = sat_score
            weights['sat'] = 0.35
            
        # 2. Leaf AI Score (0-100)
        ai_data = analysis_data.get('leaf_ai')
        if ai_data and ai_data.get('disease'):
            if ai_data['disease'].lower() == 'healthy':
                scores['ai'] = 100.0
            else:
                # If diseased, higher confidence means lower health score
                conf = ai_data.get('confidence', 80.0)
                scores['ai'] = max(0.0, 100.0 - conf)
            weights['ai'] = 0.30

        # 3. IoT Score (0-100)
        # We look at temp (ideal 20-30), humidity (ideal 50-70), soil moisture (ideal 40-60)
        iot_data = analysis_data.get('iot')
        if iot_data:
            temp = iot_data.get('temperature', 25.0)
            hum = iot_data.get('humidity', 60.0)
            soil = iot_data.get('soil_moisture', 50.0)
            
            temp_score = 100 - abs(temp - 25.0) * 5
            hum_score = 100 - abs(hum - 60.0) * 2
            soil_score = 100 - abs(soil - 50.0) * 2
            
            iot_score = max(0, min(100, (temp_score + hum_score + soil_score) / 3))
            scores['iot'] = iot_score
            weights['iot'] = 0.20
            
        # 4. Weather Score (0-100)
        # simplified mapping based on extreme weather alerts or just baseline 80
        weather_data = analysis_data.get('weather')
        if weather_data:
            # If weather is too extreme, lower score
            temp = weather_data.get('temperature', 25.0)
            wind = weather_data.get('wind_speed', 0.0)
            
            weather_score = 100.0
            if temp > 35 or temp < 5:
                weather_score -= 30
            if wind > 20:
                weather_score -= 20
                
            scores['weather'] = max(0, weather_score)
            weights['weather'] = 0.15

        # Calculate weighted sum
        total_weight = sum(weights.values())
        if total_weight == 0:
            return 50 # Default middle score if no data
            
        final_score = sum(scores[k] * (weights[k] / total_weight) for k in scores.keys())
        
        return int(round(final_score))
