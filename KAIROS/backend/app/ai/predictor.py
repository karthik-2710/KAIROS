import io
import torch
from PIL import Image
from app.ai.model_loader import get_model_for_crop, ModelNotFoundError
from app.ai.model_registry import normalize_crop_name

def predict_disease(image_bytes: bytes, target_crop: str = None) -> dict:
    """
    Run disease prediction on image bytes using the crop-specific PyTorch model.
    """
    norm_crop = normalize_crop_name(target_crop)
    
    try:
        model, class_names, transform = get_model_for_crop(norm_crop)
    except ModelNotFoundError as mne:
        print(f"[Predictor] Crop '{target_crop}' model unavailable: {mne}")
        return {
            "success": False,
            "error": f"No trained model available for crop: {target_crop}",
            "crop": norm_crop,
            "model_status": "UNAVAILABLE"
        }

    if model is None:
        return {
            "success": False,
            "error": f"AI model not loaded for crop: {target_crop}",
            "crop": norm_crop,
            "model_status": "ERROR"
        }

    try:
        print(f"[Predictor] Received request for crop: {target_crop}, validating image...")
        
        # 1. Read uploaded image
        # 2. Convert to RGB
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # 3. Apply PyTorch transforms (Resize, ToTensor, Normalize)
        img_tensor = transform(img).unsqueeze(0)

        # 4. Pass into model
        print("[Predictor] Running prediction...")
        with torch.no_grad():
            raw_predictions = model(img_tensor)
            probabilities = torch.nn.functional.softmax(raw_predictions[0], dim=0)
            
        predictions = probabilities.cpu().numpy()
        class_idx = int(torch.argmax(probabilities).item())
        
        if not class_names or class_idx >= len(class_names):
            raise RuntimeError(f"Class index {class_idx} is out of bounds for class names mapping.")
            
        raw_label = class_names[class_idx]
        confidence_score = float(predictions[class_idx])
        confidence_pct = round(confidence_score * 100, 2)
        
        print(f"[Predictor] Prediction complete.")
        print(f"  -> Predicted Class Index: {class_idx}")
        print(f"  -> Mapped Disease Name: {raw_label}")
        print(f"  -> Confidence: {confidence_pct}%")

        # Confidence Gate / Rejection Mechanism
        if confidence_score < 0.60:
            print("[Predictor] Confidence below threshold. Rejecting as ambiguous.")
            return {
                "success": False,
                "error": "Unable to confidently identify a disease. Please upload a clear crop leaf image.",
                "crop": norm_crop,
                "confidence": confidence_pct
            }
        
        # Calculate top 3 predictions
        import numpy as np
        top_3_indices = np.argsort(predictions)[-3:][::-1]
        top_3 = []
        for idx in top_3_indices:
            top_3.append({
                "class": class_names[idx].replace('_', ' ').strip(),
                "confidence": round(float(predictions[idx]) * 100, 2)
            })
            
        # Parse crop and condition from label
        clean_label = raw_label.replace('___', '_').replace('__', '_')
        parts = clean_label.split('_', 1)
        identified_crop = parts[0].replace('_', ' ') if len(parts) > 0 else target_crop
        condition = parts[1].replace('_', ' ') if len(parts) > 1 else clean_label
        
        is_healthy = 'healthy' in condition.lower()
        
        return {
            "success": True,
            "crop": norm_crop,
            "model_version": f"{norm_crop}_v1.0.0",
            "prediction": condition,
            "confidence": confidence_pct,
            "top_predictions": top_3,
            "healthy": is_healthy
        }

    except Exception as e:
        import traceback
        print(f"[Predictor] Error during inference:")
        traceback.print_exc()
        raise RuntimeError(f"Prediction failed: {e}")
