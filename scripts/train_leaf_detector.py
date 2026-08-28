import os
import sys
import shutil
import time
import torch
from pathlib import Path
from ultralytics import YOLO

def train_yolo_leaf_detector():
    project_root = Path(__file__).resolve().parent.parent
    data_yaml = project_root / 'datasets' / 'kairos_leaf_detection' / 'data.yaml'
    output_model_dir = project_root / 'models' / 'yolo' / 'kairos_leaf_detector'
    output_model_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("KAIROS YOLO LEAF DETECTOR — TRAINING PIPELINE")
    print("=" * 60)
    
    # 1. GPU / CUDA Diagnostics
    cuda_avail = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_avail else "CPU"
    vram_gb = (torch.cuda.get_device_properties(0).total_memory / (1024**3)) if cuda_avail else 0.0
    cuda_ver = torch.version.cuda if cuda_avail else "N/A"
    
    print(f"PyTorch Version   : {torch.__version__}")
    print(f"CUDA Available    : {cuda_avail}")
    print(f"CUDA Version      : {cuda_ver}")
    print(f"Compute Device    : {device_name}")
    print(f"VRAM Available    : {vram_gb:.2f} GB")
    print(f"Dataset YAML      : {data_yaml}")
    print(f"Target Model Dir  : {output_model_dir}")
    print("-" * 60)
    
    device = 0 if cuda_avail else 'cpu'
    batch_size = 32 if cuda_avail and vram_gb >= 8.0 else 16
    epochs = 60
    imgsz = 640
    
    # 2. Initialize Model with Pretrained Weights (Transfer Learning)
    # Using lightweight YOLOv8n (nano) architecture for ultra-fast edge inference
    model_name = 'yolov8n.pt'
    print(f"Loading pre-trained baseline: {model_name}...")
    model = YOLO(model_name)
    
    start_time = time.time()
    
    # 3. Train Model
    print(f"\nStarting training on {device_name} (Epochs={epochs}, Batch={batch_size}, ImgSize={imgsz})...")
    runs_dir = project_root / 'runs' / 'detect'
    
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        patience=15,
        save=True,
        save_period=-1,
        workers=4,
        project=str(runs_dir),
        name='kairos_leaf_detect_run',
        exist_ok=True,
        pretrained=True,
        optimizer='AdamW',
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        warmup_momentum=0.8,
        # Realistic Agricultural Augmentation
        hsv_h=0.015, # Hue jitter
        hsv_s=0.7,   # Saturation jitter
        hsv_v=0.4,   # Brightness jitter
        degrees=10.0,# Rotation degrees
        translate=0.1, # Translation
        scale=0.2,   # Scale jitter
        fliplr=0.5,  # Horizontal flip
        mosaic=1.0,  # Mosaic augmentation
        verbose=True
    )
    
    train_duration = time.time() - start_time
    print(f"\nTraining completed in {train_duration/60:.2f} minutes ({train_duration:.1f} seconds).")
    
    # 4. Copy best and last checkpoints to KAIROS Model Storage
    train_save_dir = runs_dir / 'kairos_leaf_detect_run'
    best_pt = train_save_dir / 'weights' / 'best.pt'
    last_pt = train_save_dir / 'weights' / 'last.pt'
    
    if best_pt.exists():
        shutil.copy2(best_pt, output_model_dir / 'best.pt')
        print(f"Saved best checkpoint to: {output_model_dir / 'best.pt'}")
    if last_pt.exists():
        shutil.copy2(last_pt, output_model_dir / 'last.pt')
        print(f"Saved last checkpoint to: {output_model_dir / 'last.pt'}")
        
    # Copy training charts and arguments
    for item in ['args.yaml', 'results.csv', 'confusion_matrix.png', 'PR_curve.png', 'F1_curve.png', 'results.png']:
        src_file = train_save_dir / item
        if src_file.exists():
            shutil.copy2(src_file, output_model_dir / item)
            
    # 5. Evaluate on Validation Set
    print("\n" + "=" * 60)
    print("STEP 14: VALIDATION SET EVALUATION")
    print("=" * 60)
    val_model = YOLO(str(output_model_dir / 'best.pt'))
    val_metrics = val_model.val(data=str(data_yaml), split='val', imgsz=imgsz, device=device)
    
    val_p = val_metrics.box.mp
    val_r = val_metrics.box.mr
    val_map50 = val_metrics.box.map50
    val_map50_95 = val_metrics.box.map
    
    print(f"Validation Precision : {val_p:.4f} ({val_p*100:.2f}%)")
    print(f"Validation Recall    : {val_r:.4f} ({val_r*100:.2f}%)")
    print(f"Validation mAP@50    : {val_map50:.4f} ({val_map50*100:.2f}%)")
    print(f"Validation mAP@50-95 : {val_map50_95:.4f} ({val_map50_95*100:.2f}%)")
    
    # 6. Evaluate on Unseen Isolated Test Set
    print("\n" + "=" * 60)
    print("STEP 15: UNBIASED TEST SET EVALUATION")
    print("=" * 60)
    test_metrics = val_model.val(data=str(data_yaml), split='test', imgsz=imgsz, device=device)
    
    test_p = test_metrics.box.mp
    test_r = test_metrics.box.mr
    test_map50 = test_metrics.box.map50
    test_map50_95 = test_metrics.box.map
    
    print(f"Test Set Precision   : {test_p:.4f} ({test_p*100:.2f}%)")
    print(f"Test Set Recall      : {test_r:.4f} ({test_r*100:.2f}%)")
    print(f"Test Set mAP@50      : {test_map50:.4f} ({test_map50*100:.2f}%)")
    print(f"Test Set mAP@50-95   : {test_map50_95:.4f} ({test_map50_95*100:.2f}%)")
    
    # 7. Write Comprehensive Model Readme & Metadata
    readme_content = f"""# KAIROS Lightweight YOLO Leaf Detector Model

## Model Specification
- **Task**: Plant Leaf Detection & Bounding Box Localization
- **Class ID**: 0
- **Class Name**: `leaf`
- **Architecture**: Ultralytics YOLOv8n (nano)
- **Pretrained Checkpoint**: `yolov8n.pt` (COCO pre-trained transfer learning)
- **Input Resolution**: 640x640 RGB
- **Compute Hardware**: {device_name} ({vram_gb:.2f} GB VRAM, CUDA {cuda_ver})
- **Training Duration**: {train_duration/60:.2f} minutes

## Performance Metrics (Validation Set - 113 images, 568 leaves)
- **Precision**: {val_p:.4f} ({val_p*100:.2f}%)
- **Recall**: {val_r:.4f} ({val_r*100:.2f}%)
- **mAP@50**: {val_map50:.4f} ({val_map50*100:.2f}%)
- **mAP@50-95**: {val_map50_95:.4f} ({val_map50_95*100:.2f}%)

## Performance Metrics (Unseen Test Set - 114 images, 599 leaves)
- **Precision**: {test_p:.4f} ({test_p*100:.2f}%)
- **Recall**: {test_r:.4f} ({test_r*100:.2f}%)
- **mAP@50**: {test_map50:.4f} ({test_map50*100:.2f}%)
- **mAP@50-95**: {test_map50_95:.4f} ({test_map50_95*100:.2f}%)

## Deployment Role
This model localizes leaf regions in real-time camera/webcam feeds and outputs bounding boxes `[x1, y1, x2, y2]`. Detected leaf regions are cropped and passed downstream to crop-specific KAIROS disease classification models.
"""
    with open(output_model_dir / 'README.md', 'w') as f:
        f.write(readme_content)
        
    print(f"\nWrote model metadata and documentation to: {output_model_dir / 'README.md'}")
    return {
        'val_p': val_p, 'val_r': val_r, 'val_map50': val_map50, 'val_map50_95': val_map50_95,
        'test_p': test_p, 'test_r': test_r, 'test_map50': test_map50, 'test_map50_95': test_map50_95,
        'duration_mins': train_duration / 60
    }

if __name__ == '__main__':
    train_yolo_leaf_detector()
