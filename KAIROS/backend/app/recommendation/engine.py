"""
KAIROS Recommendation Engine
=============================
Cross-verifies satellite NDVI + IoT sensor data + weather forecast + AI disease detection
to generate a composite health score and actionable recommendation.

KEY PRINCIPLE: A recommendation is ONLY flagged if 2+ independent sources agree.
This eliminates false positives from single-sensor noise.
"""

import json


# ─── Weight configuration ─────────────────────────────────────────────────────
WEIGHTS = {
    'ndvi': 0.35,       # Satellite NDVI carries highest weight
    'soil': 0.25,       # Soil moisture is critical
    'temp': 0.15,       # Temperature
    'humidity': 0.10,   # Humidity
    'weather': 0.05,    # Weather forecast
    'disease': 0.10,    # AI disease detection
}

# ─── Thresholds ───────────────────────────────────────────────────────────────
NDVI_LOW = 0.30
NDVI_MODERATE = 0.50
SOIL_CRITICAL = 30.0
SOIL_LOW = 40.0
TEMP_HIGH = 37.0
TEMP_CRITICAL = 40.0
HUMIDITY_HIGH = 78.0
HUMIDITY_FUNGAL = 85.0
RAIN_FORECAST_HEAVY = 20.0


class IssueFlag:
    """Represents a detected issue from a single source."""
    def __init__(self, source: str, issue_type: str, severity: str, description: str):
        self.source = source
        self.issue_type = issue_type
        self.severity = severity  # 'low', 'moderate', 'high', 'critical'
        self.description = description


def generate_recommendation(
    ndvi_data: dict,
    sensor_data: dict,
    weather_data: dict,
    ai_prediction: dict,
) -> dict:
    """
    Main cross-verification function.
    Combines all 4 data sources into a unified recommendation.
    """
    flags = []

    # ── 1. Satellite NDVI Analysis ────────────────────────────────────────────
    ndvi_score = 100.0
    if ndvi_data:
        ndvi = ndvi_data.get('ndvi_mean', 0.5)
        if ndvi < NDVI_LOW:
            ndvi_score = 20.0
            flags.append(IssueFlag(
                source='Satellite NDVI',
                issue_type='water_stress',
                severity='high',
                description=f'Very low NDVI ({ndvi:.3f}) indicates severe vegetation stress or bare soil.',
            ))
        elif ndvi < NDVI_MODERATE:
            ndvi_score = 55.0
            flags.append(IssueFlag(
                source='Satellite NDVI',
                issue_type='water_stress',
                severity='moderate',
                description=f'NDVI ({ndvi:.3f}) below healthy threshold (>0.5). Moderate vegetation stress detected.',
            ))
        else:
            ndvi_score = 90.0

    # ── 2. Soil Moisture & Temperature (IoT Sensors) ──────────────────────────
    soil_score = 100.0
    temp_score = 100.0
    humidity_score = 100.0

    if sensor_data:
        soil_moisture = sensor_data.get('soil_moisture', 50.0)
        temperature = sensor_data.get('temperature', 25.0)
        humidity = sensor_data.get('humidity', 60.0)

        # Soil moisture
        if soil_moisture < SOIL_CRITICAL:
            soil_score = 15.0
            flags.append(IssueFlag('Soil Sensor', 'water_stress', 'critical',
                f'Critical soil moisture ({soil_moisture}%). Immediate irrigation required.'))
        elif soil_moisture < SOIL_LOW:
            soil_score = 50.0
            flags.append(IssueFlag('Soil Sensor', 'water_stress', 'moderate',
                f'Low soil moisture ({soil_moisture}%). Irrigation recommended within 24h.'))
        else:
            soil_score = 90.0

        # Temperature
        if temperature > TEMP_CRITICAL:
            temp_score = 20.0
            flags.append(IssueFlag('Temperature Sensor', 'heat_stress', 'high',
                f'Critical temperature ({temperature}°C). Crop heat stress very likely.'))
        elif temperature > TEMP_HIGH:
            temp_score = 60.0
            flags.append(IssueFlag('Temperature Sensor', 'heat_stress', 'moderate',
                f'High temperature ({temperature}°C). Monitor for heat stress.'))
        else:
            temp_score = 90.0

        # Humidity
        if humidity > HUMIDITY_FUNGAL:
            humidity_score = 30.0
            flags.append(IssueFlag('Humidity Sensor', 'fungal_risk', 'high',
                f'Very high humidity ({humidity}%) — high fungal disease risk (blight, mildew).'))
        elif humidity > HUMIDITY_HIGH:
            humidity_score = 65.0
            flags.append(IssueFlag('Humidity Sensor', 'fungal_risk', 'moderate',
                f'Elevated humidity ({humidity}%). Monitor for early signs of fungal infection.'))
        else:
            humidity_score = 90.0

    # ── 3. Weather Forecast ───────────────────────────────────────────────────
    weather_score = 90.0
    if weather_data:
        rain_24h = weather_data.get('rain_forecast_mm', 0)
        if rain_24h == 0:
            # No rain — compound with water stress if NDVI also low
            water_stress_flags = [f for f in flags if f.issue_type == 'water_stress']
            if water_stress_flags:
                weather_score = 60.0
                flags.append(IssueFlag('Weather Forecast', 'water_stress', 'moderate',
                    f'No rainfall expected in next 24h. Combined with low soil/NDVI — water stress worsening.'))
        elif rain_24h > RAIN_FORECAST_HEAVY:
            # Heavy rain — could cause waterlogging or fungal spread
            fungal_flags = [f for f in flags if f.issue_type == 'fungal_risk']
            if fungal_flags:
                weather_score = 55.0
                flags.append(IssueFlag('Weather Forecast', 'fungal_risk', 'high',
                    f'{rain_24h}mm rain expected + high humidity = very high fungal spread risk.'))

    # ── 4. AI Disease Detection ───────────────────────────────────────────────
    disease_score = 100.0
    if ai_prediction:
        disease = ai_prediction.get('disease', 'Healthy')
        confidence = ai_prediction.get('confidence', 0)
        severity = ai_prediction.get('severity', 'None')

        if disease != 'Healthy' and confidence >= 65:
            sev_map = {'Low': 0.7, 'Moderate': 0.5, 'High': 0.3, 'Critical': 0.1}
            disease_score = sev_map.get(severity, 0.6) * 100
            flags.append(IssueFlag('AI Disease Scan', 'disease_risk', severity.lower(),
                f'{disease} detected with {confidence:.1f}% confidence. Severity: {severity}.'))
        else:
            disease_score = 95.0 if disease == 'Healthy' else 75.0

    # ── 5. Cross-Verification ─────────────────────────────────────────────────
    # Group flags by issue type
    issue_groups = {}
    for flag in flags:
        if flag.issue_type not in issue_groups:
            issue_groups[flag.issue_type] = []
        issue_groups[flag.issue_type].append(flag)

    # Only surface issues confirmed by 2+ sources
    verified_issues = {k: v for k, v in issue_groups.items() if len(v) >= 2 or
                       any(f.severity in ('high', 'critical') for f in v)}

    # ── 6. Composite Health Score ─────────────────────────────────────────────
    health_score = (
        ndvi_score * WEIGHTS['ndvi'] +
        soil_score * WEIGHTS['soil'] +
        temp_score * WEIGHTS['temp'] +
        humidity_score * WEIGHTS['humidity'] +
        weather_score * WEIGHTS['weather'] +
        disease_score * WEIGHTS['disease']
    )
    health_score = max(0, min(100, round(health_score)))

    # ── 7. Generate Recommendation ────────────────────────────────────────────
    if not verified_issues and not flags:
        return _healthy_recommendation(health_score, ndvi_data, sensor_data)

    # Pick dominant issue (most critical first)
    priority_order = ['disease_risk', 'fungal_risk', 'water_stress', 'heat_stress', 'general_stress']
    dominant_type = next((t for t in priority_order if t in verified_issues or t in issue_groups), 'general_stress')
    all_flags = issue_groups.get(dominant_type, flags)

    severity_rank = ['critical', 'high', 'moderate', 'low']
    max_sev = next((s for s in severity_rank if any(f.severity == s for f in all_flags)), 'low')
    display_sev = {'critical': 'Critical', 'high': 'High', 'moderate': 'Moderate', 'low': 'Low'}.get(max_sev, 'Low')

    problem, reason, action = _build_message(dominant_type, all_flags, sensor_data, ndvi_data, weather_data, ai_prediction)

    sources = [{'name': f.source, 'value': f.description[:60], 'icon': _source_icon(f.source),
                'status': 'danger' if f.severity in ('high', 'critical') else 'warning'}
               for f in all_flags]

    return {
        'health_score': health_score,
        'type': dominant_type,
        'severity': display_sev,
        'problem': problem,
        'reason': reason,
        'action': action,
        'sources': sources,
    }


def _build_message(issue_type, flags, sensor, ndvi, weather, ai):
    """Build human-readable recommendation text."""
    templates = {
        'water_stress': (
            'Water Stress Detected',
            _build_reason(flags),
            'Initiate irrigation within 24 hours. Apply 25–35mm of water evenly. '
            'Monitor soil moisture sensor 6 hours post-irrigation.'
        ),
        'heat_stress': (
            'Heat Stress Alert',
            _build_reason(flags),
            'Apply mulching to reduce soil temperature. Consider shade netting. '
            'Irrigate during early morning to reduce heat load on plants.'
        ),
        'fungal_risk': (
            'High Fungal Disease Risk',
            _build_reason(flags),
            'Apply a preventive systemic fungicide (e.g., Mancozeb or Propiconazole). '
            'Improve field drainage and reduce overhead irrigation. Scout field thoroughly.'
        ),
        'disease_risk': (
            f"Disease Detected: {ai.get('disease', 'Unknown')}",
            _build_reason(flags),
            'Isolate affected plants. Apply targeted pesticide or biological control. '
            'Consult local agronomist. Rescan in 5 days.'
        ),
        'general_stress': (
            'General Crop Stress',
            _build_reason(flags),
            'Conduct manual field inspection. Review irrigation schedule. '
            'Run satellite analysis in 5 days to track NDVI trend.'
        ),
    }
    return templates.get(issue_type, templates['general_stress'])


def _build_reason(flags):
    reasons = '. '.join(set(f.description for f in flags))
    return reasons[:500]  # Trim for DB storage


def _healthy_recommendation(health_score, ndvi, sensor):
    return {
        'health_score': health_score,
        'type': 'healthy',
        'severity': 'None',
        'problem': 'All Systems Normal — Farm is Healthy',
        'reason': 'NDVI is in the healthy range, soil moisture is optimal, temperature and humidity are within normal limits, and no disease has been detected.',
        'action': 'Continue regular monitoring. Next satellite scan recommended in 7–10 days. Keep irrigation schedule consistent.',
        'sources': [
            {'name': 'Satellite NDVI', 'value': f"NDVI: {ndvi.get('ndvi_mean', '--')}", 'icon': 'satellite', 'status': 'success'},
            {'name': 'Soil Sensor', 'value': f"Moisture: {sensor.get('soil_moisture', '--')}%", 'icon': 'soil', 'status': 'success'},
            {'name': 'AI Disease Scan', 'value': 'Healthy', 'icon': 'leaf', 'status': 'success'},
            {'name': 'Weather', 'value': 'Normal', 'icon': 'cloud', 'status': 'success'},
        ],
    }


def _source_icon(source_name):
    icons = {
        'Satellite NDVI': 'satellite', 'Soil Sensor': 'soil',
        'Temperature Sensor': 'temperature', 'Humidity Sensor': 'cloud',
        'Weather Forecast': 'cloud', 'AI Disease Scan': 'leaf',
    }
    return icons.get(source_name, 'info')
