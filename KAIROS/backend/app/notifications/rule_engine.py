from typing import List, Optional
from .models import NotificationModel

class RuleEngine:
    """
    Evaluates incoming farm data (sensor, satellite, disease predictions) 
    and generates notifications if certain thresholds or rules are met.
    """

    @staticmethod
    def evaluate_sensor_data(sensor_data: dict, farm_id: int, user_id: int) -> List[NotificationModel]:
        notifications = []
        
        # High Temperature Rule
        if sensor_data.get('temperature', 0) > 35:
            notifications.append(NotificationModel(
                title="High Temperature Alert",
                description=f"Farm temperature has reached {sensor_data['temperature']}°C. Consider irrigation or shading.",
                severity="Critical",
                category="Weather",
                farm_id=farm_id,
                user_id=user_id
            ))
            
        # Low Soil Moisture Rule
        if sensor_data.get('soil_moisture', 100) < 30:
            notifications.append(NotificationModel(
                title="Low Soil Moisture",
                description="Soil moisture is critically low. Immediate irrigation is recommended.",
                severity="Warning",
                category="Irrigation",
                farm_id=farm_id,
                user_id=user_id
            ))
            
        return notifications

    @staticmethod
    def evaluate_satellite_data(satellite_data: dict, farm_id: int, user_id: int) -> List[NotificationModel]:
        notifications = []
        
        # Low NDVI Rule
        if satellite_data.get('ndvi_mean', 1) < 0.4:
            notifications.append(NotificationModel(
                title="Low Vegetation Health (NDVI)",
                description="Average NDVI is below optimal levels. Please check for nutrient deficiency or water stress.",
                severity="Warning",
                category="NDVI",
                farm_id=farm_id,
                user_id=user_id
            ))
            
        return notifications

    @staticmethod
    def evaluate_disease_prediction(prediction: dict, farm_id: int, user_id: int) -> List[NotificationModel]:
        notifications = []
        
        # Disease Detection Rule
        if prediction.get('disease') and prediction['disease'].lower() != 'healthy':
            notifications.append(NotificationModel(
                title=f"Disease Detected: {prediction['disease']}",
                description=f"AI detected {prediction['disease']} with {prediction.get('confidence', 0)*100:.1f}% confidence.",
                severity="Critical",
                category="Disease",
                farm_id=farm_id,
                user_id=user_id
            ))
            
        return notifications
