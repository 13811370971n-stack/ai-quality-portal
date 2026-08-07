"""
Methodology API - DMAIC framework with AI enhancement points.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AIEnhancement(BaseModel):
    tool: str
    description: str
    description_zh: str


class DMAICPhase(BaseModel):
    id: str
    name: str
    name_zh: str
    description: str
    description_zh: str
    key_activities: list[str]
    key_activities_zh: list[str]
    ai_enhancements: list[AIEnhancement]
    deliverables: list[str]
    deliverables_zh: list[str]


DMAIC_PHASES: list[DMAICPhase] = [
    DMAICPhase(
        id="define",
        name="Define",
        name_zh="定义",
        description="Define the problem, project scope, and customer requirements.",
        description_zh="定义问题、项目范围和客户需求。",
        key_activities=[
            "Problem Statement & Business Case",
            "Voice of Customer (VOC) Analysis",
            "Project Charter",
            "SIPOC Diagram",
            "CTQ Tree",
        ],
        key_activities_zh=[
            "问题陈述与商业论证",
            "客户之声(VOC)分析",
            "项目章程",
            "SIPOC图",
            "CTQ树",
        ],
        ai_enhancements=[
            AIEnhancement(
                tool="AI-VOC Analyzer",
                description="NLP-based customer feedback clustering and sentiment analysis",
                description_zh="基于NLP的客户反馈聚类与情感分析",
            ),
            AIEnhancement(
                tool="AI-Scoping Assistant",
                description="Auto-generate project scope from historical data patterns",
                description_zh="从历史数据模式自动生成项目范围建议",
            ),
        ],
        deliverables=["Project Charter", "SIPOC", "CTQ Matrix"],
        deliverables_zh=["项目章程", "SIPOC图", "CTQ矩阵"],
    ),
    DMAICPhase(
        id="measure",
        name="Measure",
        name_zh="测量",
        description="Measure the current process performance and collect relevant data.",
        description_zh="测量当前过程绩效并收集相关数据。",
        key_activities=[
            "Data Collection Plan",
            "Measurement System Analysis (MSA)",
            "Process Capability (Cp/Cpk)",
            "Baseline Sigma Level",
            "Value Stream Mapping",
        ],
        key_activities_zh=[
            "数据收集计划",
            "测量系统分析(MSA)",
            "过程能力分析(Cp/Cpk)",
            "基线Sigma水平",
            "价值流图",
        ],
        ai_enhancements=[
            AIEnhancement(
                tool="AI-MSA",
                description="Automated Gage R&R with intelligent component variance decomposition",
                description_zh="自动化GRR分析，智能方差分解",
            ),
            AIEnhancement(
                tool="AI-SPC",
                description="Smart control chart selection and automated rule checking",
                description_zh="智能控制图选择与自动规则检查",
            ),
        ],
        deliverables=["Data Collection Plan", "MSA Report", "Process Capability Report"],
        deliverables_zh=["数据收集计划", "MSA报告", "过程能力报告"],
    ),
    DMAICPhase(
        id="analyze",
        name="Analyze",
        name_zh="分析",
        description="Analyze data to identify root causes of defects and variation.",
        description_zh="分析数据以识别缺陷和变异的根本原因。",
        key_activities=[
            "Hypothesis Testing",
            "Regression Analysis",
            "ANOVA",
            "Root Cause Analysis (Fishbone/5-Why)",
            "Failure Mode Analysis (FMEA)",
        ],
        key_activities_zh=[
            "假设检验",
            "回归分析",
            "方差分析(ANOVA)",
            "根本原因分析(鱼骨图/5-Why)",
            "失效模式分析(FMEA)",
        ],
        ai_enhancements=[
            AIEnhancement(
                tool="AI-RCA",
                description="ML-powered root cause identification from multivariate data",
                description_zh="基于机器学习的多变量数据根因识别",
            ),
            AIEnhancement(
                tool="AI-Hypothesis",
                description="Automated test selection and plain-language interpretation",
                description_zh="自动检验方法选择与自然语言解读",
            ),
        ],
        deliverables=["Root Cause Verification", "Statistical Analysis Report"],
        deliverables_zh=["根因验证", "统计分析报告"],
    ),
    DMAICPhase(
        id="improve",
        name="Improve",
        name_zh="改进",
        description="Develop and implement solutions to address root causes.",
        description_zh="制定并实施解决方案以消除根本原因。",
        key_activities=[
            "Design of Experiments (DOE)",
            "Solution Selection Matrix",
            "Pilot Testing",
            "Implementation Plan",
            "Risk Assessment (FMEA)",
        ],
        key_activities_zh=[
            "实验设计(DOE)",
            "方案选择矩阵",
            "试点测试",
            "实施计划",
            "风险评估(FMEA)",
        ],
        ai_enhancements=[
            AIEnhancement(
                tool="AI-DOE",
                description="Optimal experimental design with factor screening and response prediction",
                description_zh="最优实验设计，因子筛选与响应预测",
            ),
            AIEnhancement(
                tool="AI-Simulation",
                description="Monte Carlo simulation for solution robustness validation",
                description_zh="蒙特卡洛仿真验证方案鲁棒性",
            ),
        ],
        deliverables=["DOE Results", "Pilot Report", "Implementation Plan"],
        deliverables_zh=["DOE结果", "试点报告", "实施计划"],
    ),
    DMAICPhase(
        id="control",
        name="Control",
        name_zh="控制",
        description="Sustain the improvements with monitoring and control systems.",
        description_zh="通过监控和控制系统维持改进成果。",
        key_activities=[
            "Control Plan",
            "SPC Monitoring",
            "Standard Operating Procedures",
            "Training & Knowledge Transfer",
            "Project Closure & Benefits Tracking",
        ],
        key_activities_zh=[
            "控制计划",
            "SPC监控",
            "标准操作程序",
            "培训与知识转移",
            "项目结项与收益追踪",
        ],
        ai_enhancements=[
            AIEnhancement(
                tool="AI-SPC Monitor",
                description="Real-time anomaly detection with predictive drift alerts",
                description_zh="实时异常检测与预测性漂移预警",
            ),
            AIEnhancement(
                tool="AI-Control Plan",
                description="Auto-generated control plans from project learnings",
                description_zh="从项目经验自动生成控制计划",
            ),
        ],
        deliverables=["Control Plan", "SPC Dashboard", "Training Materials"],
        deliverables_zh=["控制计划", "SPC仪表盘", "培训材料"],
    ),
]


@router.get("/dmaic", response_model=list[DMAICPhase])
async def get_dmaic_phases():
    """Get all DMAIC phases with AI enhancement details."""
    return DMAIC_PHASES


@router.get("/dmaic/{phase_id}", response_model=DMAICPhase)
async def get_dmaic_phase(phase_id: str):
    """Get a specific DMAIC phase."""
    for phase in DMAIC_PHASES:
        if phase.id == phase_id:
            return phase
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Phase '{phase_id}' not found")
