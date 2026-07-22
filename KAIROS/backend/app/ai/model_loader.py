import os
import numpy as np
from pathlib import Path
from config import Config

_model = None
_class_names = None
_input_shape = None

def load_model():
    """Load the trained model, class names, and input shape (singleton pattern)."""
    global _model, _class_names, _input_shape

    if _model is not None:
        return _model, _class_names, _input_shape

    model_path = Path(Config.MODEL_PATH) if hasattr(Config, 'MODEL_PATH') else Path('models/best_model.keras')
    
    try:
        import tensorflow as tf
        
        _class_names = _default_plant_village_classes()
        
        print("\n====================================")
        print("KAIROS AI")
        print("====================================")
        print("Loading AI model...\n")
        
        if model_path.exists():
            abs_path = model_path.absolute()
            print(f"Model found at: {abs_path}")
            print("Loading...")
            _model = tf.keras.models.load_model(str(model_path))
            print("Model loaded successfully.\n")
            
            _input_shape = _model.input_shape
            output_shape = _model.output_shape
            class_count = output_shape[-1]
            
            if _input_shape and len(_input_shape) >= 3:
                expected_size = (_input_shape[1], _input_shape[2])
            else:
                expected_size = "Unknown"
            
            print("====================================")
            print("Model Inspection:")
            print(f"Input Shape: {_input_shape}")
            print(f"Output Shape: {output_shape}")
            print(f"Class Count: {class_count}")
            print(f"Expected image size: {expected_size}")
            print("====================================\n")
            
            print(f"Classes: {len(_class_names)}\n")
            print("Backend Ready\n")
            print("====================================\n")
        else:
            raise RuntimeError(f"TensorFlow model not found at {model_path}")
            
        return _model, _class_names, _input_shape

    except ImportError:
        print("[AI Model] TensorFlow not installed.")
        return None, None, None
    except Exception as e:
        print(f"[AI Model] Error loading model: {e}")
        return None, None, None


def _default_plant_village_classes():
    """Exactly the 15 classes from the newly trained EfficientNet-B3."""
    return [
        "Pepper__bell___Bacterial_spot",
        "Pepper__bell___healthy",
        "Potato___Early_blight",
        "Potato___healthy",
        "Potato___Late_blight",
        "Tomato_Bacterial_spot",
        "Tomato_Early_blight",
        "Tomato_healthy",
        "Tomato_Late_blight",
        "Tomato_Leaf_Mold",
        "Tomato_Septoria_leaf_spot",
        "Tomato_Spider_mites_Two_spotted_spider_mite",
        "Tomato__Target_Spot",
        "Tomato__Tomato_mosaic_virus",
        "Tomato__Tomato_YellowLeaf__Curl_Virus"
    ]
