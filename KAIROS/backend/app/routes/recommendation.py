import json
import logging
import traceback
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth
from app.database.db import get_db
from app.recommendation_engine.engine import AgronomicDecisionEngine
from app.weather.weather_client import get_weather_for_farm
from app.satellite.ndvi_processor import get_ndvi_for_farm

recommendation_bp = Blueprint('recommendation', __name__, url_prefix='/recommendation')


def _get_latest(db, table, farm_id):
    q = f"SELECT * FROM {table}"
    params = []
    if farm_id:
        q += " WHERE farm_id = ?"
        params.append(farm_id)
    q += " ORDER BY timestamp DESC LIMIT 1"
    row = db.execute(q, params).fetchone()
    return dict(row) if row else {}


def map_source_to_icon(source_name):
    lower_name = source_name.lower()
    if 'soil' in lower_name or 'moisture' in lower_name:
        return 'droplets'
    if 'satellite' in lower_name or 'ndvi' in lower_name:
        return 'satellite'
    if 'temp' in lower_name:
        return 'thermometer'
    if 'weather' in lower_name or 'cloud' in lower_name or 'rain' in lower_name or 'humidity' in lower_name:
        return 'cloud'
    if 'ai' in lower_name or 'leaf' in lower_name:
        return 'leaf'
    return 'brain'


def format_response(rec):
    """Maps the backend engine schema to the KAIROSfrontend React schema."""
    sources = []
    for s in rec.get('supporting_evidence', []):
        sources.append({
            "name": s,
            "value": "Cross-verified",
            "icon": map_source_to_icon(s)
        })
    return {
        "farm_id": rec.get('farm_id'),
        "health_score": rec.get('health_score', 0),
        "severity": rec.get('severity', 'None'),
        "problem": rec.get('primary_issue', 'All systems normal'),
        "reason": rec.get('diagnostic_summary', 'No summary available.'),
        "action": " ".join(rec.get('recommended_actions', [])) if isinstance(rec.get('recommended_actions'), list) else str(rec.get('recommended_actions', '')),
        "sources": sources,
        "history": []
    }


@recommendation_bp.route('', methods=['GET'])
@require_auth
def get_recommendation():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        # Get all latest data
        sensor_data = _get_latest(db, 'sensor_data', farm_id)
        satellite_data = _get_latest(db, 'satellite_data', farm_id)
        ai_prediction = _get_latest(db, 'predictions', farm_id)

        # Fetch live weather
        farm = {}
        if farm_id:
            row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
            if row:
                farm = dict(row)
        weather_data = get_weather_for_farm(farm)

        # If no satellite data cached, fetch live
        if not satellite_data and farm:
            satellite_data = get_ndvi_for_farm(farm)

        # Run recommendation engine
        rec = AgronomicDecisionEngine.generate(ai_prediction, satellite_data, sensor_data, weather_data)
        rec['farm_id'] = farm_id

        # Persist recommendation
        db.execute(
            """INSERT INTO recommendations
               (farm_id, health_score, overall_status, severity, confidence, primary_issue, secondary_issue, diagnostic_summary, assessments_json, supporting_evidence, recommended_actions, follow_up)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (farm_id, rec.get('health_score'), rec.get('overall_status'), rec.get('severity'), rec.get('confidence'),
             rec.get('primary_issue'), rec.get('secondary_issue'), rec.get('diagnostic_summary'),
             json.dumps(rec.get('assessments', {})), json.dumps(rec.get('supporting_evidence', [])),
             json.dumps(rec.get('recommended_actions', [])), rec.get('follow_up'))
        )
        # Update farm health score
        if farm_id:
            db.execute("UPDATE farms SET health_score = ? WHERE id = ?",
                       (rec.get('health_score'), farm_id))
        db.commit()

        response_data = format_response(rec)
        return jsonify(response_data), 200

    except Exception as e:
        db.rollback()
        logging.error(f"Error generating recommendation: {str(e)}")
        logging.error(traceback.format_exc())
        
        # Return Safe Defaults with 200 so UI gracefully degrades instead of throwing blank text
        fallback = {
            "farm_id": farm_id,
            "health_score": 0,
            "severity": "Unknown",
            "problem": "System Error",
            "reason": "Recommendation could not be generated.",
            "action": "Please inspect system logs.",
            "sources": [],
            "history": []
        }
        return jsonify(fallback), 200
    finally:
        db.close()


@recommendation_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        query = "SELECT * FROM recommendations"
        params = []
        if farm_id:
            query += " WHERE farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY timestamp DESC LIMIT 30"
        rows = db.execute(query, params).fetchall()
        
        results = []
        for r in rows:
            d = dict(r)
            try:
                supporting_evidence = json.loads(d.get('supporting_evidence') or '[]')
                recommended_actions = json.loads(d.get('recommended_actions') or '[]')
            except Exception:
                supporting_evidence = []
                recommended_actions = []
            
            # Use format_response mapped schema
            rec_format = {
                "health_score": d.get('health_score'),
                "severity": d.get('severity'),
                "primary_issue": d.get('primary_issue'),
                "diagnostic_summary": d.get('diagnostic_summary'),
                "recommended_actions": recommended_actions,
                "supporting_evidence": supporting_evidence,
                "timestamp": d.get('timestamp')
            }
            mapped = format_response(rec_format)
            mapped['timestamp'] = d.get('timestamp')
            results.append(mapped)
            
        return jsonify(results), 200
    except Exception as e:
        logging.error(f"Error fetching history: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify([]), 200
    finally:
        db.close()
