from flask import Blueprint, request, jsonify
from app.weather.weather_client import get_weather_for_farm
from app.utils.auth import require_auth
from app.database.db import get_db
import json

weather_bp = Blueprint('weather', __name__, url_prefix='/weather')


@weather_bp.route('', methods=['GET'])
@require_auth
def get_weather():
    farm_id = request.args.get('farm_id', type=int)
    farm = {'polygon': None}

    if farm_id:
        db = get_db()
        try:
            row = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
            if row:
                farm = dict(row)
        finally:
            db.close()

    weather_data = get_weather_for_farm(farm)
    return jsonify(weather_data), 200
