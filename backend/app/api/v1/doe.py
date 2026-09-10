"""
DOE (Design of Experiments) API.
Generates factorial designs and analyzes results.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import itertools
import json
import random

from app.core.ai_engine import chat_completion_stream

router = APIRouter()


class Factor(BaseModel):
    name: str
    low: str
    high: str


class DesignRequest(BaseModel):
    factors: List[Factor]
    design_type: str = "full"  # "full" | "half"
    replicates: int = 1
    randomize: bool = True
    center_points: int = 0


class AnalyzeRequest(BaseModel):
    factors: List[str]
    runs: List[Dict]  # [{"A": -1, "B": 1, "response": 12.5}, ...]
    response_name: str = "Response"


@router.post("/design")
async def generate_design(req: DesignRequest):
    """Generate a factorial design matrix."""
    k = len(req.factors)
    if k < 2:
        raise HTTPException(status_code=400, detail="At least 2 factors required")
    if k > 7:
        raise HTTPException(status_code=400, detail="Maximum 7 factors supported")

    labels = [chr(65 + i) for i in range(k)]  # A, B, C...

    # Full factorial: all 2^k combinations
    combos = list(itertools.product([-1, 1], repeat=k))

    # Half fraction: keep runs where product of all signs is +1
    if req.design_type == "half" and k >= 3:
        combos = [c for c in combos if _product(c) == 1]

    runs = []
    run_id = 1
    for _ in range(max(1, req.replicates)):
        for combo in combos:
            run = {"run": run_id, "std_order": run_id}
            for i, label in enumerate(labels):
                run[label] = combo[i]
                run[labels[i] + "_value"] = req.factors[i].high if combo[i] == 1 else req.factors[i].low
            runs.append(run)
            run_id += 1

    # Center points (only meaningful for numeric factors)
    for _ in range(req.center_points):
        run = {"run": run_id, "std_order": run_id, "is_center": True}
        for label in labels:
            run[label] = 0
            run[label + "_value"] = "center"
        runs.append(run)
        run_id += 1

    if req.randomize:
        order = list(range(len(runs)))
        random.shuffle(order)
        for new_pos, idx in enumerate(order):
            runs[idx]["run_order"] = new_pos + 1
        runs = sorted(runs, key=lambda r: r["run_order"])
    else:
        for i, r in enumerate(runs):
            r["run_order"] = i + 1

    resolution = "Full Factorial (Resolution: Full)"
    if req.design_type == "half" and k >= 3:
        resolution = "2^(" + str(k) + "-1) Fractional Factorial"

    return {
        "factors": [{"label": labels[i], "name": f.name, "low": f.low, "high": f.high}
                    for i, f in enumerate(req.factors)],
        "design_type": req.design_type,
        "resolution": resolution,
        "total_runs": len(runs),
        "runs": runs,
    }


def _product(seq):
    p = 1
    for x in seq:
        p *= x
    return p


@router.post("/analyze")
async def analyze_doe(req: AnalyzeRequest):
    """Analyze DOE results: main effects and interactions."""
    if not req.runs:
        raise HTTPException(status_code=400, detail="No run data provided")

    valid_runs = [r for r in req.runs if r.get("response") is not None]
    if len(valid_runs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 runs with response values required")

    responses = [float(r["response"]) for r in valid_runs]
    grand_mean = sum(responses) / len(responses)

    # Main effects
    main_effects = []
    for factor in req.factors:
        high_vals = [float(r["response"]) for r in valid_runs if r.get(factor) == 1]
        low_vals = [float(r["response"]) for r in valid_runs if r.get(factor) == -1]
        if high_vals and low_vals:
            high_mean = sum(high_vals) / len(high_vals)
            low_mean = sum(low_vals) / len(low_vals)
            effect = high_mean - low_mean
            main_effects.append({
                "factor": factor,
                "low_mean": round(low_mean, 4),
                "high_mean": round(high_mean, 4),
                "effect": round(effect, 4),
                "abs_effect": round(abs(effect), 4),
            })

    # Two-factor interactions
    interactions = []
    for f1, f2 in itertools.combinations(req.factors, 2):
        plus_vals = [float(r["response"]) for r in valid_runs
                     if r.get(f1) is not None and r.get(f2) is not None
                     and r.get(f1) * r.get(f2) == 1]
        minus_vals = [float(r["response"]) for r in valid_runs
                      if r.get(f1) is not None and r.get(f2) is not None
                      and r.get(f1) * r.get(f2) == -1]
        if plus_vals and minus_vals:
            effect = (sum(plus_vals) / len(plus_vals)) - (sum(minus_vals) / len(minus_vals))
            interactions.append({
                "interaction": f1 + "x" + f2,
                "effect": round(effect, 4),
                "abs_effect": round(abs(effect), 4),
            })

    # Rank by absolute effect
    all_effects = ([{"term": e["factor"], "effect": e["effect"], "abs_effect": e["abs_effect"], "type": "main"}
                    for e in main_effects] +
                   [{"term": i["interaction"], "effect": i["effect"], "abs_effect": i["abs_effect"], "type": "interaction"}
                    for i in interactions])
    all_effects.sort(key=lambda x: x["abs_effect"], reverse=True)

    # Variance
    variance = sum((r - grand_mean) ** 2 for r in responses) / max(1, len(responses) - 1)
    std_dev = variance ** 0.5

    # Optimal settings (maximize response)
    optimal = {}
    for e in main_effects:
        optimal[e["factor"]] = "high" if e["effect"] > 0 else "low"

    return {
        "n_runs": len(valid_runs),
        "grand_mean": round(grand_mean, 4),
        "std_dev": round(std_dev, 4),
        "min_response": round(min(responses), 4),
        "max_response": round(max(responses), 4),
        "main_effects": main_effects,
        "interactions": interactions,
        "ranked_effects": all_effects,
        "optimal_settings": optimal,
        "significant_threshold": round(2 * std_dev / (len(valid_runs) ** 0.5), 4),
    }


class InterpretRequest(BaseModel):
    analysis: dict
    factor_names: Dict[str, str] = {}
    response_name: str = "Response"
    goal: str = "maximize"  # maximize | minimize | target


@router.post("/interpret")
async def interpret_doe(req: InterpretRequest):
    """AI interpretation of DOE analysis results (streaming)."""
    system = """\u4f60\u662f\u4e00\u4f4dDOE\uff08\u5b9e\u9a8c\u8bbe\u8ba1\uff09\u4e13\u5bb6\u3002\u7528\u6237\u63d0\u4f9b\u4e86\u56e0\u5b50\u8bd5\u9a8c\u7684\u5206\u6790\u7ed3\u679c\u3002

\u4f60\u7684\u4efb\u52a1\uff1a
1. \u89e3\u8bfb\u4e3b\u6548\u5e94\u548c\u4ea4\u4e92\u6548\u5e94
2. \u5224\u65ad\u54ea\u4e9b\u56e0\u5b50\u663e\u8457\uff0c\u54ea\u4e9b\u4e0d\u663e\u8457
3. \u7ed9\u51fa\u6700\u4f18\u53c2\u6570\u7ec4\u5408\u5efa\u8bae
4. \u63d0\u9192\u9700\u8981\u6ce8\u610f\u7684\u4ea4\u4e92\u6548\u5e94\u9677\u9631
5. \u5efa\u8bae\u4e0b\u4e00\u6b65\u9a8c\u8bc1\u5b9e\u9a8c

\u8f93\u51fa\u683c\u5f0f\uff1a
**\u3010\u5173\u952e\u53d1\u73b0\u3011**
**\u3010\u663e\u8457\u56e0\u5b50\u3011**
**\u3010\u4ea4\u4e92\u6548\u5e94\u3011**
**\u3010\u6700\u4f18\u8bbe\u7f6e\u3011**
**\u3010\u4e0b\u4e00\u6b65\u5efa\u8bae\u3011**

\u4f7f\u7528\u4e2d\u6587\uff0c\u7b80\u6d01\u4e13\u4e1a\u3002"""

    user_content = "\u5206\u6790\u7ed3\u679c JSON:\n" + json.dumps(req.analysis, ensure_ascii=False)[:2500]
    user_content += "\n\n\u54cd\u5e94\u53d8\u91cf: " + req.response_name
    user_content += "\n\u4f18\u5316\u76ee\u6807: " + req.goal
    if req.factor_names:
        user_content += "\n\u56e0\u5b50\u5bf9\u5e94\u5173\u7cfb: " + json.dumps(req.factor_names, ensure_ascii=False)

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    async def generate():
        try:
            async for chunk in chat_completion_stream(messages, temperature=0.5):
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class SuggestFactorsRequest(BaseModel):
    problem: str
    process: Optional[str] = None


@router.post("/suggest-factors")
async def suggest_factors(req: SuggestFactorsRequest):
    """AI suggests factors and levels for a DOE study (streaming)."""
    system = """\u4f60\u662fDOE\u4e13\u5bb6\u3002\u7528\u6237\u63cf\u8ff0\u4e86\u4e00\u4e2a\u8981\u4f18\u5316\u7684\u95ee\u9898\uff0c\u4f60\u9700\u8981\u5efa\u8bae\u5b9e\u9a8c\u56e0\u5b50\u548c\u6c34\u5e73\u3002

\u8f93\u51fa\u683c\u5f0f\uff1a
**\u3010\u5efa\u8bae\u56e0\u5b50\u3011**
| \u56e0\u5b50 | \u4f4e\u6c34\u5e73(-1) | \u9ad8\u6c34\u5e73(+1) | \u7406\u7531 |
|------|-----------|-----------|------|
| ... | ... | ... | ... |

**\u3010\u54cd\u5e94\u53d8\u91cf\u3011**
\u5efa\u8bae\u6d4b\u91cf\u4ec0\u4e48\u6307\u6807

**\u3010\u63a8\u8350\u8bbe\u8ba1\u3011**
\u5168\u56e0\u5b50\u8fd8\u662f\u90e8\u5206\u56e0\u5b50\uff0c\u9700\u8981\u591a\u5c11\u8bd5\u9a8c

**\u3010\u6ce8\u610f\u4e8b\u9879\u3011**
\u53ef\u80fd\u7684\u6df7\u6dc6\u56e0\u5b50\u3001\u9700\u8981\u63a7\u5236\u7684\u566a\u58f0

\u4e00\u822c\u5efa\u8bae2-5\u4e2a\u56e0\u5b50\u3002\u4f7f\u7528\u4e2d\u6587\u3002"""

    user_content = "\u95ee\u9898: " + req.problem
    if req.process:
        user_content += "\n\u8fc7\u7a0b\u63cf\u8ff0: " + req.process

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    async def generate():
        try:
            async for chunk in chat_completion_stream(messages, temperature=0.6):
                yield "data: " + json.dumps({"content": chunk}) + "\n\n"
        except Exception as e:
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
