import sys
from pathlib import Path
import pandas as pd
import traceback

# Add CatBoost project to sys path
cb_path = str(Path(r"c:\Users\karthi\Documents\proji\Agricultural-Recommendation-AI"))
if cb_path not in sys.path:
    sys.path.append(cb_path)

try:
    from src.ingestion.schema import FarmTelemetryInput
    from src.features.engineer import FeatureEngineer
    from src.training.catboost_trainer import MultiTargetCatBoostTrainer
    from src.explainability.shap_explainer import ShapExplainer
    from src.recommendations.mapper import RecommendationMapper
    CATBOOST_AVAILABLE = True
except ImportError as e:
    print(f"CatBoost integration unavailable: {e}")
    CATBOOST_AVAILABLE = False

from .rule_engine import evaluate_all
from .recommendation_builder import build_recommendation
from .llm_adviser import generate_advisory_report
from app.knowledge_base.diseases import get_disease_info

trainer = None
engineer = None
mapper = None
explainer = None

def _init_catboost():
    global trainer, engineer, mapper, explainer
    if CATBOOST_AVAILABLE and trainer is None:
        try:
            model_dir = Path(r"c:\Users\karthi\Documents\proji\Agricultural-Recommendation-AI\models\production\current_model")
            if model_dir.exists():
                trainer = MultiTargetCatBoostTrainer()
                trainer.load(str(model_dir))
                engineer = FeatureEngineer()
                mapper = RecommendationMapper()
                explainer = ShapExplainer(trainer.models)
                print("[CatBoost] Loaded models successfully.")
        except Exception as e:
            print(f"[CatBoost] Error loading models: {e}")

class AgronomicDecisionEngine:
    @staticmethod
    def generate(ai_data, ndvi_data, sensor_data, weather_data):
        """
        Main entry point for generating agronomic recommendations.
        Uses CatBoost/SHAP if available, gracefully falls back to Rule Engine.
        """
        _init_catboost()
        
        crop = ai_data.get('crop', 'unknown') if ai_data else 'unknown'
        disease = ai_data.get('prediction') if ai_data else None
        
        # Ensure confidence is 0-1 scale for CatBoost schema if ai_data provides 0-100 scale
        confidence_val = float(ai_data.get('confidence', 0)) if ai_data else 0.0
        confidence = confidence_val / 100.0 if confidence_val > 1.0 else confidence_val
        
        if trainer and engineer:
            try:
                print(f"[Engine] Using CatBoost fusion for {crop}")
                telemetry = {
                    "crop": crop,
                    "growth_stage": "vegetative", # Default fallback if no farm info
                    "ndvi": ndvi_data.get('ndvi_mean') if ndvi_data else None,
                    "ndre": ndvi_data.get('ndre_mean') if ndvi_data else None,
                    "soil_moisture": sensor_data.get('soil_moisture') if sensor_data else None,
                    "nitrogen": sensor_data.get('nitrogen') if sensor_data else None,
                    "phosphorus": sensor_data.get('phosphorus') if sensor_data else None,
                    "potassium": sensor_data.get('potassium') if sensor_data else None,
                    "current_temperature": weather_data.get('temperature') if weather_data else None,
                    "humidity": weather_data.get('humidity') if weather_data else None,
                    "detected_disease": disease if disease and disease.lower() != "healthy" else None,
                    "disease_confidence": confidence if disease and disease.lower() != "healthy" else None,
                }
                
                # Filter None values to allow schema defaults to trigger
                valid_telemetry = {k:v for k,v in telemetry.items() if v is not None}
                
                validated_data = FarmTelemetryInput(**valid_telemetry)
                df_raw = pd.DataFrame([validated_data.dict()])
                
                # Extract predictions
                X = engineer.engineer_features(df_raw)
                predictions = trainer.predict(X)
                
                action_cat = predictions['recommended_action_category'].iloc[0]
                risk_explanation = explainer.explain_prediction("overall_risk", X)
                rec_mapped = mapper.get_recommendation(action_cat)
                
                overall_risk = float(predictions['overall_risk'].iloc[0])
                disease_risk = float(predictions['disease_risk'].iloc[0])
                
                # Severity Mapping
                severity = "Critical" if overall_risk > 0.8 else "High" if overall_risk > 0.6 else "Moderate" if overall_risk > 0.4 else "Low" if overall_risk > 0.2 else "None"
                
                kb_info = get_disease_info(disease) if disease else {}
                
                diagnostic_summary = rec_mapped.get('description', '')
                if risk_explanation.get('top_factors'):
                    factors = [f"{f['feature'].replace('_', ' ')} ({f['direction'].replace('_', ' ')})" for f in risk_explanation['top_factors'][:3]]
                    diagnostic_summary += f" Key drivers: {', '.join(factors)}."
                    
                actions = []
                if kb_info.get('immediate_action'):
                    actions.append(f"Immediate: {kb_info['immediate_action']}")
                if kb_info.get('treatment'):
                    actions.append(f"Treatment: {kb_info['treatment']}")
                actions.append(rec_mapped.get('primary_action', ''))
                
                # Use Gemini LLM to generate a professional advisory report
                llm_report = generate_advisory_report(
                    crop=crop,
                    telemetry=telemetry,
                    predictions=predictions.iloc[0].to_dict(),
                    risk_explanation=risk_explanation,
                    kb_info=kb_info,
                    disease=disease,
                    confidence=confidence
                )
                
                if llm_report:
                    if llm_report.get('diagnostic_summary'):
                        diagnostic_summary = llm_report['diagnostic_summary']
                    if llm_report.get('agronomist_directive'):
                        # Overwrite the actions list with a single comprehensive paragraph
                        actions = [llm_report['agronomist_directive']]
                
                supporting_evidence = []
                if disease and confidence > 0.6: supporting_evidence.append('AI Leaf Scan')
                if ndvi_data: supporting_evidence.append('Satellite')
                if sensor_data: supporting_evidence.append('Soil Sensors')
                if weather_data: supporting_evidence.append('Weather')

                # Maintain KAIROS DB backward compatibility format
                return {
                    "health_score": max(0, 100 - int(overall_risk * 100)),
                    "overall_status": "Stressed" if overall_risk > 0.5 else "Healthy",
                    "severity": severity,
                    "confidence": int(confidence * 100),
                    "primary_issue": action_cat,
                    "secondary_issue": f"Disease Risk {disease_risk:.2f}",
                    "diagnostic_summary": diagnostic_summary,
                    "assessments": {
                        "catboost_predictions": predictions.iloc[0].to_dict(),
                        "shap_explanation": risk_explanation,
                        "crop_model_version": ai_data.get("model_version", "default") if ai_data else None
                    },
                    "supporting_evidence": supporting_evidence,
                    "recommended_actions": actions,
                    "follow_up": kb_info.get('prevention', '')
                }
            except Exception as e:
                print(f"[Engine] CatBoost failed, falling back to Rule Engine. Error: {e}")
                traceback.print_exc()

        # Fallback to Rule Engine
        print(f"[Engine] Using Rule Engine fallback.")
        flags = evaluate_all(ai_data, ndvi_data, sensor_data, weather_data)
        return build_recommendation(flags, ai_data, ndvi_data, sensor_data, weather_data)
        
def generate_recommendation(satellite_data, sensor_data, weather_data, ai_prediction):
    """
    Backwards-compatible wrapper.
    """
    return AgronomicDecisionEngine.generate(ai_prediction, satellite_data, sensor_data, weather_data)
