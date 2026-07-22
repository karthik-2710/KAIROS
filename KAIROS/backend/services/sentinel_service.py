import os
import time
import logging
from typing import Optional
import requests
from dotenv import load_dotenv

# Initialize logger
logger = logging.getLogger("kairos.sentinel_service")
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

class SentinelHubError(Exception):
    """Base exception class for Sentinel Hub errors."""
    pass

class MissingCredentialsError(SentinelHubError):
    """Exception raised when Sentinel Hub client credentials are missing."""
    pass

class SentinelHubAuthError(SentinelHubError):
    """Exception raised when authentication with Sentinel Hub fails (401)."""
    pass

class SentinelHubForbiddenError(SentinelHubError):
    """Exception raised when accessing a forbidden resource (403)."""
    pass

class SentinelHubNetworkError(SentinelHubError):
    """Exception raised for connection timeouts and network issues."""
    pass

class SentinelHubParseError(SentinelHubError):
    """Exception raised when response JSON parsing fails."""
    pass


class SentinelHubService:
    """Service to handle Sentinel Hub OAuth authentication and token management.
    
    This service implements the Client Credentials flow to retrieve access tokens,
    automatically caching and refreshing them on expiry.
    """
    
    OAUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    
    def __init__(self) -> None:
        self._client_id: Optional[str] = os.getenv("SENTINEL_CLIENT_ID")
        self._client_secret: Optional[str] = os.getenv("SENTINEL_CLIENT_SECRET")
        self._access_token: Optional[str] = None
        self._expires_at: Optional[float] = None

        # Fallback to SENTINEL_HUB_CLIENT_ID / SECRET if missing or placeholders
        if not self._client_id or self._client_id == 'mock_client_id':
            self._client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")
        if not self._client_secret or self._client_secret == 'mock_client_secret':
            self._client_secret = os.getenv("SENTINEL_HUB_CLIENT_SECRET")
        
        # Verify credentials presence
        if not self._client_id or not self._client_secret:
            logger.warning("Sentinel Hub credentials (SENTINEL_CLIENT_ID / SENTINEL_CLIENT_SECRET) are missing from environment.")

    def is_token_valid(self) -> bool:
        """Checks if the currently cached access token is valid and not expired.
        
        Returns:
            bool: True if the token is valid, False otherwise.
        """
        if not self._access_token or not self._expires_at:
            return False
        
        # Allow 30 seconds buffer for request overhead
        return time.time() < (self._expires_at - 30.0)

    @property
    def expires_in(self) -> int:
        """Returns the remaining validity duration of the cached token in seconds.
        
        Returns:
            int: Remaining seconds, or 0 if expired or not authenticated.
        """
        if not self._expires_at:
            return 0
        remaining = int(self._expires_at - time.time())
        return max(0, remaining)


    def refresh_token(self) -> str:
        """Forces retrieval of a fresh access token from Sentinel Hub OAuth endpoint.
        
        Raises:
            MissingCredentialsError: If client credentials are not defined.
            SentinelHubAuthError: If 401 Unauthorized status is returned.
            SentinelHubForbiddenError: If 403 Forbidden status is returned.
            SentinelHubNetworkError: If connection times out or network fails.
            SentinelHubParseError: If response JSON parsing fails.
            SentinelHubError: For other HTTP error status codes.
            
        Returns:
            str: Freshly fetched Bearer access token string.
        """
        if not self._client_id or not self._client_secret:
            logger.error("Attempted to refresh token without credentials.")
            raise MissingCredentialsError("SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET must be defined in the environment.")

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "client_credentials",
            "client_id": self._client_id,
            "client_secret": self._client_secret
        }

        logger.info("Requesting fresh OAuth access token from Sentinel Hub...")
        try:
            # 10 seconds timeout limit
            response = requests.post(self.OAUTH_URL, headers=headers, data=data, timeout=10.0)
            
            if response.status_code == 401:
                logger.error("Authentication failed: 401 Unauthorized. Verify your credentials.")
                raise SentinelHubAuthError("Sentinel Hub OAuth authentication failed: 401 Unauthorized.")
            elif response.status_code == 403:
                logger.error("Access forbidden: 403 Forbidden.")
                raise SentinelHubForbiddenError("Sentinel Hub OAuth access forbidden: 403 Forbidden.")
            
            response.raise_for_status()
            
        except requests.exceptions.Timeout as e:
            logger.error(f"OAuth request connection timed out: {e}")
            raise SentinelHubNetworkError("Connection to Sentinel Hub OAuth timed out.") from e
        except requests.exceptions.ConnectionError as e:
            logger.error(f"OAuth request connection error: {e}")
            raise SentinelHubNetworkError("Network connection to Sentinel Hub failed.") from e
        except requests.exceptions.HTTPError as e:
            logger.error(f"OAuth request failed with HTTP error: {e}")
            raise SentinelHubError(f"Sentinel Hub HTTP request failed: {e}") from e

        # Parse JSON payload
        try:
            payload = response.json()
        except requests.exceptions.JSONDecodeError as e:
            logger.error(f"Failed to parse Sentinel Hub JSON response: {e}")
            raise SentinelHubParseError("Failed to parse Sentinel Hub OAuth JSON response payload.") from e

        access_token = payload.get("access_token")
        expires_in = payload.get("expires_in")

        if not access_token or expires_in is None:
            logger.error("Response JSON did not contain access_token or expires_in key.")
            raise SentinelHubParseError("Sentinel Hub response missing access_token or expires_in keys.")

        self._access_token = access_token
        self._expires_at = time.time() + float(expires_in)
        
        logger.info(f"OAuth token retrieved successfully. Expires in {expires_in} seconds.")
        return self._access_token

    def get_access_token(self) -> str:
        """Returns a valid Sentinel Hub access token.
        
        If a valid cached token exists, it is returned immediately. Otherwise,
        a new token is requested.
        
        Returns:
            str: Bearer access token string.
        """
        if self.is_token_valid() and self._access_token:
            logger.debug("Returning cached Sentinel Hub access token.")
            return self._access_token
        
        return self.refresh_token()
