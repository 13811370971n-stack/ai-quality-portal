import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const categories = [
  { id: 'all', label: '全部' },
  { id: 'ai-tools', label: 'AI增强工具' },
  { id: 'basic-tools', label: '基本质量工具' },
  { id: 'statistical', label: '统计分析' },
  { id: 'fmea', label: 'FMEA' },
];

const allTools = [
  // AI Enhanced Tools
  {
    id: 'ai-spc', name: 'AI-SPC', name_zh: 'AI统计过程控制',
    description: '9种控制图 + 过程能力分析 + 正态性检验。智能异常检测与根因建议。',
    category: 'ai-tools', status: 'active', route: '/tools/ai-spc', icon: '📊',
  },
  {
    id: 'ai-dfmea', name: 'AI-DFMEA', name_zh: 'AI设计失效模式分析',
    description: 'AI辅助设计FMEA，自动识别潜在失效模式、推荐预防措施、优化RPN评分。',
    category: 'fmea', status: 'active', route: '/tools/ai-dfmea', icon: '🛡️',
  },
  {
    id: 'ai-pfmea', name: 'AI-PFMEA', name_zh: 'AI过程失效模式分析',
    description: 'AI辅助过程FMEA，基于过程流程自动分析失效模式与控制措施。',
    category: 'fmea', status: 'active', route: '/tools/ai-pfmea', icon: '⚙️',
  },
  {
    id: 'ai-fishbone', name: 'AI-鱼骨图', name_zh: 'AI因果分析',
    description: '输入问题描述，AI自动生成6M原因分析；点击原因可AI展开子原因。',
    category: 'ai-tools', status: 'active', route: '/tools/quality-toolbox/workshop/fishbone', icon: '🐟',
  },
  {
    id: 'ai-5whys', name: 'AI-5 Whys', name_zh: 'AI五个为什么',
    description: 'AI引导5Why分析，自动建议下一层原因，验证逻辑链完整性。',
    category: 'ai-tools', status: 'active', route: '/tools/quality-toolbox/workshop/five-whys', icon: '❓',
  },
  {
    id: 'ai-pareto', name: 'AI-帕累托', name_zh: 'AI帕累托分析',
    description: 'AI赋能帕累托分析，智能识别关键少数，自动生成分析结论和改善建议。',
    category: 'ai-tools', status: 'active', route: '/tools/quality-toolbox/workshop/pareto', icon: '📈',
  },

  // Basic Quality Tools (7 + SIPOC + FMEA)
  {
    id: 'checksheet', name: '检查表', name_zh: 'Check Sheet',
    description: '结构化数据收集工具，支持在线创建和实时记录。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/checksheet', icon: '✅',
  },
  {
    id: 'histogram', name: '直方图', name_zh: 'Histogram',
    description: '数据分布可视化，自动分组计算频率，识别分布形态。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/histogram', icon: '📊',
  },
  {
    id: 'scatter', name: '散点图', name_zh: 'Scatter Diagram',
    description: '两变量关系分析，识别相关性和趋势。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/scatter', icon: '⚬',
  },
  {
    id: 'controlchart', name: '控制图', name_zh: 'Control Chart',
    description: '过程稳定性监控，识别特殊原因变异。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/controlchart', icon: '📉',
  },
  {
    id: 'flowchart', name: '流程图', name_zh: 'Flowchart',
    description: '过程流程可视化，识别浪费和改善机会。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/flowchart', icon: '🔀',
  },
  {
    id: 'sipoc', name: 'SIPOC', name_zh: '过程定义',
    description: 'Supplier-Input-Process-Output-Customer过程宏观视图。',
    category: 'basic-tools', status: 'active', route: '/tools/quality-toolbox/workshop/sipoc', icon: '🗂️',
  },
  {
    id: 'fmea', name: 'FMEA工坊', name_zh: '失效模式分析',
    description: '交互式FMEA填写工具，支持功能/失效/原因/措施结构化录入。',
    category: 'fmea', status: 'active', route: '/tools/quality-toolbox/workshop/fmea', icon: '⚠️',
  },

  {
    id: '8d-report', name: '8D \u62a5\u544a\u5de5\u5177', name_zh: '\u7ed3\u6784\u5316 8D + AI \u8f85\u52a9',
    description: 'D0-D8 \u5206\u8282\u586b\u5199\uff0c\u6bcf\u8282 AI \u8f85\u52a9\uff08\u5e2e\u4f60\u505a/\u6559\u4f60\u505a\uff09\uff0cAI \u5ba1\u6838\u903b\u8f91\u4e00\u81f4\u6027\uff0c\u4e00\u952e\u5bfc\u51fa Word\u3002',
    category: 'fmea', status: 'active', route: '/tools/8d', icon: '\U0001f4cb',
  },

  // Statistical Tools
  {
    id: 'process-capability', name: '过程能力', name_zh: 'Cp/Cpk/Pp/Ppk',
    description: '过程能力指数计算与分析。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/process-capability', icon: '🎯',
  },
  {
    id: 'normal-plot', name: '正态概率图', name_zh: 'Normal Probability Plot',
    description: '数据正态性检验与可视化。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/normal-plot', icon: '📐',
  },
  {
    id: 'hypothesis-test', name: '假设检验', name_zh: 'Hypothesis Test',
    description: 't检验、F检验、卡方检验等统计推断。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/hypothesis-test', icon: '🧮',
  },
  {
    id: 'regression', name: '回归分析', name_zh: 'Regression',
    description: '线性/多元回归分析，建立因果关系模型。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/regression', icon: '📏',
  },
  {
    id: 'anova', name: '方差分析', name_zh: 'ANOVA',
    description: '多组数据差异显著性检验。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/anova', icon: '📊',
  },
  {
    id: 'box-plot', name: '箱线图', name_zh: 'Box Plot',
    description: '数据分布五数概括与异常值检测。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/box-plot', icon: '📦',
  },
  {
    id: 'run-chart', name: '运行图', name_zh: 'Run Chart',
    description: '时间序列趋势分析，识别趋势和周期。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/run-chart', icon: '📈',
  },
  {
    id: 'multi-vari', name: '多变量图', name_zh: 'Multi-Vari Chart',
    description: '多因子变异分析，识别主要变异来源。',
    category: 'statistical', status: 'active', route: '/tools/quality-toolbox/workshop/multi-vari', icon: '🔲',
  },

  // Coming soon
  {
    id: 'ai-msa', name: 'AI-MSA', name_zh: 'AI测量系统分析',
    description: 'GRR交叉/嵌套分析、偏倚与线性、稳定性分析、计数型分析。AI辅助判定与改善建议。',
    category: 'ai-tools', status: 'active', route: '/tools/ai-msa', icon: '📐',
  },
  {
    id: 'ai-doe', name: 'AI-DOE', name_zh: 'AI实验设计',
    description: 'AI辅助实验设计，最优因子选择与响应预测。',
    category: 'ai-tools', status: 'active', route: '/tools/ai-doe', icon: '🧪',
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full">可用</span>;
  return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full">即将推出</span>;
}

export default function ToolsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState('');
  const { isAuthenticated, token } = useAuth();

  const filtered = allTools.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.name_zh.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleRecommend() {
    if (!searchQuery.trim()) return;
    setRecommending(true);
    setRecommendations('');
    try {
      const res = await fetch('/api/v1/ai/health');
      if (res.ok) {
        // Use simple keyword matching for now (AI endpoint can be added later)
        const q = searchQuery.toLowerCase();
        const matched = allTools.filter(t =>
          t.status === 'active' && (
            t.description.toLowerCase().includes(q) ||
            t.name_zh.toLowerCase().includes(q)
          )
        );
        if (matched.length > 0) {
          setRecommendations(`Based on "${searchQuery}", recommended tools: ${matched.map(t => t.name).join(', ')}`);
        } else {
          setRecommendations(`No exact match found. Try describing your problem differently.`);
        }
      }
    } catch {}
    finally { setRecommending(false); }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleRecommend();
  }

  return (
    <>
      <Head>
        <title>AI工具集 - AI Quality Portal</title>
        <meta name="description" content="AI赋能的质量工具集 - SPC、FMEA、鱼骨图、5Why、帕累托等" />
      </Head>

      <section className="pt-16 bg-mckinsey-navy text-white py-16 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="accent-bar mb-6" />
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">AI工具集</h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8">
            AI赋能的质量工具与方法。从SPC到FMEA，从鱼骨图到帕累托，每个工具都融合了AI能力。
          </p>

          {/* Smart Recommend Search Bar */}
          <div className="max-w-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="描述你的质量问题，AI推荐最适合的工具..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/50 focus:border-mckinsey-teal/50 text-sm"
              />
              <button
                onClick={handleRecommend}
                disabled={!searchQuery.trim() || recommending}
                className="px-5 py-3 bg-mckinsey-teal text-white rounded-xl hover:bg-mckinsey-teal/90 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {recommending ? '...' : '🎯 推荐'}
              </button>
            </div>
            {recommendations && (
              <div className="mt-3 px-4 py-2.5 bg-white/10 rounded-lg text-sm text-white/80">
                {recommendations}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="max-w-7xl mx-auto">
          {/* Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === cat.id ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((tool, i) => (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {tool.status === 'active' ? (
                  <Link href={tool.route} className="block h-full">
                    <div className="card h-full flex flex-col group hover:-translate-y-1 transition-all duration-200 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xl">{tool.icon}</span>
                        <StatusBadge status={tool.status} />
                      </div>
                      <h3 className="text-sm font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">{tool.name}</h3>
                      <p className="text-[11px] text-mckinsey-teal font-medium mt-0.5">{tool.name_zh}</p>
                      <p className="text-xs text-mckinsey-muted mt-2 flex-1 leading-relaxed line-clamp-3">{tool.description}</p>
                      <div className="mt-3 pt-2 border-t border-mckinsey-border">
                        <span className="text-[11px] text-mckinsey-teal font-medium group-hover:translate-x-1 transition-transform inline-block">
                          打开 &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="card h-full flex flex-col opacity-60 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{tool.icon}</span>
                      <StatusBadge status={tool.status} />
                    </div>
                    <h3 className="text-sm font-semibold text-mckinsey-navy">{tool.name}</h3>
                    <p className="text-[11px] text-mckinsey-teal font-medium mt-0.5">{tool.name_zh}</p>
                    <p className="text-xs text-mckinsey-muted mt-2 flex-1 leading-relaxed line-clamp-3">{tool.description}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
