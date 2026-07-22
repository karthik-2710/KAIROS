import os
import sys
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.sentinel_service import SentinelHubService
from services.statistical_service import StatisticalService

def main():
    try:
        auth_service = SentinelHubService()
        stats_service = StatisticalService(auth_service)
        
        polygon = {
            "type": "Polygon",
            "coordinates": [
                [
                    [80.2700, 13.0800],
                    [80.2712, 13.0805],
                    [80.2718, 13.0817],
                    [80.2698, 13.0814],
                    [80.2700, 13.0800]
                ]
            ]
        }
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        print(f"Testing stats for polygon from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        stats = stats_service.get_ndvi_statistics(polygon, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        print("Stats:")
        print(stats)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
