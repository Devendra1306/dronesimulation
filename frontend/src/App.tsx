import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import MissionControl from './pages/MissionControl';
import DroneSimulator from './pages/DroneSimulator';
import ROS2Lab from './pages/ROS2Lab';
import ComputerVision from './pages/ComputerVision';
import SensorData from './pages/SensorData';
import DataAnalysis from './pages/DataAnalysis';
import EdgeAI from './pages/EdgeAI';
import Experiments from './pages/Experiments';
import SystemLogs from './pages/SystemLogs';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<MissionControl />} />
          <Route path="/simulator" element={<DroneSimulator />} />
          <Route path="/ros2" element={<ROS2Lab />} />
          <Route path="/cv" element={<ComputerVision />} />
          <Route path="/sensors" element={<SensorData />} />
          <Route path="/data" element={<DataAnalysis />} />
          <Route path="/edge" element={<EdgeAI />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/logs" element={<SystemLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
