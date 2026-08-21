"""
AI-FMEA API Endpoints
Supports both DFMEA and PFMEA with AIAG-VDA 2019 7-step approach.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.deepseek import call_deepseek_json
from app.services.fmea_logic import (
    get_action_priority,
    DFMEA_SEVERITY, DFMEA_OCCURRENCE, DFMEA_DETECTION,
    PFMEA_SEVERITY, PFMEA_OCCURRENCE, PFMEA_DETECTION,
)

router = APIRouter()


class FailureAnalysisRequest(BaseModel):
    fmea_type: str  # "dfmea" or "pfmea"
    focus_element: str
    function: str
    upper_level: Optional[str] = None
    context: Optional[str] = None


class OptimizeRequest(BaseModel):
    fmea_type: str
    failure_mode: str
    cause: str
    current_controls: str
    severity: int
    occurrence: int
    detection: int
    context: Optional[str] = None


class APRequest(BaseModel):
    severity: int
    occurrence: int
    detection: int


@router.post("/ap")
async def calculate_ap(req: APRequest):
    """Calculate Action Priority from S/O/D."""
    ap = get_action_priority(req.severity, req.occurrence, req.detection)
    return {"ap": ap, "severity": req.severity, "occurrence": req.occurrence, "detection": req.detection}


@router.get("/standards/{fmea_type}")
async def get_standards(fmea_type: str):
    """Get S/O/D rating standards for DFMEA or PFMEA."""
    if fmea_type == "dfmea":
        return {"severity": DFMEA_SEVERITY, "occurrence": DFMEA_OCCURRENCE, "detection": DFMEA_DETECTION}
    else:
        return {"severity": PFMEA_SEVERITY, "occurrence": PFMEA_OCCURRENCE, "detection": PFMEA_DETECTION}


@router.post("/failure-analysis")
async def failure_analysis(req: FailureAnalysisRequest):
    """AI-generate failure modes, effects, and causes for a given element/function."""

    fmea_context = "设计FMEA(DFMEA)" if req.fmea_type == "dfmea" else "过程FMEA(PFMEA)"
    element_term = "组件/零件" if req.fmea_type == "dfmea" else "过程步骤"
    cause_term = "设计原因" if req.fmea_type == "dfmea" else "过程原因"
    cause_examples = "材料选择、几何设计、接口设计等" if req.fmea_type == "dfmea" else "设备磨损、参数偏移、人员操作等"

    system_prompt = f"""你是一位资深质量工程师，精通AIAG-VDA 2019新版FMEA方法。你正在进行{fmea_context}的第4步（失效分析）。

用户给你一个{element_term}及其功能，你需要生成失效链（失效模式→失效影响→失效原因）。

按照AIAG-VDA标准：
- 失效模式(FM)：该功能的潜在失效方式（功能不实现/部分实现/过度实现/间歇/错误方向等）
- 失效影响(FE)：对上一层级系统/最终用户的影响
- 失效原因(FC)：导致该失效模式的{cause_examples}

返回JSON格式：
{{
  "failure_chains": [
    {{
      "failure_mode": "失效模式描述",
      "failure_effects": ["对上层影响1", "对最终用户影响"],
      "failure_causes": ["{cause_term}1", "{cause_term}2"]
    }}
  ]
}}

要求：
1. 给出3-5个失效模式
2. 每个失效模式给出1-2个影响和2-3个原因
3. 必须具体，与给定的{element_term}和功能直接相关
4. 使用中文
5. 只返回JSON"""

    user_msg = f"{element_term}：{req.focus_element}\n功能/要求：{req.function}"
    if req.upper_level:
        user_msg += f"\n上层系统：{req.upper_level}"
    if req.context:
        user_msg += f"\n补充信息：{req.context}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.7)

    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        return {
            "success": True,
            "data": {
                "failure_chains": [
                    {
                        "failure_mode": f"{req.focus_element}功能丧失",
                        "failure_effects": ["上层系统功能受影响", "最终用户无法正常使用"],
                        "failure_causes": ["AI服务暂时不可用，请手动填写失效原因"],
                    },
                    {
                        "failure_mode": f"{req.focus_element}功能退化",
                        "failure_effects": ["性能下降", "用户体验降低"],
                        "failure_causes": ["请基于实际经验填写"],
                    },
                ]
            },
            "source": "fallback",
        }


@router.post("/optimize")
async def optimize(req: OptimizeRequest):
    """AI-suggest improvement actions for high AP items."""

    fmea_context = "设计FMEA" if req.fmea_type == "dfmea" else "过程FMEA"
    ap = get_action_priority(req.severity, req.occurrence, req.detection)

    system_prompt = f"""你是一位资深质量工程师，正在进行{fmea_context}的第6步（优化）。

用户有一个AP={ap}的失效项，需要制定改进措施来降低风险。

按照AIAG-VDA标准，优化措施应该：
1. 优先降低严重度S（改变设计/过程消除失效影响）
2. 其次降低发生度O（增加预防控制）
3. 最后降低探测度D（增加检测控制）

返回JSON格式：
{{
  "current_ap": "{ap}",
  "recommendations": [
    {{
      "action": "具体改进措施描述",
      "target": "S/O/D（要降低哪个）",
      "expected_reduction": "预期降低到多少",
      "responsible": "建议责任方（设计/工艺/质量/供应商）",
      "type": "预防/检测"
    }}
  ],
  "priority_reasoning": "为什么建议这些措施的理由"
}}

使用中文。只返回JSON。"""

    user_msg = f"失效模式：{req.failure_mode}\n失效原因：{req.cause}\n当前控制措施：{req.current_controls}\n当前评分：S={req.severity}, O={req.occurrence}, D={req.detection}, AP={ap}"
    if req.context:
        user_msg += f"\n补充信息：{req.context}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.6)

    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        return {
            "success": True,
            "data": {
                "current_ap": ap,
                "recommendations": [
                    {"action": "增加预防控制措施", "target": "O", "expected_reduction": "降低2-3分", "responsible": "工程", "type": "预防"},
                    {"action": "增加检测控制措施", "target": "D", "expected_reduction": "降低2-3分", "responsible": "质量", "type": "检测"},
                ],
                "priority_reasoning": "AI服务暂时不可用，请基于实际情况制定措施",
            },
            "source": "fallback",
        }
