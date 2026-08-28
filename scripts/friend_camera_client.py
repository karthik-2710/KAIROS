#!/usr/bin/env python3
"""
=============================================================================
KAIROS Remote Camera Client (For Friend's Laptop)
=============================================================================
This script runs on the friend's laptop.
It captures video from the friend's webcam, transmits frames over Wi-Fi / LAN
to the host computer running KAIROS YOLO Leaf Detection GPU server,
and displays the live stream with real-time leaf bounding boxes.

Usage:
  python friend_camera_client.py --server http://192.168.23.26:5000
"""

import sys
import time
import argparse
import cv2
import requests
import numpy as np

def run_friend_camera_client(server_url="http://192.168.23.26:5000", camera_device=0, cam_role_id="camera_2", cam_name="Secondary Camera (Friend Laptop)", target_fps=10, conf_thresh=0.25):
    endpoint = server_url.rstrip('/') + '/camera/frame'
    
    print("=" * 65)
    print("      KAIROS REMOTE WEBCAM CLIENT — FRIEND'S LAPTOP")
    print("=" * 65)
    print(f"Target Server URL : {endpoint}")
    print(f"Camera Role ID    : {cam_role_id} ({cam_name})")
    print(f"Webcam Device ID  : {camera_device}")
    print(f"Target Send Rate  : ~{target_fps} FPS")
    print(f"Confidence Thresh : {conf_thresh}")
    print("-" * 65)
    
    # 1. Test Server Connectivity
    print("[1/3] Testing connection to KAIROS host server...")
    health_url = server_url.rstrip('/') + '/health'
    try:
        resp = requests.get(health_url, timeout=3.0)
        if resp.status_code == 200:
            print(f"  [OK] Successfully reached KAIROS server at {server_url}!")
        else:
            print(f"  [WARN] Server replied with HTTP {resp.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"  [WARN] Could not connect to {server_url} yet: {e}")
        print("  Make sure both laptops are on the SAME Wi-Fi network and the host server is running.")
        print("  Proceeding anyway...\n")

    # 2. Open Local Webcam on Friend's Laptop
    print("[2/3] Opening friend's laptop webcam...")
    cap = cv2.VideoCapture(camera_device)
    if not cap.isOpened():
        print(f"[ERROR] Could not open webcam index {camera_device}.")
        print("Please check camera permissions or try --camera-device 1")
        return
        
    ret, test_frame = cap.read()
    if not ret or test_frame is None:
        print("[ERROR] Webcam opened but failed to capture frame.")
        cap.release()
        return
        
    h_orig, w_orig = test_frame.shape[:2]
    print(f"  [OK] Webcam active! Resolution: {w_orig}x{h_orig}")
    
    print("\n[3/3] Streaming frames to KAIROS YOLO GPU Host...")
    print("Press 'ESC' or 'q' in the preview window to exit.\n")
    
    frame_interval = 1.0 / max(1, target_fps)
    last_send_time = 0
    
    frames_sent = 0
    frames_failed = 0
    rtt_history = []
    yolo_latency_history = []
    
    current_detections = []
    current_diag = {}
    latest_scan_result = None
    
    window_name = "KAIROS Friend Camera — YOLO Leaf Stream"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 800, 600)
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("Failed to grab webcam frame.")
                time.sleep(0.05)
                continue
                
            now = time.time()
            
            # Send frame to host server at controlled rate
            if (now - last_send_time) >= frame_interval:
                last_send_time = now
                frames_sent += 1
                
                # Compress frame to JPEG for fast network transmission
                # Resize slightly for ultra-low latency Wi-Fi transmission if large
                send_mat = frame
                if frame.shape[1] > 960:
                    scale = 960.0 / frame.shape[1]
                    send_mat = cv2.resize(frame, (0, 0), fx=scale, fy=scale)
                    
                _, img_encoded = cv2.imencode('.jpg', send_mat, [cv2.IMWRITE_JPEG_QUALITY, 80])
                
                t_req_start = time.time()
                try:
                    files = {'image': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')}
                    data = {
                        'camera_id': cam_role_id,
                        'camera_name': cam_name,
                        'frame_id': str(frames_sent),
                        'timestamp': str(int(now)),
                        'conf_threshold': str(conf_thresh)
                    }
                    
                    response = requests.post(endpoint, files=files, data=data, timeout=2.0)
                    rtt_ms = (time.time() - t_req_start) * 1000.0
                    
                    if response.status_code == 200:
                        res_data = response.json()
                        if res_data.get('success'):
                            current_detections = res_data.get('detections', [])
                            current_diag = res_data.get('diagnostics', {})
                            rtt_history.append(rtt_ms)
                            if len(rtt_history) > 30:
                                rtt_history.pop(0)
                                
                            yolo_lat = current_diag.get('latency_ms', 0.0)
                            yolo_latency_history.append(yolo_lat)
                            if len(yolo_latency_history) > 30:
                                yolo_latency_history.pop(0)
                    else:
                        frames_failed += 1
                except requests.exceptions.RequestException:
                    frames_failed += 1
                    
            # Draw Detections on Friend's Screen
            annotated_frame = frame.copy()
            h_curr, w_curr = annotated_frame.shape[:2]
            
            leaf_count = 0
            for det in current_detections:
                bbox_norm = det.get("bbox_normalized")
                conf = det.get("confidence", 0.0)
                
                if bbox_norm and len(bbox_norm) == 4:
                    xc, yc, w_norm, h_norm = bbox_norm
                    x1 = int((xc - w_norm / 2.0) * w_curr)
                    y1 = int((yc - h_norm / 2.0) * h_curr)
                    x2 = int((xc + w_norm / 2.0) * w_curr)
                    y2 = int((yc + h_norm / 2.0) * h_curr)
                else:
                    bbox = det.get("bbox", {})
                    if isinstance(bbox, dict):
                        x1 = int(bbox.get("x", 0))
                        y1 = int(bbox.get("y", 0))
                        x2 = x1 + int(bbox.get("width", 0))
                        y2 = y1 + int(bbox.get("height", 0))
                    elif isinstance(bbox, list) and len(bbox) == 4:
                        x1, y1, x2, y2 = [int(v) for v in bbox]
                    else:
                        continue
                        
                x1 = max(0, min(w_curr - 1, x1))
                y1 = max(0, min(h_curr - 1, y1))
                x2 = max(x1 + 1, min(w_curr, x2))
                y2 = max(y1 + 1, min(h_curr, y2))
                
                leaf_count += 1
                
                # Draw Green Leaf Bounding Box
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 220, 0), 2)
                
                # Confidence Badge
                badge_text = f"LEAF {conf:.2f}"
                (tw, th), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(annotated_frame, (x1, max(0, y1 - 20)), (x1 + tw + 6, max(0, y1)), (0, 180, 0), -1)
                cv2.putText(annotated_frame, badge_text, (x1 + 3, max(14, y1 - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
                            
            # Top HUD Diagnostics Banner
            avg_rtt = sum(rtt_history) / max(1, len(rtt_history))
            avg_yolo = sum(yolo_latency_history) / max(1, len(yolo_latency_history))
            
            cv2.rectangle(annotated_frame, (0, 0), (w_curr, 50), (20, 20, 20), -1)
            
            hud_line1 = f"FRIEND CAMERA | Leaves: {leaf_count} | Net RTT: {avg_rtt:.1f}ms | GPU YOLO: {avg_yolo:.1f}ms"
            hud_line2 = f"Press [SPACE] or [S] to Scan & Diagnose Leaf | [ESC] to Exit"
            
            cv2.putText(annotated_frame, hud_line1, (10, 18), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1, cv2.LINE_AA)
            cv2.putText(annotated_frame, hud_line2, (10, 38), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 220, 0), 1, cv2.LINE_AA)
                        
            # Show latest scan diagnosis badge if available
            if latest_scan_result:
                diag_box_h = 40
                y_bot = h_curr - 10
                is_h = latest_scan_result.get('is_healthy', True)
                bg_color = (0, 140, 0) if is_h else (0, 0, 180)
                cv2.rectangle(annotated_frame, (10, y_bot - diag_box_h), (w_curr - 10, y_bot), bg_color, -1)
                scan_text = f"AI SCAN: {latest_scan_result.get('crop')} -> {latest_scan_result.get('disease')} ({latest_scan_result.get('confidence')}%)"
                cv2.putText(annotated_frame, scan_text, (20, y_bot - 14),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
                            
            cv2.imshow(window_name, annotated_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27 or key == ord('q'): # ESC or q
                print("\nExit key pressed.")
                break
            elif key == 32 or key == ord('s') or key == ord('S'): # SPACE or s -> AI Leaf Scan
                print("\n" + "=" * 60)
                print("📸 TRIGGERING TWO-STAGE AI LEAF SCAN & DIAGNOSIS...")
                print("=" * 60)
                scan_url = server_url.rstrip('/') + '/camera/scan'
                _, scan_enc = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
                try:
                    s_files = {'image': ('scan.jpg', scan_enc.tobytes(), 'image/jpeg')}
                    s_data = {'crop': 'Rice', 'farm_id': '1'}
                    s_resp = requests.post(scan_url, files=s_files, data=s_data, timeout=5.0)
                    if s_resp.status_code == 200:
                        latest_scan_result = s_resp.json()
                        print(f"🌿 Crop Target          : {latest_scan_result.get('crop')}")
                        print(f"🔍 Disease Diagnosis    : {latest_scan_result.get('disease')}")
                        print(f"✨ Confidence           : {latest_scan_result.get('confidence')}%")
                        print(f"⚠️ Severity             : {latest_scan_result.get('severity')}")
                        print(f"🍃 Leaves Localized     : {latest_scan_result.get('leaf_count')}")
                        print(f"⏱️ Total Latency         : {latest_scan_result.get('total_latency_ms')} ms")
                        if latest_scan_result.get('treatment_advisory'):
                            print(f"💊 Treatment Advisory   :\n  -> {latest_scan_result.get('treatment_advisory')}")
                    else:
                        print(f"[ERROR] Scan failed with status: {s_resp.status_code} - {s_resp.text}")
                except Exception as ex:
                    print(f"[ERROR] Scan request error: {ex}")
                print("=" * 60 + "\n")
                
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
    print("\n" + "=" * 65)
    print("SESSION COMPLETE — NETWORK CAMERA SUMMARY")
    print("=" * 65)
    print(f"Total Frames Transmitted : {frames_sent}")
    print(f"Failed / Dropped Frames  : {frames_failed}")
    if rtt_history:
        print(f"Average Network RTT Latency: {sum(rtt_history)/len(rtt_history):.1f} ms")
    if yolo_latency_history:
        print(f"Average YOLO GPU Latency   : {sum(yolo_latency_history)/len(yolo_latency_history):.1f} ms")
    print("=" * 65)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="KAIROS Multi-Camera Client")
    parser.add_argument('--server', type=str, default="http://192.168.23.26:5000", 
                        help="KAIROS host server URL (e.g. http://192.168.23.26:5000)")
    parser.add_argument('--camera-device', type=int, default=0, help="Webcam device hardware index (default: 0)")
    parser.add_argument('--camera-id', type=str, default="camera_2", 
                        help="Logical camera role: 'camera_1' (Primary) or 'camera_2' (Secondary) (default: camera_2)")
    parser.add_argument('--camera-name', type=str, default="Secondary Camera (Friend Laptop)", 
                        help="Friendly display name for this camera")
    parser.add_argument('--fps', type=int, default=10, help="Target transmission frame rate (default: 10)")
    parser.add_argument('--conf', type=float, default=0.25, help="Confidence threshold (default: 0.25)")
    args = parser.parse_args()
    
    run_friend_camera_client(
        server_url=args.server,
        camera_device=args.camera_device,
        cam_role_id=args.camera_id,
        cam_name=args.camera_name,
        target_fps=args.fps,
        conf_thresh=args.conf
    )
