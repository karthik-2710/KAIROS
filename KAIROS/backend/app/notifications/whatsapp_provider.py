import os
import logging
from typing import Optional, Dict, Any
from twilio.rest import Client
from .provider_interface import ProviderInterface
from .models import NotificationModel

logger = logging.getLogger(__name__)

class WhatsAppProvider(ProviderInterface):
    """
    Sends official WhatsApp agricultural alerts using Twilio WhatsApp API.
    Supports real delivery when credentials are provided, or simulated sandbox delivery.
    """
    
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        
        if self.account_sid and self.auth_token and not self.account_sid.startswith("your_"):
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.warning(f"[WhatsAppProvider] Twilio client initialization failed: {e}")
                self.client = None
        else:
            self.client = None

    def send(self, notification: NotificationModel, user_contact_info: dict) -> bool:
        target_number = user_contact_info.get('whatsapp') or user_contact_info.get('phone')
        if not target_number:
            logger.info("[WhatsAppProvider] No phone/whatsapp number found for farm.")
            return False

        message_body = (
            f"*{notification.title}*\n\n"
            f"{notification.description}\n\n"
            f"📱 _KAIROS Precision Agriculture Platform_"
        )
        return self.send_text(target_number, message_body)["success"]

    def send_text(self, target_phone: str, message_text: str) -> Dict[str, Any]:
        """
        Sends formatted WhatsApp message to target phone number.
        """
        clean_num = "".join(str(target_phone).split())
        if not clean_num.startswith('+'):
            clean_num = f"+{clean_num}"
        to_address = f"whatsapp:{clean_num}"

        from_address = self.from_number
        if not from_address.startswith('whatsapp:'):
            from_address = f"whatsapp:{from_address}"

        if self.client:
            try:
                msg = self.client.messages.create(
                    body=message_text,
                    from_=from_address,
                    to=to_address
                )
                logger.info(f"[WhatsAppProvider] Live WhatsApp sent successfully. SID: {msg.sid}")
                return {
                    "success": True,
                    "simulated": False,
                    "sid": msg.sid,
                    "to": clean_num,
                    "provider": "Twilio WhatsApp API"
                }
            except Exception as e:
                logger.error(f"[WhatsAppProvider] Twilio API Error: {e}")
                return {
                    "success": False,
                    "simulated": False,
                    "error": str(e),
                    "to": clean_num,
                    "provider": "Twilio WhatsApp API"
                }
        else:
            # Simulated Sandbox Delivery
            logger.info(f"[WhatsAppProvider] [SIMULATION] Delivered WhatsApp Alert to {clean_num}:\n{message_text}")
            return {
                "success": True,
                "simulated": True,
                "sid": f"SM_SIMULATED_{os.urandom(4).hex()}",
                "to": clean_num,
                "provider": "KAIROS WhatsApp Service (Sandbox Mode - Add TWILIO_ACCOUNT_SID for live SMS)"
            }
