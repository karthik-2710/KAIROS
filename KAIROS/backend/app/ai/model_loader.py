import os
import json
import logging
from pathlib import Path
from typing import Tuple, List, Optional, Any
import torch
import torchvision.models as models
from torchvision import transforms

from app.ai.model_registry import model_registry, normalize_crop_name, SUPPORTED_CROPS
from app.ai.classes import CROP_CLASSES

logger = logging.getLogger(__name__)

# Global model cache to avoid reloading models on every inference request
_model_cache: dict = {}


class ModelNotFoundError(RuntimeError):
    """Raised when no trained model weights exist for a requested crop."""
    pass


def get_model_for_crop(crop: str) -> Tuple[Optional[Any], Optional[List[str]], Optional[Any]]:
    """
    Dynamically loads and caches the crop-specific PyTorch model based on the farm's crop.
    
    Args:
        crop: Logical crop name (e.g. 'Rice', 'Cotton', 'Jowar', 'rice')
        
    Returns:
        tuple (model, class_names, transform)
        
    Raises:
        ModelNotFoundError: If the crop is unsupported or has no trained model weights.
    """
    global _model_cache

    if not crop:
        crop = "rice"
        
    crop_normalized = normalize_crop_name(crop)
    
    print(f"\n====================================")
    print(f"KAIROS AI - CROP MODEL ROUTER")
    print(f"====================================")
    print(f"[MODEL] Requested crop: {crop}")
    print(f"[MODEL] Normalized crop: {crop_normalized}")

    # Check memory cache first
    if crop_normalized in _model_cache:
        print(f"[MODEL] Using cached model for: {crop_normalized}")
        print("====================================\n")
        return _model_cache[crop_normalized]

    # Resolve from Model Registry (Single Source of Truth)
    crop_info = model_registry.get_crop_model_info(crop_normalized)
    print(f"[MODEL] Resolved folder: {crop_info.get('folder_path', 'None')}")
    print(f"[MODEL] Resolved model version: {crop_info.get('version', 'N/A')}")
    print(f"[MODEL] Model path: {crop_info.get('weight_path', 'None')}")

    if crop_info.get("status") != "READY" or not crop_info.get("weight_path"):
        err_msg = crop_info.get("error_reason") or f"No trained model available for crop: {crop}"
        print(f"[MODEL] Model validation: FAILED ({err_msg})")
        print("====================================\n")
        raise ModelNotFoundError(err_msg)

    weight_path = Path(crop_info["weight_path"])
    if not weight_path.exists():
        err_msg = f"Model weight file not found at path: {weight_path}"
        print(f"[MODEL] Model validation: FAILED ({err_msg})")
        print("====================================\n")
        raise ModelNotFoundError(err_msg)

    try:
        print(f"[MODEL] Loading weights from: {weight_path.absolute()}")
        
        # 1. Resolve Class Names
        class_names = crop_info.get("classes")
        if not class_names:
            class_names = CROP_CLASSES.get(crop_normalized)
        
        # 2. Load PyTorch checkpoint
        checkpoint = torch.load(str(weight_path.absolute()), map_location='cpu')
        
        if isinstance(checkpoint, dict) and 'classes' in checkpoint:
            class_names = checkpoint['classes']
            
        if not class_names:
            raise ValueError(f"Could not determine class labels for {crop_normalized} model.")

        num_classes = len(class_names)
        print(f"[MODEL] Target classes ({num_classes}): {class_names}")

        # 3. Inspect checkpoint to determine architecture dynamically
        state_dict_to_load = checkpoint.get('model_state_dict', checkpoint) if isinstance(checkpoint, dict) else checkpoint
        
        first_key = list(state_dict_to_load.keys())[0] if hasattr(state_dict_to_load, 'keys') and state_dict_to_load.keys() else ""
        is_timm = first_key.startswith('conv_stem.') or first_key.startswith('blocks.')
        
        feature_dim = 1536  # Default for EfficientNet-B3
        if 'classifier.weight' in state_dict_to_load:
            feature_dim = state_dict_to_load['classifier.weight'].shape[1]
        elif 'classifier.1.weight' in state_dict_to_load:
            feature_dim = state_dict_to_load['classifier.1.weight'].shape[1]
        elif 'fc.weight' in state_dict_to_load:
            feature_dim = state_dict_to_load['fc.weight'].shape[1]

        # 4. Instantiate model architecture
        try:
            import timm
            if feature_dim == 1536:
                model = timm.create_model('efficientnet_b3', pretrained=False, num_classes=num_classes)
                input_size = 300
            else:
                model = timm.create_model('tf_efficientnetv2_s', pretrained=False, num_classes=num_classes)
                input_size = 224
        except Exception:
            # Fallback to torchvision if timm fails
            if feature_dim == 1536:
                model = models.efficientnet_b3(num_classes=num_classes)
                input_size = 300
            else:
                model = models.efficientnet_v2_s(num_classes=num_classes)
                input_size = 224

        # 5. Load weights into model
        try:
            model.load_state_dict(state_dict_to_load)
        except Exception as load_err:
            # Try strict=False if custom classification head differences exist
            logger.warning(f"Strict load failed, retrying with strict=False: {load_err}")
            model.load_state_dict(state_dict_to_load, strict=False)

        model.eval()

        # 6. Standard inference preprocessing transform
        transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])

        # 7. Cache in memory
        _model_cache[crop_normalized] = (model, class_names, transform)
        
        print(f"[MODEL] Model validation: OK")
        print(f"[MODEL] Model loaded: OK (Architecture: EfficientNet | Input Size: {input_size}x{input_size})")
        print("====================================\n")
        
        return _model_cache[crop_normalized]

    except ModelNotFoundError:
        raise
    except Exception as e:
        import traceback
        print(f"[MODEL] Error loading model for {crop_normalized}: {e}")
        traceback.print_exc()
        raise RuntimeError(f"Failed to load AI model for crop '{crop}': {e}")


def clear_model_cache():
    """Clears the in-memory PyTorch model cache."""
    global _model_cache
    _model_cache.clear()
