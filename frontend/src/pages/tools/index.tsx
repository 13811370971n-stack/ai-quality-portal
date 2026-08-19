import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { tools as qualityTools } from '@/components/quality-toolbox/data/tools';

interface AiTool {
  id: string;
  name: string;
  name_zh: string;
  description_zh: string;
  category: string;
  status: 'active' | 'coming_soon' | 'beta';
  route: string;
  requiredRole?: string;
}

const aiTools: AiTool[] = [
  {
    id: 'ai-spc', name: 'AI-SPC', name_zh: 'AI统计过程控制',
    description_zh: 'AI赋能的统计过程控制，智能异常检测与根因建议。支持9种控制图。',
    category: 'ai-tools', status: 'active', route: '/tools/ai-spc', requiredRole: 'user',
  },
  {
    id: 'ai-msa', name: 'AI-MSA', name_zh: 'AI测量系统分析',
    description_zh: 'AI增强的测量系统分析，自动化GRR和偏差检测。',
    category: 'ai-tools', status: 'coming_soon', route: '/tools/ai-msa',
  },
  {
    id: 'ai-doe', name: 'AI-DOE', name_zh: 'AI实验设计',
    description_zh: 'AI辅助实验设计，最优因子选择与响应预测。',
    category: 'ai-tools', status: 'coming_soon', route: '/tools/ai-doe',
  },
  {
    id: 'ai-fmea', name: 'AI-FMEA', name_zh: 'AI失效模式分析',
    description_zh: 'AI驱动的失效模式与影响分析，自动风险评分。',
    category: 'ai-tools', status: 'coming_soon', route: '/tools/ai-fmea',
  },
  {
    id: 'ai-hypothesis', name: 'AI-Hypothesis', name_zh: 'AI假设检验',
    description_zh: '自动假设检验选择与自然语言解读。',
    category: 'ai-tools', status: 'coming_soon', route: '/tools/ai-hypothesis',
  },
];

const categoryLabels: Record<string, string> = {
  'all': '全部',
  'ai-tools': 'AI工具',
  'Root Cause Analysis': '根因分析',
  'Data Collection': '数据收集',
  'Data Analysis': '数据分析',
  'Process Control': '过程控制',
  'Process Analysis': '过程分析',
  'Management & Planning': '管理与计划',
  'Design & Prevention': '设计与预防',
};

// Keyword -> tool mapping for smart recommendation
const keywords: Record<string, { tools: string[]; reason: string }> = {
  '根本原因': { tools: ['cause-effect-diagram', 'five-whys', 'pareto-chart'], reason: '根本原因分析工具' },
  '原因': { tools: ['cause-effect-diagram', 'five-whys', 'interrelationship-digraph'], reason: '原因分析' },
  '监控': { tools: ['control-chart', 'check-sheet'], reason: '过程监控工具' },
  '稳定': { tools: ['control-chart'], reason: '过程稳定性判断' },
  '分布': { tools: ['histogram'], reason: '数据分布分析' },
  '能力': { tools: ['histogram', 'control-chart'], reason: '过程能力评估' },
  '优先': { tools: ['pareto-chart'], reason: '优先级排序' },
  '缺陷': { tools: ['pareto-chart', 'check-sheet', 'cause-effect-diagram'], reason: '缺陷分析' },
  '相关': { tools: ['scatter-diagram'], reason: '相关性分析' },
  '流程': { tools: ['flowchart', 'sipoc'], reason: '过程可视化' },
  '风险': { tools: ['fmea', 'pdpc'], reason: '风险分析与预防' },
  '失效': { tools: ['fmea'], reason: '失效模式分析' },
  '计划': { tools: ['arrow-diagram', 'pdpc', 'tree-diagram'], reason: '计划与管理' },
  '分组': { tools: ['affinity-diagram'], reason: '信息分组整理' },
  '关系': { tools: ['matrix-diagram', 'interrelationship-digraph', 'scatter-diagram'], reason: '关系分析' },
  '目标': { tools: ['tree-diagram'], reason: '目标分解' },
  '数据收集': { tools: ['check-sheet'], reason: '数据收集工具' },
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="badge-active">可用</span>;
  if (status === 'coming_soon') return <span className="badge-coming-soon">即将推出</span>;
  if (status === 'beta') return <span className="badge-beta">测试中</span>;
  return null;
}

export default function ToolsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Combine AI tools and quality tools into unified list
  const allCards = [
    ...aiTools.map((t) => ({
      id: t.id,
      name: t.name_zh,
      subtitle: t.name,
      description: t.description_zh,
      category: t.category,
      status: t.status,
      route: t.route,
      hasInteractive: t.status === 'active',
      isAi: true,
    })),
    ...qualityTools.map((t) => ({
      id: t.id,
      name: t.nameZh,
      subtitle: t.name,
      description: t.descriptionZh,
      category: t.category,
      status: 'active' as const,
      route: t.hasInteractive
        ? `/tools/quality-toolbox/workshop/${t.interactivePath?.split('/').pop()}`
        : `/tools/quality-toolbox/${t.id}`,
      hasInteractive: t.hasInteractive,
      isAi: false,
    })),
  ];

  // Filter
  const filtered = filter === 'all'
    ? allCards
    : allCards.filter((t) => t.category === filter);

  // Search + Recommend
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setRecommendations([]); return; }
    const q = query.toLowerCase();
    const scores = new Map<string, number>();
    for (const [kw, config] of Array.from(Object.entries(keywords))) {
      if (q.includes(kw)) {
        for (const toolId of config.tools) {
          scores.set(toolId, (scores.get(toolId) || 0) + 1);
        }
      }
    }
    const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    setRecommendations(sorted);
  };

  // If there are recommendations, show those first
  const displayCards = recommendations.length > 0
    ? [...filtered.filter((c) => recommendations.includes(c.id)).sort((a, b) => recommendations.indexOf(a.id) - recommendations.indexOf(b.id)),
       ...filtered.filter((c) => !recommendations.includes(c.id))]
    : filtered;

  const categories = ['all', 'ai-tools', ...Array.from(new Set(qualityTools.map((t) => t.category)))];

  return (
    <>
      <Head>
        <title>AI工具集 - AI Quality Portal</title>
      </Head>

      {/* Header */}
      <section className="pt-16 bg-mckinsey-navy text-white py-16 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="accent-bar bg-mckinsey-gold mb-6" />
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">AI工具集</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            AI增强的六西格玛工具 + 经典质量工具箱。每个工具都可在线交互使用或查看详细操作指南。
          </p>
        </div>
      </section>

      {/* Smart Recommendation Search */}
      <section className="px-6 lg:px-16 -mt-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="card !p-4 flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="描述你的问题，智能推荐合适的工具... 例如：我想分析缺陷的根本原因"
              className="flex-1 bg-transparent border-none focus:outline-none text-mckinsey-navy placeholder:text-mckinsey-muted/60"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setRecommendations([]); }} className="text-mckinsey-muted hover:text-mckinsey-navy">
                ✕
              </button>
            )}
          </div>
          {recommendations.length > 0 && (
            <p className="text-xs text-mckinsey-teal mt-2 ml-2">
              🎯 为你推荐了 {recommendations.length} 个相关工具（已置顶显示）
            </p>
          )}
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section !pt-10">
        <div className="max-w-7xl mx-auto">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === cat
                    ? 'bg-mckinsey-navy text-white'
                    : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          {/* Tool count */}
          <p className="text-sm text-mckinsey-muted mb-6">
            显示 {displayCards.length} 个工具
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCards.map((tool, i) => {
              const isRecommended = recommendations.includes(tool.id);
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={tool.route}
                    className={`card block h-full group hover:-translate-y-1 no-underline ${
                      isRecommended ? 'ring-2 ring-mckinsey-teal/30' : ''
                    } ${tool.status !== 'active' ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">
                        {tool.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isRecommended && (
                          <span className="px-2 py-0.5 bg-mckinsey-teal/10 text-mckinsey-teal text-xs font-medium rounded-full">
                            推荐
                          </span>
                        )}
                        {tool.isAi && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-mckinsey-teal/20 to-cyan-500/20 text-mckinsey-teal text-xs font-medium rounded-full">
                            AI
                          </span>
                        )}
                        {tool.hasInteractive && !tool.isAi && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                            可交互
                          </span>
                        )}
                        <StatusBadge status={tool.status} />
                      </div>
                    </div>
                    <p className="text-xs text-mckinsey-teal font-medium mb-2 font-mono">
                      {tool.subtitle}
                    </p>
                    <p className="text-sm text-mckinsey-muted leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-mckinsey-border flex items-center justify-between">
                      <span className="text-xs text-mckinsey-muted">
                        {categoryLabels[tool.category] || tool.category}
                      </span>
                      <span className="text-mckinsey-teal text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {tool.hasInteractive ? '打开 →' : '查看 →'}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
