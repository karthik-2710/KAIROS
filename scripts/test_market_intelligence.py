import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "KAIROS" / "KAIROS" / "backend"
sys.path.insert(0, str(backend_dir))

from app import create_app
from app.database.db import get_db, init_db
from app.services.market_service import (
    MarketPriceService, 
    haversine_distance, 
    CROP_COMMODITY_MAP, 
    MAHARASHTRA_DISTRICT_COORDS
)
from app.routes.ai import build_farm_ai_context, generate_deterministic_fallback

class TestMarketIntelligence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_crop_canonical_mapping(self):
        """Test canonical mapping for all 10 KAIROS crops."""
        all_10_crops = [
            'Rice', 'Soybean', 'Cotton', 'Wheat', 'Onion', 
            'Banana', 'Orange', 'Bajra', 'Jowar', 'Sugarcane'
        ]
        for crop in all_10_crops:
            norm = MarketPriceService.normalize_crop_name(crop)
            self.assertIn(norm, CROP_COMMODITY_MAP, f"Normalized crop {norm} not in CROP_COMMODITY_MAP")
            aliases = CROP_COMMODITY_MAP[norm]
            self.assertTrue(len(aliases) > 0, f"Aliases for {norm} should not be empty")

    def test_02_haversine_distance(self):
        """Test distance calculation between coordinates."""
        # Distance between Pune (18.5204, 73.8567) and Mumbai (19.0760, 72.8777) is ~120-150 km
        dist = haversine_distance(18.5204, 73.8567, 19.0760, 72.8777)
        self.assertTrue(110 <= dist <= 140, f"Expected Pune to Mumbai ~120-140 km, got {dist} km")

        # Zero distance to same point
        self.assertEqual(haversine_distance(20.0, 78.0, 20.0, 78.0), 0.0)

    def test_03_maharashtra_district_lookup(self):
        """Test district coordinate lookup."""
        for district in ['Nagpur', 'Pune', 'Nashik', 'Wardha', 'Latur', 'Kolhapur']:
            coords = MarketPriceService.get_district_coords(district)
            self.assertIsNotNone(coords, f"District {district} should have coordinates")
            self.assertEqual(len(coords), 2)

    def test_04_market_intelligence_fetch_and_caching(self):
        """Test market intelligence service real fetch and cache."""
        res = MarketPriceService.get_market_intelligence(
            crop='Soybean',
            farm_lat=20.7453, # Wardha
            farm_lon=78.6022,
            state='Maharashtra'
        )
        self.assertTrue(res.get('success'))
        self.assertEqual(res.get('crop_id'), 'soybean')
        self.assertEqual(res.get('state'), 'Maharashtra')
        self.assertIn('summary', res)
        self.assertIn('mandis', res)
        self.assertIn('source', res.get('summary', {}))

        # Check mandis sorting (distance proximity)
        mandis = res.get('mandis', [])
        if len(mandis) >= 2 and mandis[0].get('distance_km') is not None and mandis[1].get('distance_km') is not None:
            self.assertLessEqual(mandis[0]['distance_km'], mandis[1]['distance_km'] + 10)

    def test_05_backend_routes(self):
        """Test /market/prices and /market/summary endpoints."""
        # Generate valid token using app's auth utility
        from app.utils.auth import generate_token
        token = generate_token(1)
        headers = {'Authorization': f'Bearer {token}'}

        # 1. GET /market/prices
        resp1 = self.client.get('/market/prices?farm_id=1&crop=Soybean', headers=headers)
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.get_json()
        self.assertTrue(data1.get('success'))
        self.assertEqual(data1.get('crop_id'), 'soybean')

        # 2. GET /market/summary
        resp2 = self.client.get('/market/summary?farm_id=1&crop=Rice', headers=headers)
        self.assertEqual(resp2.status_code, 200)
        data2 = resp2.get_json()
        self.assertTrue(data2.get('success'))
        self.assertEqual(data2.get('crop_name'), 'Rice')
        self.assertIn('modal_price', data2)

        # 3. GET /market/history
        resp3 = self.client.get('/market/history?crop=Rice', headers=headers)
        self.assertEqual(resp3.status_code, 200)
        data3 = resp3.get_json()
        self.assertTrue(data3.get('success'))

    def test_06_ai_assistant_grounding_and_fallbacks(self):
        """Test AI assistant context contains market telemetry and handles queries in EN, MR, HI, TA."""
        # Build context for farm 1
        ctx = build_farm_ai_context(1)
        self.assertIn('market_intelligence', ctx)
        mkt = ctx['market_intelligence']
        self.assertIn('crop', mkt)
        self.assertIn('source', mkt)

        # English Market QA
        ans_en = generate_deterministic_fallback("What is the current market price of my crop?", "en", ctx)
        self.assertTrue("Official Mandi Market Prices" in ans_en or "Market Prices" in ans_en)

        # Marathi Market QA
        ans_mr = generate_deterministic_fallback("माझ्या शेताजवळ आज बाजारभाव किती आहे?", "mr", ctx)
        self.assertTrue("बाजारभाव" in ans_mr or "Market Prices" in ans_mr)

        # Hindi Market QA
        ans_hi = generate_deterministic_fallback("आज का मंडी भाव क्या है?", "hi", ctx)
        self.assertTrue("बाजार भाव" in ans_hi or "Market Prices" in ans_hi)

        # Tamil Market QA
        ans_ta = generate_deterministic_fallback("தற்போதைய சந்தை விலை என்ன?", "ta", ctx)
        self.assertTrue("சந்தை விலை" in ans_ta or "Market Prices" in ans_ta)


if __name__ == '__main__':
    unittest.main()
