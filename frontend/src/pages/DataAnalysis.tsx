import { useState, useRef } from 'react';
import Panel from '../components/common/Panel';
import { analyzeData } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, FileSpreadsheet, Download, RefreshCw, BarChart2, Table } from 'lucide-react';

interface AnalysisStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}

interface AnalysisResult {
  row_count: number;
  column_count: number;
  missing_values: Record<string, number>;
  data_types: Record<string, string>;
  numerical_stats: Record<string, AnalysisStats>;
  source: string;
}

export default function DataAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'chart'>('stats');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await analyzeData(formData);
      setAnalysis(res.data);
      const numCols = Object.keys(res.data.numerical_stats || {});
      if (numCols.length > 0) {
        setSelectedColumn(numCols[0]);
      }
    } catch (err) {
      console.error('Failed to analyze data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleFlightLog = () => {
    // Generate synthetic flight log telemetry CSV
    const rows = ['timestamp_s,altitude_m,velocity_mps,battery_pct,motor_rpm,vibration_g'];
    for (let i = 0; i <= 60; i++) {
      const alt = (i * 0.8 + Math.sin(i / 5) * 2).toFixed(2);
      const vel = (6.0 + Math.cos(i / 4) * 1.5).toFixed(2);
      const bat = (100 - i * 0.35).toFixed(1);
      const rpm = (5400 + Math.random() * 200).toFixed(0);
      const vib = (0.05 + Math.random() * 0.03).toFixed(3);
      rows.push(`${i},${alt},${vel},${bat},${rpm},${vib}`);
    }
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'flight_telemetry_sample.csv', { type: 'text/csv' });
    handleFileUpload(file);
  };

  const downloadProcessedSummary = () => {
    if (!analysis) return;
    const jsonStr = JSON.stringify(analysis, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telemetry_analysis_report.json';
    a.click();
  };

  const statsList = selectedColumn && analysis?.numerical_stats[selectedColumn]
    ? [
        { name: 'Mean', value: analysis.numerical_stats[selectedColumn].mean.toFixed(3) },
        { name: 'Median', value: analysis.numerical_stats[selectedColumn].median.toFixed(3) },
        { name: 'Std Dev', value: analysis.numerical_stats[selectedColumn].std.toFixed(3) },
        { name: 'Min', value: analysis.numerical_stats[selectedColumn].min.toFixed(3) },
        { name: 'Max', value: analysis.numerical_stats[selectedColumn].max.toFixed(3) },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">Flight Telemetry Data Analysis</h2>
          <span className="badge-demo">PANDAS & NUMPY PIPELINE</span>
          <span className="text-xs text-text-muted">Descriptive Statistics • Missing Value Auditing</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleFlightLog}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Load Sample UAV CSV Log
          </button>
          {analysis && (
            <button
              onClick={downloadProcessedSummary}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download Analysis JSON
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Upload & Column Selector */}
        <div className="w-72 shrink-0 flex flex-col gap-4">
          <Panel title="CSV DATA INGESTION" className="shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border border-dashed border-border-DEFAULT hover:border-accent rounded-lg text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-surface-1/50"
            >
              <FileSpreadsheet className="w-6 h-6 text-accent" />
              <div className="text-xs font-medium text-text-primary">Select Flight Log CSV</div>
              <div className="text-2xs text-text-muted">Comma-delimited telemetry dataset</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </div>
          </Panel>

          <Panel title="NUMERICAL FIELDS" className="flex-1 flex flex-col min-h-0">
            {analysis ? (
              <div className="space-y-1.5 overflow-y-auto pr-1">
                {Object.keys(analysis.numerical_stats).map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColumn(col)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                      selectedColumn === col
                        ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    <span className="truncate">{col}</span>
                    <span className="text-2xs text-text-muted">{analysis.data_types[col]}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-text-muted text-xs text-center py-8">
                Ingest CSV to view available metrics.
              </div>
            )}
          </Panel>
        </div>

        {/* Analytics Display Column */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <div className="bg-surface-3 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">TOTAL ROWS</div>
              <div className="font-mono text-xl font-bold text-text-primary">
                {analysis?.row_count ?? '—'}
              </div>
            </div>
            <div className="bg-surface-3 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">COLUMNS DETECTED</div>
              <div className="font-mono text-xl font-bold text-accent">
                {analysis?.column_count ?? '—'}
              </div>
            </div>
            <div className="bg-surface-3 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">ACTIVE COLUMN</div>
              <div className="font-mono text-sm font-semibold text-text-primary truncate">
                {selectedColumn ?? 'None Selected'}
              </div>
            </div>
            <div className="bg-surface-3 border border-border-subtle rounded-xl p-3.5">
              <div className="telemetry-label text-2xs mb-1">DATA FRAME SOURCE</div>
              <div className="font-mono text-xs font-medium text-text-secondary">
                {analysis?.source ?? 'DEMO_SAMPLE'}
              </div>
            </div>
          </div>

          {/* Detailed Workspace */}
          <Panel
            title={`STATISTICAL PROFILE ${selectedColumn ? `— [${selectedColumn.toUpperCase()}]` : ''}`}
            className="flex-1 flex flex-col min-h-0"
          >
            {analysis && selectedColumn ? (
              <div className="flex flex-col h-full gap-4">
                {/* View Switcher */}
                <div className="flex gap-2 border-b border-border-subtle pb-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium ${
                      activeTab === 'stats' ? 'bg-surface-4 text-accent border border-border' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    Summary Metrics Table
                  </button>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium ${
                      activeTab === 'chart' ? 'bg-surface-4 text-accent border border-border' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Metric Distribution
                  </button>
                </div>

                {activeTab === 'stats' ? (
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-muted">
                          <th className="py-2.5 px-4">STATISTICAL MEASURE</th>
                          <th className="py-2.5 px-4">CALCULATED VALUE</th>
                          <th className="py-2.5 px-4">INTERPRETATION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/50">
                        {statsList.map((stat) => (
                          <tr key={stat.name} className="hover:bg-surface-3/50">
                            <td className="py-2.5 px-4 font-semibold text-text-primary">{stat.name}</td>
                            <td className="py-2.5 px-4 text-accent font-bold">{stat.value}</td>
                            <td className="py-2.5 px-4 text-text-secondary font-sans text-2xs">
                              {stat.name === 'Mean' && 'Arithmetic average of trajectory data points'}
                              {stat.name === 'Median' && '50th percentile rank resistant to outliers'}
                              {stat.name === 'Std Dev' && 'Dispersion standard measure around average'}
                              {stat.name === 'Min' && 'Lowest recorded boundary sensor value'}
                              {stat.name === 'Max' && 'Highest flight ceiling or peak registered value'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsList} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#8fa3bd', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <YAxis tick={{ fill: '#8fa3bd', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                        <Tooltip
                          contentStyle={{ background: '#161d2a', border: '1px solid #253347', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#8fa3bd' }}
                        />
                        <Bar dataKey="value" fill="#1a9fd4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted text-xs">
                Upload a CSV telemetry log or click "Load Sample UAV CSV Log" to inspect pandas statistics.
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
