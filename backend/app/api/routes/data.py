from fastapi import APIRouter, File, UploadFile
import pandas as pd
import io
import numpy as np

router = APIRouter()

@router.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        stats = {}
        for col in numeric_cols:
            clean_series = df[col].dropna()
            if len(clean_series) > 0:
                stats[col] = {
                    "mean": round(float(clean_series.mean()), 3),
                    "median": round(float(clean_series.median()), 3),
                    "std": round(float(clean_series.std()), 3) if len(clean_series) > 1 else 0.0,
                    "min": round(float(clean_series.min()), 3),
                    "max": round(float(clean_series.max()), 3),
                    "q25": round(float(clean_series.quantile(0.25)), 3),
                    "q75": round(float(clean_series.quantile(0.75)), 3),
                }
            
        # Sample up to 120 sequential data points for interactive line charting
        sample_records = df[numeric_cols].head(120).replace({np.nan: None}).to_dict(orient="records")
        
        # Calculate pairwise correlation for numeric columns
        corr_dict = {}
        if len(numeric_cols) > 1:
            corr_df = df[numeric_cols].corr().round(2).replace({np.nan: 0.0})
            corr_dict = corr_df.to_dict()

        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "numeric_columns": numeric_cols,
            "missing_values": df.isna().sum().to_dict(),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "numerical_stats": stats,
            "series_data": sample_records,
            "correlation_matrix": corr_dict,
            "source": "PANDAS_ANALYTICS_CORE"
        }
    except Exception as e:
        return {"error": str(e)}
