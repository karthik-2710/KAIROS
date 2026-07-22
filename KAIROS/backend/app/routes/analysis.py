import logging
import traceback
from flask import Blueprint, request, jsonify

from app.utils.auth import require_auth
from app.database.db import get_db
from app.services.analysis_engine import AnalysisEngine
from app.services.history_service import HistoryService

analysis_bp = Blueprint('analysis', __name__, url_prefix='/analysis')

@analysis_bp.route('/run', methods=['POST'])
@require_auth
def run_analysis():
    data = request.json or {}
    farm_id = data.get('farm_id') or request.args.get('farm_id', type=int)
    
    if not farm_id:
        return jsonify({"error": "farm_id is required"}), 400

    try:
        # Run the unified pipeline
        analysis_data = AnalysisEngine.run_pipeline(farm_id)
        return jsonify(analysis_data), 200

    except Exception as e:
        logging.error(f"Error running analysis: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({"error": "Failed to run analysis", "details": str(e)}), 500


@analysis_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        results = HistoryService.get_history(db, farm_id)
        return jsonify(results), 200
    except Exception as e:
        logging.error(f"Error fetching analysis history: {str(e)}")
        return jsonify([]), 500
    finally:
        db.close()
