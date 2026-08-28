# KAIROS Lightweight YOLO Leaf Detector Model

## Model Specification
- **Task**: Plant Leaf Detection & Bounding Box Localization
- **Class ID**: 0
- **Class Name**: `leaf`
- **Architecture**: Ultralytics YOLOv8n (nano)
- **Pretrained Checkpoint**: `yolov8n.pt` (COCO pre-trained transfer learning)
- **Input Resolution**: 640x640 RGB
- **Compute Hardware**: NVIDIA GeForce RTX 5070 Ti Laptop GPU (11.94 GB VRAM, CUDA 13.2)
- **Training Duration**: 3.28 minutes

## Performance Metrics (Validation Set - 113 images, 568 leaves)
- **Precision**: 0.6128 (61.28%)
- **Recall**: 0.6162 (61.62%)
- **mAP@50**: 0.6578 (65.78%)
- **mAP@50-95**: 0.3965 (39.65%)

## Performance Metrics (Unseen Test Set - 114 images, 599 leaves)
- **Precision**: 0.6816 (68.16%)
- **Recall**: 0.6646 (66.46%)
- **mAP@50**: 0.7244 (72.44%)
- **mAP@50-95**: 0.4356 (43.56%)

## Deployment Role
This model localizes leaf regions in real-time camera/webcam feeds and outputs bounding boxes `[x1, y1, x2, y2]`. Detected leaf regions are cropped and passed downstream to crop-specific KAIROS disease classification models.
