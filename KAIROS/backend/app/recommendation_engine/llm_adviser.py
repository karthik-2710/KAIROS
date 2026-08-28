import os
import json
import logging
from google import genai
from google.genai import types

# Configure Gemini
api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None
    logging.warning("GEMINI_API_KEY not found. LLM Adviser will be disabled.")

def generate_advisory_report(crop, telemetry, predictions, risk_explanation, kb_info, disease, confidence):
    """
    Generates a highly detailed, professional agronomist advisory report using Gemini.
    """
    if not client:
        return None
        
    prompt = f"""
    You are an expert Agronomist and Agricultural AI Assistant for the KAIROS platform.
    Analyze the following farm telemetry, AI predictions, and CatBoost risk model outputs to generate a professional, highly-structured advisory report for the farmer.
    
    IMPORTANT FORMATTING REQUIREMENT: 
    Do NOT write a single massive paragraph. You MUST structure your response using clear bullet points (e.g. using '-') and line breaks to ensure maximum readability for the farmer.
    
    Farm Telemetry (Sensor & Satellite):
    {json.dumps(telemetry, indent=2)}
    
    AI Leaf Scan Prediction:
    Crop: {crop}
    Disease: {disease if disease else 'None Detected'}
    Confidence: {confidence * 100:.1f}%
    
    CatBoost Predictive Engine Outputs:
    {json.dumps(predictions, indent=2)}
    
    SHAP Risk Explanation (Top Drivers):
    {json.dumps(risk_explanation, indent=2)}
    
    Disease Knowledge Base:
    {json.dumps(kb_info, indent=2)}
    
    Instructions:
    Output valid JSON ONLY. Do not include markdown formatting like ```json.
    The JSON must contain EXACTLY two string keys:
    1. "diagnostic_summary": A structured, bulleted assessment explaining the current state of the farm, synthesizing the AI scan, telemetry, and CatBoost risk. Address any significant findings clearly. Explain WHY certain factors (like nitrogen or moisture) are increasing or decreasing risk.
    2. "agronomist_directive": A structured, bulleted action plan providing clear, step-by-step instructions on what the farmer should do immediately, as well as follow-up treatments or monitoring. Tell the farmer explicitly if they need to apply specific fertilizers, adjust irrigation, spray fungicides, or just continue monitoring. Use the Knowledge Base context if a disease is present.
    
    Example output format:
    {{
        "diagnostic_summary": "- The corn crop is currently showing moderate stress levels.\\n- The primary driver is a low soil moisture index (22%), which is significantly increasing the overall risk profile.\\n- Furthermore, the AI Leaf Scan has detected early signs of Blight with 85% confidence.",
        "agronomist_directive": "- Immediate action is required to address the water stress. Increase irrigation schedules by 20% over the next 48 hours to restore optimal soil moisture.\\n- Additionally, to combat the early signs of Blight, begin an application of a copper-based fungicide.\\n- Monitor the crop closely over the next week for any signs of improvement."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        response_text = response.text
        
        # Parse the JSON
        advisory = json.loads(response_text)
        return advisory
    except Exception as e:
        logging.error(f"[LLM Adviser] Error generating report: {e}")
        return None
