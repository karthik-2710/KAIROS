from flask import Blueprint, request, jsonify
import json
import logging
from app.utils.auth import require_auth
from app.database.db import get_db
from app.services.market_service import MarketPriceService

market_bp = Blueprint('market', __name__, url_prefix='/market')


def _resolve_farm_location_and_crop(farm_id: int, user_id: int):
    """Extracts crop and centroid coordinates for a farm."""
    db = get_db()
    try:
        farm = db.execute("SELECT * FROM farms WHERE id = ? AND user_id = ?", (farm_id, user_id)).fetchone()
        if not farm:
            # Fallback to any farm with this ID for demo flexibility
            farm = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
        
        if farm:
            f = dict(farm)
            crop = f.get('crop_type', 'Rice')
            polygon = f.get('polygon')
            lat, lon = 20.0, 78.0  # Default to Maharashtra agricultural center

            if polygon:
                try:
                    points = json.loads(polygon) if isinstance(polygon, str) else polygon
                    if points and len(points) > 0:
                        lat = sum(p[0] for p in points) / len(points)
                        lon = sum(p[1] for p in points) / len(points)
                except Exception:
                    pass
            return crop, lat, lon
        return 'Rice', 20.0, 78.0
    finally:
        db.close()


@market_bp.route('/prices', methods=['GET'])
@require_auth
def get_market_prices():
    """
    Returns full normalized market intelligence, distance-ranked nearby mandis,
    and historical price trends for the active farm/crop.
    """
    farm_id = request.args.get('farm_id', type=int)
    explicit_crop = request.args.get('crop', type=str)
    state = request.args.get('state', default='Maharashtra', type=str)

    farm_lat, farm_lon = 20.0, 78.0
    crop = 'Rice'

    if farm_id:
        farm_crop, farm_lat, farm_lon = _resolve_farm_location_and_crop(farm_id, getattr(request, 'user_id', 1))
        crop = explicit_crop if explicit_crop else farm_crop
    elif explicit_crop:
        crop = explicit_crop

    try:
        data = MarketPriceService.get_market_intelligence(
            crop=crop,
            farm_lat=farm_lat,
            farm_lon=farm_lon,
            state=state
        )
        return jsonify(data), 200
    except Exception as e:
        logging.error(f"[MarketRoute] Error retrieving market prices: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve official market prices',
            'details': str(e)
        }), 500


@market_bp.route('/summary', methods=['GET'])
@require_auth
def get_market_summary():
    """
    Returns compact, lightweight market price summary for the Dashboard card.
    """
    farm_id = request.args.get('farm_id', type=int)
    explicit_crop = request.args.get('crop', type=str)
    state = request.args.get('state', default='Maharashtra', type=str)

    farm_lat, farm_lon = 20.0, 78.0
    crop = 'Rice'

    if farm_id:
        farm_crop, farm_lat, farm_lon = _resolve_farm_location_and_crop(farm_id, getattr(request, 'user_id', 1))
        crop = explicit_crop if explicit_crop else farm_crop
    elif explicit_crop:
        crop = explicit_crop

    try:
        full_data = MarketPriceService.get_market_intelligence(
            crop=crop,
            farm_lat=farm_lat,
            farm_lon=farm_lon,
            state=state
        )
        summary = full_data.get('summary', {})
        top_mandi = full_data.get('mandis', [{}])[0] if full_data.get('mandis') else None

        return jsonify({
            'success': True,
            'crop_name': crop.capitalize(),
            'state': state,
            'has_data': full_data.get('has_data', False),
            'modal_price': summary.get('state_modal_avg'),
            'price_unit': summary.get('price_unit', '₹/quintal'),
            'price_per_kg': summary.get('price_per_kg_avg'),
            'price_change_pct': summary.get('price_change_pct'),
            'trend_direction': summary.get('trend_direction', 'STABLE'),
            'top_nearby_mandi': top_mandi.get('market_name') if top_mandi else None,
            'top_nearby_distance_km': top_mandi.get('distance_km') if top_mandi else None,
            'latest_observation_date': summary.get('latest_observation_date'),
            'source': summary.get('source'),
            'last_updated_at': summary.get('last_updated_at')
        }), 200
    except Exception as e:
        logging.error(f"[MarketRoute] Error retrieving market summary: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve market summary',
            'details': str(e)
        }), 500


@market_bp.route('/history', methods=['GET'])
@require_auth
def get_market_history():
    """
    Returns chronological market price observations for trend visualization.
    """
    crop = request.args.get('crop', default='Rice', type=str)
    state = request.args.get('state', default='Maharashtra', type=str)
    crop_id = MarketPriceService.normalize_crop_name(crop)

    db = get_db()
    try:
        rows = db.execute(
            """SELECT arrival_date, AVG(modal_price) as avg_modal, MIN(min_price) as min_p, MAX(max_price) as max_p, COUNT(*) as count
               FROM market_price_observations
               WHERE crop_id = ? AND state = ?
               GROUP BY arrival_date
               ORDER BY recorded_at ASC
               LIMIT 30""",
            (crop_id, state)
        ).fetchall()

        history = [{
            'date': r['arrival_date'],
            'modal_price': round(r['avg_modal'], 1) if r['avg_modal'] else None,
            'min_price': round(r['min_p'], 1) if r['min_p'] else None,
            'max_price': round(r['max_p'], 1) if r['max_p'] else None,
            'reporting_mandis': r['count']
        } for r in rows]

        return jsonify({
            'success': True,
            'crop_id': crop_id,
            'crop_name': crop.capitalize(),
            'state': state,
            'history': history,
            'source': 'Government of India (AGMARKNET / data.gov.in)'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        db.close()
