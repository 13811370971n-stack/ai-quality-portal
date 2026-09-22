/**
 * 讲义 · II 企业级部署 / I.A.1-a 六西格玛的价值与基础
 * 对应 CSSBB Primer (2014) p15–24
 *
 * 骨架与页码来自 Primer（事实性索引）；讲解文字为原创撰写。
 * 表格数值由 gen_deck_geometry.py 用 scipy 实算：
 *   3σ 短期双侧 2,700 PPM · 6σ 经 1.5σ 偏移 3.40 DPMO
 *   100 道工序：3σ 过程 RTY 76.31%，6σ 过程 99.97%
 */

export type SlideBlock =
  | { kind: 'text'; body: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'visual'; id: string; caption?: string }
  | { kind: 'formula'; lines: string[] }
  | { kind: 'table'; head: string[]; rows: string[][]; highlightRow?: number }
  | { kind: 'callout'; tone: 'insight' | 'warn' | 'note'; body: string }
  | { kind: 'steps'; items: { label: string; body: string }[] }
  | { kind: 'compare'; left: { title: string; items: string[] }; right: { title: string; items: string[] } };

export interface Checkpoint {
  q: string;
  options: { key: string; text: string }[];
  answer: string;
  why: string;
}

export interface Slide {
  n: number;
  title: string;
  subtitle?: string;
  primerPage?: number;
  blocks: SlideBlock[];
  takeaway?: string;
}

export const deckMeta = {
  slug: 'six-sigma-value',
  sectionCode: 'II',
  sectionTitleZh: '企业级部署',
  bokCode: 'I.A.1',
  titleZh: '六西格玛的价值与基础',
  titleEn: 'Value of Six Sigma / Foundations',
  primerPages: [15, 24] as [number, number],
  examPctOfSection: 8.0,
  sectionExamQ: 12,
  cognitiveLevel: 'understand' as const,
  estMinutes: 20,
  note: '本讲义是全部内容的逻辑起点：1.5σ 偏移与 3.4 DPMO 的来源在这里讲清，后面「测量·统计」的过程能力会直接用到。',
};

export const slides: Slide[] = [
  {
    n: 1,
    title: '一个反直觉的起点',
    subtitle: '质量与成本，究竟是什么关系',
    primerPage: 16,
    blocks: [
      {
        kind: 'text',
        body:
          '传统制造业的普遍认知是：质量越高，成本越高。想少出缺陷，就得多检验、多留余量、用更好的料。质量被当作成本项。',
      },
      {
        kind: 'callout',
        tone: 'insight',
        body:
          '六西格玛建立在相反的判断上：缺陷本身才是最大的成本。返工、报废、客户索赔、信誉损失，这些加起来远超预防投入。把缺陷降下来，成本跟着降。',
      },
      {
        kind: 'text',
        body:
          '这个判断决定了六西格玛不是一套质量工具，而是一套管理策略 —— 它要回答的是"改进哪里能赚最多钱"，而不只是"怎么把这个缺陷修掉"。',
      },
    ],
    takeaway: '六西格玛的前提假设：缺陷是成本，不是质量的代价。',
  },
  {
    n: 2,
    title: '摩托罗拉的起点',
    subtitle: '1984，Bill Smith 的良率理论',
    primerPage: 16,
    blocks: [
      {
        kind: 'steps',
        items: [
          {
            label: '1984',
            body: 'Bill Smith 在摩托罗拉提出良率理论：产品在出厂检验中发现的缺陷，与它在客户处的早期失效高度相关。换句话说，过程内的不良水平能预测市场表现。',
          },
          {
            label: '推论',
            body: '要降低客户端失效，不能靠加强出厂检验（那只是把缺陷挡住），必须降低过程本身产生缺陷的概率。',
          },
          {
            label: '执行',
            body: '时任董事长 Bob Galvin 把它上升为全公司战略，用统计工具识别并消除变异。六西格玛由此成形。',
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        body:
          '注意这条因果链的方向：不是"检验更严 → 质量更好"，而是"过程变异更小 → 缺陷更少 → 客户失效更少"。整个六西格玛方法论都建立在这个方向上。',
      },
    ],
    takeaway: '源头是一个实证发现：过程内不良水平可以预测客户端失效。',
  },
  {
    n: 3,
    title: '什么是"西格玛水平"',
    subtitle: '用标准差当尺子去量规格',
    primerPage: 17,
    blocks: [
      {
        kind: 'text',
        body:
          'σ（西格玛）是统计里的标准差，衡量过程的波动幅度。西格玛水平的想法很朴素：把规格的宽度用 σ 当尺子去量，看能放进几个 σ。',
      },
      { kind: 'formula', lines: ['西格玛水平 ≈ 规格中心到规格限的距离 ÷ σ'] },
      {
        kind: 'bullets',
        items: [
          '能放进的 σ 越多，说明过程相对规格越"宽松"，出界的概率越低',
          '同样的规格，过程波动越小（σ 越小），西格玛水平越高',
          '同样的过程，规格越宽松，西格玛水平也越高',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        body:
          '所以西格玛水平不是单纯的"过程有多好"，而是"过程相对于要求有多好"。脱离规格谈西格玛水平没有意义。',
      },
    ],
    takeaway: '西格玛水平 = 规格余量能容纳多少个标准差。',
  },
  {
    n: 4,
    title: '先看 3σ 过程有多差',
    subtitle: '规格恰好在 ±3σ 时会怎样',
    primerPage: 17,
    blocks: [
      {
        kind: 'text',
        body: '假设过程完美居中，规格限正好落在 ±3σ 的位置。超出规格的就是两侧尾部的面积。',
      },
      { kind: 'visual', id: 'threeSigma', caption: '图中每 1σ 宽度相同，规格宽度恰为 6σ' },
      {
        kind: 'text',
        body:
          '单侧尾部约 1,350 PPM，双侧合计约 2,700 PPM，也就是 0.27% 的不良率。看起来是个不错的数字 —— 99.73% 合格。',
      },
      {
        kind: 'callout',
        tone: 'warn',
        body:
          '但这个结论有两个隐含前提：过程永远居中，而且只有一道工序。两个前提都不成立，这是接下来两页要处理的问题。',
      },
    ],
    takeaway: '居中的 3σ 过程约 2,700 PPM 不良，但"居中"和"单工序"都是理想假设。',
  },
  {
    n: 5,
    title: '第一个前提不成立：过程会漂移',
    subtitle: '摩托罗拉的关键观察',
    primerPage: 17,
    blocks: [
      {
        kind: 'text',
        body:
          '摩托罗拉在复杂装配过程中发现：过程中心不会长期停在一个位置。刀具磨损、换批、温度变化、班次差异，会让均值随时间来回移动，幅度约 1.5σ。',
      },
      { kind: 'visual', id: 'shift', caption: '规格不动，分布中心右移 1.5σ' },
      {
        kind: 'text',
        body:
          '中心一旦右移 1.5σ，靠近 USL 的一侧只剩 1.5σ 余量，那一侧的不良率急剧上升；另一侧虽然变宽，但正态分布尾部是指数衰减的，减少的量远补不上增加的量。',
      },
      {
        kind: 'callout',
        tone: 'insight',
        body:
          '这就是短期能力和长期绩效必然有差距的物理原因。短期数据抓不到漂移，长期数据才包含它。',
      },
    ],
    takeaway: '过程中心会随时间漂移约 1.5σ，这是长期绩效差于短期能力的根源。',
  },
  {
    n: 6,
    title: '所以规格要留到 ±6σ',
    subtitle: '3.4 DPMO 是怎么算出来的',
    primerPage: 17,
    blocks: [
      {
        kind: 'text',
        body:
          '既然中心会漂 1.5σ，那么要让漂移之后仍然安全，就必须在设计时留出更多余量。如果规格设在 ±6σ：',
      },
      { kind: 'formula', lines: ['短期 Zst = 6', '漂移后 Zlt = 6 − 1.5 = 4.5', '单侧不良 P(Z > 4.5) → 3.4 DPMO'] },
      { kind: 'visual', id: 'sixSigma', caption: '漂移后近侧仍余 4.5σ' },
      {
        kind: 'callout',
        tone: 'note',
        body:
          '所谓"六西格玛水平"指的是短期 Zst = 6，对外宣称的 3.4 DPMO 其实是长期 Zlt = 4.5 的结果。两个数字描述同一件事的两端，考试常在这里设陷阱。',
      },
    ],
    takeaway: '六西格玛 = 短期 6σ，经 1.5σ 漂移后长期 4.5σ，对应 3.4 DPMO。',
  },
  {
    n: 7,
    title: '1.5 这个数字的性质',
    subtitle: '它是经验约定，不是推导结果',
    primerPage: 17,
    blocks: [
      {
        kind: 'text',
        body:
          '很多人以为 1.5σ 是某个公式算出来的。不是。它来自摩托罗拉对复杂装配过程的长期观测，是一个工程上的经验约定。',
      },
      {
        kind: 'bullets',
        items: [
          '不同行业、不同过程的实际漂移量并不都是 1.5σ',
          '用它是为了让"短期能力"和"长期绩效"之间有一个统一的换算口径，便于跨组织比较',
          '如果你有足够的长期数据，应该直接算实际的 Pp/Ppk，而不是用 1.5 去推',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        body:
          '考试中若问"1.5σ 偏移的依据"，正确方向是"基于经验观测的约定"，而不是"由中心极限定理导出"之类的说法。',
      },
    ],
    takeaway: '1.5σ 是经验约定，用于统一短期与长期的换算口径。',
  },
  {
    n: 8,
    title: '西格玛水平对照表',
    subtitle: '记住两个锚点就够',
    primerPage: 18,
    blocks: [
      {
        kind: 'table',
        head: ['短期 Zst', '长期 Zlt', '长期 DPMO', '长期良率'],
        rows: [
          ['2σ', '0.5', '308,538', '69.15%'],
          ['3σ', '1.5', '66,807', '93.32%'],
          ['4σ', '2.5', '6,210', '99.379%'],
          ['5σ', '3.5', '233', '99.977%'],
          ['6σ', '4.5', '3.4', '99.99966%'],
        ],
        highlightRow: 4,
      },
      {
        kind: 'callout',
        tone: 'insight',
        body:
          '不必背整张表。记住两个锚点：3σ 短期居中约 2,700 PPM；6σ 经漂移后 3.4 DPMO。中间的值考试给表或可由 Z 值查表得出 —— 而且这是开卷考。',
      },
      {
        kind: 'text',
        body:
          '注意表中"长期 DPMO"是单侧值。3σ 那一行的 66,807 与前面提到的 2,700 PPM 不矛盾：后者是短期居中的双侧值，前者是漂移 1.5σ 后的单侧值，口径不同。',
      },
    ],
    takeaway: '两个锚点：3σ 短期双侧 2,700 PPM；6σ 长期 3.4 DPMO。',
  },
  {
    n: 9,
    title: '第二个前提不成立：工序会串联',
    subtitle: '为什么 99.73% 其实很危险',
    primerPage: 19,
    blocks: [
      {
        kind: 'text',
        body:
          '单道工序 99.73% 听着不错。但产品要经过几十上百道工序，每道都可能出问题，总的一次通过率是各道良率的连乘。',
      },
      {
        kind: 'table',
        head: ['工序数', '3σ 过程的 RTY', '6σ 过程的 RTY'],
        rows: [
          ['1', '99.73%', '99.9997%'],
          ['10', '97.33%', '99.9966%'],
          ['50', '87.36%', '99.9830%'],
          ['100', '76.31%', '99.9660%'],
          ['500', '25.88%', '99.8303%'],
        ],
        highlightRow: 3,
      },
      {
        kind: 'callout',
        tone: 'insight',
        body:
          '100 道工序时，3σ 过程只有 76% 的产品能一次通过，近四分之一需要返工或报废。而 6σ 过程仍有 99.97%。这就是"3σ 不够用"的真正原因 —— 不是单工序不好，是串联起来会崩。',
      },
      {
        kind: 'text',
        body: '这也解释了为什么六西格玛诞生在电子制造业：工序多、串联长，衰减最明显。',
      },
    ],
    takeaway: '良率沿工序连乘衰减，工序越多，单工序的高良率越不足以保证整体。',
  },
  {
    n: 10,
    title: '六西格玛的三重含义',
    subtitle: '同一个词，三个层次',
    primerPage: 20,
    blocks: [
      {
        kind: 'steps',
        items: [
          {
            label: '一个度量',
            body: '西格玛水平，用来量化过程相对规格的表现。这是最狭义的用法，回答"现在多好"。',
          },
          {
            label: '一套方法论',
            body: 'DMAIC 五阶段的结构化改进流程，配套统计工具。回答"怎么变好"。',
          },
          {
            label: '一种管理策略',
            body: '以项目为载体、以财务收益为衡量、由高层驱动的组织能力建设。回答"为什么值得做"。',
          },
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        body:
          '很多组织推行失败，是因为只做了第一、二层 —— 培训了工具、做了项目，但没有第三层的高层驱动和财务闭环，项目做完无人跟进，收益无法确认。这一点在「领导力」和「组织障碍」两节会展开。',
      },
    ],
    takeaway: '六西格玛同时是度量、方法论和管理策略，缺第三层则难以持续。',
  },
  {
    n: 11,
    title: '它改变了哪些决策',
    subtitle: '从认知到行动',
    primerPage: 22,
    blocks: [
      {
        kind: 'compare',
        left: {
          title: '传统做法',
          items: [
            '出了问题加强检验',
            '按经验判断改哪里',
            '改进效果凭感觉确认',
            '质量是质量部门的事',
            '合格就行，在规格内就算好',
          ],
        },
        right: {
          title: '六西格玛做法',
          items: [
            '降低过程变异，而非加强筛选',
            '用数据定位关键影响因素',
            '用统计方法验证改进有效',
            '高层驱动、跨部门项目制',
            '向目标值靠拢，越靠近越好',
          ],
        },
      },
      {
        kind: 'callout',
        tone: 'insight',
        body:
          '最后一条是最容易被忽略、也最有分量的转变：传统思路认为在规格内就同样好（合格即可），六西格玛认为偏离目标值本身就有损失。这个观念后来由田口的损失函数正式化。',
      },
    ],
    takeaway: '核心转变：从"筛选出不良"到"减少变异"，从"合格即可"到"向目标值收敛"。',
  },
  {
    n: 12,
    title: '本讲小结',
    subtitle: '一条逻辑链',
    blocks: [
      {
        kind: 'steps',
        items: [
          { label: '1', body: '缺陷是成本，不是质量的代价 → 降缺陷可同时降成本' },
          { label: '2', body: '过程内不良能预测客户端失效 → 要治过程，不是治检验' },
          { label: '3', body: '西格玛水平 = 规格余量能放多少个 σ' },
          { label: '4', body: '过程中心会漂移约 1.5σ → 长期必然差于短期' },
          { label: '5', body: '规格留到 ±6σ，漂移后仍余 4.5σ → 3.4 DPMO' },
          { label: '6', body: '良率沿工序连乘衰减 → 工序多时 3σ 远远不够' },
          { label: '7', body: '六西格玛是度量 + 方法论 + 管理策略三层' },
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        body:
          '第 4、5 条会在「测量 · 统计」的过程能力一节直接复用：Cp/Cpk 用组内标准差算短期，Pp/Ppk 用整体标准差算长期，两者的差距正是这里讲的漂移。',
      },
    ],
    takeaway: '这七条是后续所有章节的共同底座。',
  },
];

export const checkpoints: Checkpoint[] = [
  {
    q: '「六西格玛水平对应 3.4 DPMO」这个说法中，3.4 DPMO 描述的是：',
    options: [
      { key: 'A', text: '短期 Zst = 6 时的双侧不良率' },
      { key: 'B', text: '长期 Zlt = 4.5 时的单侧不良率' },
      { key: 'C', text: '短期 Zst = 6 时的单侧不良率' },
      { key: 'D', text: '长期 Zlt = 6 时的双侧不良率' },
    ],
    answer: 'B',
    why:
      '「六西格玛」指短期能力 Zst = 6；经 1.5σ 漂移后长期 Zlt = 4.5，单侧 P(Z>4.5) 折算即 3.4 DPMO。选 C 的话短期单侧只有约 0.001 DPMO，远小于 3.4。',
  },
  {
    q: '关于 1.5σ 偏移，下列哪个说法正确？',
    options: [
      { key: 'A', text: '由中心极限定理推导得出' },
      { key: 'B', text: '所有过程的漂移量都是 1.5σ' },
      { key: 'C', text: '基于复杂装配过程长期观测的经验约定' },
      { key: 'D', text: '等于组内标准差与整体标准差之差' },
    ],
    answer: 'C',
    why:
      '1.5σ 来自摩托罗拉对复杂装配过程的观测，是为统一短期/长期换算口径而采用的经验值，并非数学推导，也不是所有过程的实际漂移量。有长期数据时应直接算 Pp/Ppk。',
  },
  {
    q: '某产品需经 100 道工序，每道工序均为居中的 3σ 过程。其滚动通过率最接近：',
    options: [
      { key: 'A', text: '99.73%' },
      { key: 'B', text: '97.3%' },
      { key: 'C', text: '76%' },
      { key: 'D', text: '27%' },
    ],
    answer: 'C',
    why:
      '单工序良率 0.9973，100 道连乘：0.9973^100 = 76.31%。选 A 的是把单工序良率当成了整体；良率必须连乘，不能取平均或直接沿用。',
  },
];
