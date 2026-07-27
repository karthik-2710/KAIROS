import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime

from app.utils.auth import require_auth
from config import Config
from app.services.analysis_engine import AnalysisEngine

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@ai_bp.route('/analyze-leaf', methods=['POST'])
@require_auth
def analyze_leaf():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file provided'}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({'success': False, 'error': 'Empty file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Invalid file type. Use JPG, PNG, or WebP'}), 400

    farm_id = request.form.get('farm_id', type=int)
    if not farm_id:
        return jsonify({'success': False, 'error': 'farm_id is required'}), 400

    # Save Image
    filename = secure_filename(file.filename)
    upload_dir = Config.UPLOAD_FOLDER if hasattr(Config, 'UPLOAD_FOLDER') else 'uploads'
    os.makedirs(upload_dir, exist_ok=True)
    save_name = f"scan_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{filename}"
    save_path = os.path.join(upload_dir, save_name)
    file.save(save_path)

    # Trigger Unified Analysis Pipeline
    try:
        analysis_data = AnalysisEngine.run_pipeline(farm_id, leaf_image_path=save_path)
        
        # We return the whole analysis object so the UI can update seamlessly
        # Add success flag for backward compatibility
        analysis_data['success'] = True
        
        # Backward compatibility for LeafInference.tsx
        leaf_ai = analysis_data.get('leaf_ai', {})
        analysis_data['disease'] = leaf_ai.get('disease', 'Unknown')
        analysis_data['confidence'] = leaf_ai.get('confidence', 0)
        analysis_data['scientific_name'] = leaf_ai.get('scientific_name', 'N/A')
        analysis_data['healthy'] = leaf_ai.get('healthy', False)
        analysis_data['severity'] = leaf_ai.get('severity', 'Unknown')
        analysis_data['recommendations'] = leaf_ai.get('recommendations', {})
        
        ndvi = analysis_data.get('satellite', {}).get('ndvi_mean')
        sat_status = "Optimal" if ndvi and ndvi > 0.5 else ("Moderate Stress" if ndvi and ndvi > 0.3 else "High Stress" if ndvi else "N/A")
        
        temp = analysis_data.get('weather', {}).get('temperature', 25)
        hum = analysis_data.get('weather', {}).get('humidity', 50)
        
        analysis_data['cross_validation'] = {
            'satellite': sat_status,
            'weather': f"{temp}C, {hum}% RH",
            'overall_confidence': f"{leaf_ai.get('confidence', 0)}%"
        }
        
        return jsonify(analysis_data), 200

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
        return jsonify({'success': False, 'error': 'Analysis failed', 'details': str(e), 'traceback': tb}), 500

# The /history endpoint is now fully handled by /analysis/history, but keeping this simple wrapper 
# just in case frontend specifically calls /api/ai/history
@ai_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    from app.database.db import get_db
    from app.services.history_service import HistoryService
    farm_id = request.args.get('farm_id', type=int)
    if not farm_id:
        return jsonify({'success': False, 'error': 'farm_id required'}), 400
        
    db = get_db()
    try:
        results = HistoryService.get_history(db, farm_id)
        mapped_results = []
        for r in results:
            if not r.get('disease'): continue
            mapped_results.append({
                'id': r.get('id'),
                'timestamp': r.get('timestamp'),
                'severity': r.get('severity', 'None'),
                'disease': r.get('disease'),
                'description': r.get('diagnostic_summary', ''),
                'confidence': r.get('ai_confidence', 0),
                'ndvi': r.get('ndvi_mean')
            })
        return jsonify({"success": True, "history": mapped_results}), 200
    finally:
        db.close()

@ai_bp.route('/chat', methods=['POST'])
@require_auth
def chat_with_bot():
    data = request.json
    message = data.get('message', '')
    language = data.get('language', 'en')
    
    if not message:
        return jsonify({'success': False, 'error': 'No message provided'}), 400

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({
            'success': False, 
            'error': 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'
        }), 500

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Configure model with agricultural context
        model = genai.GenerativeModel('gemini-flash-latest')
        
        system_prompt = (
            "You are the KAIROS Assistant, a helpful AI embedded in a smart agriculture web app called KAIROS. "
            "You help farmers understand the app's features and answer general agricultural questions concisely and politely. "
            "IMPORTANT: When you mention a specific feature or page, you MUST provide a markdown link pointing directly to it. "
            "Use the exact markdown format [Text](url) and ONLY use these paths: "
            "Dashboard: [Dashboard](/app) | "
            "Farms Registry: [Farms](/app/farms) | "
            "IoT Sensors: [IoT Monitoring](/app/iot) | "
            "Satellite/NDVI: [Satellite Analysis](/app/satellite) | "
            "Leaf Scanning/Disease: [Leaf Inference](/app/leaf-scan) | "
            "Recommendations: [Recommendations](/app/recommendations) | "
            "History: [History](/app/history) | "
            "Settings: [Settings](/app/settings). "
            "Always output standard text with inline markdown links. "
        )
        
        if language == 'ta':
            system_prompt += "CRITICAL INSTRUCTION: The user prefers Tamil. You MUST reply entirely in fluent, natural Tamil language."
        else:
            system_prompt += "The user prefers English. Reply in English."
        
        # Simple generation call
        response = model.generate_content(f"System Context: {system_prompt}\n\nUser: {message}")
        
        return jsonify({'success': True, 'response': response.text}), 200

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print("Error in Gemini API:", tb)
        return jsonify({'success': False, 'error': 'AI processing failed', 'details': str(e)}), 500
