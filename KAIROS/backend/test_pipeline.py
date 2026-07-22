from app import create_app
from app.services.analysis_engine import AnalysisEngine
from app.database.db import get_db

app = create_app()

with app.app_context():
    try:
        # Farm ID 1 exists? Let's check
        db = get_db()
        farm = db.execute("SELECT id FROM farms LIMIT 1").fetchone()
        if not farm:
            print("No farms found in DB")
        else:
            farm_id = farm['id']
            print(f"Testing AnalysisEngine for farm_id: {farm_id}")
            result = AnalysisEngine.run_pipeline(farm_id)
            print("Success!")
    except Exception as e:
        import traceback
        traceback.print_exc()
