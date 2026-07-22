from datetime import datetime, timedelta
import random

def get_node_status(db, farm_id, timeout_minutes=5):
    """
    Check the health and status of the ESP32 node for a given farm.
    """
    # Get last sensor data timestamp
    row = db.execute(
        "SELECT timestamp FROM sensor_data WHERE farm_id = ? ORDER BY timestamp DESC LIMIT 1", 
        (farm_id,)
    ).fetchone()
    
    # Get node record
    node_row = db.execute(
        "SELECT * FROM sensor_nodes WHERE farm_id = ?",
        (farm_id,)
    ).fetchone()

    if not node_row:
        # Create a default node record if missing
        db.execute(
            """INSERT INTO sensor_nodes (farm_id, node_status, battery_level, signal_strength, update_rate_seconds)
               VALUES (?, ?, ?, ?, ?)""",
            (farm_id, 'Online', 100.0, 'Excellent', 30)
        )
        db.commit()
        node_row = db.execute(
            "SELECT * FROM sensor_nodes WHERE farm_id = ?",
            (farm_id,)
        ).fetchone()

    status = "Offline"
    last_update_str = "Never"
    is_offline = True
    
    if row and row['timestamp']:
        last_update = datetime.fromisoformat(row['timestamp'])
        last_update_str = last_update.isoformat()
        
        # Check timeout
        if datetime.utcnow() - last_update <= timedelta(minutes=timeout_minutes):
            status = "Online"
            is_offline = False
            
    # Simulate slight fluctuations in battery and signal if online
    battery_level = node_row['battery_level']
    signal_strength = node_row['signal_strength']
    
    if not is_offline:
        # Battery slowly drops, max 100
        battery_level = max(0.0, battery_level - random.uniform(0.01, 0.05))
        # Signal strength jitter
        signals = ['Excellent', 'Good', 'Fair', 'Poor']
        current_idx = signals.index(signal_strength) if signal_strength in signals else 0
        if random.random() < 0.1:
            current_idx = max(0, min(3, current_idx + random.choice([-1, 1])))
        signal_strength = signals[current_idx]
        
        # Update node in DB
        db.execute(
            "UPDATE sensor_nodes SET node_status = ?, battery_level = ?, signal_strength = ?, last_seen = ? WHERE farm_id = ?",
            (status, battery_level, signal_strength, last_update_str, farm_id)
        )
        db.commit()
    else:
        db.execute(
            "UPDATE sensor_nodes SET node_status = ? WHERE farm_id = ?",
            (status, farm_id)
        )
        db.commit()
        
    return {
        "status": status,
        "is_offline": is_offline,
        "last_update": last_update_str,
        "battery_level": round(battery_level, 1),
        "signal_strength": signal_strength,
        "update_rate_seconds": node_row['update_rate_seconds']
    }
