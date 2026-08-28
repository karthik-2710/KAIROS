"""
Comprehensive End-to-End Verification of Crop-Specific AI Model Selection,
Loading, Farm Persistence, and Inference in KAIROS.
"""
import sys
import io
import json
from pathlib import Path

# Add backend to sys.path
backend_path = Path(__file__).resolve().parent.parent / "KAIROS" / "KAIROS" / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import torch
from app import create_app
from app.database.db import get_db, init_db
from app.utils.auth import generate_token
from app.ai.model_registry import model_registry, SUPPORTED_CROPS, normalize_crop_name
from app.ai.model_loader import get_model_for_crop, ModelNotFoundError
from app.ai.predictor import predict_disease


def run_full_verification():
    print("=" * 70)
    print("KAIROS — CROP-SPECIFIC AI MODEL PIPELINE FULL VERIFICATION")
    print("=" * 70)

    # -------------------------------------------------------------------------
    # TEST 1: Model Discovery for all 10 Supported Crops
    # -------------------------------------------------------------------------
    print("\n>>> TEST 1: MODEL DISCOVERY FOR ALL 10 SUPPORTED CROPS")
    discovered = model_registry.discover_models()
    print(f"Total Supported Crops: {len(SUPPORTED_CROPS)}")
    
    test1_passed = True
    for crop in SUPPORTED_CROPS:
        info = model_registry.get_crop_model_info(crop)
        status = info.get("status")
        weight = info.get("weight_path")
        classes_cnt = len(info.get("classes") or [])
        if crop == "Jowar":
            if status != "UNAVAILABLE":
                print(f"  [FAIL] Jowar expected UNAVAILABLE, got {status}")
                test1_passed = False
            else:
                print(f"  [PASS] Jowar       -> UNAVAILABLE (Expected: Pending Training)")
        else:
            if status != "READY" or not weight:
                print(f"  [FAIL] {crop} expected READY, got {status}")
                test1_passed = False
            else:
                print(f"  [PASS] {crop:<12} -> READY | Classes: {classes_cnt:<2} | Weights: {Path(weight).name}")

    assert test1_passed, "Test 1 failed: Model discovery mismatch"

    # -------------------------------------------------------------------------
    # TEST 2: Model Loading & Forward Pass Execution (All Available Crops)
    # -------------------------------------------------------------------------
    print("\n>>> TEST 2: MODEL LOADING & FORWARD PASS EXECUTION")
    test2_passed = True
    for crop in SUPPORTED_CROPS:
        if crop == "Jowar":
            continue
        try:
            model, class_names, transform = get_model_for_crop(crop)
            dummy_input = torch.randn(1, 3, 300, 300)
            with torch.no_grad():
                output = model(dummy_input)
            assert output.shape[1] == len(class_names), f"Shape mismatch: {output.shape[1]} vs {len(class_names)}"
            print(f"  [PASS] {crop:<12} -> PyTorch Model Loaded OK | Output Dim: {output.shape[1]} classes")
        except Exception as e:
            print(f"  [FAIL] {crop:<12} -> Loading/Inference Error: {e}")
            test2_passed = False

    assert test2_passed, "Test 2 failed: Model loading failure"

    # -------------------------------------------------------------------------
    # TEST 3: Jowar Graceful Handling (No 500 crashes)
    # -------------------------------------------------------------------------
    print("\n>>> TEST 3: JOWAR MODEL UNAVAILABLE GRACEFUL HANDLING")
    try:
        get_model_for_crop("Jowar")
        print("  [FAIL] Jowar should have raised ModelNotFoundError")
        test3_passed = False
    except ModelNotFoundError as mne:
        print(f"  [PASS] Jowar raised ModelNotFoundError correctly: '{mne}'")
        test3_passed = True

    # Test predictor directly with Jowar
    dummy_img_bytes = b"fake-image-bytes"
    res = predict_disease(dummy_img_bytes, target_crop="Jowar")
    if not res.get("success") and "No trained model available" in res.get("error", ""):
        print(f"  [PASS] predict_disease() returned structured error response for Jowar (no crash)")
    else:
        print(f"  [FAIL] predict_disease() unexpected response for Jowar: {res}")
        test3_passed = False

    assert test3_passed, "Test 3 failed: Jowar error handling"

    # -------------------------------------------------------------------------
    # TEST 4: Farm Creation & Persistence across All 10 Crops
    # -------------------------------------------------------------------------
    print("\n>>> TEST 4: FARM CREATION & PERSISTENCE (POST /farms -> GET /farms/<id>)")
    app = create_app()
    with app.app_context():
        init_db()
        db = get_db()
        db.execute("INSERT OR IGNORE INTO users (id, name, email, password) VALUES (999, 'Test User', 'tester@kairos.ag', 'hash')")
        db.commit()

    client = app.test_client()
    token = generate_token(999)
    headers = {"Authorization": f"Bearer {token}"}

    test4_passed = True
    farm_ids = {}
    for idx, crop in enumerate(SUPPORTED_CROPS, start=100):
        # Create farm
        farm_payload = {
            "name": f"Test {crop} Farm",
            "crop_type": crop,
            "area_ha": 4.5,
            "polygon": [[20.0, 78.0], [20.1, 78.0], [20.1, 78.1], [20.0, 78.1]]
        }
        post_res = client.post("/farms", json=farm_payload, headers=headers)
        if post_res.status_code not in [200, 201]:
            print(f"  [FAIL] Creating farm for {crop} returned status {post_res.status_code}")
            test4_passed = False
            continue

        # Fetch farm back to verify database persistence
        farms_res = client.get("/farms", headers=headers)
        farms_list = farms_res.get_json()
        saved_farm = next((f for f in farms_list if f["name"] == f"Test {crop} Farm"), None)
        
        if not saved_farm or saved_farm["crop_type"] != crop:
            print(f"  [FAIL] Persistence verification failed for {crop}")
            test4_passed = False
        else:
            farm_ids[crop] = saved_farm["id"]
            # Verify dynamic model association
            resolved_info = model_registry.get_crop_model_info(saved_farm["crop_type"])
            print(f"  [PASS] Farm '{saved_farm['name']}' (ID: {saved_farm['id']}) -> Persisted Crop: '{saved_farm['crop_type']}' -> Model: {resolved_info['version']} ({resolved_info['status']})")

    assert test4_passed, "Test 4 failed: Farm persistence"

    # -------------------------------------------------------------------------
    # TEST 5: Real Image Leaf Inference API Integration (POST /api/ai/analyze-leaf)
    # -------------------------------------------------------------------------
    print("\n>>> TEST 5: REAL LEAF INFERENCE API ENDPOINT (POST /api/ai/analyze-leaf)")
    sample_img_path = Path(__file__).resolve().parent.parent / "AI-Training" / "gradcam_Bacterial_Leaf_Blight.jpg"
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()

    test5_passed = True

    # 5a. Inference on Rice farm -> Must use Rice model (rice_V1.pt)
    rice_farm_id = farm_ids.get("Rice")
    data_rice = {
        "farm_id": rice_farm_id,
        "image": (io.BytesIO(img_bytes), "leaf.jpg")
    }
    res_rice = client.post("/api/ai/analyze-leaf", data=data_rice, content_type="multipart/form-data", headers=headers)
    print(f"  [INFO] POST /api/ai/analyze-leaf (Rice Farm ID {rice_farm_id}) -> Status: {res_rice.status_code}")
    if res_rice.status_code == 200:
        json_rice = res_rice.get_json()
        print(f"  [PASS] Rice Farm Inference Successful! Disease: '{json_rice.get('disease')}' | Confidence: {json_rice.get('confidence')}%")
    else:
        print(f"  [FAIL] Rice Farm Inference failed: {res_rice.get_json()}")
        test5_passed = False

    # 5b. Inference on Cotton farm -> Must use Cotton model (cotton_v1.0.0/model.pt)
    cotton_farm_id = farm_ids.get("Cotton")
    data_cotton = {
        "farm_id": cotton_farm_id,
        "image": (io.BytesIO(img_bytes), "leaf.jpg")
    }
    res_cotton = client.post("/api/ai/analyze-leaf", data=data_cotton, content_type="multipart/form-data", headers=headers)
    print(f"  [INFO] POST /api/ai/analyze-leaf (Cotton Farm ID {cotton_farm_id}) -> Status: {res_cotton.status_code}")
    if res_cotton.status_code == 200:
        json_cotton = res_cotton.get_json()
        print(f"  [PASS] Cotton Farm Inference Successful! Disease: '{json_cotton.get('disease')}' | Confidence: {json_cotton.get('confidence')}%")
    else:
        print(f"  [FAIL] Cotton Farm Inference failed: {res_cotton.get_json()}")
        test5_passed = False

    # 5c. Inference on Jowar farm -> Must return clean response with model unavailable status without 500 crash
    jowar_farm_id = farm_ids.get("Jowar")
    data_jowar = {
        "farm_id": jowar_farm_id,
        "image": (io.BytesIO(img_bytes), "leaf.jpg")
    }
    res_jowar = client.post("/api/ai/analyze-leaf", data=data_jowar, content_type="multipart/form-data", headers=headers)
    print(f"  [INFO] POST /api/ai/analyze-leaf (Jowar Farm ID {jowar_farm_id}) -> Status: {res_jowar.status_code}")
    res_j_json = res_jowar.get_json() or {}
    if res_jowar.status_code == 200 and ("No trained model" in str(res_j_json.get("disease")) or res_j_json.get("ai_model_status") == "UNAVAILABLE"):
        print(f"  [PASS] Jowar Farm Inference correctly returned structured UNAVAILABLE response: '{res_j_json.get('disease')}' (NO 500 CRASH)")
    elif res_jowar.status_code == 422:
        print(f"  [PASS] Jowar Farm Inference correctly returned descriptive 422 error: '{res_j_json.get('error')}' (NO 500 CRASH)")
    else:
        print(f"  [FAIL] Jowar Farm Inference unexpected status/response: {res_jowar.status_code}, {res_j_json}")
        test5_passed = False

    # -------------------------------------------------------------------------
    # TEST 6: GET /api/ai/models endpoint
    # -------------------------------------------------------------------------
    print("\n>>> TEST 6: GET /api/ai/models ENDPOINT")
    res_models = client.get("/api/ai/models")
    if res_models.status_code == 200:
        models_data = res_models.get_json().get("models", [])
        assert len(models_data) == 10, f"Expected 10 models, got {len(models_data)}"
        ready_models = [m["display_name"] for m in models_data if m["status"] == "READY"]
        print(f"  [PASS] GET /api/ai/models returned 10 crops. Ready ({len(ready_models)}): {ready_models}")
    else:
        print(f"  [FAIL] GET /api/ai/models returned status {res_models.status_code}")
        test5_passed = False

    print("\n" + "=" * 70)
    if test1_passed and test2_passed and test3_passed and test4_passed and test5_passed:
        print(">>> ALL 6 VERIFICATION TEST SUITES PASSED (100.0%)! <<<")
        print("=" * 70)
        return True
    else:
        print(">>> SOME VERIFICATION TESTS FAILED! <<<")
        print("=" * 70)
        return False


if __name__ == "__main__":
    success = run_full_verification()
    sys.exit(0 if success else 1)
