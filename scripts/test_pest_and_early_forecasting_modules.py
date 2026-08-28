"""
Automated Verification Script for Pest Detection & Early Forecasting Modules
Validates:
1. YOLO11s live pest detection inference and class mapping.
2. PestEarlyWarningPredictor (7-day & 14-day horizons).
3. KairosDiseasePredictor (7-day & 14-day horizons).
4. Recommendation Engine integration for pest detection and forecasting signals.
5. Multi-language locale dictionary completeness for new modules (EN, MR, HI).
"""
import sys
import json
from pathlib import Path

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "data for KAIROS" / "pests"))
sys.path.insert(0, str(ROOT_DIR / "data for KAIROS" / "pests" / "pest_detector"))
sys.path.insert(0, str(ROOT_DIR / "data for KAIROS" / "diseases"))
sys.path.insert(0, str(ROOT_DIR / "KAIROS" / "KAIROS" / "backend"))

def test_yolo_pest_detection():
    print("[1/5] Testing YOLO11s Pest Detection...")
    from recommendation_engine.adapters.pipeline import KairosMultiModelPipeline
    
    pipeline = KairosMultiModelPipeline()
    test_img = ROOT_DIR / "AI-Training" / "gradcam_Bacterial_Leaf_Blight.jpg"
    assert test_img.exists(), f"Missing test image: {test_img}"

    raw_det, status = pipeline._execute_live_pest_detection(str(test_img), None)
    assert raw_det is not None, f"Failed execution: {status}"
    assert "detections" in raw_det
    assert status["status"] in ["SUCCESS", "NO_PESTS_DETECTED"]
    print(f"  [OK] YOLO11s inference executed: {status}")

def test_pest_forecasting():
    print("[2/5] Testing XGBoost/LightGBM Pest Forecasting...")
    from recommendation_engine.adapters.pipeline import KairosMultiModelPipeline
    
    pipeline = KairosMultiModelPipeline()
    res, status = pipeline._execute_live_pest_forecast(
        crop="Rice",
        pest="Brown Planthopper",
        location="Nagpur Field A",
        pest_value=8.0,
        env={"temperature_c": 29.5, "humidity_pct": 82.0, "rainfall_mm": 5.0},
        growth_stage="Tillering"
    )
    assert res is not None, f"Failed: {status}"
    assert "risk_7d" in res
    assert "risk_14d" in res
    assert "risk_level_7d" in res
    assert "key_factors" in res
    print(f"  [OK] Pest Forecast: 7d={res['risk_7d']*100:.1f}%, 14d={res['risk_14d']*100:.1f}%, Level={res['risk_level_7d']}")

def test_disease_forecasting():
    print("[3/5] Testing XGBoost Disease Forecasting...")
    from recommendation_engine.adapters.pipeline import KairosMultiModelPipeline
    
    pipeline = KairosMultiModelPipeline()
    res, status = pipeline._execute_live_disease_forecast(
        crop="Rice",
        disease="Blast",
        location="Thanjavur Field B",
        severity=12.0,
        env={"temperature_c": 28.0, "humidity_pct": 86.0, "rainfall_mm": 10.0},
        growth_stage="Tillering"
    )
    assert res is not None, f"Failed: {status}"
    assert "risk_7d" in res
    assert "risk_14d" in res
    assert "risk_level_7d" in res
    print(f"  [OK] Disease Forecast: 7d={res['risk_7d']*100:.1f}%, 14d={res['risk_14d']*100:.1f}%, Level={res['risk_level_7d']}")

def test_recommendation_pipeline_integration():
    print("[4/5] Testing Recommendation Engine Multimodal Integration...")
    from recommendation_engine.adapters.pipeline import KairosMultiModelPipeline
    
    pipeline = KairosMultiModelPipeline()
    
    # Test pest detection signal into recommendation engine
    raw_pest = {
        "detections": [{
            "class_id": 1,
            "class_name": "bph",
            "confidence": 0.88,
            "bbox_xyxy": [10, 20, 100, 200]
        }]
    }
    rec_res = pipeline.run_pipeline(
        crop="Rice",
        growth_stage="Tillering",
        raw_pest_detection=raw_pest,
        environment={"temperature_c": 28.0, "humidity_pct": 80.0, "rainfall_mm": 0.0}
    )
    assert rec_res is not None
    assert len(rec_res.recommendations) > 0
    assert "Brown Planthopper" in rec_res.recommendations[0].threat["name"] or "BPH" in rec_res.recommendations[0].threat["name"]
    print(f"  [OK] Recommendation Engine generated verified card for {rec_res.recommendations[0].threat['name']}")

def test_multilingual_dictionaries():
    print("[5/5] Testing Multilingual Locale Dictionaries...")
    locales_dir = ROOT_DIR / "KAIROS" / "KAIROSfrontend" / "src" / "locales"
    
    with open(locales_dir / "en.json", 'r', encoding='utf-8') as f:
        en = json.load(f)
    with open(locales_dir / "mr.json", 'r', encoding='utf-8') as f:
        mr = json.load(f)
    with open(locales_dir / "hi.json", 'r', encoding='utf-8') as f:
        hi = json.load(f)

    required_keys = [
        "Pest Detection", "Early Detection", "Pest Forecast", "Disease Forecast",
        "Forecast Horizon", "Risk Level", "Target Pest", "Target Disease",
        "Run Pest Detection", "Pest Detected", "Upload Pest Image", "Objects",
        "Phenological Stage", "Early Detection & Forecasting", "Precision Ag Intelligence"
    ]
    
    for key in required_keys:
        assert key in en, f"Missing in EN: {key}"
        assert key in mr, f"Missing in MR: {key}"
        assert key in hi, f"Missing in HI: {key}"
    
    print(f"  [OK] All {len(required_keys)} new keys verified in EN, MR, and HI dictionaries.")

if __name__ == "__main__":
    test_yolo_pest_detection()
    test_pest_forecasting()
    test_disease_forecasting()
    test_recommendation_pipeline_integration()
    test_multilingual_dictionaries()
    print("\nALL PEST DETECTION & EARLY FORECASTING TESTS PASSED SUCCESSFULLY!")
