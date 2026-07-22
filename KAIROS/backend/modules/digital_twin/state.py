import threading
from .scenarios import SCENARIOS

class DigitalTwinState:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DigitalTwinState, cls).__new__(cls)
                cls._instance._init_state()
            return cls._instance

    def _init_state(self):
        self.lock = threading.Lock()
        
        # Default starting scenario
        self.current_scenario_name = "Healthy Farm"
        
        # Start at exactly the targets for the initial scenario
        initial = SCENARIOS[self.current_scenario_name]
        self.current_values = {
            "temperature": initial["temperature"],
            "humidity": initial["humidity"],
            "soil_moisture": initial["soil_moisture"],
            "light": initial["light"],
            "mq135": initial["mq135"],
            "ndvi": initial["ndvi"],
            "rain": initial["rain"],
            "ai_prediction": initial["ai_prediction"],
            "ai_confidence": initial["ai_confidence"][0],
            "risk": initial["risk"]
        }
    
    def set_scenario(self, scenario_name: str):
        if scenario_name not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {scenario_name}")
        with self.lock:
            self.current_scenario_name = scenario_name

    def get_scenario_name(self):
        with self.lock:
            return self.current_scenario_name

    def update_values(self, new_values: dict):
        with self.lock:
            self.current_values.update(new_values)

    def get_values(self):
        with self.lock:
            return dict(self.current_values)

    def get_target_values(self):
        with self.lock:
            return SCENARIOS[self.current_scenario_name]

# Singleton instance
state = DigitalTwinState()
