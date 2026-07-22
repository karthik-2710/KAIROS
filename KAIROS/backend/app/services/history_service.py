import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class HistoryService:
    @staticmethod
    def save_analysis(db, farm_id: int, analysis_data: Dict[str, Any], health_score: int):
        iot_data = analysis_data.get('iot', {})
        sat_data = analysis_data.get('satellite', {})
        ai_data = analysis_data.get('leaf_ai', {})
        rec_data = analysis_data.get('recommendation', {})
        
        latest_history = db.execute(
            "SELECT * FROM analysis_history WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1",
            (farm_id,)
        ).fetchone()
        
        if latest_history:
            last_time_str = latest_history['timestamp']
            try:
                last_time = datetime.fromisoformat(last_time_str.replace('Z', '+00:00')) if 'T' in last_time_str else datetime.strptime(last_time_str, '%Y-%m-%d %H:%M:%S')
                if (datetime.utcnow() - last_time).total_seconds() < 30:
                    return latest_history['id']
            except:
                pass

        iot_id = None
        if iot_data:
            db.execute(
                """INSERT INTO sensor_data 
                   (farm_id, temperature, humidity, soil_moisture, light, mq135, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))""",
                (farm_id, iot_data.get('temperature'), iot_data.get('humidity'),
                 iot_data.get('soil_moisture'), iot_data.get('light'), iot_data.get('mq135', 0))
            )
            iot_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        sat_id = None
        if sat_data:
            if 'id' in sat_data and sat_data['id']:
                sat_id = sat_data['id']
            else:
                db.execute(
                    """INSERT INTO satellite_data 
                       (farm_id, ndvi_mean, ndvi_min, ndvi_max, healthy_pct, moderate_pct, stress_pct, band_b4, band_b8, cloud_coverage)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (farm_id, sat_data.get('ndvi_mean'), sat_data.get('ndvi_min'), sat_data.get('ndvi_max'),
                     sat_data.get('healthy_pct'), sat_data.get('moderate_pct'), sat_data.get('stress_pct'),
                     sat_data.get('band_b4'), sat_data.get('band_b8'), sat_data.get('cloud_coverage'))
                )
                sat_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        rec_id = None
        if rec_data:
            db.execute(
                """INSERT INTO recommendations
                   (farm_id, health_score, overall_status, severity, confidence, primary_issue, secondary_issue, diagnostic_summary, assessments_json, supporting_evidence, recommended_actions, follow_up)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (farm_id, health_score, rec_data.get('overall_status'), rec_data.get('severity'), rec_data.get('confidence'),
                 rec_data.get('primary_issue'), rec_data.get('secondary_issue'), rec_data.get('diagnostic_summary'),
                 json.dumps(rec_data.get('assessments', {})), json.dumps(rec_data.get('supporting_evidence', [])),
                 json.dumps(rec_data.get('recommended_actions', [])), rec_data.get('follow_up'))
            )
            rec_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        ai_scan_id = ai_data.get('scan_id') if ai_data else None

        db.execute(
            """INSERT INTO analysis_history 
               (farm_id, sensor_data_id, satellite_data_id, leaf_scan_id, recommendation_id, farm_health_score)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (farm_id, iot_id, sat_id, ai_scan_id, rec_id, health_score)
        )
        history_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.execute("UPDATE farms SET health_score = ? WHERE id = ?", (health_score, farm_id))
        
        db.commit()
        return history_id

    @staticmethod
    def get_latest_analysis_object(db, farm_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Reconstructs the latest unified analysis object from history for fast Dashboard loading."""
        q = """
            SELECT a.id, a.timestamp, a.farm_health_score,
                   r.overall_status, r.severity, r.primary_issue, r.diagnostic_summary, r.confidence, r.recommended_actions, r.supporting_evidence, r.follow_up, r.assessments_json,
                   s.temperature, s.humidity, s.soil_moisture, s.light, s.mq135, s.rain_detected,
                   sat.ndvi_mean, sat.ndvi_min, sat.ndvi_max, sat.healthy_pct, sat.moderate_pct, sat.stress_pct, sat.band_b4, sat.band_b8, sat.cloud_coverage, sat.timestamp as sat_timestamp,
                   dp.disease, dp.confidence as ai_confidence, dp.severity as ai_severity, dp.scientific_name as ai_description, ls.timestamp as scan_time
            FROM analysis_history a
            LEFT JOIN recommendations r ON a.recommendation_id = r.id
            LEFT JOIN sensor_data s ON a.sensor_data_id = s.id
            LEFT JOIN satellite_data sat ON a.satellite_data_id = sat.id
            LEFT JOIN leaf_scans ls ON a.leaf_scan_id = ls.id
            LEFT JOIN disease_predictions dp ON ls.id = dp.scan_id
            WHERE a.farm_id = ?
            ORDER BY a.timestamp DESC LIMIT 1
        """
        row = db.execute(q, (farm_id,)).fetchone()
        if not row:
            return None
            
        d = dict(row)
        
        try:
            recommended_actions = json.loads(d.get('recommended_actions') or '[]')
            supporting_evidence = json.loads(d.get('supporting_evidence') or '[]')
            assessments = json.loads(d.get('assessments_json') or '{}')
        except:
            recommended_actions = []
            supporting_evidence = []
            assessments = {}

        satellite_data = None
        if d.get('ndvi_mean') is not None:
            satellite_data = {
                'ndvi_mean': d.get('ndvi_mean'),
                'ndvi_min': d.get('ndvi_min'),
                'ndvi_max': d.get('ndvi_max'),
                'healthy_pct': d.get('healthy_pct', 0),
                'moderate_pct': d.get('moderate_pct', 0),
                'stress_pct': d.get('stress_pct', 0),
                'band_b4': d.get('band_b4'),
                'band_b8': d.get('band_b8'),
                'cloud_coverage': d.get('cloud_coverage', 0),
                'timestamp': d.get('sat_timestamp')
            }

        iot_data = None
        if d.get('temperature') is not None:
            iot_data = {
                'temperature': d.get('temperature'),
                'humidity': d.get('humidity'),
                'soil_moisture': d.get('soil_moisture'),
                'light': d.get('light'),
                'mq135': d.get('mq135'),
                'rain_detected': bool(d.get('rain_detected'))
            }

        leaf_ai = None
        if d.get('disease') is not None:
            leaf_ai = {
                'disease': d.get('disease'),
                'confidence': d.get('ai_confidence'),
                'severity': d.get('ai_severity'),
                'description': d.get('ai_description'),
                'timestamp': d.get('scan_time')
            }
        
        rec = None
        if d.get('overall_status') is not None:
            # We want to add KB info to make it fully compatible with RecommendationEngine output
            # but for dashboard, standard fields might be enough.
            rec = {
                'overall_status': d.get('overall_status'),
                'severity': d.get('severity', 'None'),
                'primary_issue': d.get('primary_issue', 'Unknown'),
                'diagnostic_summary': d.get('diagnostic_summary', 'Not Available'),
                'confidence': d.get('confidence', 0),
                'recommended_actions': recommended_actions,
                'supporting_evidence': supporting_evidence,
                'assessments': assessments,
                'follow_up': d.get('follow_up', ''),
                'health_score': d.get('farm_health_score', 50)
            }
            
        stats = {
            'total_farms': db.execute("SELECT COUNT(*) FROM farms WHERE user_id = ?", (user_id,)).fetchone()[0],
            'alerts': db.execute("SELECT COUNT(*) FROM recommendations WHERE farm_id = ? AND severity IN ('High', 'Critical') AND timestamp >= datetime('now', '-7 days')", (farm_id,)).fetchone()[0],
            'diseases_detected': db.execute("SELECT COUNT(*) FROM disease_predictions dp JOIN leaf_scans ls ON dp.scan_id = ls.id WHERE ls.farm_id = ? AND dp.disease != 'Healthy' AND ls.timestamp >= datetime('now', '-30 days')", (farm_id,)).fetchone()[0],
        }

        return {
            'health_score': d.get('farm_health_score', 50),
            'stats': stats,
            'leaf_ai': leaf_ai,
            'satellite': satellite_data,
            'iot': iot_data,
            'sensor': iot_data, # alias for older dashboard code
            'recommendation': rec,
            'timestamp': d.get('timestamp')
        }

    @staticmethod
    def get_history(db, farm_id: int):
        query = """
            SELECT a.id, a.timestamp, a.farm_health_score,
                   r.overall_status, r.severity, r.primary_issue, r.diagnostic_summary, r.confidence, r.recommended_actions, r.supporting_evidence,
                   s.temperature, s.humidity, s.soil_moisture, s.light, s.mq135,
                   sat.ndvi_mean,
                   dp.disease, dp.confidence as ai_confidence
            FROM analysis_history a
            LEFT JOIN recommendations r ON a.recommendation_id = r.id
            LEFT JOIN sensor_data s ON a.sensor_data_id = s.id
            LEFT JOIN satellite_data sat ON a.satellite_data_id = sat.id
            LEFT JOIN leaf_scans ls ON a.leaf_scan_id = ls.id
            LEFT JOIN disease_predictions dp ON ls.id = dp.scan_id
        """
        params = []
        if farm_id:
            query += " WHERE a.farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY a.timestamp DESC LIMIT 30"
        
        rows = db.execute(query, params).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            try:
                d['recommended_actions'] = json.loads(d.get('recommended_actions') or '[]')
                d['supporting_evidence'] = json.loads(d.get('supporting_evidence') or '[]')
            except:
                d['recommended_actions'] = []
                d['supporting_evidence'] = []
            results.append(d)
            
        return results
