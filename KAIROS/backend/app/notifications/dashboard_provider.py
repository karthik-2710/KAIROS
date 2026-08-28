from .provider_interface import ProviderInterface
from .models import NotificationModel

class DashboardProvider(ProviderInterface):
    """
    Provider for in-app Dashboard Notifications.
    In the current setup, since notifications are stored in the database,
    the DashboardProvider is essentially a no-op that just returns True,
    as the frontend will fetch the notifications from the DB via REST API.
    
    Future improvements: This could emit a WebSocket event for real-time updates.
    """
    
    def send(self, notification: NotificationModel, user_contact_info: dict) -> bool:
        # In a real-time system with WebSockets (e.g., Flask-SocketIO),
        # we would emit the event here to the specific user's room.
        # emit('new_notification', notification.__dict__, room=f"user_{notification.user_id}")
        return True
