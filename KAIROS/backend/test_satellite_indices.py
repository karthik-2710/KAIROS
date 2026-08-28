import os
from config import Config
from app.satellite.ndvi_processor import _fetch_real_ndvi

def test_pipeline():
    # Load env for Sentinel Hub credentials if not loaded
    from dotenv import load_dotenv
    load_dotenv()
    Config.SENTINEL_HUB_CLIENT_ID = os.getenv('SENTINEL_HUB_CLIENT_ID')
    Config.SENTINEL_HUB_CLIENT_SECRET = os.getenv('SENTINEL_HUB_CLIENT_SECRET')

    print("Testing Sentinel Hub pipeline with real coordinates...")
    # Mock coordinates of a small farm (e.g., somewhere in central valley CA or a known field)
    # Using a small polygon to minimize processing time
    lats = [37.5, 37.51, 37.51, 37.5]
    lons = [-121.0, -121.0, -120.99, -120.99]
    
    try:
        results = _fetch_real_ndvi(lats, lons)
        print("Results retrieved successfully!")
        
        required_keys = [
            'ndvi_mean', 'ndre_mean', 'ndwi_mean',
            'ndvi_min', 'ndre_min', 'ndwi_min',
            'ndvi_max', 'ndre_max', 'ndwi_max'
        ]
        
        all_present = True
        for key in required_keys:
            if key not in results:
                print(f"MISSING KEY: {key}")
                all_present = False
            else:
                print(f"{key}: {results[key]}")
                
        if all_present:
            print("\nSUCCESS: All new indices (NDVI, NDRE, NDWI) are calculated and returned.")
        else:
            print("\nFAILURE: Some indices are missing.")
            
    except Exception as e:
        print(f"\nERROR running pipeline: {e}")

if __name__ == "__main__":
    test_pipeline()
