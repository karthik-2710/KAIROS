from flask import Blueprint, request, jsonify
from app.database.db import get_db
from app.utils.auth import hash_password, check_password, generate_token, require_auth, get_current_user

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email, and password are required'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    db = get_db()
    try:
        existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            return jsonify({'error': 'Email already registered'}), 409

        hashed = hash_password(password)
        cursor = db.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hashed)
        )
        db.commit()
        user_id = cursor.lastrowid
        token = generate_token(user_id)

        user = {'id': user_id, 'name': name, 'email': email}
        return jsonify({'user': user, 'token': token, 'farms': []}), 201
    finally:
        db.close()


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    db = get_db()
    try:
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not user or not check_password(password, user['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        token = generate_token(user['id'])
        farms = db.execute(
            "SELECT id, name, crop_type, area_ha, polygon, health_score, created_at FROM farms WHERE user_id = ?",
            (user['id'],)
        ).fetchall()

        return jsonify({
            'user': {'id': user['id'], 'name': user['name'], 'email': user['email']},
            'token': token,
            'farms': [dict(f) for f in farms],
        }), 200
    finally:
        db.close()


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user), 200
