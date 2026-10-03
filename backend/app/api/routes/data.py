from fastapi import APIRouter, File, UploadFile
import pandas as pd
import io

router = APIRouter()

@router.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
        
        numeric_cols = df.select_dtypes(include='number').columns
        stats = {}
        for col in numeric_cols:
            stats[col] = {
                "mean": float(df[col].mean()),
                "median": float(df[col].median()),
                "std": float(df[col].std()) if pd.notna(df[col].std()) else 0,
                "min": float(df[col].min()),
                "max": float(df[col].max())
            }
            
        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "missing_values": df.isna().sum().to_dict(),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "numerical_stats": stats,
            "source": "DEMO_SAMPLE"
        }
    except Exception as e:
        return {"error": str(e)}
