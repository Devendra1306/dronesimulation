import asyncio
import pytest
from app.db.mongodb import mongodb_manager
from app.schemas.database import (
    ExperimentCreate, SimulationRunCreate, TelemetryRecord,
    SensorDataRecord, CVResultRecord, SystemEventRecord
)
from app.db.repositories.experiments import experiments_repo
from app.db.repositories.simulation_runs import simulation_runs_repo
from app.db.repositories.telemetry import telemetry_repo
from app.db.repositories.sensors import sensors_repo
from app.db.repositories.cv_results import cv_results_repo
from app.db.repositories.system_events import system_events_repo

@pytest.mark.asyncio
async def test_mongodb_full_pipeline():
    # 1. Connection
    connected = await mongodb_manager.connect()
    assert connected is True, "MongoDB should connect successfully"
    
    health = await mongodb_manager.check_health()
    assert health["connected"] is True
    assert health["database"] == "roboedge_ai_lab"

    # 2. Experiment creation & retrieval
    test_exp_id = "EXP-TEST-001"
    # Cleanup previous test if present
    await experiments_repo.delete(test_exp_id)
    
    created_exp = await experiments_repo.create(ExperimentCreate(
        experiment_id=test_exp_id,
        name="Automated Unit Test Experiment",
        description="Verifying MongoDB Atlas persistence",
        simulation_environment="unit_test_world",
        drone_model="quadrotor_x500",
        cv_algorithm="opencv_canny",
        status="RUNNING"
    ))
    assert created_exp["experiment_id"] == test_exp_id
    assert created_exp["status"] == "RUNNING"

    fetched_exp = await experiments_repo.get_by_id(test_exp_id)
    assert fetched_exp is not None
    assert fetched_exp["name"] == "Automated Unit Test Experiment"

    # 3. Simulation run creation & completion
    test_run_id = "RUN-TEST-001"
    run = await simulation_runs_repo.create(SimulationRunCreate(
        run_id=test_run_id,
        experiment_id=test_exp_id,
        simulation_mode="DEMO_SIMULATION",
        environment="unit_test_world",
        drone_model="quadrotor_x500"
    ))
    assert run["run_id"] == test_run_id
    assert run["status"] == "RUNNING"

    completed_run = await simulation_runs_repo.complete_run(
        test_run_id,
        status="COMPLETED",
        summary={"max_altitude": 25.0, "duration": 42.0}
    )
    assert completed_run["status"] == "COMPLETED"

    # 4. Telemetry persistence & retrieval
    t_rec = TelemetryRecord(
        experiment_id=test_exp_id,
        run_id=test_run_id,
        timestamp=100.0,
        altitude=24.5,
        velocity=3.2,
        latitude=16.5062,
        longitude=80.6480,
        heading=90.0,
        pitch=-2.0,
        roll=0.0,
        yaw=90.0,
        battery=94.5,
        signal=98.0,
        flight_state="HOVERING",
        source="DEMO_SIMULATION"
    )
    t_ok = await telemetry_repo.insert(t_rec)
    assert t_ok is True

    history = await telemetry_repo.get_history(experiment_id=test_exp_id, run_id=test_run_id)
    assert len(history) >= 1
    assert history[0]["altitude"] == 24.5

    summary = await telemetry_repo.get_summary(experiment_id=test_exp_id)
    assert summary["count"] >= 1
    assert summary["max_altitude"] >= 24.5

    # 5. Sensor persistence & retrieval
    s_rec = SensorDataRecord(
        experiment_id=test_exp_id,
        run_id=test_run_id,
        sensor_type="IMU",
        timestamp=100.0,
        data={"pitch": -2.0, "roll": 0.0, "yaw": 90.0},
        source="DEMO_SIMULATION"
    )
    s_ok = await sensors_repo.insert(s_rec)
    assert s_ok is True

    sensors_list = await sensors_repo.get_history(experiment_id=test_exp_id, sensor_type="IMU")
    assert len(sensors_list) >= 1

    # 6. CV result persistence & retrieval
    cv_rec = CVResultRecord(
        experiment_id=test_exp_id,
        run_id=test_run_id,
        timestamp=100.0,
        algorithm="Canny Edge Detection",
        detection_count=4,
        detections=[{"label": "contour", "confidence": 0.95}],
        processing_time_ms=14.2,
        source="OPENCV_NATIVE"
    )
    cv_ok = await cv_results_repo.insert(cv_rec)
    assert cv_ok is True

    cv_list = await cv_results_repo.list_results(experiment_id=test_exp_id)
    assert len(cv_list) >= 1
    assert cv_list[0]["detection_count"] == 4

    # 7. System events logging & retrieval
    ev_rec = SystemEventRecord(
        timestamp=100.0,
        severity="INFO",
        source="MISSION_CONTROL",
        event_type="DRONE_TAKEOFF",
        message="Takeoff sequence engaged",
        experiment_id=test_exp_id,
        run_id=test_run_id
    )
    ev_ok = await system_events_repo.log_event(ev_rec)
    assert ev_ok is True

    events_list = await system_events_repo.list_events(experiment_id=test_exp_id)
    assert len(events_list) >= 1
    assert events_list[0]["event_type"] == "DRONE_TAKEOFF"

    # Cleanup test experiment
    await experiments_repo.delete(test_exp_id)
    await mongodb_manager.disconnect()

if __name__ == "__main__":
    asyncio.run(test_mongodb_full_pipeline())
    print("ALL MONGODB PIPELINE TESTS PASSED!")
