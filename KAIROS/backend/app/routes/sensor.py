from flask import Blueprint, request, jsonify
from app.database.db import get_db
from app.utils.auth import require_auth
from datetime import datetime

sensor_bp = Blueprint('sensor', __name__, url_prefix='/sensor')


@sensor_bp.route('', methods=['POST'])
def receive_sensor_data():
    """
    Receives data from ESP32 hardware.
    No auth required — called by ESP32 firmware directly.
    Uses an API key approach for hardware auth.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    farm_id = data.get('farm_id')
    temperature = data.get('temperature')
    humidity = data.get('humidity')
    soil_moisture = data.get('soil_moisture')
    light = data.get('light', 0)
    mq135 = data.get('mq135', 0)
    rain_detected = int(bool(data.get('rain_detected', False)))

    from app.services.env_intelligence import analyze_environment
    env_analysis = analyze_environment(data)

    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute(
            """INSERT INTO sensor_data (farm_id, temperature, humidity, soil_moisture, light, mq135, rain_detected)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (farm_id, temperature, humidity, soil_moisture, light, mq135, rain_detected)
        )
        sensor_data_id = cursor.lastrowid
        
        if env_analysis:
            cursor.execute(
                """INSERT INTO environmental_analysis (sensor_data_id, health_index, temp_class, hum_class, moisture_class, light_class, air_quality_class)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (sensor_data_id, env_analysis['health_index'], env_analysis['temp_class'], env_analysis['hum_class'], env_analysis['moisture_class'], env_analysis['light_class'], env_analysis['air_quality_class'])
            )
            
        db.commit()
        return jsonify({'status': 'ok', 'message': 'Sensor data received'}), 201
    finally:
        db.close()


@sensor_bp.route('/latest', methods=['GET'])
@require_auth
def get_latest():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        query = """
            SELECT s.*, e.health_index, e.temp_class, e.hum_class, e.moisture_class, e.light_class, e.air_quality_class
            FROM sensor_data s
            LEFT JOIN environmental_analysis e ON s.id = e.sensor_data_id
        """
        params = []
        if farm_id:
            query += " WHERE s.farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY s.timestamp DESC LIMIT 1"
        row = db.execute(query, params).fetchone()
        if not row:
            return jsonify({'error': 'No sensor data available'}), 404
            
        result = dict(row)
        # Generate insights dynamically to save space in DB
        from app.services.env_intelligence import generate_insights
        result['insights'] = generate_insights(
            result.get('temp_class'), result.get('hum_class'), 
            result.get('moisture_class'), result.get('light_class'), result.get('air_quality_class')
        )
        return jsonify(result), 200
    finally:
        db.close()


@sensor_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    farm_id = request.args.get('farm_id', type=int)
    days = request.args.get('days', 7, type=int)

    db = get_db()
    try:
        query = """
            SELECT s.*, e.health_index, e.temp_class, e.hum_class, e.moisture_class, e.light_class, e.air_quality_class
            FROM sensor_data s
            LEFT JOIN environmental_analysis e ON s.id = e.sensor_data_id
            WHERE s.timestamp >= datetime('now', ?)
        """
        params = [f'-{days} days']
        if farm_id:
            query += " AND s.farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY s.timestamp ASC"
        rows = db.execute(query, params).fetchall()
        return jsonify([dict(r) for r in rows]), 200
    finally:
        db.close()
