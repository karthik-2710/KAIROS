from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class NotificationModel:
    title: str
    description: str
    severity: str  # 'Critical', 'Warning', 'Information', 'Recommendation'
    category: str  # 'Disease', 'Weather', 'Satellite', 'NDVI', 'IoT', 'Recommendation', 'System', 'Farm', 'Prediction', 'General'
    action_url: Optional[str] = None
    farm_id: Optional[int] = None
    user_id: Optional[int] = None
