import logging
from typing import Dict, Any, Union
import requests
from services.sentinel_service import SentinelHubService, SentinelHubError, SentinelHubAuthError, SentinelHubForbiddenError, SentinelHubNetworkError, SentinelHubParseError

# Initialize logger
logger = logging.getLogger("kairos.statistical_service")
logging.basicConfig(level=logging.INFO)

class SentinelHubStatsError(SentinelHubError):
    """Exception raised when Sentinel Hub Statistical API operations fail."""
    pass

class NoImageryFoundError(SentinelHubStatsError):
    """Exception raised when no cloud-free or valid imagery is found for the specified bounds."""
    pass


class StatisticalService:
    """Service to interact with the Sentinel Hub Statistical API.
    
    This service queries vegetation indices, canopy metrics, and biomass
    statistics over specific farm parcels using Sentinel-2 L2A constellations.
    """
    
    STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"
    
    # Evalscript to calculate NDVI and provide data masking for stats aggregation
    NDVI_EVALSCRIPT = """
    //VERSION=3
    function setup() {
      return {
        input: [{
          bands: ["B04", "B08", "SCL", "dataMask"]
        }],
        output: [
          {
            id: "default",
            bands: 1
          },
          {
            id: "dataMask",
            bands: 1
          },
          {
            id: "cloudMask",
            bands: 1
          }
        ]
      };
    }

    function evaluatePixel(samples) {
      let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04);
      
      // SCL: 3=Cloud shadows, 8=Cloud medium prob, 9=Cloud high prob, 10=Cirrus
      let isCloud = (samples.SCL === 3 || samples.SCL === 8 || samples.SCL === 9 || samples.SCL === 10) ? 1 : 0;
      let isValid = samples.dataMask === 1 && isFinite(ndvi);
      
      return {
        default: [isValid ? ndvi : 0],
        dataMask: [isValid ? 1 : 0],
        cloudMask: [isValid ? isCloud : 0]
      };
    }
    """

    def __init__(self, auth_service: SentinelHubService) -> None:
        """Initializes the StatisticalService with a shared authentication service instance."""
        self._auth = auth_service

    def get_ndvi_statistics(self, polygon: Dict[str, Any], start_date: str, end_date: str) -> Dict[str, float]:
        """Queries the Sentinel Hub Statistical API to retrieve NDVI metrics for a farm parcel.
        
        Args:
            polygon (dict): GeoJSON polygon bounds.
            start_date (str): Beginning of time range in format YYYY-MM-DD.
            end_date (str): End of time range in format YYYY-MM-DD.
            
        Raises:
            MissingCredentialsError: If client credentials are not defined.
            SentinelHubAuthError: If 401 Unauthorized status is returned.
            SentinelHubForbiddenError: If 403 Forbidden status is returned.
            SentinelHubNetworkError: If connection times out.
            NoImageryFoundError: If no imagery matches the query range.
            SentinelHubStatsError: For general aggregation/API failures.
            
        Returns:
        Returns:
            dict: Dictionary containing mean_ndvi, min_ndvi, max_ndvi, std_dev, image_date, and cloud_coverage.
        """
        # Retrieve valid access token
        token = self._auth.get_access_token()
        
        # Ensure dates are in correct ISO time format (e.g. YYYY-MM-DDT00:00:00Z)
        from_time = start_date if "T" in start_date else f"{start_date}T00:00:00Z"
        to_time = end_date if "T" in end_date else f"{end_date}T23:59:59Z"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Build payload query parameters matching the Sentinel Hub Statistical API specifications
        payload = {
            "input": {
                "bounds": {
                    "geometry": polygon,
                    "properties": {
                        "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                    }
                },
                "data": [
                    {
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": from_time,
                                "to": to_time
                            },
                            "maxCloudCoverage": 100
                        }
                    }
                ]
            },
            "aggregation": {
                "timeRange": {
                    "from": from_time,
                    "to": to_time
                },
                "aggregationInterval": {
                    "of": "P1D"
                },
                "evalscript": self.NDVI_EVALSCRIPT,
                "resx": 0.0001,
                "resy": 0.0001
            }
        }

        logger.info(f"Querying Sentinel Hub Statistical API from {from_time} to {to_time}...")
        
        try:
            response = requests.post(self.STATS_URL, headers=headers, json=payload, timeout=20.0)
            
            if response.status_code == 401:
                logger.error("Statistical query failed: 401 Unauthorized token.")
                raise SentinelHubAuthError("Sentinel Hub authentication expired or invalid.")
            elif response.status_code == 403:
                logger.error("Statistical query forbidden: 403 Forbidden. Verify Sentinel Hub service plan constraints.")
                raise SentinelHubForbiddenError("Sentinel Hub API access forbidden: 403 Forbidden.")
            
            response.raise_for_status()
            
        except requests.exceptions.Timeout as e:
            logger.error(f"Statistical request timed out: {e}")
            raise SentinelHubNetworkError("Connection to Sentinel Hub Statistical API timed out.") from e
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Statistical request network connection failed: {e}")
            raise SentinelHubNetworkError("Network connection to Sentinel Hub Statistical API failed.") from e
        except requests.exceptions.HTTPError as e:
            logger.error(f"Statistical query failed: {response.text}")
            raise SentinelHubStatsError(f"Sentinel Hub Statistical API failed: {response.text}") from e

        # Parse output JSON payload
        try:
            res_data = response.json()
        except Exception as e:
            logger.error(f"Failed to decode response JSON: {e}")
            raise SentinelHubParseError("Failed to decode Sentinel Hub Statistical API response.") from e

        data_entries = res_data.get("data", [])
        if not data_entries:
            logger.warning("No time range intervals returned in Sentinel Hub response.")
            raise NoImageryFoundError("No satellite imagery intervals found in the query range.")

        best_entry = None
        lowest_cloud = 1.0

        for entry in reversed(data_entries):
            outputs = entry.get("outputs", {})
            default_out = outputs.get("default", {})
            cloud_out = outputs.get("cloudMask", {})
            bands = default_out.get("bands", {})
            cloud_bands = cloud_out.get("bands", {})
            
            b0_stats = bands.get("B0", {})
            stats = b0_stats.get("stats", {})
            
            # Extract cloud percentage
            cloud_b0_stats = cloud_bands.get("B0", {}).get("stats", {})
            cloud_mean = cloud_b0_stats.get("mean")
            
            sample_count = stats.get("sampleCount", 0)
            no_data_count = stats.get("noDataCount", 0)
            valid_pixels = sample_count - no_data_count
            
            if valid_pixels > 0 and stats.get("mean") is not None and cloud_mean is not None:
                # If we find a highly clear day (<20% clouds), use it immediately
                if cloud_mean < 0.20:
                    best_entry = (stats, entry, cloud_mean)
                    break
                
                # Otherwise, keep track of the day with the lowest cloud coverage
                if cloud_mean <= lowest_cloud:
                    lowest_cloud = cloud_mean
                    best_entry = (stats, entry, cloud_mean)

        if not best_entry:
            logger.warning("Satellite passes returned but no valid pixels were found.")
            raise NoImageryFoundError("No valid pixels found in the queried satellite passes.")

        stats, entry, cloud_mean = best_entry
        interval = entry.get("interval", {})
        image_date_full = interval.get("from", "")
        image_date = image_date_full.split("T")[0] if "T" in image_date_full else image_date_full
        cloud_coverage = float(cloud_mean) * 100

        logger.info("Successfully parsed optimal NDVI statistics.")
        return {
            "mean_ndvi": round(float(stats["mean"]), 2),
            "min_ndvi": round(float(stats["min"]), 2),
            "max_ndvi": round(float(stats["max"]), 2),
            "std_dev": round(float(stats["stDev"]), 2),
            "image_date": image_date,
            "cloud_coverage": round(cloud_coverage, 1)
        }
