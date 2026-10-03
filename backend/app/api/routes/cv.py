from fastapi import APIRouter, File, UploadFile
import cv2
import numpy as np
import base64

router = APIRouter()

@router.post("/process")
async def process_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"error": "Invalid image"}
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    _, thresh = cv2.threshold(edges, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    _, buffer = cv2.imencode('.png', edges)
    b64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "result_image": f"data:image/png;base64,{b64}",
        "stats": {
            "contours_found": len(contours),
            "width": img.shape[1],
            "height": img.shape[0]
        },
        "source": "DEMO_SIMULATION"
    }
