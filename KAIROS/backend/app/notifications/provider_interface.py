from abc import ABC, abstractmethod
from typing import Any
from .models import NotificationModel

class ProviderInterface(ABC):
    """Base interface for all notification providers."""
    
    @abstractmethod
    def send(self, notification: NotificationModel, user_contact_info: dict) -> bool:
        """
        Sends the notification via the provider's channel.
        
        :param notification: The notification data.
        :param user_contact_info: Contact details (phone, email, etc.) from the DB.
        :return: True if successful, False otherwise.
        """
        pass
