import time
import base64
import cv2
import numpy as np
from flask import Blueprint, request, jsonify, Response, send_file
from pathlib import Path
from app.ai.leaf_detector import detect_leaves, crop_leaves

camera_bp = Blueprint('camera', __name__)

# Multi-Camera Registry & State
# Key: camera_id -> dict of stream properties
_CAMERAS = {}
_LAST_ACTIVE_CAMERA_ID = "camera_2"

def get_or_create_camera_entry(camera_id: str, default_name: str = None) -> dict:
    global _CAMERAS
    if camera_id not in _CAMERAS:
        friendly_name = default_name or ("Primary Camera (Laptop 1)" if "1" in camera_id or "primary" in camera_id.lower() 
                                          else f"Secondary Camera ({camera_id})")
        _CAMERAS[camera_id] = {
            'id': camera_id,
            'name': friendly_name,
            'raw_frame': None,
            'annotated_jpeg': None,
            'detections': [],
            'diagnostics': {},
            'last_seen': 0,
            'fps': 0.0,
            'frame_count': 0,
            'fps_timestamps': []
        }
    return _CAMERAS[camera_id]

def annotate_frame_boxes(image_bytes: bytes, detections: list, camera_name: str = "Camera") -> bytes:
    """Draws green bounding boxes, confidence badges, and HUD on the frame."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return image_bytes
        
    h, w = img.shape[:2]
    for det in detections:
        x1, y1, x2, y2 = det.get("bbox_raw") or [
            det["bbox"]["x"],
            det["bbox"]["y"],
            det["bbox"]["x"] + det["bbox"]["width"],
            det["bbox"]["y"] + det["bbox"]["height"]
        ]
        conf = det.get("confidence", 0.0)
        
        # Green bounding box
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 220, 0), 2)
        
        # Label badge
        badge = f"LEAF {conf*100:.0f}%"
        (tw, th), _ = cv2.getTextSize(badge, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, max(0, y1 - 22)), (x1 + tw + 6, max(0, y1)), (0, 180, 0), -1)
        cv2.putText(img, badge, (x1 + 3, max(14, y1 - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
                    
    # Overlay HUD on Host Monitor
    hud_text = f"{camera_name} | Leaves: {len(detections)} | GPU YOLO: Realtime"
    cv2.putText(img, hud_text, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, hud_text, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1, cv2.LINE_AA)
    
    _, enc = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return enc.tobytes()


@camera_bp.route('/camera/frame', methods=['POST'])
@camera_bp.route('/api/camera/frame', methods=['POST'])
@camera_bp.route('/camera/leaf-detect', methods=['POST'])
@camera_bp.route('/api/camera/leaf-detect', methods=['POST'])
def handle_camera_frame():
    """
    Receives live camera frames from Camera 1 (Host Laptop), Camera 2 (Friend's Laptop),
    or external network cameras.
    """
    global _LAST_ACTIVE_CAMERA_ID
    
    image_bytes = None
    camera_id = request.form.get('camera_id') or 'camera_2'
    camera_name = request.form.get('camera_name')
    frame_id = request.form.get('frame_id') or int(time.time() * 1000)
    timestamp = request.form.get('timestamp') or int(time.time())
    conf_thresh = request.form.get('conf_threshold', type=float) or 0.25
    
    # 1. Check multipart file upload
    if 'image' in request.files:
        image_bytes = request.files['image'].read()
    elif 'frame' in request.files:
        image_bytes = request.files['frame'].read()
    # 2. Check JSON payload with base64 string
    elif request.is_json:
        json_data = request.get_json() or {}
        camera_id = json_data.get('camera_id', camera_id)
        camera_name = json_data.get('camera_name', camera_name)
        frame_id = json_data.get('frame_id', frame_id)
        timestamp = json_data.get('timestamp', timestamp)
        conf_thresh = float(json_data.get('conf_threshold', conf_thresh))
        
        raw_b64 = json_data.get('image') or json_data.get('frame')
        if raw_b64:
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',', 1)[1]
            try:
                image_bytes = base64.b64decode(raw_b64)
            except Exception as e:
                return jsonify({'success': False, 'error': f'Invalid base64 image data: {str(e)}'}), 400
                
    if not image_bytes or len(image_bytes) < 30:
        return jsonify({'success': False, 'error': 'No image data provided in request'}), 400
        
    try:
        detections, diagnostics = detect_leaves(
            image_input=image_bytes,
            conf_threshold=conf_thresh
        )
        
        formatted_detections = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            formatted_detections.append({
                "class": "leaf",
                "confidence": det["confidence"],
                "bbox": {
                    "x": x1,
                    "y": y1,
                    "width": x2 - x1,
                    "height": y2 - y1
                },
                "bbox_raw": [x1, y1, x2, y2],
                "bbox_normalized": det.get("bbox_normalized")
            })
            
        now = time.time()
        cam = get_or_create_camera_entry(camera_id, camera_name)
        
        # Calculate camera-specific FPS
        cam['fps_timestamps'].append(now)
        if len(cam['fps_timestamps']) > 20:
            cam['fps_timestamps'].pop(0)
        current_fps = round(len(cam['fps_timestamps']) / max(0.001, (now - cam['fps_timestamps'][0])), 1) if len(cam['fps_timestamps']) > 1 else 1.0
        
        cam['raw_frame'] = image_bytes
        cam['annotated_jpeg'] = annotate_frame_boxes(image_bytes, formatted_detections, cam['name'])
        cam['detections'] = formatted_detections
        cam['diagnostics'] = diagnostics
        cam['last_seen'] = now
        cam['fps'] = current_fps
        cam['frame_count'] += 1
        
        _LAST_ACTIVE_CAMERA_ID = camera_id
        
        return jsonify({
            "success": True,
            "camera_id": camera_id,
            "camera_name": cam['name'],
            "frame_id": frame_id,
            "timestamp": timestamp,
            "detections": formatted_detections,
            "diagnostics": diagnostics
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Leaf detection inference failed: {str(e)}"
        }), 500


@camera_bp.route('/camera/list', methods=['GET'])
@camera_bp.route('/api/camera/list', methods=['GET'])
def list_connected_cameras():
    """Returns a list of all active/connected cameras (Primary, Secondary, etc.)."""
    now = time.time()
    cameras_list = []
    
    # Ensure default camera entries exist
    get_or_create_camera_entry('camera_1', 'Primary Camera (Host Laptop)')
    get_or_create_camera_entry('camera_2', "Secondary Camera (Friend's Laptop)")
    
    for cid, cdata in _CAMERAS.items():
        is_active = (now - cdata['last_seen']) < 4.0 if cdata['last_seen'] > 0 else False
        cameras_list.append({
            'id': cid,
            'name': cdata['name'],
            'is_active': is_active,
            'fps': cdata['fps'] if is_active else 0.0,
            'leaf_count': len(cdata['detections']) if is_active else 0,
            'total_frames': cdata['frame_count'],
            'seconds_since_last_frame': round(now - cdata['last_seen'], 1) if cdata['last_seen'] > 0 else None
        })
        
    return jsonify({
        "success": True,
        "cameras": cameras_list,
        "active_camera_id": _LAST_ACTIVE_CAMERA_ID
    }), 200


@camera_bp.route('/camera/live-feed', methods=['GET'])
def live_mjpeg_feed():
    """
    MJPEG live video stream.
    Supports single camera (?camera_id=camera_1 or camera_2)
    or split dual-camera grid (?camera_id=split or ?camera_id=all).
    """
    target_cam_id = request.args.get('camera_id')
    
    def generate():
        while True:
            # Determine which camera to stream
            cam_id = target_cam_id
            if not cam_id or cam_id == 'auto':
                cam_id = _LAST_ACTIVE_CAMERA_ID
                
            if cam_id in ['split', 'all', 'dual']:
                # Generate Side-by-Side Dual Camera Composite View
                now = time.time()
                c1 = _CAMERAS.get('camera_1')
                c2 = _CAMERAS.get('camera_2') or _CAMERAS.get('friend_laptop_camera')
                
                # Decode c1 frame or create placeholder
                img1 = None
                if c1 and c1.get('annotated_jpeg') and (now - c1['last_seen'] < 5.0):
                    arr1 = np.frombuffer(c1['annotated_jpeg'], np.uint8)
                    img1 = cv2.imdecode(arr1, cv2.IMREAD_COLOR)
                if img1 is None:
                    img1 = np.zeros((360, 480, 3), dtype=np.uint8)
                    cv2.putText(img1, "Camera 1 (Primary) Idle", (40, 180),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 150), 1, cv2.LINE_AA)
                else:
                    img1 = cv2.resize(img1, (480, 360))
                    
                # Decode c2 frame or create placeholder
                img2 = None
                if c2 and c2.get('annotated_jpeg') and (now - c2['last_seen'] < 5.0):
                    arr2 = np.frombuffer(c2['annotated_jpeg'], np.uint8)
                    img2 = cv2.imdecode(arr2, cv2.IMREAD_COLOR)
                if img2 is None:
                    img2 = np.zeros((360, 480, 3), dtype=np.uint8)
                    cv2.putText(img2, "Camera 2 (Secondary) Idle", (40, 180),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 150), 1, cv2.LINE_AA)
                else:
                    img2 = cv2.resize(img2, (480, 360))
                    
                # Horizontal split concatenation
                composite = np.hstack([img1, img2])
                _, enc = cv2.imencode('.jpg', composite, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = enc.tobytes()
            else:
                cam = _CAMERAS.get(cam_id)
                frame_bytes = cam.get('annotated_jpeg') if cam else None
                
                if frame_bytes is None:
                    blank = np.zeros((480, 640, 3), dtype=np.uint8)
                    c_name = cam.get('name') if cam else cam_id
                    cv2.putText(blank, f"Awaiting Stream for [{c_name}]...", (50, 240),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2, cv2.LINE_AA)
                    _, enc = cv2.imencode('.jpg', blank)
                    frame_bytes = enc.tobytes()
                    
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.06)
            
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


@camera_bp.route('/camera/stats', methods=['GET'])
def get_camera_stats():
    """Returns live multi-camera telemetry."""
    now = time.time()
    cameras_status = {}
    
    for cid, cdata in _CAMERAS.items():
        is_act = (now - cdata['last_seen']) < 4.0 if cdata['last_seen'] > 0 else False
        cameras_status[cid] = {
            'id': cid,
            'name': cdata['name'],
            'is_active': is_act,
            'fps': cdata['fps'] if is_act else 0.0,
            'leaf_count': len(cdata['detections']) if is_act else 0,
            'frame_count': cdata['frame_count'],
            'latest_diagnostics': cdata['diagnostics'] if is_act else {},
            'latest_detections': cdata['detections'] if is_act else []
        }
        
    return jsonify({
        "success": True,
        "active_camera_id": _LAST_ACTIVE_CAMERA_ID,
        "cameras": cameras_status
    }), 200


@camera_bp.route('/camera/scan', methods=['POST'])
@camera_bp.route('/api/camera/scan', methods=['POST'])
def scan_leaf():
    """
    Two-Stage AI Leaf Scan Pipeline:
      Stage 1: YOLO Leaf Detector localizes the plant leaf bounding box
      Stage 2: Leaf Cropper extracts clean leaf sub-image
      Stage 3: KAIROS Crop Disease Classifier evaluates crop health, disease condition, and treatments
      Stage 4: Results are saved to predictions and analysis history
    """
    import os
    import io
    from app.ai.predictor import predict_disease
    from app.database.db import get_db
    
    image_bytes = None
    crop = request.form.get('crop') or request.args.get('crop') or 'Rice'
    camera_id = request.form.get('camera_id') or request.args.get('camera_id') or _LAST_ACTIVE_CAMERA_ID
    farm_id = request.form.get('farm_id', type=int) or 1
    
    if request.is_json:
        json_data = request.get_json() or {}
        crop = json_data.get('crop', crop)
        camera_id = json_data.get('camera_id', camera_id)
        farm_id = json_data.get('farm_id', farm_id)
        raw_b64 = json_data.get('image') or json_data.get('frame')
        if raw_b64:
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',', 1)[1]
            try:
                image_bytes = base64.b64decode(raw_b64)
            except Exception as e:
                return jsonify({'success': False, 'error': f'Invalid base64 image data: {str(e)}'}), 400
    elif 'image' in request.files:
        image_bytes = request.files['image'].read()
    elif 'frame' in request.files:
        image_bytes = request.files['frame'].read()

    # Fallback to selected camera's latest live frame
    if image_bytes is None:
        target_cam = _CAMERAS.get(camera_id) or _CAMERAS.get(_LAST_ACTIVE_CAMERA_ID)
        if target_cam and target_cam.get('raw_frame'):
            image_bytes = target_cam['raw_frame']
            
    if not image_bytes or len(image_bytes) < 50:
        return jsonify({'success': False, 'error': f'No image frame available for camera: {camera_id}'}), 400
        
    t_start = time.time()
    
    try:
        # Stage 1: YOLO Leaf Detection
        detections, yolo_diag = detect_leaves(image_bytes, conf_threshold=0.20)
        
        leaf_crop_b64 = None
        target_leaf_bytes = image_bytes
        selected_bbox = None
        
        if detections and len(detections) > 0:
            # Stage 2: Extract top detected leaf crop
            crops = crop_leaves(image_bytes, detections, margin_ratio=0.05)
            if crops and len(crops) > 0:
                best_crop = crops[0]
                crop_mat = best_crop["cropped_image"]
                selected_bbox = best_crop["bbox"]
                _, crop_enc = cv2.imencode('.jpg', crop_mat, [cv2.IMWRITE_JPEG_QUALITY, 90])
                target_leaf_bytes = crop_enc.tobytes()
                leaf_crop_b64 = f"data:image/jpeg;base64,{base64.b64encode(target_leaf_bytes).decode('utf-8')}"
                
        # Stage 3: KAIROS Crop Disease Classifier
        disease_res = predict_disease(target_leaf_bytes, target_crop=crop)
        total_time_ms = round((time.time() - t_start) * 1000.0, 1)
        
        disease_name = disease_res.get('prediction', 'Healthy')
        confidence = disease_res.get('confidence', 92.0)
        is_healthy = disease_res.get('healthy', 'healthy' in disease_name.lower())
        severity = "None" if is_healthy else ("Severe" if confidence > 85 else "Moderate")
        
        treatment_advisory = None
        if not is_healthy:
            advisories = {
                "Blast": "Apply Tricyclazole 75% WP @ 0.6 g/L or Azoxystrobin 25% SC @ 1.0 mL/L. Ensure balanced nitrogen fertilization.",
                "Bacterial Leaf Blight": "Spray Streptocycline @ 0.5 g/L + Copper Oxychloride 50% WP @ 2.5 g/L. Drain excess standing water.",
                "Brown Spot": "Apply Mancozeb 75% WP @ 2.0 g/L or Propiconazole 25% EC @ 1.0 mL/L. Apply muriate of potash to alleviate nutritional stress.",
                "Sheath Blight": "Spray Validamycin 3% L @ 2.5 mL/L or Hexaconazole 5% SC @ 2.0 mL/L near the plant base.",
                "Rust": "Apply Mancozeb 75% WP @ 2.0 g/L or Tebuconazole 25.9% EC @ 1.0 mL/L at first appearance of pustules.",
                "Canker": "Spray Copper Oxychloride 50% WP @ 3.0 g/L + Streptocycline @ 0.5 g/L during active leaf flush."
            }
            treatment_advisory = advisories.get(disease_name, f"Consult ICAR/KAU package of practices for {crop} {disease_name}. Apply approved broad-spectrum bio-fungicide.")
            
        # Save scan to database
        db = get_db()
        try:
            db.execute(
                """INSERT INTO predictions (farm_id, image_path, disease, confidence, severity, description)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (farm_id, f"camera_scan_{camera_id}_{int(time.time())}.jpg", disease_name, confidence,
                 severity, treatment_advisory or "Crop leaf healthy.")
            )
            db.commit()
        except Exception as dbe:
            print("[CameraScan] DB log skipped:", dbe)
        finally:
            db.close()
            
        return jsonify({
            "success": True,
            "camera_id": camera_id,
            "crop": crop,
            "disease": disease_name,
            "is_healthy": is_healthy,
            "confidence": confidence,
            "severity": severity,
            "treatment_advisory": treatment_advisory,
            "top_predictions": disease_res.get('top_predictions', []),
            "leaf_detected": len(detections) > 0,
            "leaf_count": len(detections),
            "leaf_bbox": selected_bbox,
            "leaf_crop_thumbnail": leaf_crop_b64,
            "total_latency_ms": total_time_ms,
            "yolo_latency_ms": yolo_diag.get('latency_ms', 0)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"AI Leaf Scan failed: {str(e)}"
        }), 500


@camera_bp.route('/camera/monitor', methods=['GET'])
def host_camera_monitor_dashboard():
    """
    Multi-Camera Interactive Host Dashboard:
    Allows selecting between Camera 1 (Primary), Camera 2 (Secondary/Friend), or Split-View Grid,
    and triggering AI leaf diagnosis on any active camera.
    """
    html_dashboard = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAIROS Host — Multi-Camera AI Leaf Monitor</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      background: #090d16; color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; min-height: 100vh;
    }
    header {
      width: 100%;
      background: linear-gradient(90deg, #064e3b, #0f172a 60%, #1e1b4b);
      padding: 16px 24px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
    
    /* Camera Selector Tabs */
    .cam-nav {
      display: flex; gap: 8px; background: #0f172a; padding: 6px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .cam-tab {
      background: transparent; color: #94a3b8; border: none; padding: 8px 16px;
      border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.2s;
    }
    .cam-tab:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .cam-tab.active { background: #10b981; color: #fff; box-shadow: 0 2px 8px rgba(16,185,129,0.4); }
    
    .grid {
      display: grid; grid-template-columns: 1fr 340px; gap: 20px;
      width: 95%; max-width: 1300px; margin: 20px auto;
    }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    
    .video-card {
      background: #131b2e; border-radius: 20px; overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08);
      position: relative;
    }
    .video-header {
      padding: 12px 18px; background: rgba(0,0,0,0.3);
      display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #94a3b8;
    }
    .stream-img {
      width: 100%; height: auto; display: block; background: #000;
      aspect-ratio: 4/3; object-fit: contain;
    }
    
    .side-panel { display: flex; flex-direction: column; gap: 16px; }
    .card {
      background: #131b2e; border-radius: 18px; padding: 18px;
      border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .card h3 { margin: 0 0 12px; font-size: 14px; font-weight: 800; color: #e2e8f0; }
    
    .metric-row {
      display: flex; justify-content: space-between; padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;
    }
    .metric-row:last-child { border: none; }
    .metric-label { color: #94a3b8; }
    .metric-value { font-weight: 800; color: #38bdf8; }
    .metric-value.green { color: #34d399; font-size: 16px; }
    
    .detections-list { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .det-item {
      background: rgba(255,255,255,0.04); border-radius: 10px; padding: 8px 12px;
      display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700;
      border-left: 3px solid #10b981;
    }
    .det-conf { background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 6px; border-radius: 6px; font-size: 11px; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span style="font-size: 24px;">🌿</span>
      <div>
        <h1>KAIROS Multi-Camera Monitor</h1>
        <div style="font-size: 11px; color: #94a3b8;">GPU YOLOv8 Leaf Detection & Multi-View Hub</div>
      </div>
    </div>
    
    <!-- Camera Switcher Nav -->
    <div class="cam-nav">
      <button id="tabCam1" class="cam-tab" onclick="switchCameraView('camera_1')">🎥 Camera 1 (Primary)</button>
      <button id="tabCam2" class="cam-tab active" onclick="switchCameraView('camera_2')">📹 Camera 2 (Secondary)</button>
      <button id="tabSplit" class="cam-tab" onclick="switchCameraView('split')">🔲 Dual Split View</button>
    </div>
  </header>

  <div class="grid">
    <div class="video-card">
      <div class="video-header">
        <span id="activeCamTitle">SELECTED: CAMERA 2 (SECONDARY / FRIEND LAPTOP)</span>
        <span id="fpsBadge" style="color: #34d399;">0.0 FPS</span>
      </div>
      
      <!-- Live Video Stream -->
      <img id="mainStreamImg" class="stream-img" src="/camera/live-feed?camera_id=camera_2" alt="KAIROS Live Stream">
      
      <!-- Action Bar -->
      <div style="padding: 14px 18px; background: #0f172a; display: flex; gap: 12px; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; gap: 8px; align-items: center;">
          <label style="font-size: 12px; font-weight: 700; color: #94a3b8;">CROP:</label>
          <select id="cropSelect" style="background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 13px;">
            <option value="Rice">🌾 Rice (Paddy)</option>
            <option value="Cotton">🌱 Cotton</option>
            <option value="Banana">🍌 Banana</option>
            <option value="Soybean">🫘 Soybean</option>
            <option value="Wheat">🌾 Wheat</option>
            <option value="Sugarcane">🎋 Sugarcane</option>
            <option value="Onion">🧅 Onion</option>
            <option value="Orange">🍊 Orange (Citrus)</option>
            <option value="Bajra">🌾 Bajra (Pearl Millet)</option>
          </select>
        </div>
        <button id="btnScan" onclick="triggerAiScan()" style="background: #10b981; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
          📸 AI Leaf Scan & Diagnose Active Cam
        </button>
      </div>
    </div>

    <div class="side-panel">
      <!-- AI Diagnosis Result Card -->
      <div class="card" id="diagnosisCard" style="display: none; border-color: #10b981; background: #0d231a;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #34d399;">🌿 AI Diagnosis Result</h3>
          <span id="resBadge" style="font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 800; background: #065f46; color: #a7f3d0;">HEALTHY</span>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
          <img id="resThumb" src="" style="width: 72px; height: 72px; border-radius: 10px; object-fit: cover; border: 2px solid #34d399; background: #000;">
          <div>
            <div id="resDisease" style="font-size: 16px; font-weight: 900; color: #ffffff;">Healthy Leaf</div>
            <div id="resCrop" style="font-size: 12px; color: #94a3b8;">Crop: Rice</div>
            <div id="resConf" style="font-size: 12px; font-weight: 700; color: #38bdf8; margin-top: 2px;">Confidence: 95.4%</div>
          </div>
        </div>
        <div id="resTreatmentBox" style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; font-size: 11px; line-height: 1.4; color: #cbd5e1; border-left: 3px solid #34d399;">
          <strong style="color: #34d399;">Advisory:</strong> <span id="resTreatment">No pathogens detected. Leaf is healthy.</span>
        </div>
      </div>

      <!-- Real-Time Camera Telemetry -->
      <div class="card">
        <h3>⚡ Multi-Camera Telemetry</h3>
        <div class="metric-row">
          <span class="metric-label">Active Camera</span>
          <span class="metric-value" id="statCamName" style="color: #a7f3d0;">Camera 2 (Secondary)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Leaves Localized</span>
          <span class="metric-value green" id="statLeaves">0</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">YOLO Inference Latency</span>
          <span class="metric-value" id="statLatency">0 ms</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Total Frames Streamed</span>
          <span class="metric-value" id="statFrames">0</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Camera 1 Status</span>
          <span class="metric-value" id="statCam1">Idle</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Camera 2 Status</span>
          <span class="metric-value" id="statCam2" style="color: #34d399;">Streaming Live</span>
        </div>
      </div>

      <div class="card">
        <h3>🔍 Live Detected Leaves</h3>
        <div class="detections-list" id="detList">
          <div style="font-size: 12px; color: #64748b; text-align: center; padding: 20px 0;">
            No leaves currently in frame
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentSelectedCam = 'camera_2';

    function switchCameraView(camId) {
      currentSelectedCam = camId;
      document.getElementById('tabCam1').className = (camId === 'camera_1') ? 'cam-tab active' : 'cam-tab';
      document.getElementById('tabCam2').className = (camId === 'camera_2') ? 'cam-tab active' : 'cam-tab';
      document.getElementById('tabSplit').className = (camId === 'split') ? 'cam-tab active' : 'cam-tab';
      
      const img = document.getElementById('mainStreamImg');
      img.src = `/camera/live-feed?camera_id=${camId}&_t=${Date.now()}`;
      
      const title = document.getElementById('activeCamTitle');
      if (camId === 'camera_1') title.innerText = 'SELECTED: CAMERA 1 (PRIMARY / HOST LAPTOP)';
      else if (camId === 'camera_2') title.innerText = 'SELECTED: CAMERA 2 (SECONDARY / FRIEND LAPTOP)';
      else title.innerText = 'DUAL SPLIT VIEW: CAMERA 1 + CAMERA 2 (SIMULTANEOUS)';
    }

    async function updateTelemetry() {
      try {
        const resp = await fetch('/camera/stats');
        if (resp.ok) {
          const data = await resp.json();
          const cams = data.cameras || {};
          
          const c1 = cams['camera_1'] || {};
          const c2 = cams['camera_2'] || cams['friend_laptop_camera'] || {};
          
          document.getElementById('statCam1').innerText = c1.is_active ? `Live (${c1.fps} FPS)` : 'Idle';
          document.getElementById('statCam1').style.color = c1.is_active ? '#34d399' : '#94a3b8';
          
          document.getElementById('statCam2').innerText = c2.is_active ? `Live (${c2.fps} FPS)` : 'Idle';
          document.getElementById('statCam2').style.color = c2.is_active ? '#34d399' : '#94a3b8';
          
          const activeCamData = (currentSelectedCam === 'camera_1') ? c1 : c2;
          document.getElementById('statCamName').innerText = (currentSelectedCam === 'camera_1') ? 'Camera 1 (Primary)' : 'Camera 2 (Secondary)';
          document.getElementById('statLeaves').innerText = activeCamData.leaf_count || 0;
          document.getElementById('statLatency').innerText = `${activeCamData.latest_diagnostics?.latency_ms || 0} ms`;
          document.getElementById('statFrames').innerText = activeCamData.frame_count || 0;
          document.getElementById('fpsBadge').innerText = `${activeCamData.fps || 0} FPS`;
          
          const list = document.getElementById('detList');
          const dets = activeCamData.latest_detections || [];
          if (dets.length > 0) {
            list.innerHTML = dets.map((d, i) => `
              <div class="det-item">
                <span>🍃 Leaf #${i + 1} (${d.bbox.width}x${d.bbox.height}px)</span>
                <span class="det-conf">${(d.confidence * 100).toFixed(0)}% Conf</span>
              </div>
            `).join('');
          } else {
            list.innerHTML = '<div style="font-size: 12px; color: #64748b; text-align: center; padding: 12px 0;">No leaves in current camera view</div>';
          }
        }
      } catch (err) {
        console.debug('Telemetry error:', err);
      }
    }
    
    async function triggerAiScan() {
      const btn = document.getElementById('btnScan');
      const crop = document.getElementById('cropSelect').value;
      const targetCam = (currentSelectedCam === 'split') ? 'camera_2' : currentSelectedCam;
      
      btn.innerText = '⏳ Scanning Leaf...';
      btn.disabled = true;
      
      try {
        const resp = await fetch('/camera/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crop: crop, camera_id: targetCam, farm_id: 1 })
        });
        
        if (resp.ok) {
          const res = await resp.json();
          if (res.success) {
            const card = document.getElementById('diagnosisCard');
            card.style.display = 'block';
            
            document.getElementById('resDisease').innerText = res.disease;
            document.getElementById('resCrop').innerText = `Crop: ${res.crop} (${res.camera_id})`;
            document.getElementById('resConf').innerText = `Confidence: ${res.confidence}% (Severity: ${res.severity})`;
            
            if (res.leaf_crop_thumbnail) {
              document.getElementById('resThumb').src = res.leaf_crop_thumbnail;
              document.getElementById('resThumb').style.display = 'block';
            } else {
              document.getElementById('resThumb').style.display = 'none';
            }
            
            const badge = document.getElementById('resBadge');
            const treatBox = document.getElementById('resTreatmentBox');
            if (res.is_healthy) {
              badge.innerText = 'HEALTHY';
              badge.style.background = '#065f46';
              badge.style.color = '#a7f3d0';
              treatBox.style.borderLeftColor = '#34d399';
              document.getElementById('resTreatment').innerText = 'No disease pathogens detected. Leaf tissue is healthy.';
            } else {
              badge.innerText = `${res.severity.toUpperCase()} DISEASE`;
              badge.style.background = '#7f1d1d';
              badge.style.color = '#fca5a5';
              treatBox.style.borderLeftColor = '#ef4444';
              document.getElementById('resTreatment').innerText = res.treatment_advisory || 'Consult local agricultural extension.';
            }
            
            card.scrollIntoView({ behavior: 'smooth' });
          } else {
            alert('AI Scan Message: ' + (res.error || 'Could not complete scan'));
          }
        }
      } catch (err) {
        alert('Scan Error: ' + err.message);
      } finally {
        btn.innerText = '📸 AI Leaf Scan & Diagnose Active Cam';
        btn.disabled = false;
      }
    }
    
    setInterval(updateTelemetry, 500);
    updateTelemetry();
  </script>
</body>
</html>"""
    return html_dashboard, 200, {'Content-Type': 'text/html'}


@camera_bp.route('/download/friend_camera_client.py', methods=['GET'])
@camera_bp.route('/client.py', methods=['GET'])
def download_client_script():
    """Serves the friend_camera_client.py script directly for download."""
    candidate_paths = [
        Path('scripts/friend_camera_client.py').resolve(),
        Path(__file__).resolve().parents[5] / 'scripts' / 'friend_camera_client.py',
        Path(__file__).resolve().parents[4] / 'scripts' / 'friend_camera_client.py',
        Path(__file__).resolve().parents[3] / 'scripts' / 'friend_camera_client.py',
    ]
    for p in candidate_paths:
        if p.exists():
            return send_file(str(p), as_attachment=False, mimetype='text/plain')
    return jsonify({'error': 'Client script not found'}), 404


@camera_bp.route('/camera/streamer', methods=['GET'])
@camera_bp.route('/streamer', methods=['GET'])
def web_camera_streamer():
    """Serves the browser camera streaming page with Camera selection."""
    html_page = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KAIROS Remote Camera Streamer</title>
  <style>
    body {
      margin: 0; padding: 0;
      background: #0f172a; color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; min-height: 100vh;
    }
    header {
      width: 100%; background: linear-gradient(90deg, #1e3a8a, #065f46);
      padding: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    h1 { margin: 0; font-size: 20px; font-weight: 800; }
    p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .container {
      position: relative; margin: 20px auto; max-width: 900px; width: 95%;
      border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.5); background: #000;
    }
    video { display: none; }
    canvas { width: 100%; height: auto; display: block; }
    .hud {
      display: flex; justify-content: space-around; background: #1e293b;
      padding: 12px; border-radius: 12px; width: 95%; max-width: 900px; margin-bottom: 20px;
      font-size: 13px; font-weight: bold;
    }
    .hud-item { text-align: center; }
    .hud-label { color: #94a3b8; font-size: 11px; text-transform: uppercase; }
    .hud-val { color: #34d399; font-size: 16px; margin-top: 2px; }
    .controls { margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
    button {
      background: #10b981; color: #fff; border: none; padding: 10px 20px;
      border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 14px; transition: all 0.2s;
    }
    button:hover { background: #059669; }
    button.stop { background: #ef4444; }
    button.stop:hover { background: #dc2626; }
    select {
      background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px;
      border-radius: 10px; font-weight: bold; font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <h1>🌿 KAIROS Remote Camera Streamer</h1>
    <p>Connected to KAIROS Multi-Camera GPU Host</p>
  </header>

  <div class="container">
    <video id="webcamVideo" autoplay playsinline></video>
    <canvas id="outputCanvas"></canvas>
  </div>

  <div class="hud">
    <div class="hud-item">
      <div class="hud-label">Camera Role</div>
      <div class="hud-val" id="valCamRole">Camera 2 (Secondary)</div>
    </div>
    <div class="hud-item">
      <div class="hud-label">Leaves Detected</div>
      <div class="hud-val" id="valLeaves">0</div>
    </div>
    <div class="hud-item">
      <div class="hud-label">Network RTT</div>
      <div class="hud-val" id="valRtt">0 ms</div>
    </div>
    <div class="hud-item">
      <div class="hud-label">GPU YOLO Latency</div>
      <div class="hud-val" id="valYolo">0 ms</div>
    </div>
    <div class="hud-item">
      <div class="hud-label">Stream Rate</div>
      <div class="hud-val" id="valFps">0 FPS</div>
    </div>
  </div>

  <div class="controls">
    <label style="font-weight: bold; font-size: 13px;">This Device Is:</label>
    <select id="roleSelect" onchange="updateRole()">
      <option value="camera_2" selected>📹 Camera 2 (Secondary / Friend)</option>
      <option value="camera_1">🎥 Camera 1 (Primary)</option>
    </select>
    <button id="btnToggle" onclick="toggleCamera()">🎥 Start Camera Stream</button>
  </div>

  <script>
    const video = document.getElementById('webcamVideo');
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    let isStreaming = false, streamInterval = null, latestDetections = [], isRequestBusy = false, framesSent = 0, lastSendTime = performance.now();
    let selectedCameraId = 'camera_2';

    function updateRole() {
      selectedCameraId = document.getElementById('roleSelect').value;
      document.getElementById('valCamRole').innerText = (selectedCameraId === 'camera_1') ? 'Camera 1 (Primary)' : 'Camera 2 (Secondary)';
    }

    async function toggleCamera() {
      const btn = document.getElementById('btnToggle');
      if (!isStreaming) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'environment' },
            audio: false
          });
          video.srcObject = stream;
          await video.play();
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          isStreaming = true;
          btn.innerText = '⏹️ Stop Camera';
          btn.className = 'stop';
          requestAnimationFrame(renderLoop);
          streamInterval = setInterval(sendFrameToGPU, 100);
        } catch (err) {
          alert('Could not open webcam: ' + err.message);
        }
      } else {
        isStreaming = false;
        clearInterval(streamInterval);
        if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
        btn.innerText = '🎥 Start Camera Stream';
        btn.className = '';
      }
    }

    function renderLoop() {
      if (!isStreaming) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const w = canvas.width, h = canvas.height;
      ctx.drawImage(video, 0, 0, w, h);
      
      for (const det of latestDetections) {
        let x1, y1, x2, y2;
        if (det.bbox_normalized) {
          const [xc, yc, nw, nh] = det.bbox_normalized;
          x1 = (xc - nw / 2) * w;
          y1 = (yc - nh / 2) * h;
          x2 = (xc + nw / 2) * w;
          y2 = (yc + nh / 2) * h;
        } else if (det.bbox) {
          x1 = det.bbox.x; y1 = det.bbox.y;
          x2 = x1 + det.bbox.width; y2 = y1 + det.bbox.height;
        }
        const conf = (det.confidence * 100).toFixed(0);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.fillStyle = '#059669';
        ctx.fillRect(x1, Math.max(0, y1 - 24), 85, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`LEAF ${conf}%`, x1 + 5, Math.max(16, y1 - 7));
      }
      requestAnimationFrame(renderLoop);
    }

    async function sendFrameToGPU() {
      if (!isStreaming || isRequestBusy || video.videoWidth === 0) return;
      isRequestBusy = true;
      const offCanvas = document.createElement('canvas');
      const targetW = Math.min(800, video.videoWidth);
      const scale = targetW / video.videoWidth;
      offCanvas.width = targetW;
      offCanvas.height = video.videoHeight * scale;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
      const base64Data = offCanvas.toDataURL('image/jpeg', 0.8);
      const t0 = performance.now();
      
      try {
        const resp = await fetch('/camera/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            camera_id: selectedCameraId,
            camera_name: (selectedCameraId === 'camera_1') ? 'Primary Camera (Host Laptop)' : 'Secondary Camera (Friend Laptop)',
            frame_id: ++framesSent,
            timestamp: Math.floor(Date.now() / 1000),
            conf_threshold: 0.25
          })
        });
        const rtt = Math.round(performance.now() - t0);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            latestDetections = data.detections || [];
            document.getElementById('valLeaves').innerText = latestDetections.length;
            document.getElementById('valRtt').innerText = `${rtt} ms`;
            document.getElementById('valYolo').innerText = `${data.diagnostics?.latency_ms || 0} ms`;
            const now = performance.now();
            const fps = (1000 / (now - lastSendTime)).toFixed(1);
            lastSendTime = now;
            document.getElementById('valFps').innerText = `${fps} FPS`;
          }
        }
      } catch (err) {
        console.debug('Frame error:', err);
      } finally {
        isRequestBusy = false;
      }
    }
  </script>
</body>
</html>"""
    return html_page, 200, {'Content-Type': 'text/html'}
