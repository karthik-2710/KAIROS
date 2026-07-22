from app.database.db import get_db
from .state import state
from .telemetry import update_telemetry

def get_demo_farm_id():
    """Helper to fetch a farm ID for inserting simulated data. In a real app, pass the actual ID."""
    conn = get_db()
    cur = conn.cursor()
    # Find the demo farm or just any farm
    row = cur.execute("SELECT id FROM farms LIMIT 1").fetchone()
    conn.close()
    if row:
        return row['id']
    return None

def simulation_tick():
    """
    Called every N seconds. Updates telemetry and persists to DB.
    """
    current = state.get_values()
    target = state.get_target_values()
    scenario_name = state.get_scenario_name()
    
    # Calculate physics
    new_values = update_telemetry(current, target)
    state.update_values(new_values)
    
    # Persist to DB
    farm_id = get_demo_farm_id()
    if farm_id is not None:
        conn = get_db()
        cur = conn.cursor()
        # 1. Persist IoT Sensor Data
        cur.execute(
            """INSERT INTO sensor_data 
               (farm_id, temperature, humidity, soil_moisture, light, mq135, scenario, ndvi, rain_detected)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                farm_id,
                new_values['temperature'],
                new_values['humidity'],
                new_values['soil_moisture'],
                new_values['light'],
                new_values['mq135'],
                scenario_name,
                new_values['ndvi'],
                1 if new_values['rain'] else 0
            )
        )
        sensor_data_id = cur.lastrowid
        
        # 1.5 Calculate and Persist Environmental Analysis
        from app.services.env_intelligence import analyze_environment
        env_analysis = analyze_environment(new_values)
        if env_analysis:
            cur.execute(
                """INSERT INTO environmental_analysis 
                   (sensor_data_id, health_index, temp_class, hum_class, moisture_class, light_class, air_quality_class)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (sensor_data_id, env_analysis['health_index'], env_analysis['temp_class'], env_analysis['hum_class'], env_analysis['moisture_class'], env_analysis['light_class'], env_analysis['air_quality_class'])
            )
        
        # 2. Persist Simulated Satellite Data (NDVI)
        # To prevent DB bloat every 3s, we update the latest record or insert if none exists
        cur.execute("SELECT id FROM satellite_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1", (farm_id,))
        sat_row = cur.fetchone()
        if sat_row:
            cur.execute("""UPDATE satellite_data 
                           SET ndvi_mean = ?, timestamp = datetime('now') 
                           WHERE id = ?""", 
                        (new_values['ndvi'], sat_row['id']))
        else:
            cur.execute("""INSERT INTO satellite_data 
                           (farm_id, ndvi_mean, healthy_pct, moderate_pct, stress_pct, cloud_coverage) 
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (farm_id, new_values['ndvi'], 50.0, 30.0, 20.0, 10.0))

        # 3. Persist Simulated AI Leaf Scan
        cur.execute("SELECT id FROM leaf_scans WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1", (farm_id,))
        scan_row = cur.fetchone()
        if not scan_row:
            cur.execute("INSERT INTO leaf_scans (farm_id, user_id) VALUES (?, 1)", (farm_id,))
            scan_id = cur.lastrowid
            cur.execute("""INSERT INTO disease_predictions 
                           (scan_id, disease, confidence, severity, healthy) 
                           VALUES (?, ?, ?, ?, ?)""",
                        (scan_id, new_values['ai_prediction'], new_values['ai_confidence'], new_values['risk'], 1 if new_values['ai_prediction'] == 'Healthy' else 0))
        else:
            scan_id = scan_row['id']
            cur.execute("UPDATE leaf_scans SET timestamp = datetime('now') WHERE id = ?", (scan_id,))
            cur.execute("""UPDATE disease_predictions 
                           SET disease = ?, confidence = ?, severity = ?, healthy = ? 
                           WHERE scan_id = ?""",
                        (new_values['ai_prediction'], new_values['ai_confidence'], new_values['risk'], 1 if new_values['ai_prediction'] == 'Healthy' else 0, scan_id))

        conn.commit()
        conn.close()
