from fastapi import APIRouter, File, UploadFile, Form, Response, Query
from typing import Optional
import cv2
import numpy as np
import base64
import time
import app.main as m

router = APIRouter()

def _generate_synthetic_aerial_frame(width: int = 640, height: int = 480) -> np.ndarray:
    """Generate a clean aerial UAV reconnaissance test frame with targets and airfield."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # Ground terrain gradient (deep green/brown grass)
    for y in range(height):
        ratio = y / height
        img[y, :] = (int(30 + 15 * ratio), int(55 + 25 * ratio), int(35 + 20 * ratio))
    
    # Runway / Helipad landing apron
    cv2.rectangle(img, (int(width * 0.25), int(height * 0.2)), (int(width * 0.75), int(height * 0.8)), (70, 75, 80), -1)
    cv2.rectangle(img, (int(width * 0.25), int(height * 0.2)), (int(width * 0.75), int(height * 0.8)), (220, 220, 220), 2)
    
    # Helipad circle & 'H'
    cx, cy = int(width * 0.5), int(height * 0.5)
    radius = int(min(width, height) * 0.22)
    cv2.circle(img, (cx, cy), radius, (240, 240, 240), 4)
    cv2.circle(img, (cx, cy), radius - 15, (255, 180, 0), 2)
    
    # 'H' mark
    hw, hh = int(radius * 0.5), int(radius * 0.7)
    cv2.line(img, (cx - hw, cy - hh), (cx - hw, cy + hh), (255, 255, 255), 6)
    cv2.line(img, (cx + hw, cy - hh), (cx + hw, cy + hh), (255, 255, 255), 6)
    cv2.line(img, (cx - hw, cy), (cx + hw, cy), (255, 255, 255), 6)

    # Secondary target marker (drone waypoint alpha)
    t2x, t2y = int(width * 0.82), int(height * 0.35)
    cv2.circle(img, (t2x, t2y), 24, (0, 140, 255), 3)
    cv2.line(img, (t2x - 30, t2y), (t2x + 30, t2y), (0, 140, 255), 2)
    cv2.line(img, (t2x, t2y - 30), (t2x, t2y + 30), (0, 140, 255), 2)
    
    # HUD text overlay
    cv2.putText(img, "UAV OPTICAL EO/IR SENSOR", (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 200), 2)
    cv2.putText(img, f"SIM TIME: {time.strftime('%H:%M:%S')}", (16, height - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    return img

@router.get("/camera/frame")
async def get_live_camera_frame():
    """Return the live camera frame from Gazebo ODE or synthetic tactical camera."""
    frame_bytes = None
    if hasattr(m, 'adapter') and m.adapter:
        frame_bytes = await m.adapter.get_camera_frame()

    if not frame_bytes:
        img = _generate_synthetic_aerial_frame()
        _, buf = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        frame_bytes = buf.tobytes()

    return Response(content=frame_bytes, media_type="image/jpeg")

@router.get("/presets")
async def get_vision_presets():
    """Return pre-rendered tactical aerial frames for one-click testing."""
    presets = []
    
    # Preset 1: Airfield Helipad
    f1 = _generate_synthetic_aerial_frame(640, 480)
    _, b1 = cv2.imencode('.jpg', f1)
    presets.append({
        "id": "helipad",
        "name": "Airfield Landing Target (Tactical Helipad)",
        "description": "High contrast circular landing zone with precision alignment mark",
        "image_data": f"data:image/jpeg;base64,{base64.b64encode(b1).decode('utf-8')}"
    })
    
    # Preset 2: Runway & Horizon
    f2 = np.zeros((480, 640, 3), dtype=np.uint8)
    f2[:200, :] = (180, 130, 70) # Sky
    f2[200:, :] = (35, 45, 30)   # Terrain
    pts = np.array([[280, 200], [360, 200], [560, 480], [80, 480]], np.int32)
    cv2.fillPoly(f2, [pts], (60, 60, 65))
    cv2.line(f2, (320, 200), (320, 480), (255, 255, 255), 3) # Centerline
    cv2.line(f2, (0, 200), (640, 200), (0, 255, 0), 2) # Horizon line
    _, b2 = cv2.imencode('.jpg', f2)
    presets.append({
        "id": "runway",
        "name": "Runway Approach & Artificial Horizon",
        "description": "Long straightway with high-visibility center dashed guide",
        "image_data": f"data:image/jpeg;base64,{base64.b64encode(b2).decode('utf-8')}"
    })

    return presets

@router.post("/process")
async def process_image(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    mode: str = Form("contour"), # "target_acquisition", "contour", "edge", "threshold", "thermal"
    grayscale: bool = Form(True),
    gaussian_blur: bool = Form(True),
    canny_edge: bool = Form(True),
    threshold: bool = Form(False),
    contour_detection: bool = Form(True),
    canny_low: int = Form(50),
    canny_high: int = Form(150),
    blur_kernel: int = Form(5)
):
    start_time = time.time()
    img = None

    if file and file.filename:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif image_base64:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        decoded = base64.b64decode(image_base64)
        nparr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    else:
        # Fallback to current drone camera or synthetic frame
        img = _generate_synthetic_aerial_frame()

    if img is None:
        img = _generate_synthetic_aerial_frame()

    h, w = img.shape[:2]
    current = img.copy()
    contours_found = 0
    active_stages = []
    detections = []

    # MODE 1: Tactical Target & Helipad Acquisition
    if mode == "target_acquisition":
        gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 2.0)
        active_stages.append("Gaussian Pre-Filter")

        # Detect circles (Hough Circles)
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=60,
            param1=80, param2=35, minRadius=15, maxRadius=int(min(w, h) * 0.45)
        )
        
        annotated = current.copy()
        target_count = 0

        if circles is not None:
            circles = np.uint16(np.around(circles))
            for i, c in enumerate(circles[0, :5]):
                cx, cy, r = int(c[0]), int(c[1]), int(c[2])
                target_count += 1
                # Outer lock ring
                cv2.circle(annotated, (cx, cy), r, (0, 255, 0), 2)
                # Inner reticle
                cv2.circle(annotated, (cx, cy), 6, (0, 0, 255), -1)
                # Bounding box
                x1, y1 = max(0, cx - r - 8), max(0, cy - r - 8)
                x2, y2 = min(w, cx + r + 8), min(h, cy + r + 8)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 120), 2)
                # Target lock label
                label = f"TGT-0{i+1} [ACQUIRED] ({cx},{cy})"
                cv2.putText(annotated, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 120), 1)
                detections.append({"label": f"TGT-0{i+1}", "x": cx, "y": cy, "radius": r, "confidence": 0.96})

        # Also find prominent contours if few circles
        if target_count == 0:
            edged = cv2.Canny(blurred, 40, 120)
            cnts, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for i, cnt in enumerate(cnts[:4]):
                if cv2.contourArea(cnt) > 600:
                    x, y, cw, ch = cv2.boundingRect(cnt)
                    cv2.rectangle(annotated, (x, y), (x + cw, y + ch), (0, 220, 255), 2)
                    cv2.putText(annotated, f"OBJ-0{i+1}", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1)
                    target_count += 1
                    detections.append({"label": f"OBJ-0{i+1}", "x": x + cw // 2, "y": y + ch // 2, "confidence": 0.88})

        contours_found = target_count
        current = annotated
        active_stages.append(f"Target Locking ({target_count} target zones locked)")

    # MODE 2: FLIR Thermal Vision
    elif mode == "thermal":
        gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        thermal_lut = cv2.applyColorMap(gray, cv2.COLORMAP_INFERNO)
        # Overlay tactical thermal HUD
        cv2.putText(thermal_lut, "EO/IR FLIR THERMAL PASS", (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        current = thermal_lut
        active_stages.append("FLIR Thermal Color Mapping (cv2.COLORMAP_INFERNO)")

    # MODE 3: Edge & Horizon Detection
    elif mode == "edge":
        gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        k = blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1
        blurred = cv2.GaussianBlur(gray, (k, k), 1.5)
        edges = cv2.Canny(blurred, canny_low, canny_high)
        # Convert edges to high-contrast cyan overlay
        colored_edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        colored_edges[np.where((colored_edges == [255, 255, 255]).all(axis=2))] = [255, 180, 0] # Cyan in BGR
        current = colored_edges
        active_stages.append(f"Canny Edge Extraction ({canny_low}, {canny_high})")

    # MODE 4: Standard Custom Pipeline
    else:
        if grayscale or canny_edge or threshold or contour_detection:
            current = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
            active_stages.append("Grayscale (cv2.cvtColor)")
        
        if gaussian_blur:
            k = blur_kernel if blur_kernel % 2 == 1 else blur_kernel + 1
            current = cv2.GaussianBlur(current, (k, k), 1.5)
            active_stages.append(f"Gaussian Blur {k}x{k}")

        if canny_edge:
            gray = current if len(current.shape) == 2 else cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
            current = cv2.Canny(gray, canny_low, canny_high)
            active_stages.append(f"Canny Edge ({canny_low}, {canny_high})")

        if threshold and not canny_edge:
            gray = current if len(current.shape) == 2 else cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
            _, current = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            active_stages.append("Binary Threshold")

        if contour_detection:
            binary_mask = current if len(current.shape) == 2 else cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
            contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours_found = len(contours)
            out_bgr = cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR) if len(current.shape) == 2 else current.copy()
            cv2.drawContours(out_bgr, contours, -1, (0, 255, 120), 2)
            current = out_bgr
            active_stages.append(f"Contour Extraction ({contours_found} found)")

    # Encode to PNG
    if len(current.shape) == 2:
        current = cv2.cvtColor(current, cv2.COLOR_GRAY2BGR)

    _, buffer = cv2.imencode('.png', current)
    b64 = base64.b64encode(buffer).decode('utf-8')
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "result_image": f"data:image/png;base64,{b64}",
        "stats": {
            "contours_found": contours_found,
            "width": w,
            "height": h,
            "processing_time_ms": elapsed_ms,
            "stages_applied": active_stages,
            "detections": detections
        },
        "source": "OPENCV_NATIVE_PIPELINE"
    }

from typing import Optional
from fastapi import Query
from app.db.repositories.cv_results import cv_results_repo

@router.get("/results")
async def get_cv_results(
    experiment_id: Optional[str] = Query(None),
    run_id: Optional[str] = Query(None),
    algorithm: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    return await cv_results_repo.list_results(
        experiment_id=experiment_id,
        run_id=run_id,
        algorithm=algorithm,
        limit=limit,
        skip=skip
    )

