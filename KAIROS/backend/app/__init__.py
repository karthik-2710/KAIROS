import os
from flask import Flask
from flask_cors import CORS
from config import Config
from app.database.db import init_db
from app.routes.auth import auth_bp
from app.routes.farm import farm_bp
from app.routes.sensor import sensor_bp
from app.routes.weather import weather_bp
from app.routes.satellite import satellite_bp
from app.routes.ai import ai_bp
from app.routes.recommendation import recommendation_bp
from app.routes.dashboard import dashboard_bp
from app.routes.analysis import analysis_bp
from app.routes.market import market_bp
from app.notifications import notifications_bp
from app.routes.camera import camera_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

    # CORS
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'])

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(farm_bp)
    app.register_blueprint(sensor_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(satellite_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(ai_bp, url_prefix='/api/ai', name='ai_api_alias')
    app.register_blueprint(camera_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(notifications_bp)
    
    from modules.digital_twin.api import digital_twin_bp
    app.register_blueprint(digital_twin_bp)

    # Robust Startup Diagnostics for AI Models
    print("[Startup] Initializing AI Model diagnostics across 10 supported crops...")
    try:
        import torch
        print(f"PyTorch {torch.__version__} loaded successfully")
        
        from app.ai.model_registry import model_registry, SUPPORTED_CROPS
        discovered = model_registry.discover_models()
        ready_count = sum(1 for v in discovered.values() if v.get("status") == "READY")
        print(f"[Startup] AI Model Registry initialized: {ready_count}/{len(SUPPORTED_CROPS)} crop models ready.\n")
    except Exception as e:
        import traceback
        print(f"[Startup] ERROR: Exception during AI Model initialization: {e}")
        traceback.print_exc()

    # Start 10-Minute Automated WhatsApp Weather Alert Background Dispatcher
    try:
        from app.weather.auto_dispatcher import start_auto_dispatcher
        start_auto_dispatcher()
    except Exception as e:
        print(f"[Startup] Error starting auto dispatcher: {e}")

    # Static uploads handler
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        from flask import send_from_directory
        return send_from_directory(os.path.abspath(Config.UPLOAD_FOLDER), filename)

    # Health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'service': 'KAIROS Backend', 'version': '1.0.0'}, 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Endpoint not found'}, 404

    @app.errorhandler(413)
    def too_large(e):
        return {'error': 'File too large. Maximum size is 10MB'}, 413

    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error'}, 500

    return app
