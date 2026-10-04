import { useState, useEffect, useRef } from 'react';
import { 
  Eye, RefreshCw, Upload, Crosshair, 
  Flame, Zap, Compass, CheckCircle2, 
  Camera, Sliders, Shield, AlertCircle
} from 'lucide-react';
import { processImage, getVisionPresets, getCameraFrameUrl } from '../services/api';
import { useAppStore } from '../store/appStore';

interface Detection {
  label: string;
  x: number;
  y: number;
  radius?: number;
  confidence: number;
}

interface ProcessedStats {
  contours_found: number;
  width: number;
  height: number;
  processing_time_ms: number;
  stages_applied: string[];
  detections?: Detection[];
}

export default function ComputerVision() {
  const { state } = useAppStore();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visionMode, setVisionMode] = useState<'target_acquisition' | 'thermal' | 'edge' | 'contour' | 'raw'>('target_acquisition');
  
  // Pipeline filter fine-tuning
  const [cannyLow, setCannyLow] = useState(40);
  const [cannyHigh, setCannyHigh] = useState(130);
  const [blurKernel, setBlurKernel] = useState(5);
  
  // Live stream toggle
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'drone_cam'>('drone_cam');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveIntervalRef = useRef<number | null>(null);

  // Load presets and default tactical frame on mount
  useEffect(() => {
    const initVision = async () => {
      try {
        const res = await getVisionPresets();
        if (res.data && res.data.length > 0) {
          setPresets(res.data);
          // Auto load first preset or live frame
          setSourceImage(res.data[0].image_data);
          runPipeline(res.data[0].image_data, 'target_acquisition');
        }
      } catch (e) {
        // Fallback synthetic frame
        fetchDroneCameraFrame();
      }
    };
    initVision();
  }, []);

  const fetchDroneCameraFrame = async () => {
    try {
      const url = getCameraFrameUrl();
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setSourceImage(base64data);
        runPipeline(base64data, visionMode);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to grab drone camera frame:', err);
    }
  };

  // Run OpenCV pipeline
  const runPipeline = async (imageInput?: string | null, modeOverride?: string) => {
    const targetImage = imageInput || sourceImage;
    if (!targetImage) return;

    setIsProcessing(true);
    try {
      const activeMode = modeOverride || visionMode;
      const formData = new FormData();
      formData.append('image_base64', targetImage);
      formData.append('mode', activeMode);
      formData.append('canny_low', String(cannyLow));
      formData.append('canny_high', String(cannyHigh));
      formData.append('blur_kernel', String(blurKernel));
      formData.append('grayscale', 'true');
      formData.append('gaussian_blur', 'true');
      formData.append('canny_edge', String(activeMode === 'edge'));
      formData.append('contour_detection', String(activeMode === 'contour' || activeMode === 'target_acquisition'));

      const res = await processImage(formData);
      if (res.data) {
        setProcessedImage(res.data.result_image);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('OpenCV pipeline error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Live drone stream loop
  useEffect(() => {
    if (isLiveStreaming) {
      liveIntervalRef.current = window.setInterval(() => {
        fetchDroneCameraFrame();
      }, 1200);
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [isLiveStreaming, visionMode, cannyLow, cannyHigh]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setSourceImage(b64);
        setActiveTab('upload');
        runPipeline(b64, visionMode);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (presetData: string) => {
    setSourceImage(presetData);
    setActiveTab('presets');
    runPipeline(presetData, visionMode);
  };

  const telemetry = state.telemetry;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 select-none">
      {/* Top Header & Tactical Vision Toolbar */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                DRONE OPTICAL VISION & TARGET ACQUISITION
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OPENCV 4.9 NATIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous Landing Zone Identification • Hough Transform Targeting • Canny Aerial Contours • FLIR Thermal
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsLiveStreaming(!isLiveStreaming);
              if (!isLiveStreaming) fetchDroneCameraFrame();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
              isLiveStreaming
                ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-pulse text-rose-600' : ''}`} />
            {isLiveStreaming ? 'LIVE STREAM ACTIVE' : 'START LIVE CAM'}
          </button>

          <button
            onClick={() => fetchDroneCameraFrame()}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            CAPTURE FRAME
          </button>
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Column: Vision Pipeline Controls & Modes (310px) */}
        <div className="w-80 shrink-0 flex flex-col gap-3.5 overflow-y-auto pr-0.5">
          {/* Feed Source Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>CAMERA FEED SOURCE</span>
              <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md font-mono">
                {activeTab.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-medium">
              <button
                onClick={() => {
                  setActiveTab('drone_cam');
                  fetchDroneCameraFrame();
                }}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'drone_cam'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drone FPV
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'presets'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  fileInputRef.current?.click();
                }}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload
              </button>
            </div>

            {/* Presets List */}
            {activeTab === 'presets' && presets.length > 0 && (
              <div className="space-y-2 mt-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.image_data)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all flex items-center gap-2.5 group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src={p.image_data} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-sky-600">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            {activeTab === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-xl text-center cursor-pointer transition-colors bg-slate-50/50 flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-sky-600" />
                <div className="text-xs font-semibold text-slate-800">Select Image File</div>
                <div className="text-[10px] text-slate-500">PNG, JPG, or WEBP inspection frame</div>
              </div>
            )}

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Tactical Vision Modes Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider mb-3">
              TACTICAL DETECTION ALGORITHM
            </div>

            <div className="space-y-2">
              {/* Mode 1: Target Acquisition */}
              <button
                onClick={() => {
                  setVisionMode('target_acquisition');
                  runPipeline(sourceImage, 'target_acquisition');
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  visionMode === 'target_acquisition'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Crosshair className={`w-4 h-4 mt-0.5 shrink-0 ${visionMode === 'target_acquisition' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Target & Helipad Lock
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">RECOMMENDED</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Hough circle transforms & centroid lock for UAV landing pads and tactical markers.
                  </div>
                </div>
              </button>

              {/* Mode 2: FLIR Thermal */}
              <button
                onClick={() => {
                  setVisionMode('thermal');
                  runPipeline(sourceImage, 'thermal');
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  visionMode === 'thermal'
                    ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Flame className={`w-4 h-4 mt-0.5 shrink-0 ${visionMode === 'thermal' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">FLIR Thermal False-Color (LUT)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Military infrared spectrum heat signature colorization via OpenCV Inferno.
                  </div>
                </div>
              </button>

              {/* Mode 3: Canny Edge & Horizon */}
              <button
                onClick={() => {
                  setVisionMode('edge');
                  runPipeline(sourceImage, 'edge');
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  visionMode === 'edge'
                    ? 'border-sky-500 bg-sky-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Zap className={`w-4 h-4 mt-0.5 shrink-0 ${visionMode === 'edge' ? 'text-sky-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Canny Edge & Horizon Line</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Dual-threshold gradient extraction for runway edges and artificial horizon orientation.
                  </div>
                </div>
              </button>

              {/* Mode 4: Contours */}
              <button
                onClick={() => {
                  setVisionMode('contour');
                  runPipeline(sourceImage, 'contour');
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  visionMode === 'contour'
                    ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Compass className={`w-4 h-4 mt-0.5 shrink-0 ${visionMode === 'contour' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900">Hierarchical Contour Segmentation</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Extracts geometric contours and calculates obstacle area dimensions.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Pipeline Parameters Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>PARAMETER TUNING</span>
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Canny Low Threshold</span>
                  <span className="font-mono text-sky-600 font-bold">{cannyLow}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={cannyLow}
                  onChange={(e) => setCannyLow(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Canny High Threshold</span>
                  <span className="font-mono text-sky-600 font-bold">{cannyHigh}</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="255"
                  value={cannyHigh}
                  onChange={(e) => setCannyHigh(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>Gaussian Blur Kernel</span>
                  <span className="font-mono text-sky-600 font-bold">{blurKernel}x{blurKernel}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[3, 5, 7].map((k) => (
                    <button
                      key={k}
                      onClick={() => setBlurKernel(k)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                        blurKernel === k
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {k}x{k}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => runPipeline()}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold font-sans text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    PROCESSING FRAME...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    APPLY PIPELINE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Viewport & Detection Telemetry */}
        <div className="flex-1 flex flex-col gap-3.5 min-h-0">
          {/* Dual Viewports */}
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
            {/* Viewport 1: Source Optical Frame with Tactical HUD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">
                    RAW OPTICAL SENSOR [CAM-01]
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {stats ? `${stats.width}x${stats.height}` : '640x480'} · BGR8
                </span>
              </div>

              <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-900">
                {sourceImage ? (
                  <img
                    src={sourceImage}
                    alt="Optical feed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-xs font-mono">NO SIGNAL FROM CAMERA</div>
                )}

                {/* Tactical HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between font-mono text-[11px]">
                  <div className="flex justify-between items-start text-sky-400">
                    <div className="bg-slate-950/80 px-2.5 py-1 rounded border border-sky-500/30 backdrop-blur-sm">
                      <div>OPTICAL EO GIMBAL</div>
                      <div className="text-[10px] text-emerald-400">FPS: 28.4 | ROS: /camera/image_raw</div>
                    </div>
                    <div className="bg-slate-950/80 px-2.5 py-1 rounded border border-sky-500/30 text-right backdrop-blur-sm text-[10px]">
                      <div>ALT: {telemetry ? `${telemetry.altitude.toFixed(1)} m` : '0.1 m'}</div>
                      <div>PITCH: {telemetry ? `${telemetry.pitch.toFixed(1)}°` : '0.0°'}</div>
                    </div>
                  </div>

                  {/* Center Crosshair */}
                  <div className="self-center flex flex-col items-center opacity-70">
                    <div className="w-12 h-12 border border-sky-400/50 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                    </div>
                  </div>

                  <div className="flex justify-between items-end text-slate-400 text-[10px]">
                    <div className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      UAV MODE: {telemetry?.mode || 'STANDBY'}
                    </div>
                    <div className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-sky-400 font-semibold">
                      OPTICAL PASSTHROUGH
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewport 2: OpenCV Processed Output Frame */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">
                    OPENCV PROCESSED [STAGE: {visionMode.toUpperCase()}]
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  {stats ? `${stats.processing_time_ms} ms` : '—'}
                </span>
              </div>

              <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-900">
                {processedImage ? (
                  <img
                    src={processedImage}
                    alt="Processed feed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 text-xs font-mono">AWAITING PIPELINE RUN...</div>
                )}

                {/* Tactical HUD Target Lock Overlay */}
                <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between font-mono text-[11px]">
                  <div className="flex justify-between items-start text-emerald-400">
                    <div className="bg-slate-950/85 px-2.5 py-1 rounded border border-emerald-500/40 backdrop-blur-sm text-[10px]">
                      <div>ALGORITHM: {visionMode.toUpperCase()}</div>
                      <div>TARGETS LOCKED: {stats?.contours_found ?? 0}</div>
                    </div>
                    {stats?.detections && stats.detections.length > 0 && (
                      <div className="bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/50 text-emerald-400 text-right backdrop-blur-sm text-[10px] animate-pulse">
                        ● TARGET ACQUIRED
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end text-slate-400 text-[10px]">
                    <div className="bg-slate-950/85 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">
                      OUTPUT: ARGB_SURFACE
                    </div>
                    <div className="bg-slate-950/85 px-2 py-0.5 rounded border border-slate-800 font-mono text-slate-300">
                      cv2.findContours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry & Target Lock Analytics Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] grid grid-cols-4 gap-4 items-center shrink-0">
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                TARGETS / CONTOURS
              </div>
              <div className="font-mono text-xl font-bold text-emerald-600">
                {stats?.contours_found ?? 0}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                PROCESSING LATENCY
              </div>
              <div className="font-mono text-xl font-bold text-sky-600">
                {stats ? `${stats.processing_time_ms} ms` : '—'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                FRAME RESOLUTION
              </div>
              <div className="font-mono text-sm font-bold text-slate-800">
                {stats ? `${stats.width} × ${stats.height} px` : '640 × 480 px'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                ACTIVE PIPELINE STAGES
              </div>
              <div className="font-mono text-[11px] font-semibold text-slate-700 truncate" title={stats?.stages_applied?.join(', ')}>
                {stats?.stages_applied?.length ? stats.stages_applied.join(' → ') : 'Standard Optical Pipeline'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
