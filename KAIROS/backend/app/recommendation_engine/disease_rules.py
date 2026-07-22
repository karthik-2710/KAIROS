def evaluate(ai_data, env_data):
    flags = []
    if not ai_data:
        return flags
        
    disease = ai_data.get('disease', 'Healthy')
    confidence = ai_data.get('confidence', 0)
    
    if disease != 'Healthy':
        flag = {
            'issue': disease,
            'severity': 'High' if confidence > 80 else 'Moderate',
            'evidence': ['AI Leaf Scan'],
            'ai_confidence': confidence,
            'diagnostic': f"Leaf disease ({disease}) detected by AI with {confidence:.1f}% confidence.",
            'actions': ["Inspect affected and nearby plants", "Consider targeted pesticide/fungicide application"],
        }
        
        # Environmental compounding factors
        humidity = env_data.get('humidity', 0)
        rain = env_data.get('rain_detected', False)
        
        if humidity > 85 or rain:
            flag['severity'] = 'Critical'
            flag['evidence'].append('Humidity' if humidity > 85 else 'Rain Sensor')
            flag['diagnostic'] += " High humidity and moisture significantly increase the risk of rapid disease progression."
            flag['actions'].append("Immediate fungicide application recommended due to favorable spread conditions.")
            
        flags.append(flag)
    return flags
