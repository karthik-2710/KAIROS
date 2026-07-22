from typing import Dict, Any

class CrossValidatorService:
    @staticmethod
    def cross_validate(ai_data: Dict[str, Any], ndvi_data: Dict[str, Any], 
                       iot_data: Dict[str, Any], weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cross validates all data sources to produce a unified Diagnosis.
        """
        diagnosis = {
            "primary_issue": "None",
            "secondary_issue": "None",
            "severity": "Low",
            "confidence": 0,
            "diagnostic_summary": "Farm appears healthy.",
            "stress_factors": []
        }
        
        issues = []
        stress_factors = []
        severity_levels = {"Low": 1, "Moderate": 2, "High": 3, "Critical": 4}
        max_severity = 1
        
        # 1. Evaluate Leaf AI
        if ai_data and ai_data.get('disease') and ai_data['disease'].lower() != 'healthy':
            issues.append(ai_data['disease'])
            severity_str = ai_data.get('severity', 'Moderate')
            max_severity = max(max_severity, severity_levels.get(severity_str, 2))
            
        # 2. Evaluate NDVI
        if ndvi_data and ndvi_data.get('ndvi_mean') is not None:
            ndvi = ndvi_data['ndvi_mean']
            if ndvi < 0.3:
                issues.append("Severe Vegetation Stress")
                max_severity = max(max_severity, 4)
                stress_factors.append("Low NDVI")
            elif ndvi < 0.5:
                stress_factors.append("Moderate Vegetation Stress")
                max_severity = max(max_severity, 2)
                
        # 3. Evaluate IoT
        if iot_data:
            if iot_data.get('soil_moisture', 50) < 30:
                stress_factors.append("Drought Stress (Low Soil Moisture)")
                max_severity = max(max_severity, 3)
            if iot_data.get('temperature', 25) > 35:
                stress_factors.append("Heat Stress")
            if iot_data.get('humidity', 60) > 85:
                stress_factors.append("High Humidity (Fungal Risk)")
                
        # 4. Synthesize Diagnosis
        if issues:
            diagnosis['primary_issue'] = issues[0]
            if len(issues) > 1:
                diagnosis['secondary_issue'] = issues[1]
                
        if stress_factors:
            if diagnosis['primary_issue'] == "None":
                diagnosis['primary_issue'] = stress_factors[0]
            elif diagnosis['secondary_issue'] == "None":
                diagnosis['secondary_issue'] = stress_factors[0]
                
        # Determine string severity
        inv_severity = {v: k for k, v in severity_levels.items()}
        diagnosis['severity'] = inv_severity.get(max_severity, "Low")
        
        # Build summary
        if diagnosis['primary_issue'] != "None":
            summary = f"Detected {diagnosis['primary_issue']}."
            if stress_factors:
                summary += f" Complicated by {', '.join(stress_factors)}."
            diagnosis['diagnostic_summary'] = summary
        else:
            if stress_factors:
                diagnosis['diagnostic_summary'] = f"Monitoring required for {', '.join(stress_factors)}."
            else:
                diagnosis['diagnostic_summary'] = "Farm parameters are within optimal ranges."
                
        diagnosis['stress_factors'] = stress_factors
        
        # Calculate cross-validated confidence
        # Base confidence from AI, modified by supporting factors
        base_conf = ai_data.get('confidence', 70) if ai_data and ai_data.get('disease') != 'healthy' else 85
        if "High Humidity (Fungal Risk)" in stress_factors and "blight" in diagnosis['primary_issue'].lower():
            base_conf = min(99, base_conf + 10) # Environmental factors support the AI
            
        diagnosis['confidence'] = int(base_conf)
        
        return diagnosis
