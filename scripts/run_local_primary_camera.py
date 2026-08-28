#!/usr/bin/env python3
"""
=============================================================================
KAIROS Local Primary Camera Streamer (Camera 1)
=============================================================================
Streams your own laptop's webcam as Camera 1 (Primary) into the KAIROS
multi-camera hub on localhost.
"""

import sys
import time
import cv2
import requests

def run_primary_camera(server_url="http://localhost:5000", device_id=0):
    endpoint = server_url.rstrip('/') + '/camera/frame'
    print("=" * 60)
    print("      KAIROS LOCAL PRIMARY CAMERA (CAMERA 1)")
    print("=" * 60)
    print(f"Server Target : {endpoint}")
    print(f"Device Index  : {device_id}")
    print("-" * 60)
    
    cap = cv2.VideoCapture(device_id)
    if not cap.isOpened():
        print(f"[ERROR] Could not open local webcam (index {device_id}).")
        return
        
    print("[OK] Local webcam active as Camera 1 (Primary). Streaming to KAIROS...")
    print("Press Ctrl+C or ESC in terminal to stop.\n")
    
    frame_count = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(0.05)
                continue
                
            frame_count += 1
            # Resize slightly for smooth transmission
            if frame.shape[1] > 960:
                scale = 960.0 / frame.shape[1]
                frame = cv2.resize(frame, (0, 0), fx=scale, fy=scale)
                
            _, enc = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            
            try:
                files = {'image': ('cam1.jpg', enc.tobytes(), 'image/jpeg')}
                data = {
                    'camera_id': 'camera_1',
                    'camera_name': 'Primary Camera (Host Laptop)',
                    'frame_id': str(frame_count),
                    'timestamp': str(int(time.time())),
                    'conf_threshold': '0.25'
                }
                requests.post(endpoint, files=files, data=data, timeout=1.5)
            except Exception as e:
                pass
                
            time.sleep(0.08) # ~12 FPS
    finally:
        cap.release()
        print("\nPrimary Camera stopped.")

if __name__ == '__main__':
    run_primary_camera()
