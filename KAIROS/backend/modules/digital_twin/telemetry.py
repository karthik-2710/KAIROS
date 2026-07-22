import random

def clamp(val, min_val, max_val):
    return max(min_val, min(val, max_val))

def step_towards(current, target, step_size, noise=0.0):
    """Move current towards target by at most step_size, plus some random noise."""
    diff = target - current
    if abs(diff) > step_size:
        move = step_size if diff > 0 else -step_size
    else:
        move = diff
        
    new_val = current + move + random.gauss(0, noise)
    return new_val

def update_telemetry(current_values: dict, target_values: dict) -> dict:
    """
    Simulates physics relationships and smooth transitions.
    Returns the newly computed telemetry state.
    """
    new_vals = dict(current_values)

    # Base steps per tick (3 seconds)
    # E.g. temperature moves by at most 0.1 degree per tick
    temp_step = 0.05
    hum_step = 0.3
    moist_step = 0.2
    light_step = 15.0
    mq135_step = 5.0
    ndvi_step = 0.005
    
    # 1. Direct interpolation towards targets
    new_vals["temperature"] = step_towards(new_vals["temperature"], target_values["temperature"], temp_step, 0.02)
    new_vals["humidity"] = step_towards(new_vals["humidity"], target_values["humidity"], hum_step, 0.2)
    new_vals["soil_moisture"] = step_towards(new_vals["soil_moisture"], target_values["soil_moisture"], moist_step, 0.1)
    new_vals["light"] = step_towards(new_vals["light"], target_values["light"], light_step, 5.0)
    new_vals["mq135"] = step_towards(new_vals["mq135"], target_values["mq135"], mq135_step, 2.0)
    new_vals["ndvi"] = step_towards(new_vals["ndvi"], target_values["ndvi"], ndvi_step, 0.001)

    # Set Rain boolean directly if the scenario changes (or we could make it probabilistic, but scenario dictates it for now)
    new_vals["rain"] = target_values["rain"]
    
    # AI and Risk are updated dynamically
    new_vals["ai_prediction"] = target_values["ai_prediction"]
    new_vals["risk"] = target_values["risk"]
    
    # Confidence fluctuates within the target bounds
    min_conf, max_conf = target_values["ai_confidence"]
    target_conf = (min_conf + max_conf) / 2.0
    # Drift confidence slightly
    new_vals["ai_confidence"] = step_towards(new_vals["ai_confidence"], target_conf, 0.2, 0.1)
    new_vals["ai_confidence"] = clamp(new_vals["ai_confidence"], min_conf, max_conf)

    # 2. Physics-based relationships overriding direct interpolation if needed
    if new_vals["rain"]:
        # If it's raining, humidity goes up, temp drops, moisture goes up
        new_vals["humidity"] = step_towards(new_vals["humidity"], 95.0, 0.5, 0.1)
        new_vals["temperature"] = step_towards(new_vals["temperature"], 22.0, 0.1, 0.05)
        new_vals["soil_moisture"] = step_towards(new_vals["soil_moisture"], 80.0, 0.5, 0.1)
        new_vals["light"] = step_towards(new_vals["light"], 300.0, 10.0, 2.0)

    # Temperature vs Humidity coupling
    # Generally higher temp means lower relative humidity, but we rely on the target scenarios
    # For extreme temperatures, drop moisture faster
    if new_vals["temperature"] > 35.0 and not new_vals["rain"]:
        new_vals["soil_moisture"] -= 0.05

    # Bounds clamping
    new_vals["temperature"] = clamp(new_vals["temperature"], 10.0, 50.0)
    new_vals["humidity"] = clamp(new_vals["humidity"], 0.0, 100.0)
    new_vals["soil_moisture"] = clamp(new_vals["soil_moisture"], 0.0, 100.0)
    new_vals["light"] = clamp(new_vals["light"], 0.0, 2000.0)
    new_vals["mq135"] = clamp(new_vals["mq135"], 0.0, 1000.0)
    new_vals["ndvi"] = clamp(new_vals["ndvi"], 0.0, 1.0)

    # Round for realistic sensor resolution
    new_vals["temperature"] = round(new_vals["temperature"], 2)
    new_vals["humidity"] = round(new_vals["humidity"], 1)
    new_vals["soil_moisture"] = round(new_vals["soil_moisture"], 1)
    new_vals["light"] = round(new_vals["light"], 1)
    new_vals["mq135"] = round(new_vals["mq135"], 1)
    new_vals["ndvi"] = round(new_vals["ndvi"], 3)
    new_vals["ai_confidence"] = round(new_vals["ai_confidence"], 1)

    return new_vals
