import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import QTLayout from '@/components/quality-toolbox/QTLayout';
import { tools } from '@/components/quality-toolbox/data/tools';

const toolIcons: Record<string, string> = {
  'cause-effect-diagram': '🐟',
  'check-sheet': '☑️',
  'control-chart': '📈',
  'histogram': '📊',
  'pareto-chart': '📉',
  'scatter-diagram': '⚡',
  'flowchart': '🔀',
  'five-whys': '❓',
  'fmea': '⚠️',
  'sipoc': '📋',
};

export default function WorkshopPage() {
  const interactiveTools = tools.filter((t) => t.hasInteractive);

  return (
    <>
      <Head><title>交互工坊 - 质量工具箱</title></Head>
      <QTLayout>
        <section className="section">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">⚒️ 交互工坊</h1>
            <p className="text-mckinsey-muted mb-8">在线使用质量工具。输入你的数据，即时生成分析结果。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {interactiveTools.map((tool, i) => (
                <motion.div key={tool.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/tools/quality-toolbox/workshop/${tool.interactivePath?.split('/').pop()}`} className="card block p-6 group hover:-translate-y-1 h-full no-underline">
                    <div className="text-3xl mb-3">{toolIcons[tool.id] || '🔧'}</div>
                    <h3 className="font-semibold text-lg text-mckinsey-navy mb-1 group-hover:text-mckinsey-teal transition-colors">{tool.nameZh}</h3>
                    <p className="text-sm text-mckinsey-muted line-clamp-2">{tool.descriptionZh}</p>
                    <div className="mt-4 text-sm text-mckinsey-teal font-medium">打开工具 →</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </QTLayout>
    </>
  );
}
