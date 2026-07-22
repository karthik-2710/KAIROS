#!/usr/bin/env python3
"""
KAIROS Backend — Flask Development Server
"""
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.database.db import init_db

if __name__ == '__main__':
    # Initialize database on startup
    init_db()

    # Pre-load AI model in background
    try:
        from app.ai.model_loader import load_model
        load_model()
    except Exception as e:
        print(f"[KAIROS] AI model pre-load skipped: {e}")

    # Start Digital Twin Scheduler
    try:
        from modules.digital_twin.scheduler import scheduler
        scheduler.start()
    except Exception as e:
        print(f"[KAIROS] Digital Twin scheduler failed to start: {e}")

    app = create_app()

    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'

    print(f"""
==================================================
          KAIROS Backend v1.0.0
  Knowledge-driven Agricultural Intelligence
==================================================
  Running on  : http://localhost:{port}
  Frontend    : http://localhost:5173
  Debug mode  : {str(debug).upper():<5}
==================================================
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)
