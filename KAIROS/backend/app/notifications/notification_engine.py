from typing import List, Dict, Type
from app.database.db import get_db
from .models import NotificationModel
from .provider_interface import ProviderInterface
from .dashboard_provider import DashboardProvider
from .whatsapp_provider import WhatsAppProvider

class NotificationEngine:
    def __init__(self):
        # Register providers
        self.providers: Dict[str, ProviderInterface] = {
            'dashboard': DashboardProvider(),
            'whatsapp': WhatsAppProvider()
        }

    def _get_farm_contact_info_and_prefs(self, farm_id: int) -> dict:
        db = get_db()
        try:
            row = db.execute('''
                SELECT f.phone, f.whatsapp, f.use_phone_as_whatsapp, f.email, f.preferred_language,
                       np.dashboard, np.whatsapp as pref_whatsapp, np.email as pref_email, np.sms as pref_sms,
                       np.disease_detection, np.disease_forecast, np.ndvi_alerts, np.weather_alerts,
                       np.irrigation_alerts, np.nutrient_alerts, np.harvest_reminders, np.general_updates
                FROM farms f
                LEFT JOIN notification_preferences np ON f.id = np.farm_id
                WHERE f.id = ?
            ''', (farm_id,)).fetchone()
            return dict(row) if row else {}
        finally:
            db.close()

    def _should_send_category(self, prefs: dict, category: str) -> bool:
        # Map categories to preference columns
        category_map = {
            'Disease': 'disease_detection',
            'Weather': 'weather_alerts',
            'Irrigation': 'irrigation_alerts',
            'NDVI': 'ndvi_alerts',
            'General': 'general_updates',
            'Recommendation': 'general_updates',
            'Prediction': 'disease_forecast'
        }
        pref_key = category_map.get(category, 'general_updates')
        return bool(prefs.get(pref_key, 1))

    def _save_notification(self, notif: NotificationModel) -> int:
        db = get_db()
        try:
            cursor = db.execute('''
                INSERT INTO notifications (user_id, farm_id, title, description, severity, category, channel, action_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (notif.user_id, notif.farm_id, notif.title, notif.description, notif.severity, notif.category, 'dashboard', notif.action_url))
            db.commit()
            return cursor.lastrowid
        finally:
            db.close()

    def _log_delivery(self, notification_id: int, provider: str, status: str, error: str = None):
        db = get_db()
        try:
            db.execute('''
                INSERT INTO notification_delivery_logs (notification_id, provider, status, error_message)
                VALUES (?, ?, ?, ?)
            ''', (notification_id, provider, status, error))
            db.commit()
        finally:
            db.close()

    def process_notifications(self, notifications: List[NotificationModel]):
        """Process a list of generated notifications, save them, and send via providers."""
        for notif in notifications:
            if not notif.farm_id:
                continue
                
            info = self._get_farm_contact_info_and_prefs(notif.farm_id)
            if not info:
                continue
                
            # Check if category is enabled by user
            if not self._should_send_category(info, notif.category):
                continue

            # Check for duplicates within the last hour to prevent spam
            db = get_db()
            try:
                recent = db.execute('''
                    SELECT id FROM notifications 
                    WHERE farm_id = ? AND title = ? AND timestamp >= datetime('now', '-1 hour')
                ''', (notif.farm_id, notif.title)).fetchone()
                if recent:
                    continue
            finally:
                db.close()

            # Save to DB
            notif_id = self._save_notification(notif)
            
            # Send via Dashboard (always enabled if generated)
            if info.get('dashboard', 1):
                success = self.providers['dashboard'].send(notif, info)
                self._log_delivery(notif_id, 'dashboard', 'SUCCESS' if success else 'FAILED')

            # Send via WhatsApp if enabled
            if info.get('pref_whatsapp', 0) and 'whatsapp' in self.providers:
                success = self.providers['whatsapp'].send(notif, info)
                self._log_delivery(notif_id, 'whatsapp', 'SUCCESS' if success else 'FAILED')

# Singleton instance
notification_engine = NotificationEngine()
