from flask import Blueprint, request, jsonify
import json
from app.database.db import get_db
from app.utils.auth import require_auth
from services.sentinel_service import SentinelHubService
from services.statistical_service import StatisticalService
from datetime import datetime, timedelta

farm_bp = Blueprint('farm', __name__, url_prefix='/farms')


def _row_to_dict(row):
    d = dict(row)
    return d


@farm_bp.route('', methods=['GET'])
@require_auth
def get_farms():
    db = get_db()
    try:
        farms = db.execute(
            "SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC",
            (request.user_id,)
        ).fetchall()
        return jsonify([_row_to_dict(f) for f in farms]), 200
    finally:
        db.close()


@farm_bp.route('/<int:farm_id>', methods=['GET'])
@require_auth
def get_farm(farm_id):
    db = get_db()
    try:
        farm = db.execute(
            "SELECT * FROM farms WHERE id = ? AND user_id = ?",
            (farm_id, request.user_id)
        ).fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404
        return jsonify(_row_to_dict(farm)), 200
    finally:
        db.close()


@farm_bp.route('', methods=['POST'])
@require_auth
def create_farm():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    crop_type = data.get('crop_type', '').strip()
    area_ha = data.get('area_ha', 0)
    polygon = data.get('polygon')
    if isinstance(polygon, (dict, list)):
        polygon = json.dumps(polygon)

    if not name or not crop_type:
        return jsonify({'error': 'Farm name and crop type are required'}), 400

    db = get_db()
    try:
        cursor = db.execute(
            """INSERT INTO farms (user_id, name, crop_type, area_ha, polygon, health_score)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (request.user_id, name, crop_type, area_ha, polygon, 50)
        )
        db.commit()
        farm = db.execute("SELECT * FROM farms WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return jsonify(_row_to_dict(farm)), 201
    finally:
        db.close()


@farm_bp.route('/<int:farm_id>', methods=['PUT'])
@require_auth
def update_farm(farm_id):
    data = request.get_json()
    db = get_db()
    try:
        farm = db.execute(
            "SELECT id FROM farms WHERE id = ? AND user_id = ?",
            (farm_id, request.user_id)
        ).fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404

        updates = {k: v for k, v in data.items() if k in ('name', 'crop_type', 'area_ha', 'polygon')}
        if not updates:
            return jsonify({'error': 'No valid fields to update'}), 400

        set_clause = ', '.join(f"{k} = ?" for k in updates)
        db.execute(
            f"UPDATE farms SET {set_clause} WHERE id = ?",
            list(updates.values()) + [farm_id]
        )
        db.commit()
        updated = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
        return jsonify(_row_to_dict(updated)), 200
    finally:
        db.close()


@farm_bp.route('/<int:farm_id>', methods=['DELETE'])
@require_auth
def delete_farm(farm_id):
    db = get_db()
    try:
        farm = db.execute(
            "SELECT id FROM farms WHERE id = ? AND user_id = ?",
            (farm_id, request.user_id)
        ).fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404
        db.execute("DELETE FROM farms WHERE id = ?", (farm_id,))
        db.commit()
        return jsonify({'message': 'Farm deleted successfully'}), 200
    finally:
        db.close()


@farm_bp.route('/<int:farm_id>/calculate-ndvi', methods=['POST'])
@require_auth
def calculate_ndvi(farm_id):
    from app.satellite.ndvi_processor import get_ndvi_for_farm
    db = get_db()
    try:
        farm = db.execute(
            "SELECT * FROM farms WHERE id = ? AND user_id = ?",
            (farm_id, request.user_id)
        ).fetchone()
        
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404
            
        farm_dict = _row_to_dict(farm)
        
        try:
            stats = get_ndvi_for_farm(farm_dict)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
            
        # Save to satellite_data table
        cursor = db.execute(
            """INSERT INTO satellite_data
               (farm_id, ndvi_mean, ndvi_min, ndvi_max, healthy_pct, moderate_pct, stress_pct, cloud_coverage)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (farm_id, stats.get('ndvi_mean'), stats.get('ndvi_min'), stats.get('ndvi_max'),
             stats.get('healthy_pct'), stats.get('moderate_pct'), stats.get('stress_pct'), stats.get('cloud_coverage'))
        )
        sat_id = cursor.lastrowid
        
        # Link this new satellite data to the latest analysis_history for this farm
        latest_analysis = db.execute(
            "SELECT id FROM analysis_history WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1",
            (farm_id,)
        ).fetchone()
        
        if latest_analysis:
            db.execute(
                "UPDATE analysis_history SET satellite_data_id = ? WHERE id = ?",
                (sat_id, latest_analysis['id'])
            )
        else:
            db.execute(
                "INSERT INTO analysis_history (farm_id, satellite_data_id, farm_health_score) VALUES (?, ?, 50)",
                (farm_id, sat_id)
            )
        
        db.commit()
        
        return jsonify(stats), 200
    finally:
        db.close()

