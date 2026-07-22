def evaluate(ndvi_data, env_data):
    flags = []
    if not ndvi_data:
        return flags
        
    ndvi = ndvi_data.get('ndvi_mean', 1.0)
    
    if ndvi < 0.3:
        flag = {
            'issue': 'Severe Vegetation Stress',
            'severity': 'High',
            'evidence': ['Satellite NDVI'],
            'diagnostic': f"Satellite NDVI ({ndvi:.2f}) indicates severe vegetation stress or bare soil.",
            'actions': ["Conduct immediate field inspection", "Review irrigation and fertilization logs"]
        }
        
        soil_moisture = env_data.get('soil_moisture')
        if soil_moisture is not None and soil_moisture < 25:
            flag['issue'] = 'Critical Water Stress'
            flag['severity'] = 'Critical'
            flag['evidence'].append('Soil Moisture')
            flag['diagnostic'] += f" Low soil moisture ({soil_moisture}%) confirms severe drought stress."
            flag['actions'].insert(0, "Apply immediate heavy irrigation")
            
        flags.append(flag)
    elif ndvi < 0.5:
        flag = {
            'issue': 'Moderate Vegetation Stress',
            'severity': 'Moderate',
            'evidence': ['Satellite NDVI'],
            'diagnostic': f"Satellite NDVI ({ndvi:.2f}) is below optimal levels.",
            'actions': ["Monitor crop health", "Check for localized pest or water issues"]
        }
        flags.append(flag)
        
    return flags
