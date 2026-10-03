import asyncio
import time
import logging
from typing import Optional
from app.config import settings
from app.schemas.drone import TelemetryData
from app.schemas.database import TelemetryRecord, SensorDataRecord, SystemEventRecord
from app.db.repositories.telemetry import telemetry_repo
from app.db.repositories.sensors import sensors_repo
from app.db.repositories.system_events import system_events_repo

logger = logging.getLogger(__name__)

class PersistenceService:
    def __init__(self):
        self.active_experiment_id: Optional[str] = "EXP-ACTIVE-01"
        self.active_run_id: Optional[str] = "RUN-ACTIVE-01"
        self._last_telemetry_persist_time: float = 0.0
        self._persist_interval: float = 1.0 / max(settings.telemetry_db_rate_hz, 0.1)

    def set_active_context(self, experiment_id: Optional[str], run_id: Optional[str]):
        self.active_experiment_id = experiment_id
        self.active_run_id = run_id

    async def maybe_persist_telemetry(self, telem: TelemetryData):
        """Persists telemetry at throttled frequency (TELEMETRY_DB_RATE_HZ) without blocking WebSocket."""
        if not settings.enable_telemetry_persistence:
            return

        now = time.time()
        if now - self._last_telemetry_persist_time < self._persist_interval:
            return

        self._last_telemetry_persist_time = now

        # Fire and forget async insert
        asyncio.create_task(self._persist_sample(telem, now))

    async def _persist_sample(self, telem: TelemetryData, now: float):
        try:
            # 1. Telemetry document
            t_rec = TelemetryRecord(
                experiment_id=self.active_experiment_id,
                run_id=self.active_run_id,
                timestamp=now,
                altitude=telem.altitude,
                velocity=telem.velocity,
                latitude=telem.latitude,
                longitude=telem.longitude,
                heading=telem.heading,
                pitch=telem.pitch,
                roll=telem.roll,
                yaw=telem.yaw,
                battery=telem.battery,
                signal=telem.signal_strength,
                flight_state=telem.mode,
                source=telem.source
            )
            await telemetry_repo.insert(t_rec)

            # 2. Key sensor historical record (IMU sample)
            s_rec = SensorDataRecord(
                experiment_id=self.active_experiment_id,
                run_id=self.active_run_id,
                sensor_type="IMU",
                timestamp=now,
                data={
                    "pitch": telem.pitch,
                    "roll": telem.roll,
                    "yaw": telem.yaw
                },
                source=telem.source
            )
            await sensors_repo.insert(s_rec)
        except Exception as e:
            logger.debug(f"Persistence skipped or failed: {e}")

    async def log_event(
        self,
        event_type: str,
        message: str,
        severity: str = "INFO",
        source: str = "SYSTEM",
        metadata: Optional[dict] = None
    ):
        """Asynchronously writes a system event to MongoDB."""
        try:
            event = SystemEventRecord(
                timestamp=time.time(),
                severity=severity,
                source=source,
                event_type=event_type,
                message=message,
                experiment_id=self.active_experiment_id,
                run_id=self.active_run_id,
                metadata=metadata or {}
            )
            asyncio.create_task(system_events_repo.log_event(event))
        except Exception:
            pass

persistence_service = PersistenceService()
