# Weighted decision engine configuration
DEFAULT_WEIGHTS = {
    'ai_confidence': 0.40,
    'satellite_ndvi': 0.25,
    'soil_moisture': 0.15,
    'humidity': 0.10,
    'temperature': 0.05,
    'rain': 0.05
}

def calculate_health_score(ai_data, ndvi_data, sensor_data, weather_data, cross_verified_issue):
    """
    Calculates a normalized 0-100 health score based on weighted inputs.
    """
    score = 100.0
    
    # Base deductions based on cross-verified issue severity
    if cross_verified_issue:
        sev_map = {'Critical': 60, 'High': 40, 'Moderate': 20, 'Low': 10, 'None': 0}
        score -= sev_map.get(cross_verified_issue.get('severity', 'None'), 0)
        
    # Example granular deductions (can be expanded)
    if ndvi_data:
        ndvi = ndvi_data.get('ndvi_mean', 1.0)
        if ndvi < 0.3:
            score -= (100 * DEFAULT_WEIGHTS['satellite_ndvi'])
        elif ndvi < 0.5:
            score -= (50 * DEFAULT_WEIGHTS['satellite_ndvi'])
            
    if sensor_data:
        soil = sensor_data.get('soil_moisture', 50)
        if soil < 30:
            score -= (100 * DEFAULT_WEIGHTS['soil_moisture'])
        elif soil < 40:
            score -= (50 * DEFAULT_WEIGHTS['soil_moisture'])
            
    if ai_data and ai_data.get('disease', 'Healthy') != 'Healthy':
        conf = ai_data.get('confidence', 0)
        score -= (conf * DEFAULT_WEIGHTS['ai_confidence'])
        
    return max(0, min(100, int(score)))
