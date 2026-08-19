"""
AI Quality Data Analysis API.
Upload Excel/CSV -> auto-detect fields -> statistical analysis -> AI interpretation.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import json
import io
import os
import tempfile

from app.database.session import get_db
from app.models.user import User
from app.core.security import require_user
from app.core.ai_engine import chat_completion_stream

router = APIRouter()


def safe_json(obj):
    """Convert numpy/pandas types to JSON-safe types."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj) if not np.isnan(obj) else None
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if pd.isna(obj):
        return None
    return obj


@router.post("/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    analysis_type: str = Form(default="auto"),
    usl: Optional[str] = Form(default=None),
    lsl: Optional[str] = Form(default=None),
    user: User = Depends(require_user),
):
    """Upload Excel/CSV and perform statistical analysis."""
    # Read file
    content = await file.read()
    filename = file.filename or "data"
    ext = os.path.splitext(filename)[1].lower()

    try:
        if ext in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(content))
        elif ext == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty")

    # Auto-detect numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    all_cols = df.columns.tolist()

    # Basic statistics
    stats = {}
    for col in numeric_cols[:10]:  # limit to first 10 numeric columns
        series = df[col].dropna()
        if len(series) == 0:
            continue
        col_stats = {
            "count": safe_json(len(series)),
            "mean": safe_json(series.mean()),
            "std": safe_json(series.std()),
            "min": safe_json(series.min()),
            "max": safe_json(series.max()),
            "median": safe_json(series.median()),
            "q1": safe_json(series.quantile(0.25)),
            "q3": safe_json(series.quantile(0.75)),
        }

        # Process capability if spec limits provided
        if usl and lsl:
            try:
                usl_val = float(usl)
                lsl_val = float(lsl)
                mean = series.mean()
                std = series.std()
                if std > 0:
                    cp = (usl_val - lsl_val) / (6 * std)
                    cpu = (usl_val - mean) / (3 * std)
                    cpl = (mean - lsl_val) / (3 * std)
                    cpk = min(cpu, cpl)
                    col_stats["cp"] = safe_json(round(cp, 3))
                    col_stats["cpk"] = safe_json(round(cpk, 3))
                    col_stats["cpu"] = safe_json(round(cpu, 3))
                    col_stats["cpl"] = safe_json(round(cpl, 3))
                    col_stats["usl"] = usl_val
                    col_stats["lsl"] = lsl_val
            except (ValueError, TypeError):
                pass

        stats[col] = col_stats

    # Detect anomalies (simple IQR method)
    anomalies = {}
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) < 10:
            continue
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers = series[(series < lower) | (series > upper)]
        if len(outliers) > 0:
            anomalies[col] = {
                "count": safe_json(len(outliers)),
                "percentage": safe_json(round(len(outliers) / len(series) * 100, 1)),
                "lower_bound": safe_json(round(lower, 4)),
                "upper_bound": safe_json(round(upper, 4)),
            }

    # Pareto (for non-numeric columns - defect types)
    pareto = {}
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    for col in cat_cols[:3]:
        vc = df[col].value_counts().head(10)
        total = vc.sum()
        cumulative = 0
        items = []
        for val, count in vc.items():
            cumulative += count
            items.append({
                "value": str(val),
                "count": safe_json(count),
                "percentage": safe_json(round(count / total * 100, 1)),
                "cumulative": safe_json(round(cumulative / total * 100, 1)),
            })
        pareto[col] = items

    result = {
        "filename": filename,
        "rows": len(df),
        "columns": len(all_cols),
        "column_names": all_cols,
        "numeric_columns": numeric_cols,
        "categorical_columns": cat_cols,
        "statistics": stats,
        "anomalies": anomalies,
        "pareto": pareto,
        "sample_data": df.head(5).to_dict(orient="records"),
    }

    return result


@router.post("/interpret")
async def ai_interpret(
    analysis_result: str = Form(...),
    question: str = Form(default=""),
    user: User = Depends(require_user),
):
    """Get AI interpretation of analysis results via SSE stream."""
    system_prompt = """你是一位资深质量数据分析专家。你收到了一份质量数据的统计分析结果。

你的任务：
1. 用通俗易懂的语言解释数据分析结果
2. 识别关键发现（异常、趋势、能力不足等）
3. 给出质量改善建议
4. 如果有Cpk数据，评估过程能力等级

输出格式：
**【数据概览】**
简要描述数据集

**【关键发现】**
- 发现1
- 发现2

**【过程能力评估】**（如有Cpk）
- Cpk评级和解读

**【异常检测】**（如有）
- 异常描述

**【改善建议】**
- 建议1
- 建议2

使用中文回答，简洁专业。"""

    user_content = f"分析结果：
{analysis_result[:3000]}"
    if question:
        user_content += f"

用户问题：{question}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    async def generate():
        try:
            async for chunk in chat_completion_stream(messages):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
