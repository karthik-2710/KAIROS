def evaluate(sensor_data):
    flags = []
    if not sensor_data:
        return flags
        
    soil = sensor_data.get('soil_moisture')
    temp = sensor_data.get('temperature')
    hum = sensor_data.get('humidity')
    
    if soil is not None and soil < 30:
        flags.append({
            'issue': 'Low Soil Moisture',
            'severity': 'Moderate',
            'evidence': ['Soil Moisture'],
            'diagnostic': f"Soil moisture is low ({soil}%).",
            'actions': ["Schedule irrigation within 24 hours"]
        })
        
    if temp is not None and temp > 35:
        flags.append({
            'issue': 'Heat Stress Risk',
            'severity': 'Moderate',
            'evidence': ['Temperature'],
            'diagnostic': f"High temperatures ({temp}°C) may cause heat stress.",
            'actions': ["Ensure adequate soil moisture to help plants cope with heat"]
        })
        
    return flags
