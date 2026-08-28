import os
import ast
import random
import shutil
import cv2
import pandas as pd
from pathlib import Path

def prepare_yolo_dataset(seed=42, train_pct=0.80, val_pct=0.10, test_pct=0.10):
    project_root = Path(__file__).resolve().parent.parent
    src_data_dir = project_root / 'data for KAIROS' / 'leaf detection'
    src_train_img_dir = src_data_dir / 'train'
    src_csv_path = src_data_dir / 'train.csv'
    
    target_root = project_root / 'datasets' / 'kairos_leaf_detection'
    webcam_infra_dir = project_root / 'datasets' / 'kairos_webcam_leaf'
    
    # Create target directories
    for split in ['train', 'val', 'test']:
        (target_root / 'images' / split).mkdir(parents=True, exist_ok=True)
        (target_root / 'labels' / split).mkdir(parents=True, exist_ok=True)
    webcam_infra_dir.mkdir(parents=True, exist_ok=True)
    
    # Read annotations
    df = pd.read_csv(src_csv_path)
    
    # Group annotations by image_id
    img_to_boxes = {}
    for _, row in df.iterrows():
        img_id = row['image_id']
        w_img = float(row['width'])
        h_img = float(row['height'])
        bbox = ast.literal_eval(row['bbox']) if isinstance(row['bbox'], str) else row['bbox']
        
        x_min, y_min, bw, bh = [float(v) for v in bbox]
        
        # Convert to YOLO format: 0 x_center y_center width height
        x_center = (x_min + bw / 2.0) / w_img
        y_center = (y_min + bh / 2.0) / h_img
        norm_w = bw / w_img
        norm_h = bh / h_img
        
        # Clamp to [0, 1]
        x_center = max(0.0, min(1.0, x_center))
        y_center = max(0.0, min(1.0, y_center))
        norm_w = max(0.001, min(1.0, norm_w))
        norm_h = max(0.001, min(1.0, norm_h))
        
        yolo_line = f"0 {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}"
        
        if img_id not in img_to_boxes:
            img_to_boxes[img_id] = []
        img_to_boxes[img_id].append(yolo_line)
        
    # Get all source images on disk
    all_images = sorted([p.name for p in src_train_img_dir.glob('*.jpg')] + [p.name for p in src_train_img_dir.glob('*.png')])
    print(f"Total source images found: {len(all_images)}")
    
    # Deterministic shuffle
    random.seed(seed)
    shuffled_images = all_images.copy()
    random.shuffle(shuffled_images)
    
    n_total = len(shuffled_images)
    n_train = int(n_total * train_pct)
    n_val = int(n_total * val_pct)
    n_test = n_total - n_train - n_val
    
    train_imgs = shuffled_images[:n_train]
    val_imgs = shuffled_images[n_train:n_train + n_val]
    test_imgs = shuffled_images[n_train + n_val:]
    
    print(f"Dataset Split Plan: Train={len(train_imgs)} ({len(train_imgs)/n_total*100:.1f}%), "
          f"Val={len(val_imgs)} ({len(val_imgs)/n_total*100:.1f}%), "
          f"Test={len(test_imgs)} ({len(test_imgs)/n_total*100:.1f}%)")
          
    splits = {
        'train': train_imgs,
        'val': val_imgs,
        'test': test_imgs
    }
    
    split_stats = {}
    for split_name, img_list in splits.items():
        total_leaves = 0
        copied_images = 0
        
        for img_name in img_list:
            src_img = src_train_img_dir / img_name
            dst_img = target_root / 'images' / split_name / img_name
            shutil.copy2(src_img, dst_img)
            copied_images += 1
            
            # Write label file
            label_name = Path(img_name).stem + '.txt'
            dst_label = target_root / 'labels' / split_name / label_name
            
            boxes = img_to_boxes.get(img_name, [])
            total_leaves += len(boxes)
            with open(dst_label, 'w') as f:
                if boxes:
                    f.write('\n'.join(boxes) + '\n')
                else:
                    f.write('') # background image
                    
        split_stats[split_name] = {'images': copied_images, 'leaves': total_leaves}
        print(f"  [{split_name.upper()}] Written {copied_images} images, {total_leaves} annotated leaves.")
        
    # Generate data.yaml with absolute posix path
    data_yaml_path = target_root / 'data.yaml'
    yaml_content = f"""# KAIROS YOLO Leaf Detector Dataset Configuration
path: {target_root.as_posix()}
train: images/train
val: images/val
test: images/test

# Exactly ONE class: 0 = leaf
names:
  0: leaf
"""
    with open(data_yaml_path, 'w') as f:
        f.write(yaml_content)
        
    print(f"\nCreated data.yaml at: {data_yaml_path}")
    print(f"Webcam infrastructure directory initialized at: {webcam_infra_dir}")
    return split_stats

if __name__ == '__main__':
    prepare_yolo_dataset()
