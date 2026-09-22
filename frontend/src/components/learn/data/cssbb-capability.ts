/**
 * CSSBB 备考 · 垂直切片：过程能力（Process Capability）
 *
 * 知识骨架来源：ASQ CSSBB BoK 条目编号 V.F.1–V.F.7，页码对应 CSSBB Primer (2014) p633–667。
 * 骨架（考点清单/层级/页码）属事实性索引；讲解、速查卡、练习题均为原创撰写。
 * 所有计算已用 Python 逐题验算（见 verify_capability.py），calcVerified 标记为已核对。
 */

export type CognitiveLevel = 'remember' | 'understand' | 'apply' | 'analyze';
export type Priority = 'must' | 'should' | 'skim';

export interface CSSBBTopic {
  bokCode: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  primerPages: [number, number];
  pages: number;
  cognitiveLevel: CognitiveLevel;
  /** 预估题数：基于本章约 5 题总量按考频判断分摊，非精确值 */
  estExamQ: number;
  priority: Priority;
  toolPath?: string;
  summary: string;
  keyPoints: string[];
}

export interface QuickRef {
  id: string;
  bokCode: string;
  kind: 'formula' | 'criterion' | 'contrast' | 'decision';
  keyword: string;
  primerPage: number;
  lines: string[];
  /** 为什么值得放进速查表 */
  why?: string;
}

export interface PracticeQuestion {
  id: string;
  bokCode: string;
  scenario: string;
  stem: string;
  options: { key: string; text: string }[];
  answer: string;
  workings: string[];
  trap: string;
  calcVerified: boolean;
  toolPath?: string;
}

/** 本切片在考试中的位置 */
export const sliceMeta = {
  section: 'VII. MEASURE - STATISTICS',
  sectionBokCode: 'V. Measure',
  subsection: 'PROCESS CAPABILITY',
  primerPages: [633, 667] as [number, number],
  pages: 35,
  /** Measure-Statistics 整章 14 题 / 101 页，本节 35 页 → 约 5 题 */
  estExamQ: 5,
  sectionExamQ: 14,
  sectionPages: 101,
  openBook: true,
  note: '开卷考试。本节公式密集但可查，真正的区分点是「选对指标」和「算得快」。',
};

export const topics: CSSBBTopic[] = [
  {
    bokCode: 'V.F.3',
    slug: 'capability-studies',
    titleEn: 'Capability Studies',
    titleZh: '能力研究',
    primerPages: [633, 645],
    pages: 13,
    cognitiveLevel: 'apply',
    estExamQ: 1.0,
    priority: 'must',
    toolPath: '/tools/quality-toolbox/workshop/process-capability',
    summary:
      '能力研究是后面所有指标的前提。核心是三件事：过程必须先处于统计受控状态，数据要通过正态性检验，样本量要足够。三者任一不满足，算出来的 Cp/Cpk 都没有意义。',
    keyPoints: [
      '前提顺序不可颠倒：先稳态 → 再正态 → 才算能力。不稳定的过程算能力是无效的',
      'Z 值是连接「过程分布」与「不良率」的桥梁：Z =(x − μ)/σ，查表得超出规格的比例',
      '自然公差（6σ，过程说话）与规格公差（USL−LSL，客户说话）是两个不同概念，能力指数就是二者之比',
      '典型样本量要求：至少 25 组子组、总计 100 点以上，样本不足时置信区间很宽',
    ],
  },
  {
    bokCode: 'V.F.1',
    slug: 'capability-indices',
    titleEn: 'Capability Indices',
    titleZh: '能力指数 Cp / Cpk / Cpm / Cr',
    primerPages: [646, 651],
    pages: 6,
    cognitiveLevel: 'apply',
    estExamQ: 1.5,
    priority: 'must',
    toolPath: '/tools/quality-toolbox/workshop/process-capability',
    summary:
      '全章最高频考点。Cp 只看过程的「潜力」（宽度够不够），Cpk 同时看「实际表现」（有没有居中）。Cp 恒大于等于 Cpk，只有完全居中时二者相等。Cpm 进一步把偏离目标值也算进去。',
    keyPoints: [
      'Cp 衡量潜力，不管中心位置；Cpk 取上下侧较小者，反映实际风险',
      'Cp ≥ Cpk 永远成立。Cp 高而 Cpk 低 = 过程能力够但没对准，调中心即可，不必降变异',
      'Cr = 1/Cp 是能力比，方向相反：Cr 越小越好',
      'Cpm 用于有明确目标值 T 的场合，把 (μ−T) 计入分母，Cpk 不区分偏向哪一侧',
      '只有单侧规格时只能算 Cpu 或 Cpl，Cp 无定义',
    ],
  },
  {
    bokCode: 'V.F.2',
    slug: 'performance-indices',
    titleEn: 'Performance Indices',
    titleZh: '绩效指数 Pp / Ppk',
    primerPages: [652, 652],
    pages: 1,
    cognitiveLevel: 'apply',
    estExamQ: 0.5,
    priority: 'must',
    toolPath: '/tools/quality-toolbox/workshop/process-capability',
    summary:
      '公式与 Cp/Cpk 形式完全相同，唯一区别是分母用的标准差不同：能力指数用组内标准差（短期），绩效指数用整体标准差（长期）。这个区别是考试最爱设的陷阱。',
    keyPoints: [
      'Pp/Ppk 用整体标准差 s（所有数据一起算），包含了组间漂移',
      'Cp/Cpk 用组内标准差（由 R̄/d₂ 或 s̄/c₄ 估计），只反映瞬时变异',
      '通常 Cp > Pp。二者差距大 = 过程存在明显的组间漂移或趋势',
      'Cp/Pp 比值可当作「过程稳定性」的粗略指标',
    ],
  },
  {
    bokCode: 'V.F.7',
    slug: 'short-long-term',
    titleEn: 'Short & Long Term Capability',
    titleZh: '短期与长期能力',
    primerPages: [653, 653],
    pages: 1,
    cognitiveLevel: 'understand',
    estExamQ: 0.5,
    priority: 'must',
    summary:
      '只有一页，但概念区分是高频考点。短期能力反映过程「最好能做到什么」，长期能力反映「实际交付了什么」。二者用 1.5σ 偏移这个经验值连接。',
    keyPoints: [
      'Zlt = Zst − 1.5。这个 1.5 是经验约定，不是推导结果',
      '「6 西格玛水平」指的是 Zst = 6，对应 Zlt = 4.5，单侧不良 3.4 DPMO',
      '短期数据来自连续、同一批、同一设定；长期数据跨班次、跨批次、跨换型',
      '报告能力时必须说明是短期还是长期，否则数字无法比较',
    ],
  },
  {
    bokCode: 'V.F.5',
    slug: 'non-normal-data',
    titleEn: 'Non-Normal Data',
    titleZh: '非正态数据的能力分析',
    primerPages: [654, 658],
    pages: 5,
    cognitiveLevel: 'apply',
    estExamQ: 0.3,
    priority: 'should',
    toolPath: '/tools/quality-toolbox/workshop/normal-plot',
    summary:
      '正态假设不成立时，直接套 Cp/Cpk 会严重误判。两条出路：把数据变换成正态（Box-Cox 等）后再算，或者改用基于实际分布百分位的方法。',
    keyPoints: [
      '先用概率图或正态性检验判断，不要凭直觉',
      'Box-Cox 通过 λ 搜索最佳变换；λ=0 即取对数，λ=0.5 即开平方，λ=1 表示无需变换',
      '变换后规格限也必须做同样的变换，这一步最容易漏',
      '寿命、时间、浓度这类天然右偏的数据，常见需要对数变换',
    ],
  },
  {
    bokCode: 'V.F.4',
    slug: 'attribute-data',
    titleEn: 'Attribute Data Capability',
    titleZh: '计数型数据的能力',
    primerPages: [659, 659],
    pages: 1,
    cognitiveLevel: 'understand',
    estExamQ: 0.2,
    priority: 'should',
    summary:
      '计数型数据没有标准差的概念，所以没有 Cp/Cpk。能力用不良率本身表达：PPM、DPMO，或换算成等效 Z 值 / 西格玛水平。',
    keyPoints: [
      '计数型数据不要计算 Cpk，这是常见的概念性错误',
      '用 p̄（不良品率）或 ū（单位缺陷数）作为能力基础',
      '可把不良率反查标准正态表得到等效 Z 值，从而与计量型结果对话',
      '前提同样是过程受控：p 图 / np 图 / u 图 / c 图 先判稳定',
    ],
  },
  {
    bokCode: 'V.F.6',
    slug: 'performance-metrics',
    titleEn: 'Performance Metrics',
    titleZh: '绩效度量 DPU / DPMO / RTY',
    primerPages: [660, 667],
    pages: 8,
    cognitiveLevel: 'apply',
    estExamQ: 1.5,
    priority: 'must',
    summary:
      '计算密集的高频考点，也是最容易算错的地方。核心是分清三个分母：DPU 除以单位数，DPO 除以总机会数，RTY 是各工序良率的连乘而不是平均。',
    keyPoints: [
      'DPU = 缺陷数 / 单位数；DPO = 缺陷数 /(单位数 × 每单位机会数)；DPMO = DPO × 10⁶',
      '「机会数」必须由题目给出或明确定义，它决定 DPO 的分母',
      'Y = e^(−DPU) 把缺陷数与良率连接起来，反过来 DPU = −ln(Y)',
      'RTY 是各工序良率连乘，恒小于任何单工序良率，也远小于平均良率',
      'TDPU = −ln(RTY)，可用来反算整条线的总缺陷水平',
    ],
  },
];

export const quickRefs: QuickRef[] = [
  {
    id: 'qr-cp-family',
    bokCode: 'V.F.1',
    kind: 'formula',
    keyword: 'Cp / Cpk / Cr / k',
    primerPage: 648,
    lines: [
      'Cp  = (USL − LSL) / (6σ_within)',
      'Cpu = (USL − X̄) / (3σ_within)',
      'Cpl = (X̄ − LSL) / (3σ_within)',
      'Cpk = min(Cpu, Cpl)',
      'Cr  = 1 / Cp',
      'k   = |X̄ − M| / ((USL − LSL)/2)     M = 规格中心',
      'Cpk = Cp × (1 − k)                   ← 可用来快速交叉验算',
    ],
    why: '最后一行是考场上的验算利器：算完 Cp 和 k 就能反推 Cpk，两条路对得上才放心。',
  },
  {
    id: 'qr-pp-family',
    bokCode: 'V.F.2',
    kind: 'formula',
    keyword: 'Pp / Ppk',
    primerPage: 652,
    lines: [
      'Pp  = (USL − LSL) / (6s_overall)',
      'Ppu = (USL − X̄) / (3s_overall)',
      'Ppl = (X̄ − LSL) / (3s_overall)',
      'Ppk = min(Ppu, Ppl)',
      '',
      '形式与 Cp/Cpk 完全一致，只换分母的标准差',
    ],
  },
  {
    id: 'qr-sigma-est',
    bokCode: 'V.F.3',
    kind: 'formula',
    keyword: '组内标准差的估计',
    primerPage: 640,
    lines: [
      'σ_within ≈ R̄ / d₂        （用极差，子组容量 n 查 d₂）',
      'σ_within ≈ s̄ / c₄        （用标准差，查 c₄）',
      'σ_within ≈ MR̄ / 1.128    （单值移动极差，n=2 时 d₂=1.128）',
      '',
      's_overall = 全部数据一起算的样本标准差',
    ],
    why: 'd₂ 与 c₄ 必须查表，考场要能快速定位系数表的页码。',
  },
  {
    id: 'qr-z-dpmo',
    bokCode: 'V.F.3',
    kind: 'formula',
    keyword: 'Z 值 ↔ 不良率 ↔ DPMO',
    primerPage: 636,
    lines: [
      'Z = (x − μ) / σ',
      '单侧不良率 = P(Z > z)  查标准正态表',
      'DPMO = 单侧不良率 × 10⁶',
      '',
      '常用锚点（单侧）：',
      '  Z=3.0 → 1,350 DPMO      Z=3.5 → 233 DPMO',
      '  Z=4.0 →    32 DPMO      Z=4.5 → 3.4 DPMO',
      '  Z=6.0 →  0.001 DPMO',
    ],
    why: '记住 Z=4.5 对应 3.4 DPMO 这一个锚点，就能推出「6 西格玛」的由来。',
  },
  {
    id: 'qr-cpk-dpmo',
    bokCode: 'V.F.1',
    kind: 'formula',
    keyword: 'Cpk → DPMO 换算',
    primerPage: 649,
    lines: [
      'Z = 3 × Cpk  （Cpk 对应的是单侧）',
      '',
      '  Cpk 1.00 → Z 3.00 → 单侧 1,350 DPMO  双侧 2,700',
      '  Cpk 1.33 → Z 3.99 → 单侧    33 DPMO  双侧    66',
      '  Cpk 1.67 → Z 5.01 → 单侧  0.27 DPMO  双侧  0.54',
      '  Cpk 2.00 → Z 6.00 → 单侧 0.001 DPMO',
    ],
    why: '双侧只在过程居中时才可近似为单侧的两倍。题目若明确偏心，别乘 2。',
  },
  {
    id: 'qr-dpu-dpmo',
    bokCode: 'V.F.6',
    kind: 'formula',
    keyword: 'DPU / DPO / DPMO / 良率',
    primerPage: 661,
    lines: [
      'DPU  = D / U                      缺陷数 / 单位数',
      'DPO  = D / (U × O)                O = 每单位机会数',
      'DPMO = DPO × 10⁶',
      'TO   = U × O                      总机会数',
      '',
      'Y = FPY = e^(−DPU)                首次通过率',
      'DPU = −ln(Y)                      反向',
    ],
    why: '三个指标三个分母。考试最常见的错就是拿 DPU 直接乘 10⁶ 当 DPMO。',
  },
  {
    id: 'qr-rty',
    bokCode: 'V.F.6',
    kind: 'formula',
    keyword: 'RTY 滚动通过率',
    primerPage: 664,
    lines: [
      'RTY = Y₁ × Y₂ × … × Yₙ            各工序良率连乘',
      'TDPU = −ln(RTY)',
      '',
      '若各工序良率相同为 Y：RTY = Yⁿ',
      'RTY 恒小于最小的单工序良率',
    ],
    why: 'RTY 不是平均良率。4 道 97.5% 平均的工序，实际 RTY 可能只有 90%。',
  },
  {
    id: 'qr-shift',
    bokCode: 'V.F.7',
    kind: 'formula',
    keyword: '1.5σ 偏移',
    primerPage: 653,
    lines: [
      'Zlt = Zst − 1.5',
      'Zst = Zlt + 1.5',
      '',
      '「6 西格玛水平」= Zst 6 → Zlt 4.5 → 3.4 DPMO',
      '1.5 是经验约定，不是数学推导结果',
    ],
  },
  {
    id: 'qr-cpk-criteria',
    bokCode: 'V.F.1',
    kind: 'criterion',
    keyword: 'Cp / Cpk 判定标准',
    primerPage: 647,
    lines: [
      'Cp < 1.00     不合格，必然产生超差',
      'Cp 1.00–1.33  需严格控制才能维持',
      'Cp ≥ 1.33     一般行业通用的可接受下限',
      'Cp ≥ 1.67     汽车行业新过程常见要求',
      'Cp ≥ 2.00     对应 6 西格玛水平',
      '',
      'Cr 方向相反：Cr 0.75–1.00 对应 Cp 1.00–1.33',
    ],
    why: '注意题目问的是 Cp 还是 Cr，两者判定方向相反。',
  },
  {
    id: 'qr-prereq',
    bokCode: 'V.F.3',
    kind: 'criterion',
    keyword: '能力研究前提检查',
    primerPage: 634,
    lines: [
      '1. 过程处于统计受控状态（控制图无失控信号）',
      '2. 数据通过正态性检验（或已适当变换）',
      '3. 样本量足够（常见要求 ≥25 子组 / ≥100 点）',
      '4. 测量系统已通过 MSA（GR&R 合格）',
      '',
      '任一不满足 → 能力指数无效',
    ],
    why: '第 4 条最常被忽略：量具不合格时，算出的变异里混着测量误差。',
  },
  {
    id: 'qr-cp-vs-cpk',
    bokCode: 'V.F.1',
    kind: 'contrast',
    keyword: '易混：Cp vs Cpk',
    primerPage: 648,
    lines: [
      'Cp  只看分布宽度够不够，不管中心在哪 → 「潜力」',
      'Cpk 取较差的一侧，反映真实风险     → 「表现」',
      '',
      'Cp 高 + Cpk 低  → 偏心，调中心即可（成本低）',
      'Cp 低 + Cpk 低  → 变异太大，须降变异（成本高）',
      'Cp = Cpk        → 完全居中',
    ],
    why: '这个区分直接决定改进方向：调中心还是降变异，两者代价差很多。',
  },
  {
    id: 'qr-cpk-vs-ppk',
    bokCode: 'V.F.2',
    kind: 'contrast',
    keyword: '易混：Cpk vs Ppk',
    primerPage: 652,
    lines: [
      'Cpk  用组内 σ（R̄/d₂）  → 短期 / 潜在能力',
      'Ppk  用整体 s          → 长期 / 实际绩效',
      '',
      '通常 Cpk > Ppk',
      '差距大 = 存在组间漂移（换批、换班、刀具磨损、温漂）',
    ],
    why: '题目给「组内标准差」还是「整体标准差」是判别信号，读题先找这个词。',
  },
  {
    id: 'qr-dpu-vs-dpo',
    bokCode: 'V.F.6',
    kind: 'contrast',
    keyword: '易混：DPU vs DPO vs DPMO',
    primerPage: 661,
    lines: [
      'DPU  分母 = 单位数 U            单位：每件多少缺陷',
      'DPO  分母 = U × O（总机会数）   单位：每个机会的缺陷概率',
      'DPMO = DPO × 10⁶               DPO 换算到百万机会',
      '',
      '错误做法：DPU × 10⁶ 当作 DPMO',
      '只有 O = 1 时二者才相等',
    ],
    why: '本节最高频的计算失分点。读题先圈出「机会数」。',
  },
  {
    id: 'qr-rty-vs-avg',
    bokCode: 'V.F.6',
    kind: 'contrast',
    keyword: '易混：RTY vs 平均良率',
    primerPage: 664,
    lines: [
      'RTY  = 连乘   0.98×0.96×0.99×0.97 = 90.35%',
      '平均  = 算术平均                  = 97.50%',
      '',
      '差 7.15 个百分点 —— 工序越多差距越大',
      'RTY 才是客户实际感受到的一次通过率',
    ],
  },
  {
    id: 'qr-attr-vs-var',
    bokCode: 'V.F.4',
    kind: 'decision',
    keyword: '决策：该用哪个能力指标',
    primerPage: 659,
    lines: [
      '数据是计量型（连续）吗？',
      '├─ 是 → 正态吗？',
      '│       ├─ 是 → Cp/Cpk（短期）· Pp/Ppk（长期）',
      '│       └─ 否 → Box-Cox 变换后再算，或用百分位法',
      '└─ 否（计数型）→ 不算 Cpk',
      '                 用 PPM / DPMO，或换算等效 Z 值',
    ],
  },
  {
    id: 'qr-nonnormal-flow',
    bokCode: 'V.F.5',
    kind: 'decision',
    keyword: '决策：非正态数据处理',
    primerPage: 655,
    lines: [
      '1. 概率图 / 正态性检验',
      '2. 不正态 → 判断是否可变换',
      '3. Box-Cox 搜索 λ',
      '     λ=−1 取倒数   λ=0 取对数   λ=0.5 开平方   λ=1 无需变换',
      '4. 变换数据，同时变换规格限  ← 最易漏',
      '5. 在变换空间计算能力指数',
    ],
  },
];

export const questions: PracticeQuestion[] = [
  {
    id: 'q-cap-01',
    bokCode: 'V.F.1',
    scenario: '发动机曲轴轴颈磨削工序',
    stem:
      '某曲轴轴颈直径规格为 50.00 ± 0.05 mm。抽取 25 个子组共 125 件，由极差法估得组内标准差 σ = 0.012 mm，过程均值 X̄ = 50.01 mm。该过程的 Cp 与 Cpk 分别约为多少？',
    options: [
      { key: 'A', text: 'Cp = 1.39，Cpk = 1.39' },
      { key: 'B', text: 'Cp = 1.39，Cpk = 1.11' },
      { key: 'C', text: 'Cp = 1.11，Cpk = 1.39' },
      { key: 'D', text: 'Cp = 1.67，Cpk = 1.11' },
    ],
    answer: 'B',
    workings: [
      'USL = 50.05，LSL = 49.95，规格宽度 = 0.10',
      'Cp  = 0.10 / (6 × 0.012) = 0.10 / 0.072 = 1.3889 ≈ 1.39',
      'Cpu = (50.05 − 50.01) / (3 × 0.012) = 0.04 / 0.036 = 1.1111',
      'Cpl = (50.01 − 49.95) / (3 × 0.012) = 0.06 / 0.036 = 1.6667',
      'Cpk = min(1.1111, 1.6667) = 1.11',
      '交叉验算：k = |50.01 − 50.00| / 0.05 = 0.20，Cpk = Cp(1−k) = 1.3889 × 0.8 = 1.1111 ✓',
    ],
    trap:
      'Cp 达到 1.39 看似合格，但 Cpk 只有 1.11 —— 问题不在变异而在偏心。改进方向是把均值调回 50.00，而不是花大代价降低变异。选 A 的人忘了过程并未居中。',
    calcVerified: true,
    toolPath: '/tools/quality-toolbox/workshop/process-capability',
  },
  {
    id: 'q-cap-02',
    bokCode: 'V.F.2',
    scenario: '同一曲轴工序，三个月长期数据',
    stem:
      '延续上题。取三个月跨班次数据，整体标准差 s = 0.018 mm，均值仍为 50.01 mm。该过程的 Ppk 约为多少？此结果说明什么？',
    options: [
      { key: 'A', text: 'Ppk = 1.11，与 Cpk 一致，过程稳定' },
      { key: 'B', text: 'Ppk = 0.93，长期能力略有下降' },
      { key: 'C', text: 'Ppk = 0.74，存在显著组间漂移' },
      { key: 'D', text: 'Ppk = 1.67，长期表现优于短期' },
    ],
    answer: 'C',
    workings: [
      'Pp  = 0.10 / (6 × 0.018) = 0.9259',
      'Ppu = (50.05 − 50.01) / (3 × 0.018) = 0.04 / 0.054 = 0.7407',
      'Ppl = (50.01 − 49.95) / (3 × 0.018) = 0.06 / 0.054 = 1.1111',
      'Ppk = min = 0.7407 ≈ 0.74',
      'Cp / Pp = 1.3889 / 0.9259 = 1.50 → 组间变异贡献显著',
    ],
    trap:
      '0.93 是 Pp 不是 Ppk，选 B 的人漏了取上下侧最小值这一步。短期 Cpk = 1.11 勉强可用，长期 Ppk = 0.74 已不合格，差距来自换批与刀具磨损等组间因素——这正是 Cp/Cpk 与 Pp/Ppk 必须同时报告的原因。',
    calcVerified: true,
    toolPath: '/tools/quality-toolbox/workshop/process-capability',
  },
  {
    id: 'q-cap-03',
    bokCode: 'V.F.6',
    scenario: 'PCBA 板级 BGA 焊接',
    stem:
      '某批生产 500 块 PCBA，每块板有 1200 个 BGA 焊点，AOI 共检出 43 个焊接缺陷。该工序的 DPMO 约为多少？',
    options: [
      { key: 'A', text: '71.7' },
      { key: 'B', text: '86' },
      { key: 'C', text: '86,000' },
      { key: 'D', text: '35,833' },
    ],
    answer: 'A',
    workings: [
      '总机会数 TO = U × O = 500 × 1200 = 600,000',
      'DPO  = D / TO = 43 / 600,000 = 0.00007167',
      'DPMO = DPO × 10⁶ = 71.67 ≈ 71.7',
      '（另：DPU = 43 / 500 = 0.086，单位是每块板的缺陷数）',
    ],
    trap:
      'C 是把 DPU（0.086）直接乘 10⁶ 得到的，混淆了「每单位」和「每机会」两个分母 —— 这是本节最高频的失分点。读题时先圈出「每单位机会数 O」。B 把 DPU 放大 1000 倍，D 把机会数记成 600 块板。',
    calcVerified: true,
  },
  {
    id: 'q-cap-04',
    bokCode: 'V.F.6',
    scenario: '汽车五金件冲压—焊接—电镀—装配四工序线',
    stem:
      '某产线四道工序的一次通过率依次为 98%、96%、99%、97%。该产线的滚动通过率 RTY 及总缺陷数 TDPU 约为多少？',
    options: [
      { key: 'A', text: 'RTY = 97.5%，TDPU = 0.025' },
      { key: 'B', text: 'RTY = 90.3%，TDPU = 0.102' },
      { key: 'C', text: 'RTY = 96.0%，TDPU = 0.041' },
      { key: 'D', text: 'RTY = 90.3%，TDPU = 0.097' },
    ],
    answer: 'B',
    workings: [
      'RTY = 0.98 × 0.96 × 0.99 × 0.97',
      '    = 0.9800 → 0.9408 → 0.931392 → 0.903450',
      'RTY = 0.9035 = 90.35%',
      'TDPU = −ln(0.903450) = 0.10153 ≈ 0.102',
      '反向校验：e^(−0.10153) = 0.903450 ✓',
    ],
    trap:
      'A 取了算术平均 97.5%，比真实 RTY 高出 7.15 个百分点 —— 工序越多，这个误差越大。D 的 RTY 对但 TDPU 用了 1−RTY = 0.0965 近似，TDPU 必须用 −ln(RTY)。',
    calcVerified: true,
  },
  {
    id: 'q-cap-05',
    bokCode: 'V.F.7',
    scenario: '注塑件关键尺寸能力评估',
    stem:
      '某注塑过程短期能力评估得 Zst = 5.0。按六西格玛惯用的 1.5σ 偏移假设，其长期单侧 DPMO 约为多少？',
    options: [
      { key: 'A', text: '0.29' },
      { key: 'B', text: '3.4' },
      { key: 'C', text: '233' },
      { key: 'D', text: '1,350' },
    ],
    answer: 'C',
    workings: [
      'Zlt = Zst − 1.5 = 5.0 − 1.5 = 3.5',
      '单侧 P(Z > 3.5) = 0.00023263',
      'DPMO = 0.00023263 × 10⁶ = 232.6 ≈ 233',
      '对照：Zst = 6 → Zlt = 4.5 → 3.4 DPMO，即「六西格玛水平」的来源',
    ],
    trap:
      'A 是直接用 Zst = 5.0 算的，忘了做 1.5σ 偏移。B 是 Zlt = 4.5 的结果（对应 Zst = 6），D 是 Zlt = 3.0 的结果。这道题考的就是「报告能力必须声明短期还是长期」。',
    calcVerified: true,
  },
];

/** 学习顺序建议：不按 Primer 页码顺序，按依赖关系与考频 */
export const studyOrder = [
  { step: 1, bokCode: 'V.F.3', reason: 'Z 值与前提条件是后面一切的基础' },
  { step: 2, bokCode: 'V.F.1', reason: '最高频考点，Cp/Cpk 必须算到不假思索' },
  { step: 3, bokCode: 'V.F.2', reason: '与 V.F.1 成对出现，重点在分母的区别' },
  { step: 4, bokCode: 'V.F.7', reason: '只有一页，但把短期/长期串起来' },
  { step: 5, bokCode: 'V.F.6', reason: '计算密集，独立成体系，需单独练熟' },
  { step: 6, bokCode: 'V.F.5', reason: '考频较低，理解流程即可' },
  { step: 7, bokCode: 'V.F.4', reason: '一页，记住「计数型不算 Cpk」这一条' },
];
