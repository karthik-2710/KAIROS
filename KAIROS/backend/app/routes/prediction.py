import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.ai.predictor import predict_disease
from app.utils.auth import require_auth
from app.database.db import get_db
from config import Config

prediction_bp = Blueprint('prediction', __name__, url_prefix='/predict')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@prediction_bp.route('', methods=['POST'])
@require_auth
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({'error': 'Empty file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Use JPG, PNG, or WebP'}), 400

    farm_id = request.form.get('farm_id', type=int)
    image_bytes = file.read()

    # Run prediction
    result = predict_disease(image_bytes)

    # Save image to disk
    filename = secure_filename(file.filename)
    upload_dir = Config.UPLOAD_FOLDER
    os.makedirs(upload_dir, exist_ok=True)
    from datetime import datetime
    save_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{filename}"
    save_path = os.path.join(upload_dir, save_name)
    with open(save_path, 'wb') as f:
        f.write(image_bytes)

    # Persist to DB
    db = get_db()
    try:
        db.execute(
            """INSERT INTO predictions (farm_id, image_path, disease, confidence, severity, description)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (farm_id, save_path, result.get('disease'), result.get('confidence'),
             result.get('severity'), result.get('description'))
        )
        db.commit()
    finally:
        db.close()

    return jsonify(result), 200


@prediction_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    farm_id = request.args.get('farm_id', type=int)
    db = get_db()
    try:
        query = "SELECT * FROM predictions"
        params = []
        if farm_id:
            query += " WHERE farm_id = ?"
            params.append(farm_id)
        query += " ORDER BY timestamp DESC LIMIT 20"
        rows = db.execute(query, params).fetchall()
        return jsonify([dict(r) for r in rows]), 200
    finally:
        db.close()
