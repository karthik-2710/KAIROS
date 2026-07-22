import sys
from services.sentinel_service import SentinelHubService
from services.statistical_service import StatisticalService, SentinelHubStatsError

def main() -> None:
    """Test script to verify statistical service module imports and construction."""
    print("Testing StatisticalService initialization...")
    try:
        auth_service = SentinelHubService()
        stats_service = StatisticalService(auth_service)
        print("Initialization Successful")
    except Exception as e:
        print(f"Failed to initialize StatisticalService: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
