/**
 * CSSBB 十大章节骨架 + 考试权重
 *
 * 权重与题数：CSSBB Primer (2014) 载明的考试构成（事实性数据）。
 * 页数与密度：由 Primer 书签目录页码范围计算得出（本站分析）。
 * density = 考试权重% / 页数占比%，>1 表示每页的考试价值高于平均。
 */

export interface CSSBBSection {
  code: string;
  bokCode: string;
  titleEn: string;
  titleZh: string;
  examPct: number;
  examQ: number;
  primerPages: [number, number];
  pages: number;
  pagePct: number;
  density: number;
  /** 已实现内容的子节点 */
  implemented?: { slug: string; titleZh: string; bokRange: string }[];
}

export const examMeta = {
  totalQ: 150,
  durationHours: 4,
  openBook: true,
  secondsPerQuestion: Math.round((4 * 3600) / 150),
  primerTotalPages: 1059,
  contentPages: 1034,
  source: 'CSSBB Primer (2014), Quality Council of Indiana',
};

export const sections: CSSBBSection[] = [
  {
    code: 'II',
    bokCode: 'I',
    titleEn: 'Enterprise-Wide Deployment',
    titleZh: '企业级部署',
    examPct: 8.0,
    examQ: 12,
    primerPages: [14, 120],
    pages: 107,
    pagePct: 10.3,
    density: 0.77,
  },
  {
    code: 'III',
    bokCode: 'II',
    titleEn: 'Process Management and Measures',
    titleZh: '流程管理与度量',
    examPct: 6.7,
    examQ: 10,
    primerPages: [121, 170],
    pages: 50,
    pagePct: 4.8,
    density: 1.39,
  },
  {
    code: 'IV',
    bokCode: 'III',
    titleEn: 'Team Management',
    titleZh: '团队管理',
    examPct: 12.0,
    examQ: 18,
    primerPages: [171, 306],
    pages: 136,
    pagePct: 13.2,
    density: 0.91,
  },
  {
    code: 'V',
    bokCode: 'IV',
    titleEn: 'Define',
    titleZh: '定义',
    examPct: 13.3,
    examQ: 20,
    primerPages: [307, 426],
    pages: 120,
    pagePct: 11.6,
    density: 1.15,
  },
  {
    code: 'VI',
    bokCode: 'V (1/2)',
    titleEn: 'Measure - Data',
    titleZh: '测量 · 数据',
    examPct: 7.3,
    examQ: 11,
    primerPages: [427, 570],
    pages: 144,
    pagePct: 13.9,
    density: 0.52,
  },
  {
    code: 'VII',
    bokCode: 'V (2/2)',
    titleEn: 'Measure - Statistics',
    titleZh: '测量 · 统计',
    examPct: 9.3,
    examQ: 14,
    primerPages: [571, 671],
    pages: 101,
    pagePct: 9.8,
    density: 0.95,
    implemented: [
      { slug: 'capability', titleZh: '过程能力', bokRange: 'V.F.1–V.F.7' },
    ],
  },
  {
    code: 'VIII',
    bokCode: 'VI',
    titleEn: 'Analyze',
    titleZh: '分析',
    examPct: 14.7,
    examQ: 22,
    primerPages: [672, 812],
    pages: 141,
    pagePct: 13.6,
    density: 1.08,
  },
  {
    code: 'IX',
    bokCode: 'VII',
    titleEn: 'Improve',
    titleZh: '改进',
    examPct: 14.0,
    examQ: 21,
    primerPages: [813, 918],
    pages: 106,
    pagePct: 10.3,
    density: 1.37,
  },
  {
    code: 'X',
    bokCode: 'VIII',
    titleEn: 'Control',
    titleZh: '控制',
    examPct: 10.0,
    examQ: 15,
    primerPages: [919, 1016],
    pages: 98,
    pagePct: 9.5,
    density: 1.06,
  },
  {
    code: 'XI',
    bokCode: 'IX',
    titleEn: 'Design for Six Sigma',
    titleZh: '六西格玛设计 DFSS',
    examPct: 4.7,
    examQ: 7,
    primerPages: [1017, 1047],
    pages: 31,
    pagePct: 3.0,
    density: 1.57,
  },
];

/** 反直觉的占比对比 */
export const insights = {
  softPct: 26.7,
  softQ: 40,
  softLabel: '企业级部署 + 流程管理 + 团队管理',
  statPct: 24.0,
  statQ: 36,
  statLabel: '测量·统计 + 分析',
};
