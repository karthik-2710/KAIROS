import os
import json
import math
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.database.db import get_db
from config import Config

# Coordinate centroids for Maharashtra districts
MAHARASHTRA_DISTRICT_COORDS = {
    'pune': (18.5204, 73.8567),
    'nagpur': (21.1458, 79.0882),
    'nashik': (19.9975, 73.7898),
    'aurangabad': (19.8762, 75.3433),
    'chhatrapati sambhajinagar': (19.8762, 75.3433),
    'solapur': (17.6599, 75.9064),
    'amravati': (20.9374, 77.7796),
    'kolhapur': (16.7050, 74.2433),
    'sangli': (16.8524, 74.5815),
    'satara': (17.6805, 73.9997),
    'jalgaon': (21.0077, 75.5626),
    'ahmednagar': (19.0948, 74.7480),
    'ahilyanagar': (19.0948, 74.7480),
    'akola': (20.7002, 77.0082),
    'latur': (18.4088, 76.5604),
    'dhule': (20.9042, 74.7749),
    'nanded': (19.1383, 77.3210),
    'buldhana': (20.5293, 76.1843),
    'wardha': (20.7453, 78.6022),
    'yavatmal': (20.3888, 78.1204),
    'bhandara': (21.1718, 79.6548),
    'gondia': (21.4598, 80.1961),
    'chandrapur': (19.9615, 79.2961),
    'gadchiroli': (20.1809, 80.0039),
    'jalna': (19.8410, 75.8864),
    'beed': (18.9891, 75.7601),
    'parbhani': (19.2686, 76.7708),
    'hingoli': (19.7196, 77.1477),
    'washim': (20.1112, 77.1352),
    'osmanabad': (18.1856, 76.0419),
    'dharashiv': (18.1856, 76.0419),
    'nandurbar': (21.3700, 74.2400),
    'thane': (19.2183, 72.9781),
    'palghar': (19.6967, 72.7699),
    'raigad': (18.5158, 73.1812),
    'ratnagiri': (16.9902, 73.3120),
    'sindhudurg': (16.1264, 73.5670),
    'mumbai': (19.0760, 72.8777)
}

# Canonical Mapping for all 10 KAIROS crops
CROP_COMMODITY_MAP = {
    'rice': ['Paddy(Dhan)(Common)', 'Rice', 'Paddy(Dhan)(Basmati)'],
    'soybean': ['Soyabean', 'Soybean'],
    'cotton': ['Cotton', 'Kapas'],
    'wheat': ['Wheat', 'Wheat(Atta)'],
    'onion': ['Onion', 'Green Onion'],
    'banana': ['Banana', 'Banana - Green'],
    'orange': ['Mousambi(Sweet Lime)', 'Orange', 'Santra'],
    'bajra': ['Bajra(Pearl Millet/Cumbu)', 'Bajra'],
    'jowar': ['Jowar(Sorghum)', 'Jowar'],
    'sugarcane': ['Gur(Jaggery)', 'Sugarcane']
}

DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY', '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b')
DATA_GOV_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070'
CACHE_TTL_SECONDS = 3600  # 1 hour cache


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in km."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


class MarketPriceService:
    _memory_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def normalize_crop_name(cls, crop: str) -> str:
        """Returns lowercase normalized KAIROS crop identifier."""
        if not crop:
            return 'rice'
        c = crop.lower().strip()
        for key in CROP_COMMODITY_MAP.keys():
            if key in c:
                return key
        return 'rice'

    @classmethod
    def get_district_coords(cls, district: str) -> Optional[tuple]:
        """Looks up coordinates for a Maharashtra district."""
        if not district:
            return None
        d_norm = district.lower().strip()
        for d_key, coords in MAHARASHTRA_DISTRICT_COORDS.items():
            if d_key in d_norm or d_norm in d_key:
                return coords
        return None

    @classmethod
    def fetch_official_market_data(cls, crop_id: str, state: str = "Maharashtra") -> List[Dict[str, Any]]:
        """
        Fetches official Government of India AGMARKNET daily mandi price records
        from data.gov.in using canonical commodity aliases.
        """
        commodity_terms = CROP_COMMODITY_MAP.get(crop_id, [crop_id.capitalize()])
        records: List[Dict[str, Any]] = []

        for term in commodity_terms:
            params = {
                'api-key': DATA_GOV_API_KEY,
                'format': 'json',
                'filters[state]': state,
                'filters[commodity]': term
            }
            query_string = urllib.parse.urlencode(params)
            url = f"https://api.data.gov.in/resource/{DATA_GOV_RESOURCE_ID}?{query_string}"

            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'KAIROS-Precision-Ag/2.0 (Official Agronomy Platform)'}
            )

            try:
                with urllib.request.urlopen(req, timeout=7) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        found_recs = data.get('records', [])
                        if found_recs:
                            records.extend(found_recs)
                            # Once primary official term returns active mandis, proceed
                            break
            except Exception as e:
                print(f"[MarketPriceService] Fetch error for {crop_id} -> '{term}': {e}")
                continue

        # If no Maharashtra mandis reported today, query national mandis
        if not records and state == "Maharashtra":
            params_all = {
                'api-key': DATA_GOV_API_KEY,
                'format': 'json',
                'filters[commodity]': commodity_terms[0]
            }
            query_all = urllib.parse.urlencode(params_all)
            url_all = f"https://api.data.gov.in/resource/{DATA_GOV_RESOURCE_ID}?{query_all}"
            req_all = urllib.request.Request(
                url_all,
                headers={'User-Agent': 'KAIROS-Precision-Ag/2.0 (Official Agronomy Platform)'}
            )
            try:
                with urllib.request.urlopen(req_all, timeout=7) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        records = data.get('records', [])
            except Exception as e:
                print(f"[MarketPriceService] National fallback error for {crop_id}: {e}")

        return records

    @classmethod
    def get_market_intelligence(
        cls, 
        crop: str = "Rice", 
        farm_lat: float = 20.0, 
        farm_lon: float = 78.0, 
        state: str = "Maharashtra"
    ) -> Dict[str, Any]:
        """
        Retrieves normalized, distance-sorted market intelligence for the farmer's crop and location.
        Implements in-memory and SQLite caching with 1-hour TTL.
        """
        crop_id = cls.normalize_crop_name(crop)
        cache_key = f"{crop_id}_{state}_{round(farm_lat, 2)}_{round(farm_lon, 2)}"
        now = datetime.utcnow()

        # 1. Check in-memory cache
        if cache_key in cls._memory_cache:
            entry = cls._memory_cache[cache_key]
            if (now - entry['cached_at']).total_seconds() < CACHE_TTL_SECONDS:
                return entry['data']

        # 2. Check SQLite persistent cache
        db = get_db()
        try:
            row = db.execute(
                "SELECT payload_json, expires_at FROM market_price_cache WHERE cache_key = ?",
                (cache_key,)
            ).fetchone()
            if row:
                expires_at = datetime.fromisoformat(row['expires_at'])
                if now < expires_at:
                    data = json.loads(row['payload_json'])
                    cls._memory_cache[cache_key] = {'data': data, 'cached_at': now}
                    return data
        except Exception as e:
            print("[MarketPriceService] SQLite cache read error:", e)
        finally:
            db.close()

        # 3. Fetch fresh data from Official GOI API
        raw_records = cls.fetch_official_market_data(crop_id, state)

        # 4. Normalize and calculate proximity
        normalized_mandis: List[Dict[str, Any]] = []
        observed_dates = set()

        for r in raw_records:
            mandi_name = r.get('market', 'APMC Mandi')
            district = r.get('district', 'Regional')
            r_state = r.get('state', state)
            commodity = r.get('commodity', crop.capitalize())
            variety = r.get('variety', 'Standard')
            arrival_date = r.get('arrival_date', now.strftime('%d/%m/%Y'))
            observed_dates.add(arrival_date)

            try:
                min_p = float(r.get('min_price', 0))
            except (ValueError, TypeError):
                min_p = None

            try:
                max_p = float(r.get('max_price', 0))
            except (ValueError, TypeError):
                max_p = None

            try:
                modal_p = float(r.get('modal_price', 0))
            except (ValueError, TypeError):
                modal_p = None

            # Calculate distance from farm
            dist_coords = cls.get_district_coords(district)
            if dist_coords and farm_lat and farm_lon:
                distance_km = haversine_distance(farm_lat, farm_lon, dist_coords[0], dist_coords[1])
            else:
                distance_km = 999.0

            if distance_km < 60:
                proximity_badge = "Local District"
            elif distance_km < 200:
                proximity_badge = "Nearby Market"
            else:
                proximity_badge = "State-wide Market"

            mandi_obj = {
                'market_name': mandi_name,
                'district': district,
                'state': r_state,
                'commodity': commodity,
                'variety': variety,
                'min_price': min_p,
                'max_price': max_p,
                'modal_price': modal_p,
                'price_unit': '₹/quintal',
                'price_per_kg': round(modal_p / 100, 2) if modal_p else None,
                'distance_km': distance_km if distance_km != 999.0 else None,
                'proximity_badge': proximity_badge,
                'arrival_date': arrival_date,
                'source': 'Government of India (AGMARKNET / data.gov.in)'
            }
            normalized_mandis.append(mandi_obj)

        # Sort mandis: Primary by distance, Secondary by highest modal price
        normalized_mandis.sort(key=lambda m: (m['distance_km'] if m['distance_km'] is not None else 9999, -(m['modal_price'] or 0)))

        # 5. Compute Aggregates & Transparency Metrics
        modal_prices = [m['modal_price'] for m in normalized_mandis if m['modal_price']]
        min_prices = [m['min_price'] for m in normalized_mandis if m['min_price']]
        max_prices = [m['max_price'] for m in normalized_mandis if m['max_price']]

        state_modal_avg = round(sum(modal_prices) / len(modal_prices), 1) if modal_prices else None
        overall_min = min(min_prices) if min_prices else None
        overall_max = max(max_prices) if max_prices else None
        top_mandi = max(normalized_mandis, key=lambda m: m['modal_price'] or 0) if normalized_mandis else None

        latest_date_str = sorted(list(observed_dates))[-1] if observed_dates else now.strftime('%d/%m/%Y')

        # 6. Check historical observations in SQLite
        db = get_db()
        price_change_pct = None
        trend_direction = "STABLE"
        historical_points = []

        try:
            # Store fresh observations
            for m in normalized_mandis[:10]:
                if m.get('modal_price'):
                    db.execute(
                        """INSERT INTO market_price_observations 
                           (crop_id, commodity, market, district, state, min_price, max_price, modal_price, unit, arrival_date, source)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (crop_id, m['commodity'], m['market_name'], m['district'], m['state'],
                         m['min_price'], m['max_price'], m['modal_price'], m['price_unit'], m['arrival_date'], m['source'])
                    )

            # Retrieve past distinct observations for trend
            history_rows = db.execute(
                """SELECT arrival_date, AVG(modal_price) as avg_modal, MIN(min_price) as min_p, MAX(max_price) as max_p
                   FROM market_price_observations
                   WHERE crop_id = ? AND state = ?
                   GROUP BY arrival_date
                   ORDER BY recorded_at ASC
                   LIMIT 15""",
                (crop_id, state)
            ).fetchall()

            for h in history_rows:
                historical_points.append({
                    'date': h['arrival_date'],
                    'modal_price': round(h['avg_modal'], 1) if h['avg_modal'] else None,
                    'min_price': round(h['min_p'], 1) if h['min_p'] else None,
                    'max_price': round(h['max_p'], 1) if h['max_p'] else None
                })

            if len(historical_points) >= 2:
                prev_price = historical_points[-2]['modal_price']
                curr_price = historical_points[-1]['modal_price']
                if prev_price and curr_price:
                    diff = curr_price - prev_price
                    price_change_pct = round((diff / prev_price) * 100, 1)
                    if price_change_pct > 0.5:
                        trend_direction = "UP"
                    elif price_change_pct < -0.5:
                        trend_direction = "DOWN"

            db.commit()
        except Exception as e:
            print("[MarketPriceService] Historical observation logging error:", e)
        finally:
            db.close()

        # 7. Build Response Object
        result: Dict[str, Any] = {
            'success': True,
            'crop_id': crop_id,
            'crop_name': crop.capitalize(),
            'state': state,
            'farm_location': {'lat': farm_lat, 'lon': farm_lon},
            'has_data': len(normalized_mandis) > 0,
            'summary': {
                'state_modal_avg': state_modal_avg,
                'min_price': overall_min,
                'max_price': overall_max,
                'price_unit': '₹/quintal',
                'price_per_kg_avg': round(state_modal_avg / 100, 2) if state_modal_avg else None,
                'top_market': top_mandi['market_name'] if top_mandi else None,
                'top_market_price': top_mandi['modal_price'] if top_mandi else None,
                'total_mandis_reporting': len(normalized_mandis),
                'price_change_pct': price_change_pct,
                'trend_direction': trend_direction,
                'latest_observation_date': latest_date_str,
                'source': 'Government of India (AGMARKNET / data.gov.in)',
                'last_updated_at': now.isoformat()
            },
            'mandis': normalized_mandis,
            'historical_trends': historical_points
        }

        # 8. Store in Persistent & Memory Cache
        cls._memory_cache[cache_key] = {'data': result, 'cached_at': now}
        try:
            db = get_db()
            expires_at_str = (now + timedelta(seconds=CACHE_TTL_SECONDS)).isoformat()
            db.execute(
                """INSERT OR REPLACE INTO market_price_cache 
                   (cache_key, crop_id, state, payload_json, last_updated, expires_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (cache_key, crop_id, state, json.dumps(result), now.isoformat(), expires_at_str)
            )
            db.commit()
            db.close()
        except Exception as e:
            print("[MarketPriceService] Cache write error:", e)

        return result
