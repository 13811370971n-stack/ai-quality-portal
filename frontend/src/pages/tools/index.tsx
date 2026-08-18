import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Tool {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  category: string;
  status: string;
  icon: string;
  route: string;
  requiredRole?: string;
}

const categoryLabels: Record<string, string> = {
  control: '过程控制',
  measurement: '测量分析',
  improvement: '改进优化',
  analysis: '数据分析',
  toolbox: '工具箱',
};

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'badge-active',
    coming_soon: 'badge-coming-soon',
    beta: 'badge-beta',
  };
  const labels: Record<string, string> = {
    active: '可用',
    coming_soon: '即将推出',
    beta: '测试中',
  };
  return <span className={classes[status] || 'badge-coming-soon'}>{labels[status] || status}</span>;
}

const fallbackTools: Tool[] = [
  {
    id: 'ai-spc', name: 'AI-SPC', name_zh: 'AI统计过程控制',
    description: 'AI-powered Statistical Process Control with intelligent anomaly detection.',
    description_zh: 'AI赋能的统计过程控制，智能异常检测与根因建议。支持Xbar-R、Xbar-S、I-MR、P/NP/C/U、EWMA、Z-MR等9种控制图。',
    category: 'control', status: 'active', icon: 'bar-chart-line', route: '/tools/ai-spc', requiredRole: 'user',
  },
  {
    id: 'ai-msa', name: 'AI-MSA', name_zh: 'AI测量系统分析',
    description: 'AI-enhanced Measurement System Analysis with automated Gage R&R.',
    description_zh: 'AI增强的测量系统分析，自动化GRR和偏差检测。',
    category: 'measurement', status: 'coming_soon', icon: 'rulers', route: '/tools/ai-msa',
  },
  {
    id: 'ai-doe', name: 'AI-DOE', name_zh: 'AI实验设计',
    description: 'AI-assisted Design of Experiments.',
    description_zh: 'AI辅助实验设计，最优因子选择与响应预测。',
    category: 'improvement', status: 'coming_soon', icon: 'grid-3x3', route: '/tools/ai-doe',
  },
  {
    id: 'ai-fmea', name: 'AI-FMEA', name_zh: 'AI失效模式分析',
    description: 'AI-driven FMEA with automated risk scoring.',
    description_zh: 'AI驱动的失效模式与影响分析。',
    category: 'analysis', status: 'coming_soon', icon: 'exclamation-triangle', route: '/tools/ai-fmea', requiredRole: 'vip',
  },
  {
    id: 'ai-hypothesis', name: 'AI-Hypothesis Testing', name_zh: 'AI假设检验',
    description: 'Automated hypothesis test selection.',
    description_zh: '自动假设检验选择与自然语言解读。',
    category: 'analysis', status: 'coming_soon', icon: 'check2-circle', route: '/tools/ai-hypothesis', requiredRole: 'vip',
  },
  {
    id: 'quality-toolbox', name: 'Quality Toolbox', name_zh: '质量工具箱',
    description: 'Interactive quality tools for learning and practice - 150+ tools organized by DMAIC.',
    description_zh: '交互式质量工具学习平台。以DMAIC为主线组织150+工具，支持在线使用鱼骨图、控制图、帕累托图等。含知识图谱、学习路径和智能推荐。',
    category: 'toolbox', status: 'active', icon: 'toolbox', route: '/tools/quality-toolbox',
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const { isAuthenticated, user } = useAuth();
  const isActive = tool.status === 'active';
  const isVipOnly = tool.requiredRole === 'vip';
  const userCanAccess = isAuthenticated && (user?.role === 'admin' || user?.role === 'vip' || tool.requiredRole === 'user');

  const cardContent = (
    <div className={`card flex flex-col justify-between h-full ${
      isActive ? 'cursor-pointer hover:-translate-y-1 transition-all duration-300 group' : 'opacity-75'
    }`}>
      <div>
        <div className="flex items-start justify-between mb-4">
          <h3 className={`text-lg font-semibold transition-colors ${
            isActive ? 'text-mckinsey-navy group-hover:text-mckinsey-teal' : 'text-mckinsey-navy'
          }`}>
            {tool.name}
          </h3>
          <div className="flex items-center gap-2">
            {isVipOnly && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-mckinsey-gold/20 to-amber-500/20 text-mckinsey-gold text-xs font-medium rounded-full">
                VIP
              </span>
            )}
            <StatusBadge status={tool.status} />
          </div>
        </div>
        <p className="text-sm text-mckinsey-teal font-medium mb-2">
          {tool.name_zh}
        </p>
        <p className="text-mckinsey-muted text-sm leading-relaxed">
          {tool.description_zh}
        </p>
      </div>
      <div className="mt-6 pt-4 border-t border-mckinsey-border flex items-center justify-between">
        <span className="text-xs text-mckinsey-muted uppercase tracking-wide">
          {categoryLabels[tool.category] || tool.category}
        </span>
        {isActive && (
          <span className="text-mckinsey-teal text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
            {!isAuthenticated ? (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                登录使用
              </span>
            ) : (
              <span>打开 &rarr;</span>
            )}
          </span>
        )}
      </div>
    </div>
  );

  if (isActive) {
    return <Link href={tool.route} className="block h-full no-underline">{cardContent}</Link>;
  }
  return cardContent;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/v1/tools/')
      .then((res) => res.json())
      .then((data) => {
        setTools(data);
        setLoading(false);
      })
      .catch(() => {
        setTools(fallbackTools);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(tools.map((t) => t.category)))];
  const filtered = filter === 'all' ? tools : tools.filter((t) => t.category === filter);

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
            经典六西格玛工具的AI增强版本。每个工具都融合了机器学习能力，
            实现智能分析、自动检测和自然语言交互。
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-10">
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
                {cat === 'all' ? '全部' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-mckinsey-muted">加载中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ToolCard tool={tool} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
