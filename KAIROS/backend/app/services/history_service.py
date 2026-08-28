import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class HistoryService:
    @staticmethod
    def save_analysis(db, farm_id: int, analysis_data: Dict[str, Any], health_score: int) -> int:
        """
        Persists a complete unified multimodal analysis snapshot into the database.
        Creates records across sensor_data, satellite_data, recommendations, and analysis_history.
        """
        iot_data = analysis_data.get('iot', {})
        sat_data = analysis_data.get('satellite', {})
        ai_data = analysis_data.get('leaf_ai', {})
        rec_data = analysis_data.get('recommendation', {})
        
        # 1. Store IoT sensor reading
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

        # 2. Store Satellite NDVI telemetry
        sat_id = None
        if sat_data:
            if 'id' in sat_data and sat_data['id']:
                sat_id = sat_data['id']
            else:
                db.execute(
                    """INSERT INTO satellite_data 
                       (farm_id, ndvi_mean, ndvi_min, ndvi_max, 
                        ndre_mean, ndre_min, ndre_max,
                        ndwi_mean, ndwi_min, ndwi_max,
                        healthy_pct, moderate_pct, stress_pct, band_b4, band_b8, cloud_coverage)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (farm_id, sat_data.get('ndvi_mean'), sat_data.get('ndvi_min'), sat_data.get('ndvi_max'),
                     sat_data.get('ndre_mean'), sat_data.get('ndre_min'), sat_data.get('ndre_max'),
                     sat_data.get('ndwi_mean'), sat_data.get('ndwi_min'), sat_data.get('ndwi_max'),
                     sat_data.get('healthy_pct'), sat_data.get('moderate_pct'), sat_data.get('stress_pct'),
                     sat_data.get('band_b4'), sat_data.get('band_b8'), sat_data.get('cloud_coverage', 0))
                )
                sat_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        # 3. Store Recommendation details
        rec_id = None
        if rec_data:
            assessments_payload = {
                "model_statuses": rec_data.get('model_statuses', {}),
                "rule_matched": rec_data.get('rule_matched', {}),
                "safety_info": rec_data.get('safety_info', []),
                "recommendation_response": rec_data.get('recommendation_response', {})
            }
            
            db.execute(
                """INSERT INTO recommendations
                   (farm_id, health_score, overall_status, severity, confidence, primary_issue, secondary_issue, diagnostic_summary, assessments_json, supporting_evidence, recommended_actions, follow_up)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (farm_id, health_score, rec_data.get('overall_status'), rec_data.get('severity'), rec_data.get('confidence', 95),
                 rec_data.get('primary_issue'), rec_data.get('secondary_issue'), rec_data.get('diagnostic_summary'),
                 json.dumps(assessments_payload), json.dumps(rec_data.get('supporting_evidence', [])),
                 json.dumps(rec_data.get('recommended_actions', [])), rec_data.get('action') or rec_data.get('follow_up'))
            )
            rec_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

        ai_scan_id = ai_data.get('scan_id') if ai_data else None

        # 4. Insert into unified analysis_history
        db.execute(
            """INSERT INTO analysis_history 
               (farm_id, sensor_data_id, satellite_data_id, leaf_scan_id, recommendation_id, farm_health_score)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (farm_id, iot_id, sat_id, ai_scan_id, rec_id, health_score)
        )
        history_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        
        # 5. Update farm health score
        db.execute("UPDATE farms SET health_score = ? WHERE id = ?", (health_score, farm_id))
        
        db.commit()
        return history_id

    @staticmethod
    def get_history(db, farm_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetches structured analysis history records scoped to a farm.
        Returns full historical context without re-running models.
        """
        query = """
            SELECT a.id, a.farm_id, a.timestamp, a.farm_health_score,
                   f.name as farm_name, f.crop_type as crop,
                   r.overall_status, r.severity, r.primary_issue, r.secondary_issue, r.diagnostic_summary, 
                   r.confidence as rec_confidence, r.recommended_actions, r.supporting_evidence, r.follow_up, r.assessments_json,
                   s.temperature, s.humidity, s.soil_moisture, s.light, s.mq135,
                   sat.ndvi_mean, sat.ndre_mean, sat.ndwi_mean, sat.stress_pct, sat.healthy_pct,
                   dp.disease, dp.confidence as ai_confidence, dp.severity as ai_severity
            FROM analysis_history a
            LEFT JOIN farms f ON a.farm_id = f.id
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
        query += " ORDER BY a.timestamp DESC LIMIT 50"
        
        rows = db.execute(query, params).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            
            # Parse JSON structures
            try:
                recommended_actions = json.loads(d.get('recommended_actions') or '[]')
            except Exception:
                recommended_actions = []
                
            try:
                supporting_evidence = json.loads(d.get('supporting_evidence') or '[]')
            except Exception:
                supporting_evidence = []
                
            try:
                assessments = json.loads(d.get('assessments_json') or '{}')
            except Exception:
                assessments = {}

            action_text = d.get('follow_up') or ("\n".join(recommended_actions) if recommended_actions else "Maintain standard scouting protocols.")
            
            ts = d.get('timestamp') or ""
            date_str = ts[:10] if len(ts) >= 10 else ts

            results.append({
                "id": d.get('id'),
                "analysis_id": d.get('id'),
                "farm_id": d.get('farm_id'),
                "farm_name": d.get('farm_name') or f"Farm #{d.get('farm_id')}",
                "crop": d.get('crop') or "Rice",
                "location": d.get('farm_name') or "Field Location",
                "timestamp": ts,
                "date": date_str,
                "health_score": round(d.get('farm_health_score') or 50, 1),
                "severity": d.get('severity') or "Low",
                "overall_status": d.get('overall_status') or "Optimal",
                "primary_issue": d.get('primary_issue') or d.get('disease') or "Baseline Monitoring",
                "secondary_issue": d.get('secondary_issue'),
                "diagnostic_summary": d.get('diagnostic_summary') or f"System analysis indicates {d.get('severity', 'Low')} risk.",
                "action": action_text,
                "recommended_actions": recommended_actions,
                "supporting_evidence": supporting_evidence,
                "safety_info": assessments.get('safety_info', []),
                "rule_matched": assessments.get('rule_matched', {}),
                "model_statuses": assessments.get('model_statuses', {}),
                "disease": d.get('disease'),
                "ai_confidence": round(d.get('ai_confidence') or 0.0, 2),
                "temperature": d.get('temperature'),
                "humidity": d.get('humidity'),
                "soil_moisture": d.get('soil_moisture'),
                "ndvi_mean": d.get('ndvi_mean'),
                "stress_pct": d.get('stress_pct')
            })
            
        return results

    @staticmethod
    def get_analysis_by_id(db, analysis_id: int, farm_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Fetches detailed single analysis record by ID."""
        query = """
            SELECT a.id, a.farm_id, a.timestamp, a.farm_health_score,
                   f.name as farm_name, f.crop_type as crop, f.area_ha,
                   r.overall_status, r.severity, r.primary_issue, r.secondary_issue, r.diagnostic_summary, 
                   r.confidence as rec_confidence, r.recommended_actions, r.supporting_evidence, r.follow_up, r.assessments_json,
                   s.temperature, s.humidity, s.soil_moisture, s.light, s.mq135,
                   sat.ndvi_mean, sat.ndre_mean, sat.ndwi_mean, sat.stress_pct, sat.healthy_pct,
                   dp.disease, dp.confidence as ai_confidence, dp.severity as ai_severity
            FROM analysis_history a
            LEFT JOIN farms f ON a.farm_id = f.id
            LEFT JOIN recommendations r ON a.recommendation_id = r.id
            LEFT JOIN sensor_data s ON a.sensor_data_id = s.id
            LEFT JOIN satellite_data sat ON a.satellite_data_id = sat.id
            LEFT JOIN leaf_scans ls ON a.leaf_scan_id = ls.id
            LEFT JOIN disease_predictions dp ON ls.id = dp.scan_id
            WHERE a.id = ?
        """
        params = [analysis_id]
        if farm_id:
            query += " AND a.farm_id = ?"
            params.append(farm_id)
            
        row = db.execute(query, params).fetchone()
        if not row:
            return None
            
        d = dict(row)
        try:
            recommended_actions = json.loads(d.get('recommended_actions') or '[]')
            supporting_evidence = json.loads(d.get('supporting_evidence') or '[]')
            assessments = json.loads(d.get('assessments_json') or '{}')
        except Exception:
            recommended_actions = []
            supporting_evidence = []
            assessments = {}

        action_text = d.get('follow_up') or ("\n".join(recommended_actions) if recommended_actions else "Maintain standard scouting protocols.")

        return {
            "id": d.get('id'),
            "analysis_id": d.get('id'),
            "farm_id": d.get('farm_id'),
            "farm_name": d.get('farm_name') or f"Farm #{d.get('farm_id')}",
            "crop": d.get('crop') or "Rice",
            "area_ha": d.get('area_ha'),
            "location": d.get('farm_name') or "Field Location",
            "timestamp": d.get('timestamp'),
            "health_score": round(d.get('farm_health_score') or 50, 1),
            "severity": d.get('severity') or "Low",
            "overall_status": d.get('overall_status') or "Optimal",
            "primary_issue": d.get('primary_issue') or d.get('disease') or "Baseline Monitoring",
            "secondary_issue": d.get('secondary_issue'),
            "diagnostic_summary": d.get('diagnostic_summary') or "System analysis completed.",
            "action": action_text,
            "recommended_actions": recommended_actions,
            "supporting_evidence": supporting_evidence,
            "safety_info": assessments.get('safety_info', []),
            "rule_matched": assessments.get('rule_matched', {}),
            "model_statuses": assessments.get('model_statuses', {}),
            "raw_model_outputs": assessments.get('raw_model_outputs', {}),
            "disease": d.get('disease'),
            "ai_confidence": round(d.get('ai_confidence') or 0.0, 2),
            "temperature": d.get('temperature'),
            "humidity": d.get('humidity'),
            "soil_moisture": d.get('soil_moisture'),
            "light": d.get('light'),
            "ndvi_mean": d.get('ndvi_mean'),
            "ndre_mean": d.get('ndre_mean'),
            "ndwi_mean": d.get('ndwi_mean'),
            "stress_pct": d.get('stress_pct'),
            "healthy_pct": d.get('healthy_pct')
        }

    @staticmethod
    def get_latest_analysis_object(db, farm_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Reconstructs the latest unified analysis object from history for fast Dashboard loading."""
        q = """
            SELECT a.id, a.timestamp, a.farm_health_score,
                   r.overall_status, r.severity, r.primary_issue, r.diagnostic_summary, r.confidence, r.recommended_actions, r.supporting_evidence, r.follow_up, r.assessments_json,
                   s.temperature, s.humidity, s.soil_moisture, s.light, s.mq135, s.rain_detected,
                   sat.ndvi_mean, sat.ndvi_min, sat.ndvi_max, sat.ndre_mean, sat.ndre_min, sat.ndre_max, sat.ndwi_mean, sat.ndwi_min, sat.ndwi_max, sat.healthy_pct, sat.moderate_pct, sat.stress_pct, sat.band_b4, sat.band_b8, sat.cloud_coverage, sat.timestamp as sat_timestamp,
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
        except Exception:
            recommended_actions = []
            supporting_evidence = []
            assessments = {}

        satellite_data = None
        if d.get('ndvi_mean') is not None:
            satellite_data = {
                'ndvi_mean': d.get('ndvi_mean'),
                'ndvi_min': d.get('ndvi_min'),
                'ndvi_max': d.get('ndvi_max'),
                'ndre_mean': d.get('ndre_mean'),
                'ndre_min': d.get('ndre_min'),
                'ndre_max': d.get('ndre_max'),
                'ndwi_mean': d.get('ndwi_mean'),
                'ndwi_min': d.get('ndwi_min'),
                'ndwi_max': d.get('ndwi_max'),
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
            'sensor': iot_data,
            'recommendation': rec,
            'timestamp': d.get('timestamp')
        }
