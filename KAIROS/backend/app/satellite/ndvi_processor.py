"""
Sentinel-2 NDVI Processor
--------------------------
Uses the Sentinel Hub Process API to download Sentinel-2 bands B04 (Red) and B08 (NIR),
then computes NDVI = (NIR - Red) / (NIR + Red).

Requirements:
    pip install sentinelhub
    Set SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET in .env

Sentinel Hub Registration:
    1. Register at https://www.sentinel-hub.com/
    2. Create an OAuth client in the dashboard
    3. Copy client_id and client_secret to your .env
"""

import json
import numpy as np
from config import Config


def get_ndvi_for_farm(farm: dict) -> dict:
    """
    Calculate NDVI for a farm polygon.
    Returns NDVI statistics and zone percentages.
    Falls back to mock data if Sentinel Hub credentials are missing.
    """
    polygon = farm.get('polygon')
    if not polygon:
        raise ValueError("Farm has no boundary polygon")

    try:
        poly_obj = json.loads(polygon) if isinstance(polygon, str) else polygon
        
        lats = []
        lons = []
        
        if isinstance(poly_obj, dict) and poly_obj.get('type') == 'Polygon':
            # GeoJSON format: [[[lon, lat], ...]]
            coords = poly_obj['coordinates'][0]
            if len(coords) < 3:
                raise ValueError("Polygon has insufficient coordinates")
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
        elif isinstance(poly_obj, list):
            # Legacy format: [[lat, lon], ...]
            coords = poly_obj
            if len(coords) < 3:
                raise ValueError("Polygon has insufficient coordinates")
            lats = [c[0] for c in coords]
            lons = [c[1] for c in coords]
        else:
            raise ValueError("Unknown polygon format")
            
    except Exception as e:
        raise ValueError(f"Invalid polygon format: {e}")

    if not Config.SENTINEL_HUB_CLIENT_ID or not Config.SENTINEL_HUB_CLIENT_SECRET:
        print("[NDVI Processor] Sentinel Hub credentials missing, falling back to mock")
        return _mock_ndvi()

    try:
        return _fetch_real_ndvi(lats, lons)
    except Exception as e:
        print(f"[NDVI Processor] Sentinel Hub error: {e}")
        return _mock_ndvi()

def _mock_ndvi() -> dict:
    """Mock NDVI data for development or fallback."""
    import random
    mean = round(random.uniform(0.6, 0.85), 4)
    return {
        'ndvi_mean': mean,
        'ndvi_min': round(mean - 0.2, 4),
        'ndvi_max': round(mean + 0.1, 4),
        'healthy_pct': random.randint(60, 90),
        'moderate_pct': random.randint(10, 30),
        'stress_pct': random.randint(0, 10),
        'cloud_coverage': random.randint(0, 20),
        '_is_real': False,
    }


def _fetch_real_ndvi(lats: list, lons: list) -> dict:
    """Fetch real NDVI data from Sentinel Hub."""
    from sentinelhub import (
        SHConfig, SentinelHubRequest, BBox, CRS, MimeType,
        DataCollection, SentinelHubStatistical, bbox_to_dimensions
    )

    config = SHConfig()
    config.sh_client_id = Config.SENTINEL_HUB_CLIENT_ID
    config.sh_client_secret = Config.SENTINEL_HUB_CLIENT_SECRET
    config.sh_base_url = "https://sh.dataspace.copernicus.eu"
    config.sh_token_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

    # Build bounding box from polygon
    bbox = BBox(
        bbox=[min(lons), min(lats), max(lons), max(lats)],
        crs=CRS.WGS84
    )

    # NDVI evalscript
    evalscript = """
    //VERSION=3
    function setup() {
        return { 
            input: ["B04", "B08", "dataMask"], 
            output: { bands: 1, sampleType: "FLOAT32" } 
        };
    }
    function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return [ndvi];
    }
    """

    from datetime import datetime, timedelta
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    cdse_s2l2a = DataCollection.SENTINEL2_L2A.define_from("CDSE_S2L2A", service_url=config.sh_base_url)

    request_sh = SentinelHubRequest(
        evalscript=evalscript,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=cdse_s2l2a,
                time_interval=(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')),
                mosaicking_order='leastCC',
            )
        ],
        responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
        bbox=bbox,
        size=bbox_to_dimensions(bbox, resolution=10),
        config=config,
    )

    data = request_sh.get_data()[0]
    if data.ndim == 3:
        ndvi_array = data[:, :, 0].astype(float)
    else:
        ndvi_array = data.astype(float)
    ndvi_array = np.clip(ndvi_array, -1, 1)
    ndvi_array = ndvi_array[ndvi_array != 0]  # Remove no-data pixels

    if ndvi_array.size == 0:
        return _mock_ndvi()

    ndvi_mean = float(np.mean(ndvi_array))
    ndvi_min = float(np.min(ndvi_array))
    ndvi_max = float(np.max(ndvi_array))

    healthy_pct = round(float(np.sum(ndvi_array >= 0.5) / ndvi_array.size * 100), 1)
    moderate_pct = round(float(np.sum((ndvi_array >= 0.3) & (ndvi_array < 0.5)) / ndvi_array.size * 100), 1)
    stress_pct = round(100 - healthy_pct - moderate_pct, 1)

    return {
        'ndvi_mean': round(ndvi_mean, 4),
        'ndvi_min': round(ndvi_min, 4),
        'ndvi_max': round(ndvi_max, 4),
        'healthy_pct': healthy_pct,
        'moderate_pct': moderate_pct,
        'stress_pct': max(0, stress_pct),
        'cloud_coverage': 0,
        '_is_real': True,
    }


def compute_ndvi_formula(b4: float, b8: float) -> float:
    """Simple scalar NDVI computation."""
    if (b8 + b4) == 0:
        return 0.0


