import sqlite3
import os
from config import Config

def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Initialize the database schema."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            password    TEXT    NOT NULL,
            created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS farms (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            name        TEXT    NOT NULL,
            crop_type   TEXT    NOT NULL,
            area_ha     REAL    DEFAULT 0,
            polygon     TEXT,
            health_score INTEGER DEFAULT 50,
            created_at  TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sensor_data (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id         INTEGER,
            temperature     REAL,
            humidity        REAL,
            soil_moisture   REAL,
            light           REAL    DEFAULT 0,
            mq135           REAL    DEFAULT 0,
            scenario        TEXT    DEFAULT 'Healthy Farm',
            ndvi            REAL    DEFAULT 0.8,
            rain_detected   INTEGER DEFAULT 0,
            timestamp       TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS environmental_analysis (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_data_id    INTEGER,
            health_index      REAL,
            temp_class        TEXT,
            hum_class         TEXT,
            moisture_class    TEXT,
            light_class       TEXT,
            air_quality_class TEXT,
            timestamp         TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sensor_nodes (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id               INTEGER,
            node_status           TEXT    DEFAULT 'Online',
            battery_level         REAL    DEFAULT 100.0,
            signal_strength       TEXT    DEFAULT 'Excellent',
            update_rate_seconds   INTEGER DEFAULT 30,
            last_seen             TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS satellite_data (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id         INTEGER,
            ndvi_mean       REAL,
            ndvi_min        REAL,
            ndvi_max        REAL,
            healthy_pct     REAL,
            moderate_pct    REAL,
            stress_pct      REAL,
            band_b4         REAL,
            band_b8         REAL,
            cloud_coverage  REAL,
            image_path      TEXT,
            timestamp       TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id     INTEGER,
            image_path  TEXT,
            disease     TEXT,
            confidence  REAL,
            severity    TEXT,
            description TEXT,
            timestamp   TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS leaf_scans (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id     INTEGER,
            user_id     INTEGER,
            timestamp   TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS scan_images (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id     INTEGER,
            image_path  TEXT,
            FOREIGN KEY (scan_id) REFERENCES leaf_scans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS disease_predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id         INTEGER,
            disease         TEXT,
            scientific_name TEXT,
            confidence      REAL,
            severity        TEXT,
            healthy         INTEGER,
            model_version   TEXT,
            FOREIGN KEY (scan_id) REFERENCES leaf_scans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS farm_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id         INTEGER,
            scan_id         INTEGER,
            event_type      TEXT,
            description     TEXT,
            ndvi_at_time    REAL,
            confidence_str  TEXT,
            timestamp       TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
            FOREIGN KEY (scan_id) REFERENCES leaf_scans(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id             INTEGER,
            health_score        INTEGER,
            overall_status      TEXT,
            severity            TEXT,
            confidence          INTEGER,
            primary_issue       TEXT,
            secondary_issue     TEXT,
            diagnostic_summary  TEXT,
            assessments_json    TEXT,
            supporting_evidence TEXT,
            recommended_actions TEXT,
            follow_up           TEXT,
            timestamp           TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS analysis_history (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            farm_id             INTEGER,
            sensor_data_id      INTEGER,
            satellite_data_id   INTEGER,
            leaf_scan_id        INTEGER,
            recommendation_id   INTEGER,
            farm_health_score   REAL,
            timestamp           TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
            FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(id) ON DELETE SET NULL,
            FOREIGN KEY (satellite_data_id) REFERENCES satellite_data(id) ON DELETE SET NULL,
            FOREIGN KEY (leaf_scan_id) REFERENCES leaf_scans(id) ON DELETE SET NULL,
            FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL
        );
    """)

    # Seed demo user and demo farm if empty
    existing = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing == 0:
        import bcrypt
        pw = bcrypt.hashpw(b'demo1234', bcrypt.gensalt()).decode()
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            ('Demo Farmer', 'demo@kairos.ag', pw)
        )
        uid = cursor.lastrowid
        cursor.execute(
            """INSERT INTO farms (user_id, name, crop_type, area_ha, polygon, health_score)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (uid, 'North Paddy Field', 'Rice', 3.2,
             '[[11.0168,76.9558],[11.0268,76.9558],[11.0268,76.9658],[11.0168,76.9658]]', 72)
        )
        fid = cursor.lastrowid
        # Insert sample sensor data
        import random
        for i in range(20):
            from datetime import datetime, timedelta
            ts = (datetime.utcnow() - timedelta(hours=i*3)).isoformat()
            cursor.execute(
                """INSERT INTO sensor_data (farm_id, temperature, humidity, soil_moisture, light, mq135, rain_detected, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (fid, round(28 + random.random()*8, 1), round(55 + random.random()*30, 1),
                 round(30 + random.random()*40, 1), round(600 + random.random()*400, 1), round(100 + random.random()*300, 1), 0, ts)
            )

        cursor.execute(
            """INSERT INTO sensor_nodes (farm_id, node_status, battery_level, signal_strength, update_rate_seconds)
               VALUES (?, ?, ?, ?, ?)""",
            (fid, 'Online', 98.5, 'Excellent', 30)
        )

    conn.commit()
    conn.close()
    print("Database initialized")
