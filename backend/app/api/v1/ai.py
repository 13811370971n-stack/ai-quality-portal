"""
AI Quality Tools API
Endpoints for AI-enhanced Fishbone, 5 Whys, and Pareto analysis.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.deepseek import call_deepseek_json, call_deepseek
from app.services.fallback_knowledge import get_fishbone_fallback, get_five_whys_fallback

router = APIRouter()


# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════

@router.get("/health")
async def ai_health():
    """Check AI service availability."""
    from app.services.deepseek import DEEPSEEK_TOKEN
    return {
        "status": "ok",
        "deepseek_configured": bool(DEEPSEEK_TOKEN),
        "service": "ai-quality-tools",
    }


# ═══════════════════════════════════════════════════════════════
# AI Fishbone Diagram
# ═══════════════════════════════════════════════════════════════

class FishboneGenerateRequest(BaseModel):
    problem: str
    context: Optional[str] = None  # Additional context (industry, product, etc.)


class FishboneExpandRequest(BaseModel):
    problem: str
    category: str  # e.g., "人 (Man)"
    cause: str  # The cause to expand


@router.post("/fishbone/generate")
async def fishbone_generate(req: FishboneGenerateRequest):
    """Generate 6M causes for a problem statement."""
    
    system_prompt = """你是一位资深的六西格玛黑带和质量工程专家。用户会给你一个质量问题描述，你需要用鱼骨图(因果图)的6M方法进行分析。

请严格按以下JSON格式返回结果：
{
  "categories": [
    {"name": "人 (Man)", "causes": [{"text": "原因描述", "subCauses": []}]},
    {"name": "机 (Machine)", "causes": [{"text": "原因描述", "subCauses": []}]},
    {"name": "料 (Material)", "causes": [{"text": "原因描述", "subCauses": []}]},
    {"name": "法 (Method)", "causes": [{"text": "原因描述", "subCauses": []}]},
    {"name": "环 (Environment)", "causes": [{"text": "原因描述", "subCauses": []}]},
    {"name": "测 (Measurement)", "causes": [{"text": "原因描述", "subCauses": []}]}
  ]
}

要求：
1. 每个M类别给出3-5个具体的、可操作的潜在原因
2. 原因要具体，不要太笼统（如"人的问题"太笼统，应该写"操作人员焊接速度不稳定"）
3. 原因要与用户描述的问题直接相关
4. 使用中文
5. 只返回JSON，不要任何额外文字"""

    user_msg = f"问题：{req.problem}"
    if req.context:
        user_msg += f"\n背景信息：{req.context}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.7)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        # Fallback to knowledge base
        fallback = get_fishbone_fallback(req.problem)
        return {"success": True, "data": fallback, "source": "fallback", "ai_error": result.get("error")}


@router.post("/fishbone/expand")
async def fishbone_expand(req: FishboneExpandRequest):
    """Expand a specific cause into sub-causes."""
    
    system_prompt = """你是一位六西格玛质量专家。用户正在做鱼骨图分析，已经识别了一个原因，现在需要进一步追问该原因的子原因（更深层的原因）。

请返回JSON格式：
{
  "subCauses": ["子原因1", "子原因2", "子原因3", "子原因4"]
}

要求：
1. 给出3-5个更深层的具体子原因
2. 子原因要比父原因更具体、更接近根本原因
3. 使用中文
4. 只返回JSON"""

    user_msg = f"问题：{req.problem}\n类别：{req.category}\n原因：{req.cause}\n\n请分析「{req.cause}」这个原因，给出更深层的子原因。"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.7)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        return {
            "success": True,
            "data": {"subCauses": ["需要进一步调查具体情况", "建议收集数据验证", "可能需要现场观察确认"]},
            "source": "fallback",
        }


# ═══════════════════════════════════════════════════════════════
# AI 5 Whys
# ═══════════════════════════════════════════════════════════════

class FiveWhysSuggestRequest(BaseModel):
    problem: str
    chain: list[str]  # List of answers so far ["answer1", "answer2", ...]
    current_depth: int  # Current depth (0-based)


class FiveWhysValidateRequest(BaseModel):
    problem: str
    chain: list[str]
    root_cause: str


@router.post("/five-whys/suggest")
async def five_whys_suggest(req: FiveWhysSuggestRequest):
    """Suggest next 'why' answer + guiding questions + possible branches."""
    
    system_prompt = """你是一位六西格玛质量专家，正在引导用户使用"5个为什么"方法进行根因分析。

根据用户提供的问题和已有的追问链，你需要：
1. 建议下一层的原因（suggestion）
2. 提供一个引导性问题帮助用户思考（guide_question）
3. 给出2-3个可能的方向/分叉（branches），每个方向包含方向名称和提示

请返回JSON格式：
{
  "suggestion": "AI建议的下一层原因",
  "guide_question": "引导用户思考的问题",
  "branches": [
    {"direction": "方向1名称", "hint": "这个方向的思考提示"},
    {"direction": "方向2名称", "hint": "这个方向的思考提示"},
    {"direction": "方向3名称", "hint": "这个方向的思考提示"}
  ],
  "is_likely_root": false,
  "root_hint": ""
}

如果你认为当前层级已经接近根本原因，设 is_likely_root=true，并在 root_hint 中说明为什么。
使用中文。只返回JSON。"""

    chain_text = ""
    if req.chain:
        for i, answer in enumerate(req.chain):
            chain_text += f"\n第{i+1}个为什么的答案：{answer}"
    
    user_msg = f"原始问题：{req.problem}{chain_text}\n\n当前是第{req.current_depth + 1}层追问。请建议下一层的原因。"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.7)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        fallback = get_five_whys_fallback(req.problem)
        return {"success": True, "data": fallback, "source": "fallback", "ai_error": result.get("error")}


@router.post("/five-whys/validate")
async def five_whys_validate(req: FiveWhysValidateRequest):
    """Validate root cause and suggest corrective actions."""
    
    system_prompt = """你是一位六西格玛质量专家。用户已经完成了"5个为什么"分析并确定了根本原因。请：
1. 评估这个根因是否合理（验证：如果消除这个根因，问题是否不再发生？）
2. 建议2-3个具体的纠正措施

请返回JSON格式：
{
  "validation": {
    "is_valid": true/false,
    "reasoning": "验证逻辑说明",
    "confidence": "high/medium/low"
  },
  "corrective_actions": [
    {"action": "纠正措施描述", "type": "短期/长期", "priority": "高/中/低"},
    {"action": "纠正措施描述", "type": "短期/长期", "priority": "高/中/低"},
    {"action": "纠正措施描述", "type": "短期/长期", "priority": "高/中/低"}
  ],
  "prevention": "预防再发生的建议"
}

使用中文。只返回JSON。"""

    chain_text = "\n".join([f"  第{i+1}层：{a}" for i, a in enumerate(req.chain)])
    user_msg = f"原始问题：{req.problem}\n\n追问链：\n{chain_text}\n\n确认的根本原因：{req.root_cause}\n\n请验证这个根因并建议纠正措施。"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.5)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        return {
            "success": True,
            "data": {
                "validation": {"is_valid": True, "reasoning": "AI服务暂时不可用，请人工验证", "confidence": "low"},
                "corrective_actions": [
                    {"action": "针对根因制定专项改进措施", "type": "短期", "priority": "高"},
                    {"action": "建立预防机制防止再发", "type": "长期", "priority": "中"},
                    {"action": "更新相关标准和培训材料", "type": "长期", "priority": "中"},
                ],
                "prevention": "建议将此案例纳入经验教训库",
            },
            "source": "fallback",
        }


# ═══════════════════════════════════════════════════════════════
# AI Pareto Chart
# ═══════════════════════════════════════════════════════════════

class ParetoAnalyzeRequest(BaseModel):
    items: list[dict]  # [{"category": "划伤", "count": 45}, ...]
    context: Optional[str] = None


class ParetoChatRequest(BaseModel):
    items: list[dict]
    question: str
    history: list[dict] = []  # [{"role": "user/ai", "content": "..."}]


class ParetoCompareRequest(BaseModel):
    before: list[dict]  # [{"category": "...", "count": N}, ...]
    after: list[dict]
    context: Optional[str] = None


@router.post("/pareto/analyze")
async def pareto_analyze(req: ParetoAnalyzeRequest):
    """Analyze Pareto data and provide interpretation."""
    
    system_prompt = """你是一位六西格玛质量专家。用户提供了帕累托图的数据，请给出专业的分析解读。

分析应包含：
1. 关键少数识别（80/20法则）
2. 改进优先级建议
3. 可能的根因方向提示

返回JSON格式：
{
  "summary": "一句话总结",
  "key_findings": ["发现1", "发现2", "发现3"],
  "priority_items": ["应优先处理的类别1", "类别2"],
  "root_cause_hints": "对关键少数的根因方向提示",
  "recommendation": "改进建议"
}

使用中文。只返回JSON。"""

    items_text = "\n".join([f"  {item['category']}: {item['count']}件" for item in req.items])
    total = sum(item["count"] for item in req.items)
    user_msg = f"帕累托数据（总计{total}件）：\n{items_text}"
    if req.context:
        user_msg += f"\n背景：{req.context}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.5)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        # Simple fallback analysis
        sorted_items = sorted(req.items, key=lambda x: x["count"], reverse=True)
        cumulative = 0
        priority = []
        for item in sorted_items:
            cumulative += item["count"]
            priority.append(item["category"])
            if cumulative / total >= 0.8:
                break
        return {
            "success": True,
            "data": {
                "summary": f"前{len(priority)}项占总数的80%以上，是改进重点",
                "key_findings": [f"{priority[0]}是最主要的问题类别" if priority else "数据不足"],
                "priority_items": priority,
                "root_cause_hints": "建议对关键少数进行鱼骨图分析",
                "recommendation": "集中资源优先解决排名前几位的问题",
            },
            "source": "fallback",
        }


@router.post("/pareto/chat")
async def pareto_chat(req: ParetoChatRequest):
    """Chat about Pareto data - answer follow-up questions."""
    
    system_prompt = """你是一位六西格玛质量专家。用户正在分析帕累托图数据，有后续问题。请基于数据提供专业回答。

如果用户问某个缺陷类别的原因，你可以建议使用鱼骨图(6M)方法分析，并给出初步的原因假设。

返回JSON格式：
{
  "answer": "你的回答",
  "suggestions": ["建议的后续行动1", "建议2"],
  "related_tool": "如果建议使用其他工具，写工具名称，否则为null"
}

使用中文。只返回JSON。"""

    items_text = "\n".join([f"  {item['category']}: {item['count']}件" for item in req.items])
    history_text = "\n".join([f"  {msg['role']}: {msg['content']}" for msg in req.history[-5:]])
    
    user_msg = f"帕累托数据：\n{items_text}\n\n对话历史：\n{history_text}\n\n用户问题：{req.question}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.7)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        return {
            "success": True,
            "data": {
                "answer": "AI服务暂时不可用。建议对此问题使用鱼骨图进行6M分析。",
                "suggestions": ["使用鱼骨图分析根因", "收集更多数据验证"],
                "related_tool": "鱼骨图",
            },
            "source": "fallback",
        }


@router.post("/pareto/compare")
async def pareto_compare(req: ParetoCompareRequest):
    """Compare before/after Pareto data and analyze improvement effect."""
    
    system_prompt = """你是一位六西格玛质量专家。用户提供了改善前后两组帕累托数据，请对比分析改善效果。

分析应包含：
1. 总量变化
2. 各类别的变化情况
3. 改善效果评估
4. 后续建议

返回JSON格式：
{
  "summary": "改善效果一句话总结",
  "total_change": {"before": N, "after": N, "reduction_pct": "XX%"},
  "category_changes": [
    {"category": "类别", "before": N, "after": N, "change_pct": "±XX%", "status": "improved/worsened/stable"}
  ],
  "effectiveness": "high/medium/low",
  "findings": ["发现1", "发现2"],
  "next_steps": ["后续建议1", "建议2"]
}

使用中文。只返回JSON。"""

    before_text = "\n".join([f"  {item['category']}: {item['count']}件" for item in req.before])
    after_text = "\n".join([f"  {item['category']}: {item['count']}件" for item in req.after])
    user_msg = f"改善前：\n{before_text}\n\n改善后：\n{after_text}"
    if req.context:
        user_msg += f"\n背景：{req.context}"

    result = await call_deepseek_json(system_prompt, user_msg, temperature=0.5)
    
    if result["success"]:
        return {"success": True, "data": result["data"], "source": "deepseek"}
    else:
        total_before = sum(item["count"] for item in req.before)
        total_after = sum(item["count"] for item in req.after)
        change = ((total_after - total_before) / total_before * 100) if total_before > 0 else 0
        return {
            "success": True,
            "data": {
                "summary": f"总量{'下降' if change < 0 else '上升'}{abs(change):.1f}%",
                "total_change": {"before": total_before, "after": total_after, "reduction_pct": f"{-change:.1f}%"},
                "effectiveness": "medium",
                "findings": ["AI服务暂时不可用，以上为基础统计"],
                "next_steps": ["建议人工详细分析各类别变化"],
            },
            "source": "fallback",
        }
