import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import QTLayout from '@/components/quality-toolbox/QTLayout';
import { dmaicPhases } from '@/components/quality-toolbox/data/dmaicPhases';

const features = [
  { icon: '🗺️', title: 'DMAIC 知识图谱', desc: '可视化展示各阶段工具分布与关联', link: '/tools/quality-toolbox/graph' },
  { icon: '⚒️', title: '交互式工坊', desc: '7大基本工具在线交互使用', link: '/tools/quality-toolbox/workshop' },
  { icon: '📚', title: '学习路径', desc: '自学 · 引导式 · 项目实战三种模式', link: '/tools/quality-toolbox/learn' },
  { icon: '🎯', title: '智能推荐', desc: '描述问题，推荐最适合的质量工具', link: '/tools/quality-toolbox/recommend' },
];

export default function QualityToolboxHome() {
  return (
    <>
      <Head>
        <title>质量工具箱 - AI Quality Portal</title>
      </Head>
      <QTLayout>
        {/* Hero */}
        <section className="bg-mckinsey-navy text-white py-16 px-6 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="accent-bar mb-6" />
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">质量工具箱</h1>
              <p className="text-white/70 text-lg max-w-2xl mb-1">Quality Toolbox · 交互式学习平台</p>
              <p className="text-white/50 max-w-2xl text-sm">
                基于《The Quality Toolbox》第三版，以 DMAIC 框架组织 150+ 质量工具。支持在线交互使用、知识图谱导航和结构化学习路径。
              </p>
            </motion.div>
          </div>
        </section>

        {/* DMAIC */}
        <section className="section">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-mckinsey-navy mb-8">DMAIC 方法论</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {dmaicPhases.map((phase, i) => (
                <motion.div key={phase.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/tools/quality-toolbox/graph?phase=${phase.id}`} className="card block p-6 text-center group hover:-translate-y-1 no-underline">
                    <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: phase.color + '15' }}>{phase.icon}</div>
                    <div className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: phase.color }}>{phase.id}</div>
                    <div className="text-sm font-medium text-mckinsey-navy">{phase.nameZh}</div>
                    <div className="text-xs text-mckinsey-muted mt-1">{phase.tools.length} 个工具</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-mckinsey-navy mb-8">平台功能</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, i) => (
                <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <Link href={feat.link} className="card block h-full group hover:-translate-y-1 no-underline">
                    <div className="text-3xl mb-4">{feat.icon}</div>
                    <h3 className="font-semibold text-mckinsey-navy mb-2">{feat.title}</h3>
                    <p className="text-sm text-mckinsey-muted">{feat.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="max-w-7xl mx-auto text-center card bg-gradient-to-br from-mckinsey-teal/5 to-cyan-500/5 border-mckinsey-teal/20">
            <h2 className="text-xl font-bold text-mckinsey-navy mb-2">快速开始</h2>
            <p className="text-mckinsey-muted mb-6">描述你遇到的质量问题，AI 将推荐最适合的工具</p>
            <Link href="/tools/quality-toolbox/recommend" className="btn-primary inline-flex items-center gap-2 no-underline">
              🎯 开始使用智能推荐
            </Link>
          </div>
        </section>
      </QTLayout>
    </>
  );
}
