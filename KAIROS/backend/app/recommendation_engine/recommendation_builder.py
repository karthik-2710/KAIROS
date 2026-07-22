from .severity import calculate_severity, get_status_from_severity
from .confidence import calculate_confidence
from .scoring import calculate_health_score

def build_recommendation(flags, ai_data, ndvi_data, sensor_data, weather_data):
    if not flags:
        # Fallback if somehow flags is empty, though rule_engine guarantees at least 'Healthy Crop'
        flags = [{'issue': 'Healthy Crop', 'severity': 'None', 'evidence': [], 'diagnostic': 'All systems normal.', 'actions': []}]

    primary = flags[0]
    secondary = flags[1] if len(flags) > 1 else None
    
    overall_severity = calculate_severity(flags)
    overall_confidence = calculate_confidence(flags)
    
    # Calculate health score using weighted system
    health_score = calculate_health_score(ai_data, ndvi_data, sensor_data, weather_data, primary)
    
    # Collect all unique evidence
    evidence_set = set()
    for f in flags:
        evidence_set.update(f.get('evidence', []))
    if not evidence_set:
        evidence_set = {"System Data"}
        
    # Collect actions
    actions = []
    for f in flags:
        for act in f.get('actions', []):
            if act not in actions:
                actions.append(act)
                
    # Build assessments - summarize specifically for each domain based on available raw data
    disease_text = "No disease detected."
    if ai_data and ai_data.get('disease', 'Healthy') != 'Healthy':
        disease_text = f"AI detected {ai_data['disease']} with {ai_data.get('confidence', 0):.1f}% confidence."
        
    veg_text = "Vegetation health is stable."
    if ndvi_data:
        ndvi = ndvi_data.get('ndvi_mean', 1.0)
        if ndvi < 0.35:
            veg_text = f"NDVI reading of {ndvi:.2f} indicates severe vegetation stress."
        elif ndvi < 0.5:
            veg_text = f"NDVI reading of {ndvi:.2f} indicates sub-optimal vegetation health."
            
    env_text = "Environmental conditions are optimal."
    if sensor_data:
        from app.services.env_intelligence import analyze_environment
        env_analysis = analyze_environment(sensor_data)
        if env_analysis and env_analysis.get('insights'):
            env_text = "Environmental sensors indicate: " + " ".join(env_analysis['insights'])
        else:
            env_text = "Environmental conditions are stable."

    summary = primary['diagnostic']
    if secondary:
        summary += f" Additionally, {secondary['diagnostic'].lower()}"

    follow_up = "Monitor closely for the next 48 hours and re-evaluate."
    if 'Water Stress' in primary['issue']:
        follow_up = "Check NDVI and soil moisture in 3-5 days."
    elif 'Disease' in primary['issue']:
        follow_up = "Repeat AI leaf scan after 72 hours."
        
    return {
        "health_score": health_score,
        "overall_status": get_status_from_severity(overall_severity),
        "severity": overall_severity,
        "confidence": overall_confidence,
        "primary_issue": primary['issue'],
        "secondary_issue": secondary['issue'] if secondary else None,
        "assessments": {
            "disease": disease_text,
            "vegetation": veg_text,
            "environmental": env_text
        },
        "supporting_evidence": list(evidence_set),
        "diagnostic_summary": summary,
        "recommended_actions": actions[:5], # Keep top 5 actions
        "follow_up": follow_up
    }
