import sys
from services.sentinel_service import SentinelHubService, SentinelHubError

def main() -> None:
    """Instantiates SentinelHubService, retrieves token, and verifies authentication details."""
    service = SentinelHubService()
    
    try:
        # Request access token
        token = service.get_access_token()
        
        # Output details securely
        print("Authentication Successful")
        
        masked_token = f"{token[:4]}...{token[-4:]}" if len(token) > 8 else token
        print(f"Token: {masked_token}")
        print(f"Token expires in: {service.expires_in} seconds")
        
    except SentinelHubError as e:
        print(f"Sentinel Hub authentication failed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
