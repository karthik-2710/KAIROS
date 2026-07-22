import io
import numpy as np
from PIL import Image
from app.ai.model_loader import load_model
from app.knowledge_base.diseases import get_disease_info

def predict_disease(image_bytes: bytes) -> dict:
    """
    Run disease prediction on image bytes using the real EfficientNet-B3 model.
    """
    model, class_names, input_shape = load_model()

    if model is None:
        raise RuntimeError("AI model not loaded")

    try:
        print("[Predictor] Received request, validating image...")
        
        # 1. Read uploaded image
        # 2. Convert to RGB
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        print("[Predictor] Image validated and converted to RGB.")
        
        # 3. Resize to dynamic model input size
        if input_shape and len(input_shape) >= 3:
            target_size = (input_shape[1], input_shape[2])
        else:
            target_size = (300, 300)
            
        img = img.resize(target_size)
        print(f"[Predictor] Image resized to {target_size}.")
        
        # 4. Convert to float32
        img_array = np.array(img, dtype=np.float32)
        print("[Predictor] Image converted to float32 NumPy array.")
        
        # 5. Expand dimensions
        img_array = np.expand_dims(img_array, axis=0)
        print(f"[Predictor] Image expanded to batch dimension: {img_array.shape}.")

        # 6. Pass into model.predict()
        print("[Predictor] Running prediction...")
        raw_predictions = model.predict(img_array, verbose=0)
        predictions = raw_predictions[0]
        
        # Calculate top 1 prediction
        class_idx = int(np.argmax(predictions))
        
        if not class_names or class_idx >= len(class_names):
            raise RuntimeError(f"Class index {class_idx} is out of bounds for class names mapping.")
            
        raw_label = class_names[class_idx]
        confidence_score = float(predictions[class_idx])
        confidence_pct = round(confidence_score * 100, 2)
        
        print(f"[Predictor] Prediction complete.")
        print(f"  -> Raw Prediction Shape: {raw_predictions.shape}")
        print(f"  -> Highest Probability: {confidence_score:.4f}")
        print(f"  -> Predicted Class Index: {class_idx}")
        print(f"  -> Mapped Disease Name: {raw_label}")
        print(f"  -> Confidence: {confidence_pct}%")
        
        # Calculate top 3 predictions
        top_3_indices = np.argsort(predictions)[-3:][::-1]
        top_3 = []
        for idx in top_3_indices:
            top_3.append({
                "disease": class_names[idx].replace('_', ' ').strip(),
                "confidence": round(float(predictions[idx]) * 100, 2)
            })
            
        # Parse crop and condition from label
        clean_label = raw_label.replace('___', '_').replace('__', '_')
        parts = clean_label.split('_', 1)
        crop = parts[0].replace('_', ' ') if len(parts) > 0 else 'Unknown Crop'
        condition = parts[1].replace('_', ' ') if len(parts) > 1 else clean_label
        
        is_healthy = 'healthy' in condition.lower()
        status = "Healthy" if is_healthy else "Diseased"
        
        # Get recommendations using the new format
        disease_info = get_disease_info(condition, is_healthy=is_healthy)
        
        # DB backwards compatibility fields
        severity = disease_info.get('Severity', 'Moderate') if not is_healthy else 'None'
        
        print("[Predictor] Response returned successfully.")
        
        return {
            "success": True,
            "disease": condition,
            "confidence": confidence_pct,
            "confidence_score": confidence_score,
            "crop": crop,
            "status": status,
            "top_3": top_3,
            "recommendations": disease_info,  # Passed directly to routes/ai.py
            "description": f"AI model classified the image as {condition} with {confidence_pct}% confidence.",
            # Fields for database inserts in routes/ai.py:
            "severity": severity,
            "healthy": is_healthy,
            "scientific_name": disease_info.get('Scientific_Name', 'N/A')
        }

    except Exception as e:
        import traceback
        print(f"[Predictor] Error during inference:")
        traceback.print_exc()
        raise RuntimeError(f"Prediction failed: {e}")
