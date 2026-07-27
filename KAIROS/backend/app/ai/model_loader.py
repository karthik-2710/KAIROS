import os
from pathlib import Path
import torch
import torchvision.models as models
from torchvision import transforms
from config import Config

_model = None
_class_names = None
_transform = None

def load_model():
    """Load the trained PyTorch model, class names, and input transforms (singleton pattern)."""
    global _model, _class_names, _transform

    if _model is not None:
        return _model, _class_names, _transform

    # Look for grape_v1.pt first, then fallback to Config if available
    default_model_path = Path('models/grape_v1.pt')
    
    if hasattr(Config, 'MODEL_PATH'):
        model_path = Path(Config.MODEL_PATH)
        if not model_path.exists():
            model_path = default_model_path
    else:
        model_path = default_model_path
        
    try:
        _class_names = _new_disease_classes()
        
        print("\n====================================")
        print("KAIROS AI")
        print("====================================")
        print("Loading AI model (PyTorch)...\n")
        
        if model_path.exists():
            abs_path = model_path.absolute()
            print(f"Model found at: {abs_path}")
            print("Loading...")
            
            # Instantiate architecture
            _model = models.efficientnet_v2_s(num_classes=len(_class_names))
            
            # Load state dict
            checkpoint = torch.load(abs_path, map_location='cpu')
            if 'model_state_dict' in checkpoint:
                _model.load_state_dict(checkpoint['model_state_dict'])
            else:
                _model.load_state_dict(checkpoint)
                
            _model.eval() # Set to evaluation mode
            
            print("Model loaded successfully.\n")
            
            # Define transforms (Standard ImageNet/EfficientNet transforms)
            _transform = transforms.Compose([
                transforms.Resize((384, 384)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                     std=[0.229, 0.224, 0.225])
            ])
            
            print("====================================")
            print("Model Inspection:")
            print(f"Architecture: EfficientNet-V2-S")
            print(f"Expected image size: 384x384")
            print("====================================\n")
            
            print(f"Classes: {len(_class_names)}\n")
            print("Backend Ready\n")
            print("====================================\n")
        else:
            raise RuntimeError(f"PyTorch model not found at {model_path}")
            
        return _model, _class_names, _transform

    except ImportError:
        print("[AI Model] PyTorch not installed.")
        return None, None, None
    except Exception as e:
        import traceback
        print(f"[AI Model] Error loading model: {e}")
        traceback.print_exc()
        return None, None, None


def _new_disease_classes():
    """The 22 classes from the new PyTorch model."""
    return [
        'Cashew_anthracnose', 'Cashew_gumosis', 'Cashew_healthy', 'Cashew_leaf miner', 
        'Cashew_red rust', 'Cassava_bacterial blight', 'Cassava_brown spot', 
        'Cassava_green mite', 'Cassava_healthy', 'Cassava_mosaic', 'Maize_fall armyworm', 
        'Maize_grasshoper', 'Maize_healthy', 'Maize_leaf beetle', 'Maize_leaf blight', 
        'Maize_leaf spot', 'Maize_streak virus', 'Tomato_healthy', 'Tomato_leaf blight', 
        'Tomato_leaf curl', 'Tomato_septoria leaf spot', 'Tomato_verticulium wilt'
    ]
