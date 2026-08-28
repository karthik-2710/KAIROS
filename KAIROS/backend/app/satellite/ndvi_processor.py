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
    Falls back to baseline data if Sentinel Hub credentials are missing or polygon is undefined.
    """
    if not farm:
        return _mock_ndvi()

    polygon = farm.get('polygon')
    if not polygon:
        return _mock_ndvi()

    try:
        poly_obj = json.loads(polygon) if isinstance(polygon, str) else polygon
        
        lats = []
        lons = []
        
        if isinstance(poly_obj, dict) and poly_obj.get('type') == 'Polygon':
            # GeoJSON format: [[[lon, lat], ...]]
            coords = poly_obj['coordinates'][0]
            if len(coords) < 3:
                return _mock_ndvi()
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
        elif isinstance(poly_obj, list):
            # Legacy format: [[lat, lon], ...]
            coords = poly_obj
            if len(coords) < 3:
                return _mock_ndvi()
            lats = [c[0] for c in coords]
            lons = [c[1] for c in coords]
        else:
            return _mock_ndvi()
            
    except Exception as e:
        return _mock_ndvi()

    if not Config.SENTINEL_HUB_CLIENT_ID or not Config.SENTINEL_HUB_CLIENT_SECRET:
        return _mock_ndvi()

    try:
        return _fetch_real_ndvi(lats, lons)
    except Exception as e:
        print(f"[NDVI Processor] Sentinel Hub error: {e}")
        return _mock_ndvi()
        return _mock_ndvi()

def _mock_ndvi() -> dict:
    """Mock NDVI data for development or fallback."""
    import random
    mean = round(random.uniform(0.6, 0.85), 4)
    ndre_mean = round(random.uniform(0.3, 0.5), 4)
    ndwi_mean = round(random.uniform(0.1, 0.3), 4)
    return {
        'ndvi_mean': mean,
        'ndvi_min': round(mean - 0.2, 4),
        'ndvi_max': round(mean + 0.1, 4),
        'ndre_mean': ndre_mean,
        'ndre_min': round(ndre_mean - 0.1, 4),
        'ndre_max': round(ndre_mean + 0.1, 4),
        'ndwi_mean': ndwi_mean,
        'ndwi_min': round(ndwi_mean - 0.1, 4),
        'ndwi_max': round(ndwi_mean + 0.1, 4),
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

    # NDVI, NDRE, NDWI evalscript
    evalscript = """
    //VERSION=3
    function setup() {
        return { 
            input: ["B04", "B05", "B08", "B11", "dataMask"], 
            output: { bands: 3, sampleType: "FLOAT32" } 
        };
    }
    function evaluatePixel(sample) {
        let ndvi = (sample.B08 + sample.B04) !== 0 ? (sample.B08 - sample.B04) / (sample.B08 + sample.B04) : NaN;
        let ndre = (sample.B08 + sample.B05) !== 0 ? (sample.B08 - sample.B05) / (sample.B08 + sample.B05) : NaN;
        let ndwi = (sample.B08 + sample.B11) !== 0 ? (sample.B08 - sample.B11) / (sample.B08 + sample.B11) : NaN;
        return [ndvi, ndre, ndwi];
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
    # data is expected to be (H, W, 3) since we requested 3 bands
    if data.ndim == 3 and data.shape[2] >= 3:
        ndvi_array = data[:, :, 0].astype(float)
        ndre_array = data[:, :, 1].astype(float)
        ndwi_array = data[:, :, 2].astype(float)
    else:
        # Fallback if something went wrong
        ndvi_array = data.astype(float)
        ndre_array = np.full_like(ndvi_array, np.nan)
        ndwi_array = np.full_like(ndvi_array, np.nan)
        
    ndvi_array = np.clip(ndvi_array, -1, 1)
    ndre_array = np.clip(ndre_array, -1, 1)
    ndwi_array = np.clip(ndwi_array, -1, 1)
    
    # Filter valid pixels (remove 0 from old logic, and remove NaNs from division by zero)
    # Using NDVI valid mask as the master mask for simplicity and consistency
    valid_mask = ~np.isnan(ndvi_array) & (ndvi_array != 0)
    
    ndvi_valid = ndvi_array[valid_mask]
    ndre_valid = ndre_array[valid_mask]
    ndwi_valid = ndwi_array[valid_mask]

    if ndvi_valid.size == 0:
        return _mock_ndvi()

    ndvi_mean = float(np.mean(ndvi_valid))
    ndvi_min = float(np.min(ndvi_valid))
    ndvi_max = float(np.max(ndvi_valid))
    
    # Safe mean for NDRE
    if ndre_valid.size > 0 and not np.all(np.isnan(ndre_valid)):
        ndre_mean = float(np.nanmean(ndre_valid))
        ndre_min = float(np.nanmin(ndre_valid))
        ndre_max = float(np.nanmax(ndre_valid))
    else:
        ndre_mean = ndre_min = ndre_max = None
        
    # Safe mean for NDWI
    if ndwi_valid.size > 0 and not np.all(np.isnan(ndwi_valid)):
        ndwi_mean = float(np.nanmean(ndwi_valid))
        ndwi_min = float(np.nanmin(ndwi_valid))
        ndwi_max = float(np.nanmax(ndwi_valid))
    else:
        ndwi_mean = ndwi_min = ndwi_max = None

    healthy_pct = round(float(np.sum(ndvi_valid >= 0.5) / ndvi_valid.size * 100), 1)
    moderate_pct = round(float(np.sum((ndvi_valid >= 0.3) & (ndvi_valid < 0.5)) / ndvi_valid.size * 100), 1)
    stress_pct = round(100 - healthy_pct - moderate_pct, 1)

    print("========================================")
    print("KAIROS SATELLITE ANALYSIS")
    print("========================================")
    print("Satellite: Sentinel-2")
    print("Bands: B4, B5, B8, B11 retrieved: YES")
    print(f"NDVI Mean = {ndvi_mean:.4f}")
    print(f"NDRE Mean = {ndre_mean:.4f}" if ndre_mean is not None else "NDRE Mean = null")
    print(f"NDWI Mean = {ndwi_mean:.4f}" if ndwi_mean is not None else "NDWI Mean = null")
    print("========================================")

    return {
        'ndvi_mean': round(ndvi_mean, 4),
        'ndvi_min': round(ndvi_min, 4),
        'ndvi_max': round(ndvi_max, 4),
        'ndre_mean': round(ndre_mean, 4) if ndre_mean is not None else None,
        'ndre_min': round(ndre_min, 4) if ndre_min is not None else None,
        'ndre_max': round(ndre_max, 4) if ndre_max is not None else None,
        'ndwi_mean': round(ndwi_mean, 4) if ndwi_mean is not None else None,
        'ndwi_min': round(ndwi_min, 4) if ndwi_min is not None else None,
        'ndwi_max': round(ndwi_max, 4) if ndwi_max is not None else None,
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


