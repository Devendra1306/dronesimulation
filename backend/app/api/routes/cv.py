from fastapi import APIRouter, File, UploadFile, Form
import cv2
import numpy as np
import base64
import time

router = APIRouter()

@router.post("/process")
async def process_image(
    file: UploadFile = File(...),
    grayscale: bool = Form(True),
    gaussian_blur: bool = Form(True),
    canny_edge: bool = Form(True),
    threshold: bool = Form(False),
    contour_detection: bool = Form(True)
):
    start_time = time.time()
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image format"}
        
    h, w = img.shape[:2]
    current = img.copy()
    contours_found = 0
    active_stages = []

    # 1. Grayscale
    if grayscale or canny_edge or threshold or contour_detection:
        current = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        active_stages.append("Grayscale (cv2.cvtColor)")
    
    # 2. Gaussian Blur
    if gaussian_blur:
        if len(current.shape) == 2:
            current = cv2.GaussianBlur(current, (5, 5), 1.5)
        else:
            current = cv2.GaussianBlur(current, (5, 5), 1.5)
        active_stages.append("Gaussian Blur 5x5 (cv2.GaussianBlur)")

    # 3. Canny Edge Detection
    if canny_edge:
        if len(current.shape) == 3:
            gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        else:
            gray = current
        current = cv2.Canny(gray, 50, 150)
        active_stages.append("Canny Edge (cv2.Canny: 50, 150)")

    # 4. Thresholding
    if threshold and not canny_edge:
        if len(current.shape) == 3:
            gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        else:
            gray = current
        _, current = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        active_stages.append("Otsu/Binary Threshold (cv2.threshold)")

    # 5. Contour Detection
    if contour_detection:
        binary_mask = current if len(current.shape) == 2 else cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours_found = len(contours)
        
        # Render colored contours onto output frame
        out_bgr = cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR) if len(current.shape) == 2 else current.copy()
        cv2.drawContours(out_bgr, contours, -1, (0, 255, 120), 2)
        current = out_bgr
        active_stages.append(f"Contour Extraction ({contours_found} found)")

    # Encode to PNG
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
            "stages_applied": active_stages
        },
        "source": "OPENCV_NATIVE_PIPELINE"
    }
