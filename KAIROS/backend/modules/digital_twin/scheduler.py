import time
import threading
from .simulator import simulation_tick

class DigitalTwinScheduler:
    def __init__(self, interval=3.0):
        self.interval = interval
        self.thread = None
        self.running = False

    def _run(self):
        while self.running:
            try:
                simulation_tick()
            except Exception as e:
                print(f"[Digital Twin] Error in simulation tick: {e}")
            time.sleep(self.interval)

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True, name="DigitalTwinThread")
        self.thread.start()
        print(f"[Digital Twin] Background simulator started (interval: {self.interval}s)")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)

scheduler = DigitalTwinScheduler()
