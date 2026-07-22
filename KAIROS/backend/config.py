import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'kairos.db')

    # OpenWeatherMap
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

    # Sentinel Hub
    SENTINEL_HUB_CLIENT_ID = os.getenv('SENTINEL_HUB_CLIENT_ID', '')
    SENTINEL_HUB_CLIENT_SECRET = os.getenv('SENTINEL_HUB_CLIENT_SECRET', '')
    SENTINEL_HUB_INSTANCE_ID = os.getenv('SENTINEL_HUB_INSTANCE_ID', '')
    SENTINEL_CLIENT_ID = os.getenv('SENTINEL_CLIENT_ID', '')
    SENTINEL_CLIENT_SECRET = os.getenv('SENTINEL_CLIENT_SECRET', '')

    # AI Model
    MODEL_PATH = os.getenv('MODEL_PATH', 'models/best_model.keras')
    MODEL_CLASSES_PATH = os.getenv('MODEL_CLASSES_PATH', 'models/class_names.txt')
    IMAGE_SIZE = (224, 224)

    # Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    # JWT
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRY_HOURS = 72

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
