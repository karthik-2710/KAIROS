import os
import io
import time
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import List, Dict, Any, Union, Tuple, Optional

# Singleton YOLO leaf detector instance
_YOLO_LEAF_DETECTOR = None
_MODEL_PATH = None

def get_leaf_detector_model():
    """
    Returns the singleton Ultralytics YOLO leaf detector model.
    Loads from models/yolo/kairos_leaf_detector/best.pt.
    """
    global _YOLO_LEAF_DETECTOR, _MODEL_PATH
    if _YOLO_LEAF_DETECTOR is not None:
        return _YOLO_LEAF_DETECTOR
        
    this_file = Path(__file__).resolve()
    candidate_paths = [
        this_file.parents[5] / 'models' / 'yolo' / 'kairos_leaf_detector' / 'best.pt',
        this_file.parents[4] / 'models' / 'yolo' / 'kairos_leaf_detector' / 'best.pt',
        this_file.parents[3] / 'models' / 'yolo' / 'kairos_leaf_detector' / 'best.pt',
        this_file.parents[2] / 'models' / 'yolo' / 'kairos_leaf_detector' / 'best.pt',
        Path('c:/Users/karthi/Documents/proji/models/yolo/kairos_leaf_detector/best.pt'),
        Path('models/yolo/kairos_leaf_detector/best.pt').resolve(),
        Path('runs/detect/kairos_leaf_detect_run/weights/best.pt').resolve(),
    ]
    
    found_path = None
    for p in candidate_paths:
        if p.exists():
            found_path = p
            break
            
    if not found_path:
        raise FileNotFoundError(
            f"KAIROS YOLO Leaf Detector checkpoint (best.pt) not found in candidate paths: {[str(p) for p in candidate_paths]}"
        )
        
    from ultralytics import YOLO
    print(f"[YOLO LEAF DETECTOR] Loading checkpoint from: {found_path}")
    _YOLO_LEAF_DETECTOR = YOLO(str(found_path))
    _MODEL_PATH = found_path
    return _YOLO_LEAF_DETECTOR


def prepare_image(image_input: Union[np.ndarray, Image.Image, str, Path, bytes]) -> np.ndarray:
    """
    Normalizes various image input formats (bytes, PIL, path, numpy array) into a BGR numpy array.
    """
    if isinstance(image_input, (str, Path)):
        img = cv2.imread(str(image_input))
        if img is None:
            raise ValueError(f"Failed to read image from path: {image_input}")
        return img
    elif isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from bytes")
        return img
    elif isinstance(image_input, Image.Image):
        rgb = np.array(image_input)
        if len(rgb.shape) == 2:
            return cv2.cvtColor(rgb, cv2.COLOR_GRAY2BGR)
        elif rgb.shape[2] == 4:
            return cv2.cvtColor(rgb, cv2.COLOR_RGBA2BGR)
        else:
            return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    elif isinstance(image_input, np.ndarray):
        return image_input
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")


def detect_leaves(
    image_input: Union[np.ndarray, Image.Image, str, Path, bytes],
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45,
    device: Optional[Union[str, int]] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Executes lightweight YOLO leaf detection and returns structured leaf bounding boxes.
    
    Returns:
        detections: List of dicts:
            [
                {
                    "class": "leaf",
                    "confidence": 0.94,
                    "bbox": [x1, y1, x2, y2], # absolute pixels
                    "bbox_normalized": [x_center, y_center, w, h] # 0..1
                }
            ]
        diagnostics: Dict with latency_ms, image_width, image_height, leaf_count
    """
    t0 = time.time()
    img_bgr = prepare_image(image_input)
    h_img, w_img = img_bgr.shape[:2]
    
    model = get_leaf_detector_model()
    
    if device is None:
        import torch
        device = 0 if torch.cuda.is_available() else 'cpu'
        
    results = model.predict(
        source=img_bgr,
        conf=conf_threshold,
        iou=iou_threshold,
        device=device,
        verbose=False
    )
    
    latency_ms = (time.time() - t0) * 1000.0
    
    detections: List[Dict[str, Any]] = []
    
    if results and len(results) > 0:
        boxes = results[0].boxes
        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0].cpu().numpy())
                
                x1, y1, x2, y2 = xyxy
                # Safety clamp to image boundaries
                x1 = max(0, min(w_img - 1, int(x1)))
                y1 = max(0, min(h_img - 1, int(y1)))
                x2 = max(x1 + 1, min(w_img, int(x2)))
                y2 = max(y1 + 1, min(h_img, int(y2)))
                
                bw = x2 - x1
                bh = y2 - y1
                
                norm_xc = (x1 + bw / 2.0) / w_img
                norm_yc = (y1 + bh / 2.0) / h_img
                norm_w = bw / w_img
                norm_h = bh / h_img
                
                detections.append({
                    "class": "leaf",
                    "confidence": round(conf, 4),
                    "bbox": [x1, y1, x2, y2],
                    "bbox_normalized": [
                        round(norm_xc, 4),
                        round(norm_yc, 4),
                        round(norm_w, 4),
                        round(norm_h, 4)
                    ]
                })
                
    # Sort detections by confidence descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)
    
    diagnostics = {
        "latency_ms": round(latency_ms, 2),
        "fps_estimate": round(1000.0 / max(0.1, latency_ms), 1),
        "image_width": w_img,
        "image_height": h_img,
        "leaf_count": len(detections)
    }
    
    return detections, diagnostics


def crop_leaves(
    image_input: Union[np.ndarray, Image.Image, str, Path, bytes],
    detections: List[Dict[str, Any]],
    margin_ratio: float = 0.04,
    min_size: int = 32
) -> List[Dict[str, Any]]:
    """
    Crops detected leaf regions from the original image for downstream disease classification models.
    
    Returns:
        List of dicts:
            [
                {
                    "leaf_index": 0,
                    "confidence": 0.94,
                    "bbox": [x1, y1, x2, y2],
                    "cropped_image": np.ndarray (BGR), # ready for disease classifier
                    "crop_width": int,
                    "crop_height": int
                }
            ]
    """
    img_bgr = prepare_image(image_input)
    h_img, w_img = img_bgr.shape[:2]
    
    crops = []
    
    for idx, det in enumerate(detections):
        x1, y1, x2, y2 = det["bbox"]
        
        bw = x2 - x1
        bh = y2 - y1
        
        # Apply safety margin around leaf
        mx = int(bw * margin_ratio)
        my = int(bh * margin_ratio)
        
        crop_x1 = max(0, x1 - mx)
        crop_y1 = max(0, y1 - my)
        crop_x2 = min(w_img, x2 + mx)
        crop_y2 = min(h_img, y2 + my)
        
        cropped = img_bgr[crop_y1:crop_y2, crop_x1:crop_x2]
        
        if cropped.shape[0] < min_size or cropped.shape[1] < min_size:
            # Skip tiny noise crops
            continue
            
        crops.append({
            "leaf_index": idx,
            "confidence": det.get("confidence", 1.0),
            "bbox": [x1, y1, x2, y2],
            "crop_bbox": [crop_x1, crop_y1, crop_x2, crop_y2],
            "cropped_image": cropped,
            "crop_width": cropped.shape[1],
            "crop_height": cropped.shape[0]
        })
        
    return crops
