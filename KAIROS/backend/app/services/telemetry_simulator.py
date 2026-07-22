import math
import time
import random
from typing import Dict, Any

class TelemetrySimulator:
    """
    Digital Twin Simulator for KAIROS.
    Generates realistic sensor values that evolve gradually over time based on 
    continuous mathematical functions (sine waves) with slight noise.
    """
    
    @staticmethod
    def get_current_telemetry(farm_id: int) -> Dict[str, Any]:
        # Use current time in seconds as the continuous progression variable
        t = time.time()
        
        # Use farm_id to create slight offsets between different farms
        offset = farm_id * 1000
        
        # Base daily cycle (24 hours = 86400 seconds)
        # We'll speed up the simulation cycle slightly to show change in minutes
        # Let's say a full cycle takes 2 hours (7200 seconds) for demonstration
        cycle_period = 7200.0
        
        # Phase (0 to 2*PI)
        phase = ((t + offset) % cycle_period) / cycle_period * 2 * math.pi
        
        # Helper to generate value with sine wave and noise
        def gradual_value(base: float, amplitude: float, phase_shift: float, noise_level: float = 0.05) -> float:
            val = base + amplitude * math.sin(phase + phase_shift)
            noise = (random.random() * 2 - 1) * noise_level * amplitude
            return round(val + noise, 2)
            
        # Temperature: Base 25C, swings 10C (15C to 35C). Peaks at PI/2
        temp = gradual_value(25.0, 10.0, 0.0, 0.02)
        
        # Humidity: Base 65%, swings 25%. Inverse to temperature (peaks at 3PI/2)
        humidity = gradual_value(65.0, 25.0, math.pi, 0.03)
        # Clamp humidity
        humidity = max(10.0, min(100.0, humidity))
        
        # Light: Base 50000 lux, swings 50000. 
        # But should not go below 0 (night time).
        light_raw = 50000.0 + 50000.0 * math.sin(phase)
        light = max(0.0, light_raw + (random.random() * 1000 - 500))
        light = round(light, 0)
        
        # Solar Panel Output: Correlates highly with light
        solar = round((light / 100000.0) * 12.0, 2) # max 12V roughly
        
        # Soil Moisture: Gradually depletes, peaks slowly (simulating watering every few cycles)
        # We use a much slower cycle for soil moisture
        soil_phase = ((t + offset) % (cycle_period * 3)) / (cycle_period * 3) * 2 * math.pi
        soil_moisture = gradual_value(50.0, 30.0, soil_phase, 0.02)
        soil_moisture = max(0.0, min(100.0, soil_moisture))
        
        # pH: Very slow change, mostly stable around 6.5
        ph = gradual_value(6.5, 0.5, phase / 5, 0.01)
        
        # EC (Electrical Conductivity): Relates to soil moisture and nutrients
        ec = gradual_value(1.5, 0.4, soil_phase, 0.05)
        
        # NPK (Nitrogen, Phosphorus, Potassium): Generally stable, slight drift
        nitrogen = gradual_value(120.0, 20.0, phase / 4, 0.05)
        phosphorus = gradual_value(40.0, 10.0, phase / 3, 0.05)
        potassium = gradual_value(180.0, 30.0, phase / 2, 0.05)
        
        # Battery: Drops during night, charges during day
        # Integrated over time, but we'll approximate based on phase
        battery = gradual_value(80.0, 20.0, phase - (math.pi/4), 0.02)
        battery = max(0.0, min(100.0, battery))
        
        return {
            "temperature": temp,
            "humidity": round(humidity, 1),
            "soil_moisture": round(soil_moisture, 1),
            "light": light,
            "ph": ph,
            "ec": ec,
            "nitrogen": int(nitrogen),
            "phosphorus": int(phosphorus),
            "potassium": int(potassium),
            "battery": round(battery, 1),
            "solar": solar,
            "status": "Online",
            "mq135": round(gradual_value(400.0, 50.0, phase, 0.1), 0) # Air quality / CO2 ppm
        }
