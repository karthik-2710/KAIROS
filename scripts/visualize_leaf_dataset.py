import os
import ast
import random
import cv2
import pandas as pd
from pathlib import Path

def visualize_samples(n_samples=35, output_dir='research_cache/leaf_dataset_samples'):
    data_dir = Path('data for KAIROS/leaf detection')
    img_dir = data_dir / 'train'
    csv_path = data_dir / 'train.csv'
    
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(csv_path)
    unique_images = df['image_id'].unique()
    
    # Set seed for reproducible sampling
    random.seed(42)
    selected_images = random.sample(list(unique_images), min(n_samples, len(unique_images)))
    
    print(f"Generating visual verification samples for {len(selected_images)} images into '{output_dir}'...")
    
    summary = []
    
    for idx, img_id in enumerate(selected_images, 1):
        img_file = img_dir / img_id
        if not img_file.exists():
            print(f"Warning: Image {img_id} not found on disk")
            continue
            
        img = cv2.imread(str(img_file))
        if img is None:
            print(f"Warning: Failed to load image {img_id}")
            continue
            
        h, w, _ = img.shape
        img_rows = df[df['image_id'] == img_id]
        box_count = len(img_rows)
        
        annotated_img = img.copy()
        
        for _, row in img_rows.iterrows():
            bbox = ast.literal_eval(row['bbox'])
            x, y, bw, bh = [int(v) for v in bbox]
            
            # Draw green bounding box for class 'leaf'
            cv2.rectangle(annotated_img, (x, y), (x + bw, y + bh), (0, 220, 0), 2)
            
            # Label banner
            label_text = "leaf"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated_img, (x, max(0, y - 18)), (x + tw + 6, max(0, y)), (0, 180, 0), -1)
            cv2.putText(annotated_img, label_text, (x + 3, max(12, y - 4)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
                        
        # Add image info overlay
        info_text = f"{img_id} ({w}x{h}) - {box_count} leaves"
        cv2.putText(annotated_img, info_text, (10, 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
        cv2.putText(annotated_img, info_text, (10, 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
                    
        out_file = out_path / f"sample_{idx:02d}_{img_id}"
        cv2.imwrite(str(out_file), annotated_img)
        summary.append({'index': idx, 'image_id': img_id, 'resolution': f"{w}x{h}", 'leaves': box_count, 'output': str(out_file)})
        
    print(f"Successfully generated {len(summary)} visual verification samples.")
    return summary

if __name__ == '__main__':
    visualize_samples()
