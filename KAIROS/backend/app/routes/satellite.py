from flask import Blueprint, request, jsonify
from app.satellite.ndvi_processor import get_ndvi_for_farm
from app.utils.auth import require_auth
from app.database.db import get_db
from services.sentinel_service import SentinelHubService, SentinelHubAuthError, SentinelHubError
from services.statistical_service import StatisticalService, NoImageryFoundError
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("kairos.routes.satellite")

satellite_bp = Blueprint('satellite', __name__, url_prefix='/satellite')


@satellite_bp.route('/test', methods=['GET'])
def get_satellite_test():
    """Temporary test route to check Sentinel Hub Statistical API integration."""
    test_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [76.9558, 11.0168],
                [76.9558, 11.0268],
                [76.9658, 11.0268],
                [76.9658, 11.0168],
                [76.9558, 11.0168]
            ]
        ]
    }
    
    # Sentinel-2 pass search window
    start_date = "2026-06-17"
    end_date = "2026-07-17"
    
    try:
        auth_service = SentinelHubService()
        stats_service = StatisticalService(auth_service)
        stats = stats_service.get_ndvi_statistics(test_polygon, start_date, end_date)
        return jsonify(stats), 200
        
    except NoImageryFoundError as e:
        return jsonify({"error": "No imagery found", "details": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Failed to retrieve statistics", "details": str(e)}), 500


@satellite_bp.route('', methods=['GET'])
@require_auth
def get_satellite():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        if farm_id:
            # Return latest stored analysis
            row = db.execute(
                "SELECT * FROM satellite_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1",
                (farm_id,)
            ).fetchone()
            if row:
                return jsonify(dict(row)), 200

            # No stored data — run live analysis
            farm = db.execute("SELECT * FROM farms WHERE id = ?", (farm_id,)).fetchone()
            if farm:
                result = get_ndvi_for_farm(dict(farm))
                _save_satellite(db, farm_id, result)
                return jsonify(result), 200

        # No farm specified — return mock
        from app.satellite.ndvi_processor import _mock_ndvi
        return jsonify(_mock_ndvi()), 200
    finally:
        db.close()


@satellite_bp.route('/analyze', methods=['POST'])
@require_auth
def trigger_analysis():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid request JSON'}), 400

    polygon = data.get('polygon')
    
    if not polygon:
        # Fallback to existing farm_id logic for compatibility if needed
        farm_id = data.get('farm_id') if data else None
        if not farm_id:
            return jsonify({'success': False, 'error': 'polygon or farm_id required'}), 400

        db = get_db()
        try:
            farm = db.execute("SELECT * FROM farms WHERE id = ? AND user_id = ?",
                              (farm_id, request.user_id)).fetchone()
            if not farm:
                return jsonify({'success': False, 'error': 'Farm not found'}), 404

            result = get_ndvi_for_farm(dict(farm))
            
            try:
                import json
                poly_obj = json.loads(farm['polygon']) if isinstance(farm['polygon'], str) else farm['polygon']
                if isinstance(poly_obj, list):
                    geojson_coords = [[ [float(p[1]), float(p[0])] for p in poly_obj ]]
                    if geojson_coords[0][0] != geojson_coords[0][-1]:
                        geojson_coords[0].append(geojson_coords[0][0])
                    polygon_stats = {"type": "Polygon", "coordinates": geojson_coords}
                else:
                    polygon_stats = poly_obj
                    
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=90)

                auth_service = SentinelHubService()
                stats_service = StatisticalService(auth_service)
                stats = stats_service.get_ndvi_statistics(
                    polygon_stats, 
                    start_date.strftime('%Y-%m-%d'), 
                    end_date.strftime('%Y-%m-%d')
                )
                
                result['ndvi_mean'] = stats.get('mean_ndvi', result.get('ndvi_mean'))
                result['ndvi_min'] = stats.get('min_ndvi', result.get('ndvi_min'))
                result['ndvi_max'] = stats.get('max_ndvi', result.get('ndvi_max'))
                result['cloud_coverage'] = stats.get('cloud_coverage', result.get('cloud_coverage'))
                if stats.get('image_date'):
                    result['timestamp'] = stats.get('image_date')
            except Exception as e:
                logger.warning(f"Could not enrich with StatisticalService: {e}")

            _save_satellite(db, farm_id, result)
            response_data = {
                'status': 'ok',
                'data': result,
                'ndvi': result.get('ndvi_mean'),
                'health': 'Healthy' if result.get('ndvi_mean', 0) >= 0.5 else 'Stress',
                'cloud': result.get('cloud_coverage'),
                'date': result.get('timestamp')
            }
            return jsonify(response_data), 200
        finally:
            db.close()

    # Validate GeoJSON polygon
    if not isinstance(polygon, dict) or polygon.get('type') != 'Polygon' or not polygon.get('coordinates'):
        return jsonify({'success': False, 'error': 'Invalid or malformed GeoJSON polygon'}), 400

    logger.info("Received polygon for analysis")
    
    # Calculate time range (last 90 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)

    try:
        auth_service = SentinelHubService()
        stats_service = StatisticalService(auth_service)
        
        # Calculate statistics
        start_time = datetime.now()
        stats = stats_service.get_ndvi_statistics(
            polygon, 
            start_date.strftime('%Y-%m-%d'), 
            end_date.strftime('%Y-%m-%d')
        )
        execution_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Statistics received successfully in {execution_time} seconds")
        
        # Classify crop health
        mean_ndvi = stats.get('mean_ndvi', 0)
        
        if mean_ndvi >= 0.75:
            health = {"status": "Excellent", "description": "Excellent Vegetation"}
        elif mean_ndvi >= 0.60:
            health = {"status": "Healthy", "description": "Healthy Vegetation"}
        elif mean_ndvi >= 0.45:
            health = {"status": "Moderate", "description": "Moderate Vegetation"}
        elif mean_ndvi >= 0.30:
            health = {"status": "Stress", "description": "Vegetation Stress"}
        else:
            health = {"status": "Severe", "description": "Severe Crop Stress"}

        return jsonify({
            "success": True,
            "statistics": stats,
            "crop_health": health
        }), 200

    except SentinelHubAuthError as e:
        logger.error(f"Authentication failure: {e}")
        return jsonify({'success': False, 'error': 'Authentication failure with satellite service'}), 401
    except NoImageryFoundError as e:
        logger.warning(f"No available imagery: {e}")
        return jsonify({'success': False, 'error': 'No available imagery or cloud coverage too high for the specified area in the last 30 days'}), 404
    except SentinelHubError as e:
        logger.error(f"Sentinel Hub API error: {e}")
        return jsonify({'success': False, 'error': f'Satellite service error: {str(e)}'}), 502
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {e}")
        return jsonify({'success': False, 'error': 'Internal server error during analysis'}), 500


@satellite_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        query = "SELECT * FROM satellite_data"
        params = []
        if farm_id:
            query += " WHERE farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY timestamp DESC LIMIT 20"
        rows = db.execute(query, params).fetchall()
        return jsonify([dict(r) for r in rows]), 200
    finally:
        db.close()


def _save_satellite(db, farm_id, result):
    query = """INSERT INTO satellite_data
               (farm_id, ndvi_mean, ndvi_min, ndvi_max, healthy_pct, moderate_pct, stress_pct, band_b4, band_b8, cloud_coverage"""
    values_placeholder = "?, ?, ?, ?, ?, ?, ?, ?, ?, ?"
    params = [farm_id, result.get('ndvi_mean'), result.get('ndvi_min'), result.get('ndvi_max'),
             result.get('healthy_pct'), result.get('moderate_pct'), result.get('stress_pct'),
             result.get('band_b4'), result.get('band_b8'), result.get('cloud_coverage')]
             
    if 'timestamp' in result and result['timestamp']:
        query += ", timestamp)"
        values_placeholder += ", ?"
        params.append(result['timestamp'])
    else:
        query += ")"
        
    db.execute(f"{query} VALUES ({values_placeholder})", tuple(params))
    sat_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    
    latest_history = db.execute("SELECT id FROM analysis_history WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1", (farm_id,)).fetchone()
    if latest_history:
        db.execute("UPDATE analysis_history SET satellite_data_id = ? WHERE id = ?", (sat_id, latest_history['id']))
    else:
        db.execute("INSERT INTO analysis_history (farm_id, satellite_data_id, farm_health_score) VALUES (?, ?, 50)", (farm_id, sat_id))
    db.commit()
