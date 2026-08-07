"""
AI Tools API - endpoints for AI-SPC, AI-MSA, and other quality tools.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ToolInfo(BaseModel):
    id: str
    name: str
    name_zh: str
    description: str
    description_zh: str
    category: str
    status: str  # "active" | "coming_soon" | "beta"
    icon: str
    route: str


# Tool registry - extend as tools are added
TOOLS_REGISTRY: list[ToolInfo] = [
    ToolInfo(
        id="ai-spc",
        name="AI-SPC",
        name_zh="AI统计过程控制",
        description="AI-powered Statistical Process Control with intelligent anomaly detection and root cause suggestions.",
        description_zh="AI赋能的统计过程控制，智能异常检测与根因建议。",
        category="control",
        status="active",
        icon="bar-chart-line",
        route="/tools/ai-spc",
    ),
    ToolInfo(
        id="ai-msa",
        name="AI-MSA",
        name_zh="AI测量系统分析",
        description="AI-enhanced Measurement System Analysis with automated Gage R&R and bias detection.",
        description_zh="AI增强的测量系统分析，自动化GRR和偏差检测。",
        category="measurement",
        status="active",
        icon="rulers",
        route="/tools/ai-msa",
    ),
    ToolInfo(
        id="ai-doe",
        name="AI-DOE",
        name_zh="AI实验设计",
        description="AI-assisted Design of Experiments with optimal factor selection and response prediction.",
        description_zh="AI辅助实验设计，最优因子选择与响应预测。",
        category="improvement",
        status="coming_soon",
        icon="grid-3x3",
        route="/tools/ai-doe",
    ),
    ToolInfo(
        id="ai-fmea",
        name="AI-FMEA",
        name_zh="AI失效模式分析",
        description="AI-driven Failure Mode and Effects Analysis with automated risk scoring and action prioritization.",
        description_zh="AI驱动的失效模式与影响分析，自动风险评分与措施优先级。",
        category="analysis",
        status="coming_soon",
        icon="exclamation-triangle",
        route="/tools/ai-fmea",
    ),
    ToolInfo(
        id="ai-hypothesis",
        name="AI-Hypothesis Testing",
        name_zh="AI假设检验",
        description="Automated hypothesis test selection and interpretation with plain-language conclusions.",
        description_zh="自动假设检验选择与解读，自然语言结论输出。",
        category="analysis",
        status="coming_soon",
        icon="check2-circle",
        route="/tools/ai-hypothesis",
    ),
]


@router.get("/", response_model=list[ToolInfo])
async def list_tools():
    """List all available AI quality tools."""
    return TOOLS_REGISTRY


@router.get("/{tool_id}", response_model=ToolInfo)
async def get_tool(tool_id: str):
    """Get details of a specific tool."""
    for tool in TOOLS_REGISTRY:
        if tool.id == tool_id:
            return tool
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found")
