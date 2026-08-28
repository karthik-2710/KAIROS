from flask import request, jsonify
from app.database.db import get_db
from app.utils.auth import require_auth
from . import notifications_bp

def _row_to_dict(row):
    return dict(row)

@notifications_bp.route('', methods=['GET'])
@require_auth
def get_notifications():
    db = get_db()
    try:
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        notifications = db.execute('''
            SELECT n.*, f.name as farm_name 
            FROM notifications n
            LEFT JOIN farms f ON n.farm_id = f.id
            WHERE n.user_id = ? 
            ORDER BY n.timestamp DESC
            LIMIT ? OFFSET ?
        ''', (request.user_id, limit, offset)).fetchall()
        
        # Get unread count
        unread = db.execute('''
            SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0
        ''', (request.user_id,)).fetchone()[0]
        
        return jsonify({
            'notifications': [_row_to_dict(n) for n in notifications],
            'unread_count': unread
        }), 200
    finally:
        db.close()

@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@require_auth
def mark_as_read(notif_id):
    db = get_db()
    try:
        db.execute('''
            UPDATE notifications SET is_read = 1 
            WHERE id = ? AND user_id = ?
        ''', (notif_id, request.user_id))
        db.commit()
        return jsonify({'message': 'Marked as read'}), 200
    finally:
        db.close()

@notifications_bp.route('/read-all', methods=['PUT'])
@require_auth
def mark_all_as_read():
    db = get_db()
    try:
        db.execute('''
            UPDATE notifications SET is_read = 1 
            WHERE user_id = ?
        ''', (request.user_id,))
        db.commit()
        return jsonify({'message': 'All marked as read'}), 200
    finally:
        db.close()

@notifications_bp.route('/preferences/<int:farm_id>', methods=['GET'])
@require_auth
def get_preferences(farm_id):
    db = get_db()
    try:
        # Verify ownership
        farm = db.execute("SELECT id FROM farms WHERE id = ? AND user_id = ?", (farm_id, request.user_id)).fetchone()
        if not farm:
            return jsonify({'error': 'Unauthorized or farm not found'}), 403
            
        prefs = db.execute("SELECT * FROM notification_preferences WHERE farm_id = ?", (farm_id,)).fetchone()
        if not prefs:
            return jsonify({}), 200
        return jsonify(_row_to_dict(prefs)), 200
    finally:
        db.close()

@notifications_bp.route('/preferences/<int:farm_id>', methods=['PUT'])
@require_auth
def update_preferences(farm_id):
    data = request.get_json()
    db = get_db()
    try:
        # Verify ownership
        farm = db.execute("SELECT id FROM farms WHERE id = ? AND user_id = ?", (farm_id, request.user_id)).fetchone()
        if not farm:
            return jsonify({'error': 'Unauthorized or farm not found'}), 403
            
        # Get existing to build update query safely
        existing = db.execute("SELECT * FROM notification_preferences WHERE farm_id = ?", (farm_id,)).fetchone()
        if not existing:
            # Should have been created by migration, but just in case
            db.execute("INSERT INTO notification_preferences (farm_id) VALUES (?)", (farm_id,))
            
        valid_keys = [
            'dashboard', 'whatsapp', 'email', 'sms', 'weekly_summary', 'monthly_report',
            'disease_detection', 'disease_forecast', 'ndvi_alerts', 'weather_alerts',
            'irrigation_alerts', 'nutrient_alerts', 'harvest_reminders', 'general_updates'
        ]
        
        updates = {k: v for k, v in data.items() if k in valid_keys}
        if updates:
            set_clause = ', '.join(f"{k} = ?" for k in updates)
            db.execute(f"UPDATE notification_preferences SET {set_clause} WHERE farm_id = ?", 
                      list(updates.values()) + [farm_id])
            db.commit()
            
        updated = db.execute("SELECT * FROM notification_preferences WHERE farm_id = ?", (farm_id,)).fetchone()
        return jsonify(_row_to_dict(updated)), 200
    finally:
        db.close()
