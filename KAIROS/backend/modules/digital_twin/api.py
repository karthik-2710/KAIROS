from flask import Blueprint, jsonify, request
from .state import state
from .scenarios import SCENARIOS
import datetime

digital_twin_bp = Blueprint('digital_twin', __name__, url_prefix='/api/iot')

@digital_twin_bp.route('/live', methods=['GET'])
def get_live_telemetry():
    vals = state.get_values()
    
    # We match the frontend expected structure
    response = {
        "temperature": vals["temperature"],
        "humidity": vals["humidity"],
        "soil_moisture": vals["soil_moisture"],
        "rain": vals["rain"],
        "light": vals["light"],
        "ndvi": vals["ndvi"],
        "scenario": state.get_scenario_name(),
        "ai_prediction": vals["ai_prediction"],
        "ai_confidence": vals["ai_confidence"],
        "risk": vals["risk"],
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }
    return jsonify(response)

@digital_twin_bp.route('/scenario', methods=['POST'])
def set_scenario():
    data = request.json
    scenario_name = data.get("scenario")
    if not scenario_name:
        return jsonify({"error": "Missing scenario"}), 400
        
    if scenario_name not in SCENARIOS:
        return jsonify({"error": f"Unknown scenario. Available: {list(SCENARIOS.keys())}"}), 400
        
    state.set_scenario(scenario_name)
    return jsonify({"status": "success", "scenario": scenario_name})
