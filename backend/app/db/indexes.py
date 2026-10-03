import logging
from pymongo import ASCENDING, DESCENDING, IndexModel
from app.db.mongodb import mongodb_manager

logger = logging.getLogger(__name__)

async def create_indexes():
    """Initializes required MongoDB indexes idempotently."""
    db = mongodb_manager.get_database()
    if db is None:
        return

    try:
        # 1. experiments
        await db.experiments.create_indexes([
            IndexModel([("experiment_id", ASCENDING)], unique=True),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # 2. simulation_runs
        await db.simulation_runs.create_indexes([
            IndexModel([("run_id", ASCENDING)], unique=True),
            IndexModel([("experiment_id", ASCENDING), ("start_time", DESCENDING)]),
            IndexModel([("status", ASCENDING)]),
        ])

        # 3. telemetry
        await db.telemetry.create_indexes([
            IndexModel([("experiment_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("run_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
        ])

        # 4. sensor_data
        await db.sensor_data.create_indexes([
            IndexModel([("experiment_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("run_id", ASCENDING), ("sensor_type", ASCENDING), ("timestamp", DESCENDING)]),
        ])

        # 5. cv_results
        await db.cv_results.create_indexes([
            IndexModel([("experiment_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("run_id", ASCENDING), ("timestamp", DESCENDING)]),
        ])

        # 6. experiment_results
        await db.experiment_results.create_indexes([
            IndexModel([("experiment_id", ASCENDING)], unique=True),
            IndexModel([("run_id", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ])

        # 7. system_events
        await db.system_events.create_indexes([
            IndexModel([("experiment_id", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("severity", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("event_type", ASCENDING), ("timestamp", DESCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
        ])

        logger.info("MongoDB collections and compound indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Failed to create MongoDB indexes: {e}")
