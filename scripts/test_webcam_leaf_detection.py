import os
import sys
import time
import argparse
import cv2
import numpy as np
from pathlib import Path

def run_webcam_leaf_detection(model_path=None, camera_index=0, conf_threshold=0.25, save_output=False):
    project_root = Path(__file__).resolve().parent.parent
    if model_path is None:
        model_path = project_root / 'models' / 'yolo' / 'kairos_leaf_detector' / 'best.pt'
    else:
        model_path = Path(model_path)
        
    print("=" * 60)
    print("KAIROS WEBCAM LEAF DETECTION TESTER")
    print("=" * 60)
    print(f"Model Path       : {model_path}")
    print(f"Camera Device    : {camera_index}")
    print(f"Confidence Thresh: {conf_threshold}")
    print("-" * 60)
    
    if not model_path.exists():
        print(f"Error: Model checkpoint not found at {model_path}")
        return False
        
    try:
        from ultralytics import YOLO
        model = YOLO(str(model_path))
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        return False
        
    # Open Webcam
    cap = cv2.VideoCapture(camera_index)
    
    # Check if webcam opened successfully
    if not cap.isOpened():
        print(f"Warning: Could not open webcam device index {camera_index}.")
        print("Falling back to test dataset images playback...")
        return run_test_image_stream(model, project_root, conf_threshold)
        
    # Try reading first test frame
    ret, test_frame = cap.read()
    if not ret or test_frame is None:
        print(f"Warning: Webcam device {camera_index} opened but returned empty frame.")
        cap.release()
        return run_test_image_stream(model, project_root, conf_threshold)
        
    print("\nWebcam successfully connected!")
    print("Press 'ESC' or 'q' in the preview window to exit.")
    print("Starting real-time leaf detection stream...\n")
    
    fps_history = []
    prev_time = time.time()
    
    out_writer = None
    if save_output:
        h, w, _ = test_frame.shape
        out_path = project_root / 'research_cache' / 'webcam_detection_output.mp4'
        out_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(str(out_path), fourcc, 20.0, (w, h))
        print(f"Recording video output to: {out_path}")
        
    frame_count = 0
    total_latency_ms = 0.0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break
                
            frame_count += 1
            t_start = time.time()
            
            # Run YOLO Leaf Detector
            results = model.predict(
                source=frame,
                conf=conf_threshold,
                iou=0.45,
                verbose=False,
                device=0 if os.environ.get('CUDA_VISIBLE_DEVICES', '0') != '-1' else 'cpu'
            )
            
            inf_time_ms = (time.time() - t_start) * 1000.0
            total_latency_ms += inf_time_ms
            
            # Calculate instantaneous and smoothed FPS
            curr_time = time.time()
            instant_fps = 1.0 / max(0.001, (curr_time - prev_time))
            prev_time = curr_time
            fps_history.append(instant_fps)
            if len(fps_history) > 30:
                fps_history.pop(0)
            avg_fps = sum(fps_history) / len(fps_history)
            
            # Parse detections
            annotated_frame = frame.copy()
            leaf_count = 0
            
            if results and len(results) > 0:
                boxes = results[0].boxes
                if boxes is not None and len(boxes) > 0:
                    leaf_count = len(boxes)
                    for box in boxes:
                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        conf = float(box.conf[0].cpu().numpy())
                        cls_id = int(box.cls[0].cpu().numpy())
                        
                        x1, y1, x2, y2 = coords
                        
                        # Draw bounding box
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 220, 0), 2)
                        
                        # Label badge
                        label_str = f"LEAF {conf:.2f}"
                        (tw, th), _ = cv2.getTextSize(label_str, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                        cv2.rectangle(annotated_frame, (x1, max(0, y1 - 22)), (x1 + tw + 8, max(0, y1)), (0, 180, 0), -1)
                        cv2.putText(annotated_frame, label_str, (x1 + 4, max(14, y1 - 5)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
                                    
            # Top HUD Diagnostics Banner
            hud_bg = np.zeros((40, annotated_frame.shape[1], 3), dtype=np.uint8)
            hud_text = f"KAIROS YOLO Leaf Detector | FPS: {avg_fps:.1f} | Latency: {inf_time_ms:.1f}ms | Leaves: {leaf_count}"
            cv2.putText(annotated_frame, hud_text, (12, 26), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(annotated_frame, hud_text, (12, 26), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1, cv2.LINE_AA)
                        
            if out_writer:
                out_writer.write(annotated_frame)
                
            cv2.imshow("KAIROS Live Leaf Detection", annotated_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27 or key == ord('q'): # ESC or q
                print("\nExit key pressed.")
                break
                
    finally:
        cap.release()
        if out_writer:
            out_writer.release()
        cv2.destroyAllWindows()
        
    if frame_count > 0:
        print("\n" + "=" * 60)
        print("WEBCAM SESSION PERFORMANCE SUMMARY")
        print("=" * 60)
        print(f"Total Frames Processed : {frame_count}")
        print(f"Average FPS            : {sum(fps_history)/max(1, len(fps_history)):.1f} FPS")
        print(f"Average Latency        : {total_latency_ms/frame_count:.1f} ms")
        print("=" * 60)
        
    return True

def run_test_image_stream(model, project_root, conf_threshold=0.25):
    """Simulates webcam video stream from test dataset images."""
    test_img_dir = project_root / 'datasets' / 'kairos_leaf_detection' / 'images' / 'test'
    if not test_img_dir.exists():
        test_img_dir = project_root / 'data for KAIROS' / 'leaf detection' / 'train'
        
    test_images = sorted(list(test_img_dir.glob('*.jpg')) + list(test_img_dir.glob('*.png')))
    if not test_images:
        print("No test images available for simulation.")
        return False
        
    print(f"\nRunning simulation test across {len(test_images)} test images...")
    latencies = []
    
    for img_path in test_images[:30]:
        img = cv2.imread(str(img_path))
        if img is None:
            continue
            
        t0 = time.time()
        results = model.predict(source=img, conf=conf_threshold, verbose=False)
        lat_ms = (time.time() - t0) * 1000.0
        latencies.append(lat_ms)
        
    avg_lat = sum(latencies) / len(latencies)
    est_fps = 1000.0 / avg_lat
    print(f"Simulation Test Results: Avg Latency={avg_lat:.2f}ms, Max Theoretical Throughput={est_fps:.1f} FPS")
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="KAIROS Real-Time Webcam Leaf Detector")
    parser.add_argument('--model', type=str, default=None, help="Path to best.pt")
    parser.add_argument('--camera', type=int, default=0, help="Camera device index")
    parser.add_argument('--conf', type=float, default=0.25, help="Confidence threshold")
    parser.add_argument('--save', action='store_true', help="Save video recording")
    args = parser.parse_args()
    
    run_webcam_leaf_detection(
        model_path=args.model,
        camera_index=args.camera,
        conf_threshold=args.conf,
        save_output=args.save
    )
