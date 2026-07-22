from datetime import datetime, timedelta

def predict_irrigation(db, farm_id):
    """
    Analyzes recent telemetry to predict when the next irrigation is required.
    """
    rows = db.execute(
        "SELECT soil_moisture, temperature, timestamp FROM sensor_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 6",
        (farm_id,)
    ).fetchall()

    if not rows or len(rows) < 2:
        return {
            "prediction": "Insufficient data to project irrigation.",
            "status": "Unknown",
            "hours_until_dry": None,
            "projected_moisture": None,
            "recommended_liters": 0,
            "trend_analysis": "Gathering data..."
        }

    # Sort chronological
    rows = list(reversed(rows))
    
    data = [(datetime.fromisoformat(r['timestamp']), r['soil_moisture'], r['temperature']) for r in rows]
    
    dt = (data[-1][0] - data[0][0]).total_seconds() / 3600.0
    if dt <= 0:
        dt = 1.0 # fallback

    d_moisture = data[-1][1] - data[0][1]
    depletion_rate_per_hour = d_moisture / dt
    
    current_moisture = data[-1][1]
    avg_temp = sum([r[2] for r in data]) / len(data)
    critical_threshold = 30.0

    farm = db.execute("SELECT area_ha FROM farms WHERE id = ?", (farm_id,)).fetchone()
    area_ha = farm['area_ha'] if farm else 1.0
    
    # 10% increase in moisture across 1 ha approx 10,000 liters
    recommended_liters = int(area_ha * 1500)

    if current_moisture < critical_threshold:
        return {
            "prediction": "Immediate irrigation required.",
            "status": "Critical",
            "hours_until_dry": 0,
            "projected_moisture": current_moisture,
            "recommended_liters": recommended_liters,
            "trend_analysis": "Soil moisture is critically low. High stress detected."
        }

    if depletion_rate_per_hour >= 0:
        return {
            "prediction": "No immediate irrigation needed.",
            "status": "Optimal",
            "hours_until_dry": None,
            "projected_moisture": current_moisture,
            "recommended_liters": 0,
            "trend_analysis": "Soil moisture is stable or increasing."
        }

    hours_until_dry = (current_moisture - critical_threshold) / abs(depletion_rate_per_hour)
    
    # Analyze evaporation factors
    evap_factor = "High temperature increasing evaporation." if avg_temp > 30 else "Moderate evaporation."
    
    if hours_until_dry < 8:
        proj = max(0, current_moisture + depletion_rate_per_hour * hours_until_dry)
        return {
            "prediction": f"Estimated irrigation required within {round(hours_until_dry)} hours.",
            "status": "Warning",
            "hours_until_dry": round(hours_until_dry, 1),
            "projected_moisture": round(current_moisture + depletion_rate_per_hour * min(6, hours_until_dry), 1),
            "recommended_liters": recommended_liters,
            "trend_analysis": f"Soil moisture decreasing steadily. {evap_factor}"
        }
    else:
        return {
            "prediction": "Moisture levels adequate for today.",
            "status": "Good",
            "hours_until_dry": round(hours_until_dry, 1),
            "projected_moisture": round(current_moisture + depletion_rate_per_hour * 12, 1),
            "recommended_liters": 0,
            "trend_analysis": f"Soil moisture is depleting slowly. {evap_factor}"
        }
