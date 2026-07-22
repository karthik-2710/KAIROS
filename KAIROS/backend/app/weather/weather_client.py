import requests
from config import Config


def get_weather_by_coords(lat: float, lon: float) -> dict:
    """
    Fetches current weather and 24h rain forecast from OpenWeatherMap.
    Returns structured dict with temperature, humidity, wind_speed,
    rain_forecast_mm, description, location.
    """
    api_key = Config.OPENWEATHER_API_KEY
    if not api_key:
        return {}

    try:
        # Current weather
        current_url = f"{Config.OPENWEATHER_BASE_URL}/weather"
        params = {'lat': lat, 'lon': lon, 'appid': api_key, 'units': 'metric'}
        current_res = requests.get(current_url, params=params, timeout=10)
        current_res.raise_for_status()
        cdata = current_res.json()

        # Forecast (for rain prediction)
        forecast_url = f"{Config.OPENWEATHER_BASE_URL}/forecast"
        forecast_res = requests.get(forecast_url, params={**params, 'cnt': 8}, timeout=10)
        forecast_res.raise_for_status()
        fdata = forecast_res.json()

        # Extract 24h rain total
        rain_24h = sum(
            item.get('rain', {}).get('3h', 0)
            for item in fdata.get('list', [])[:8]
        )

        return {
            'temperature': round(cdata['main']['temp'], 1),
            'humidity': cdata['main']['humidity'],
            'wind_speed': round(cdata['wind']['speed'] * 3.6, 1),  # m/s to km/h
            'description': cdata['weather'][0]['description'].title(),
            'location': f"{cdata['name']}, {cdata['sys']['country']}",
            'rain_forecast_mm': round(rain_24h, 2),
            'pressure': cdata['main']['pressure'],
            'feels_like': round(cdata['main']['feels_like'], 1),
            'lat': lat,
            'lon': lon,
        }

    except (requests.RequestException, KeyError, ValueError) as e:
        print(f"[WeatherClient] Error: {e}")
        return {}


def get_weather_for_farm(farm: dict) -> dict:
    """Get weather for a farm based on its polygon centroid."""
    polygon = farm.get('polygon')
    lat, lon = 11.0, 77.0  # Default: Tamil Nadu

    if polygon:
        import json
        try:
            points = json.loads(polygon) if isinstance(polygon, str) else polygon
            lat = sum(p[0] for p in points) / len(points)
            lon = sum(p[1] for p in points) / len(points)
        except Exception:
            pass

    return get_weather_by_coords(lat, lon)

