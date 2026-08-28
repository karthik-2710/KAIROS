import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'kairos.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def column_exists(table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

# Alter farms table
if not column_exists('farms', 'phone'):
    cursor.execute("ALTER TABLE farms ADD COLUMN phone TEXT")
if not column_exists('farms', 'whatsapp'):
    cursor.execute("ALTER TABLE farms ADD COLUMN whatsapp TEXT")
if not column_exists('farms', 'use_phone_as_whatsapp'):
    cursor.execute("ALTER TABLE farms ADD COLUMN use_phone_as_whatsapp INTEGER DEFAULT 0")
if not column_exists('farms', 'email'):
    cursor.execute("ALTER TABLE farms ADD COLUMN email TEXT")
if not column_exists('farms', 'preferred_language'):
    cursor.execute("ALTER TABLE farms ADD COLUMN preferred_language TEXT DEFAULT 'English'")

# Alter satellite_data table
for col in ['ndre_mean', 'ndre_min', 'ndre_max', 'ndwi_mean', 'ndwi_min', 'ndwi_max', 'band_b5', 'band_b11']:
    if not column_exists('satellite_data', col):
        cursor.execute(f"ALTER TABLE satellite_data ADD COLUMN {col} REAL")

# Create new tables
cursor.executescript("""
CREATE TABLE IF NOT EXISTS notifications (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    farm_id             INTEGER,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    severity            TEXT DEFAULT 'Information',
    category            TEXT DEFAULT 'General',
    channel             TEXT DEFAULT 'dashboard',
    is_read             INTEGER DEFAULT 0,
    action_url          TEXT,
    timestamp           TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id             INTEGER NOT NULL UNIQUE,
    dashboard           INTEGER DEFAULT 1,
    whatsapp            INTEGER DEFAULT 0,
    email               INTEGER DEFAULT 0,
    sms                 INTEGER DEFAULT 0,
    weekly_summary      INTEGER DEFAULT 1,
    monthly_report      INTEGER DEFAULT 0,
    disease_detection   INTEGER DEFAULT 1,
    disease_forecast    INTEGER DEFAULT 1,
    ndvi_alerts         INTEGER DEFAULT 1,
    weather_alerts      INTEGER DEFAULT 1,
    irrigation_alerts   INTEGER DEFAULT 1,
    nutrient_alerts     INTEGER DEFAULT 1,
    harvest_reminders   INTEGER DEFAULT 1,
    general_updates     INTEGER DEFAULT 1,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id     INTEGER NOT NULL,
    provider            TEXT NOT NULL,
    status              TEXT NOT NULL,
    error_message       TEXT,
    timestamp           TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);
""")

# Backfill preferences for existing farms
cursor.execute("SELECT id FROM farms")
farms = cursor.fetchall()
for farm in farms:
    farm_id = farm[0]
    cursor.execute("SELECT id FROM notification_preferences WHERE farm_id = ?", (farm_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO notification_preferences (farm_id) VALUES (?)", (farm_id,))

conn.commit()
conn.close()
print("Migration completed successfully.")
