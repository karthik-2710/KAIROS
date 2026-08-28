import os
import sys
import json
import base64
import unittest
import cv2
import numpy as np
from pathlib import Path

# Add backend and project root to sys.path
project_root = Path(__file__).resolve().parent.parent
backend_dir = project_root / 'KAIROS' / 'KAIROS' / 'backend'
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(project_root))

from app import create_app
from app.ai.leaf_detector import detect_leaves, crop_leaves, prepare_image
from app.utils.auth import generate_token

class TestLeafDetectionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        
        # Create a synthetic green leaf image on neutral background for test verification
        img = np.full((480, 640, 3), 220, dtype=np.uint8) # light grey background
        # Draw a synthetic green leaf ellipse
        cv2.ellipse(img, (320, 240), (120, 70), 30, 0, 360, (34, 139, 34), -1)
        cv2.line(img, (200, 200), (440, 280), (0, 100, 0), 3) # main vein
        cls.synthetic_img = img
        
        # Also select a real sample image from test dataset
        test_dir = project_root / 'datasets' / 'kairos_leaf_detection' / 'images' / 'test'
        if not test_dir.exists():
            test_dir = project_root / 'data for KAIROS' / 'leaf detection' / 'train'
        test_imgs = list(test_dir.glob('*.jpg'))
        cls.real_img_path = test_imgs[0] if test_imgs else None

    def test_01_existing_disease_models_untouched(self):
        """Verify existing KAIROS disease models remain intact and unmodified."""
        production_models_dir = project_root / 'AI-Training' / 'models' / 'production'
        self.assertTrue(production_models_dir.exists(), "Production disease models directory must exist")
        
        expected_crops = ['rice_v1.0.0', 'banana_v1.0.0', 'cotton_v1.0.0', 'wheat_v1.0.0', 'sugarcane_v1.0.0']
        for crop_dir_name in expected_crops:
            crop_dir = production_models_dir / crop_dir_name
            self.assertTrue(crop_dir.exists(), f"Crop model directory {crop_dir_name} must exist")
            model_files = list(crop_dir.glob('*.pt')) + list(crop_dir.glob('*.pth'))
            self.assertTrue(len(model_files) > 0, f"Disease model file must exist in {crop_dir_name}")

    def test_02_detect_leaves_function(self):
        """Test detect_leaves() on test dataset images."""
        if not self.real_img_path:
            self.skipTest("No test image found")
            
        detections, diag = detect_leaves(self.real_img_path, conf_threshold=0.20)
        self.assertIsInstance(detections, list)
        self.assertIn("latency_ms", diag)
        self.assertIn("leaf_count", diag)
        
        for det in detections:
            self.assertEqual(det["class"], "leaf", "Class must be strictly 'leaf'")
            self.assertIn("confidence", det)
            self.assertIn("bbox", det)
            self.assertEqual(len(det["bbox"]), 4)
            x1, y1, x2, y2 = det["bbox"]
            self.assertGreaterEqual(x1, 0)
            self.assertGreaterEqual(y1, 0)
            self.assertGreater(x2, x1)
            self.assertGreater(y2, y1)

    def test_03_crop_leaves_function(self):
        """Test crop_leaves() creates valid sub-images for downstream disease models."""
        if not self.real_img_path:
            self.skipTest("No test image found")
            
        detections, _ = detect_leaves(self.real_img_path, conf_threshold=0.20)
        if not detections:
            # Fallback with dummy box
            detections = [{"class": "leaf", "confidence": 0.9, "bbox": [50, 50, 200, 200]}]
            
        crops = crop_leaves(self.real_img_path, detections)
        self.assertIsInstance(crops, list)
        for crop_info in crops:
            self.assertIn("cropped_image", crop_info)
            crop_mat = crop_info["cropped_image"]
            self.assertIsInstance(crop_mat, np.ndarray)
            self.assertGreater(crop_mat.shape[0], 0)
            self.assertGreater(crop_mat.shape[1], 0)
            self.assertEqual(crop_mat.shape[2], 3)

    def test_04_camera_frame_api_multipart(self):
        """Test POST /camera/frame with multipart image file."""
        # Encode image to bytes
        _, buf = cv2.imencode('.jpg', self.synthetic_img)
        img_bytes = io.BytesIO(buf.tobytes())
        
        data = {
            'image': (img_bytes, 'frame.jpg'),
            'camera_id': 'test_laptop_cam',
            'frame_id': 101,
            'timestamp': 1724800000
        }
        
        resp = self.client.post('/camera/frame', data=data, content_type='multipart/form-data')
        self.assertEqual(resp.status_code, 200)
        res_json = resp.get_json()
        self.assertTrue(res_json.get('success'))
        self.assertEqual(res_json.get('camera_id'), 'test_laptop_cam')
        self.assertEqual(res_json.get('frame_id'), '101')
        self.assertIn('detections', res_json)
        self.assertIn('diagnostics', res_json)

    def test_05_camera_frame_api_base64_json(self):
        """Test POST /camera/frame with JSON base64 frame."""
        _, buf = cv2.imencode('.jpg', self.synthetic_img)
        b64_str = base64.b64encode(buf).decode('utf-8')
        
        payload = {
            'image': f'data:image/jpeg;base64,{b64_str}',
            'camera_id': 'friend_laptop_cam_02',
            'frame_id': 202,
            'timestamp': 1724800010,
            'conf_threshold': 0.2
        }
        
        resp = self.client.post('/camera/frame', json=payload)
        self.assertEqual(resp.status_code, 200)
        res_json = resp.get_json()
        self.assertTrue(res_json.get('success'))
        self.assertEqual(res_json.get('camera_id'), 'friend_laptop_cam_02')
        self.assertEqual(res_json.get('frame_id'), 202)
        self.assertIn('detections', res_json)

if __name__ == '__main__':
    import io
    unittest.main()
