import { useState, useRef } from 'react';
import Panel from '../components/common/Panel';
import { processImage } from '../services/api';
import { Upload, Eye, Sliders, Activity, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';

export default function ComputerVision() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [processedResult, setProcessedResult] = useState<{
    result_image: string;
    stats: { contours_found: number; width: number; height: number };
    source: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineOptions, setPipelineOptions] = useState({
    grayscale: true,
    gaussianBlur: true,
    cannyEdge: true,
    threshold: false,
    contourDetection: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileObject(file);
      setSelectedImage(URL.createObjectURL(file));
      setProcessedResult(null);
    }
  };

  const loadSampleImage = () => {
    // Generate a clean test pattern on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark aerospace test card background
      ctx.fillStyle = '#080a0e';
      ctx.fillRect(0, 0, 480, 360);
      
      // Target circles & drones mockup
      ctx.strokeStyle = '#1a9fd4';
      ctx.lineWidth = 4;
      ctx.strokeRect(60, 50, 140, 110);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(320, 180, 60, 0, 2 * Math.PI);
      ctx.stroke();

      // Drone landing cross
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(130, 80); ctx.lineTo(130, 130);
      ctx.moveTo(105, 105); ctx.lineTo(155, 105);
      ctx.stroke();

      ctx.fillStyle = '#e8edf5';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('TARGET IDENT: UAS-ALPHA', 70, 220);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_uav_target.png', { type: 'image/png' });
          setFileObject(file);
          setSelectedImage(canvas.toDataURL());
          setProcessedResult(null);
        }
      });
    }
  };

  const handleProcess = async () => {
    if (!fileObject) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileObject);
      const res = await processImage(formData);
      setProcessedResult(res.data);
    } catch (err) {
      console.error('Error processing CV frame:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Top Banner */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-text-primary">Computer Vision Lab</h2>
          <span className="badge-demo">DEMO / OPENCV BACKEND</span>
          <span className="text-xs text-text-muted">OpenCV Core • Edge Detection • Target Extraction</span>
        </div>
        <button
          onClick={loadSampleImage}
          className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load Synthetic UAV Target
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Controls Column */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <Panel title="INPUT SELECTION" className="shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border border-dashed border-border-DEFAULT hover:border-accent rounded-lg text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-surface-1/50"
            >
              <Upload className="w-5 h-5 text-accent" />
              <div className="text-xs font-medium text-text-primary">Upload Flight Frame / Inspection Image</div>
              <div className="text-2xs text-text-muted">PNG, JPG or WebP up to 10MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </Panel>

          <Panel title="VISION PIPELINE FILTERS" className="flex-1 flex flex-col justify-between">
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded bg-surface-3 border border-border-subtle cursor-pointer">
                <span className="text-text-primary font-medium">Grayscale Conversion</span>
                <input
                  type="checkbox"
                  checked={pipelineOptions.grayscale}
                  onChange={(e) => setPipelineOptions({ ...pipelineOptions, grayscale: e.target.checked })}
                  className="rounded text-accent focus:ring-0 bg-surface-1 border-border"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-surface-3 border border-border-subtle cursor-pointer">
                <span className="text-text-primary font-medium">Gaussian Blur (5x5 Kernel)</span>
                <input
                  type="checkbox"
                  checked={pipelineOptions.gaussianBlur}
                  onChange={(e) => setPipelineOptions({ ...pipelineOptions, gaussianBlur: e.target.checked })}
                  className="rounded text-accent focus:ring-0 bg-surface-1 border-border"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-surface-3 border border-border-subtle cursor-pointer">
                <span className="text-text-primary font-medium">Canny Edge Extraction (50, 150)</span>
                <input
                  type="checkbox"
                  checked={pipelineOptions.cannyEdge}
                  onChange={(e) => setPipelineOptions({ ...pipelineOptions, cannyEdge: e.target.checked })}
                  className="rounded text-accent focus:ring-0 bg-surface-1 border-border"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-surface-3 border border-border-subtle cursor-pointer">
                <span className="text-text-primary font-medium">Binary Thresholding</span>
                <input
                  type="checkbox"
                  checked={pipelineOptions.threshold}
                  onChange={(e) => setPipelineOptions({ ...pipelineOptions, threshold: e.target.checked })}
                  className="rounded text-accent focus:ring-0 bg-surface-1 border-border"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-surface-3 border border-border-subtle cursor-pointer">
                <span className="text-text-primary font-medium">Hierarchical Contour Finder</span>
                <input
                  type="checkbox"
                  checked={pipelineOptions.contourDetection}
                  onChange={(e) => setPipelineOptions({ ...pipelineOptions, contourDetection: e.target.checked })}
                  className="rounded text-accent focus:ring-0 bg-surface-1 border-border"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              <button
                onClick={handleProcess}
                disabled={!fileObject || isProcessing}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    PROCESSING FRAME...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    RUN OPENCV PIPELINE
                  </>
                )}
              </button>
            </div>
          </Panel>
        </div>

        {/* Output Previews Column */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
            {/* Input Frame */}
            <Panel title="SOURCE FRAME (INPUT)" className="flex flex-col overflow-hidden">
              <div className="flex-1 bg-surface-1 rounded border border-border-subtle p-2 flex items-center justify-center overflow-hidden relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Source flight frame"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-text-muted text-xs flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40 text-text-muted" />
                    <span>No image selected. Upload a file or click "Load Synthetic UAV Target".</span>
                  </div>
                )}
              </div>
            </Panel>

            {/* Output Frame */}
            <Panel title="OPENCV PROCESSED OUTPUT" className="flex flex-col overflow-hidden">
              <div className="flex-1 bg-surface-1 rounded border border-border-subtle p-2 flex items-center justify-center overflow-hidden relative">
                {processedResult ? (
                  <img
                    src={processedResult.result_image}
                    alt="Processed frame"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-text-muted text-xs flex flex-col items-center gap-2">
                    <Eye className="w-8 h-8 opacity-40 text-text-muted" />
                    <span>Run pipeline to view generated edge/contour mask.</span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Metrics & Inference Stats */}
          <div className="h-28 shrink-0 panel p-4 grid grid-cols-4 gap-4 items-center">
            <div className="bg-surface-3 p-3 rounded-lg border border-border-subtle">
              <div className="telemetry-label text-2xs mb-1">CONTOURS DETECTED</div>
              <div className="font-mono text-xl font-bold text-accent">
                {processedResult?.stats?.contours_found ?? '0'}
              </div>
            </div>

            <div className="bg-surface-3 p-3 rounded-lg border border-border-subtle">
              <div className="telemetry-label text-2xs mb-1">FRAME DIMENSIONS</div>
              <div className="font-mono text-sm font-medium text-text-primary">
                {processedResult ? `${processedResult.stats.width} × ${processedResult.stats.height} px` : '—'}
              </div>
            </div>

            <div className="bg-surface-3 p-3 rounded-lg border border-border-subtle">
              <div className="telemetry-label text-2xs mb-1">EXECUTION ENGINE</div>
              <div className="font-mono text-xs font-semibold text-status-green flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>OpenCV (cv2) Native</span>
              </div>
            </div>

            <div className="bg-surface-3 p-3 rounded-lg border border-border-subtle">
              <div className="telemetry-label text-2xs mb-1">SOURCE CLASSIFIER</div>
              <div className="font-mono text-xs text-text-secondary truncate">
                {processedResult?.source ?? 'DEMO_SIMULATION'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
