import { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';
import { TelemetryData, SystemStatus, LogEntry } from '../types';

interface AppState {
  telemetry: TelemetryData | null;
  systemStatus: SystemStatus | null;
  simulationRunning: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  logs: LogEntry[];
}

type Action =
  | { type: 'SET_TELEMETRY'; payload: TelemetryData }
  | { type: 'SET_SYSTEM_STATUS'; payload: SystemStatus }
  | { type: 'SET_SIMULATION_RUNNING'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'disconnected' | 'error' }
  | { type: 'ADD_LOG'; payload: LogEntry };

const initialState: AppState = {
  telemetry: null,
  systemStatus: null,
  simulationRunning: false,
  connectionStatus: 'disconnected',
  logs: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TELEMETRY':
      return { ...state, telemetry: action.payload };
    case 'SET_SYSTEM_STATUS':
      return { ...state, systemStatus: action.payload };
    case 'SET_SIMULATION_RUNNING':
      return { ...state, simulationRunning: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
