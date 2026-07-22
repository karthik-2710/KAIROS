import traceback
import logging
from typing import Dict, Any, Optional

from app.database.db import get_db
from app.weather.weather_client import get_weather_for_farm
from app.satellite.ndvi_processor import get_ndvi_for_farm
from app.ai.predictor import predict_disease

from app.services.telemetry_simulator import TelemetrySimulator
from app.services.cross_validator import CrossValidatorService
from app.services.recommendation_engine import RecommendationEngine
from app.services.health_score import HealthScoreService
from app.services.history_service import HistoryService

class AnalysisEngine:
    @staticmethod
    def run_pipeline(farm_id: int, leaf_image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs the complete unified analysis pipeline for a given farm.
        """
        db = get_db()
        try:
            # 1. Select Farm
            farm = dict(db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone() or {})
            if not farm:
                raise ValueError("Farm not found")

            # 2. Retrieve IoT Telemetry (Digital Twin Simulator)
            iot_data = TelemetrySimulator.get_current_telemetry(farm_id)

            # 3. Retrieve Weather
            weather_data = get_weather_for_farm(farm)

            # 4. Retrieve Satellite (NDVI)
            # Try to get the latest from DB first to save API calls, but for pipeline we'll call get_ndvi
            # Wait, get_ndvi_for_farm internally uses cached/mocked if API fails, so we can call it.
            # However, if we don't want to spam Sentinel, we can check DB first.
            satellite_row = db.execute("SELECT * FROM satellite_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1", (farm_id,)).fetchone()
            if satellite_row:
                satellite_data = dict(satellite_row)
            else:
                satellite_data = get_ndvi_for_farm(farm)

            # 5. Analyze uploaded leaf image
            ai_data = {}
            if leaf_image_path:
                with open(leaf_image_path, 'rb') as f:
                    image_bytes = f.read()
                ai_data = predict_disease(image_bytes)
                # Ensure it has the structure expected
                if not ai_data or 'error' in ai_data:
                    ai_data = {}
                else:
                    # Log the scan to get an ID
                    db.execute("INSERT INTO leaf_scans (farm_id) VALUES (?)", (farm_id,))
                    scan_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
                    db.execute(
                        "INSERT INTO disease_predictions (scan_id, disease, confidence, severity) VALUES (?, ?, ?, ?)",
                        (scan_id, ai_data.get('disease'), ai_data.get('confidence'), ai_data.get('severity', 'Moderate'))
                    )
                    ai_data['scan_id'] = scan_id
            else:
                # If no leaf uploaded, try to pull the most recent AI scan for this farm
                recent_ai = db.execute(
                    """SELECT dp.disease, dp.confidence, dp.severity, ls.id as scan_id 
                       FROM disease_predictions dp
                       JOIN leaf_scans ls ON dp.scan_id = ls.id
                       WHERE ls.farm_id = ? ORDER BY ls.timestamp DESC LIMIT 1""",
                    (farm_id,)
                ).fetchone()
                if recent_ai:
                    ai_data = dict(recent_ai)

            # 6. Cross validate every source
            diagnosis = CrossValidatorService.cross_validate(ai_data, satellite_data, iot_data, weather_data)

            # 7. Generate intelligent recommendations
            recommendation = RecommendationEngine.generate_recommendations(diagnosis)

            # 8. Compute Farm Health Score
            analysis_dict = {
                'iot': iot_data,
                'satellite': satellite_data,
                'weather': weather_data,
                'leaf_ai': ai_data
            }
            health_score = HealthScoreService.calculate_health_score(analysis_dict)

            analysis_dict['recommendation'] = recommendation
            analysis_dict['health_score'] = health_score
            analysis_dict['farm'] = farm

            # 9. Store analysis
            HistoryService.save_analysis(db, farm_id, analysis_dict, health_score)

            # 10. Fetch extra stats for the Dashboard UI
            analysis_dict['stats'] = {
                'total_farms': db.execute("SELECT COUNT(*) FROM farms WHERE user_id = ?", (farm.get('user_id'),)).fetchone()[0],
                'alerts': db.execute("SELECT COUNT(*) FROM recommendations WHERE farm_id = ? AND severity IN ('High', 'Critical') AND timestamp >= datetime('now', '-7 days')", (farm_id,)).fetchone()[0],
                'diseases_detected': db.execute("SELECT COUNT(*) FROM disease_predictions dp JOIN leaf_scans ls ON dp.scan_id = ls.id WHERE ls.farm_id = ? AND dp.disease != 'Healthy' AND ls.timestamp >= datetime('now', '-30 days')", (farm_id,)).fetchone()[0],
            }

            return analysis_dict
            
        except Exception as e:
            logging.error(f"Error in AnalysisEngine: {str(e)}")
            logging.error(traceback.format_exc())
            raise
        finally:
            db.close()
