import logging
import traceback
from flask import Blueprint, request, jsonify

from app.utils.auth import require_auth
from app.database.db import get_db
from app.services.analysis_engine import AnalysisEngine
from app.services.history_service import HistoryService

analysis_bp = Blueprint('analysis', __name__, url_prefix='/analysis')
logger = logging.getLogger(__name__)


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
        logger.error(f"Error running analysis: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Failed to run analysis", "details": str(e)}), 500


@analysis_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """Returns chronologically ordered real analysis history records scoped to a farm."""
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        results = HistoryService.get_history(db, farm_id)
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Error fetching analysis history: {str(e)}")
        return jsonify([]), 500
    finally:
        db.close()


@analysis_bp.route('/history/<int:analysis_id>', methods=['GET'])
@require_auth
def get_analysis_detail(analysis_id: int):
    """Returns stored immutable snapshot of a specific historical analysis without re-running models."""
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        record = HistoryService.get_analysis_by_id(db, analysis_id, farm_id)
        if not record:
            return jsonify({"error": f"Analysis #{analysis_id} not found"}), 404
        return jsonify(record), 200
    except Exception as e:
        logger.error(f"Error fetching analysis #{analysis_id}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
