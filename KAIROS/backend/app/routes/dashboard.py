from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth
from app.database.db import get_db
from app.services.history_service import HistoryService
from app.services.analysis_engine import AnalysisEngine

import logging
import traceback

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('', methods=['GET'])
@require_auth
def get_dashboard():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    
    try:
        if not farm_id:
            return jsonify({"error": "Farm ID required"}), 400

        # Check if farm exists
        farm = dict(db.execute("SELECT * FROM farms WHERE id = ? AND user_id = ?",
                         (farm_id, request.user_id)).fetchone() or {})
        if not farm:
            return jsonify({"error": "Farm not found"}), 404

        # Try to get latest analysis from history
        latest_analysis = HistoryService.get_latest_analysis_object(db, farm_id, request.user_id)
        
        if not latest_analysis:
            # If no history exists, we tell the frontend it needs to run
            # Or we could just run it synchronously here. 
            # The prompt says "Selecting a farm and pressing 'Run Analysis' should perform ONE complete analysis pipeline"
            # It's better to tell the frontend it needs to run, so the UI can show a loading state.
            return jsonify({"needs_run": True}), 200

        return jsonify(latest_analysis), 200

    except Exception as e:
        logging.error(f"Error in dashboard: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
    finally:
        db.close()
