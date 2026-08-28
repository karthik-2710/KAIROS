import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "KAIROS", "KAIROS", "backend", "kairos.db")
conn = sqlite3.connect(db_path)
conn.execute("UPDATE farms SET phone = '+919962109473', whatsapp = '+919962109473'")
conn.commit()

print("Linked Phone Numbers for all farms:")
for r in conn.execute("SELECT id, name, crop_type, phone, whatsapp FROM farms").fetchall():
    print(r)
conn.close()
