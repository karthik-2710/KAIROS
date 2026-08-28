import os
import sys
from dotenv import load_dotenv

# Load env before importing app modules
load_dotenv()

# Add backend directory to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.notifications.notification_engine import notification_engine
from app.notifications.models import NotificationModel
from app.notifications.whatsapp_provider import WhatsAppProvider

def test_whatsapp():
    provider = WhatsAppProvider()
    if not provider.client:
        print("[X] Twilio client failed to initialize. Check your .env variables.")
        return

    print("[OK] Twilio client initialized.")
    
    # Create a mock notification
    notif = NotificationModel(
        title="Leaf Blight Detected",
        description="Our AI detected early signs of Leaf Blight in your Rice crop (West Barley Field). We recommend applying fungicide within 48 hours to prevent spread.",
        severity="Critical",
        category="Disease",
        action_url="/farms/1/analysis"
    )
    
    # Mock user contact info (change the number below if you want to test a different number)
    # The number must be registered in your Twilio Sandbox!
    contact_info = {
        'whatsapp': os.getenv('TWILIO_WHATSAPP_NUMBER_TARGET', '+919962109473')  # Uses the number from your screenshot
    }
    
    print(f"Sending test WhatsApp message to {contact_info['whatsapp']}...")
    success = provider.send(notif, contact_info)
    
    if success:
        print("[SUCCESS] Check your WhatsApp.")
    else:
        print("[ERROR] Failed to send WhatsApp message.")

if __name__ == "__main__":
    test_whatsapp()
