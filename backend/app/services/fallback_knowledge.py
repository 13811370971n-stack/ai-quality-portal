"""
Fallback Knowledge Base for AI Quality Tools
Used when DeepSeek API is unavailable.
Provides pre-built templates for common manufacturing quality issues.
"""

# 6M categories with common causes for manufacturing
FISHBONE_6M_TEMPLATES = {
    "通用制造问题": {
        "人 (Man)": ["操作技能不足", "培训不到位", "注意力不集中", "违反操作规程"],
        "机 (Machine)": ["设备磨损", "维护不及时", "参数设置不当", "设备精度下降"],
        "料 (Material)": ["来料质量波动", "材料批次差异", "储存条件不当", "供应商变更"],
        "法 (Method)": ["工艺规程不完善", "检验标准不明确", "操作步骤遗漏", "变更管理不到位"],
        "环 (Environment)": ["温湿度变化", "洁净度不达标", "照明不足", "振动干扰"],
        "测 (Measurement)": ["测量设备误差", "检验频次不够", "判定标准模糊", "测量方法不当"],
    },
    "表面缺陷": {
        "人 (Man)": ["操作力度不均", "搬运不当", "手套污染", "经验不足"],
        "机 (Machine)": ["模具磨损", "刀具钝化", "传送带异物", "夹具松动"],
        "料 (Material)": ["材料硬度不均", "表面预处理不良", "涂层附着力差", "原料杂质"],
        "法 (Method)": ["抛光工艺不当", "清洗流程缺失", "防护措施不足", "包装设计不合理"],
        "环 (Environment)": ["粉尘污染", "湿度导致氧化", "温度引起变形", "静电吸附"],
        "测 (Measurement)": ["目检标准不统一", "光源角度影响", "检测设备灵敏度", "抽检比例不足"],
    },
    "尺寸超差": {
        "人 (Man)": ["测量读数错误", "装夹方式不正确", "操作顺序错误", "疲劳导致失误"],
        "机 (Machine)": ["主轴跳动", "导轨磨损", "热变形", "刀具补偿错误"],
        "料 (Material)": ["毛坯尺寸波动", "材料热膨胀系数", "硬度不均匀", "内应力释放"],
        "法 (Method)": ["加工余量不合理", "走刀路径不优", "冷却方式不当", "基准选择错误"],
        "环 (Environment)": ["温度变化导致热胀冷缩", "振动影响加工精度", "湿度影响量具", "气压变化"],
        "测 (Measurement)": ["量具精度不够", "测量点位置不当", "温度补偿缺失", "重复性差"],
    },
    "焊接缺陷": {
        "人 (Man)": ["焊接速度不稳定", "焊枪角度不正确", "操作经验不足", "未预热"],
        "机 (Machine)": ["焊机电流不稳", "送丝速度异常", "保护气流量不足", "电极磨损"],
        "料 (Material)": ["焊丝型号不匹配", "母材含碳量高", "油污未清除", "焊剂受潮"],
        "法 (Method)": ["焊接顺序不当", "层间温度过高", "坡口设计不合理", "焊接参数未优化"],
        "环 (Environment)": ["风速过大影响保护气", "环境温度过低", "湿度导致氢脆", "磁偏吹"],
        "测 (Measurement)": ["无损检测覆盖不全", "目视检查标准不清", "焊缝尺寸测量偏差", "缺陷等级判定模糊"],
    },
    "电子产品故障": {
        "人 (Man)": ["焊接温度控制不当", "ESD防护不到位", "元件方向插错", "清洗不彻底"],
        "机 (Machine)": ["回流焊温度曲线偏移", "贴片机精度下降", "AOI误判率高", "锡膏印刷偏移"],
        "料 (Material)": ["元件批次不良", "PCB板翘曲", "锡膏过期", "引脚氧化"],
        "法 (Method)": ["工艺窗口过窄", "测试覆盖率不足", "返工流程不规范", "BOM版本错误"],
        "环 (Environment)": ["静电损伤", "温湿度超标", "洁净度不达标", "存储条件不当"],
        "测 (Measurement)": ["ICT覆盖不全", "功能测试用例不足", "老化时间不够", "测试夹具磨损"],
    },
}

# Generic guiding questions for 5 Whys
FIVE_WHYS_GUIDES = {
    "人": "这个问题是否与人员的技能、培训、经验、注意力或工作量有关？",
    "机": "这个问题是否与设备的状态、维护、参数设置或能力有关？",
    "料": "这个问题是否与材料的质量、规格、来源或储存有关？",
    "法": "这个问题是否与工艺方法、标准流程、变更管理有关？",
    "环": "这个问题是否与工作环境（温度、湿度、洁净度、布局）有关？",
    "测": "这个问题是否与测量方法、检测设备或判定标准有关？",
    "管理": "这个问题是否与管理体系、制度、资源配置或沟通有关？",
}

# Common corrective action categories
CORRECTIVE_ACTIONS = {
    "培训": "制定专项培训计划，确保相关人员掌握正确操作方法",
    "标准化": "更新/建立标准操作程序(SOP)，明确每一步的要求和判定标准",
    "防错": "设计防错装置(Poka-Yoke)，从物理上防止错误发生",
    "维护": "建立/完善预防性维护(PM)计划，定期检查和更换易损件",
    "检验": "增加过程检验点，缩小检验频次，提前发现异常",
    "供应商": "加强供应商管理，明确来料验收标准，必要时更换供应商",
    "设备": "维修/升级/更换设备，恢复或提升设备能力",
    "环境": "改善工作环境条件，增加监控和预警",
}


def get_fishbone_fallback(problem: str) -> dict:
    """Return a fallback fishbone template based on keyword matching."""
    problem_lower = problem.lower()
    
    if any(kw in problem_lower for kw in ["划伤", "表面", "外观", "涂层", "抛光"]):
        template = FISHBONE_6M_TEMPLATES["表面缺陷"]
    elif any(kw in problem_lower for kw in ["尺寸", "公差", "超差", "精度", "加工"]):
        template = FISHBONE_6M_TEMPLATES["尺寸超差"]
    elif any(kw in problem_lower for kw in ["焊接", "虚焊", "焊缝", "焊点"]):
        template = FISHBONE_6M_TEMPLATES["焊接缺陷"]
    elif any(kw in problem_lower for kw in ["电子", "电路", "PCB", "贴片", "焊锡"]):
        template = FISHBONE_6M_TEMPLATES["电子产品故障"]
    else:
        template = FISHBONE_6M_TEMPLATES["通用制造问题"]
    
    categories = []
    for cat_name, causes in template.items():
        categories.append({
            "name": cat_name,
            "causes": [{"text": c, "subCauses": []} for c in causes],
        })
    
    return {"categories": categories, "source": "fallback_knowledge_base"}


def get_five_whys_fallback(problem: str) -> dict:
    """Return generic guiding questions for 5 Whys."""
    return {
        "suggestion": "请思考这个问题最直接的原因是什么 — 是人、机、料、法、环还是测方面的问题？",
        "guides": FIVE_WHYS_GUIDES,
        "branches": [
            {"direction": "人员/技能方面", "hint": "操作人员的能力、培训或工作状态是否有问题？"},
            {"direction": "设备/工具方面", "hint": "相关设备或工具的状态、精度是否异常？"},
            {"direction": "方法/流程方面", "hint": "现有流程、标准或方法是否存在缺陷？"},
        ],
        "source": "fallback_knowledge_base",
    }
