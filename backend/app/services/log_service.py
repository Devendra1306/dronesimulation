import time

class LogService:
    def __init__(self):
        self.logs = []
        
    def add_log(self, level: str, message: str, source: str):
        log = {
            "level": level,
            "message": message,
            "timestamp": time.time(),
            "source": source
        }
        self.logs.append(log)
        # In a real system, you'd also broadcast this via websockets here or in a separate task
        
    def get_logs(self, limit: int = 100):
        return self.logs[-limit:]

log_service = LogService()
