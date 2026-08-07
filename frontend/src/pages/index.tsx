import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const valueProps = [
  {
    icon: '⚡',
    title: '效率提升10x',
    description: 'AI自动化数据分析流程，将数天的分析工作压缩至分钟级完成。',
  },
  {
    icon: '🎯',
    title: '精准根因定位',
    description: '机器学习模型从多维数据中识别关键因子，超越人工经验局限。',
  },
  {
    icon: '🔮',
    title: '预测性质量控制',
    description: '从被动响应转向主动预防，在质量问题发生前预警并干预。',
  },
];

const modules = [
  {
    href: '/tools',
    title: 'AI工具集',
    subtitle: 'AI-SPC · AI-MSA · AI-DOE',
    description: '经典六西格玛工具的AI增强版本，智能异常检测、自动化分析、自然语言解读。',
    color: 'border-l-mckinsey-teal',
  },
  {
    href: '/coach',
    title: '六西格玛AI教练',
    subtitle: 'DMAIC · 工具推荐 · 项目评审',
    description: '随时可用的六西格玛专家，指导项目各阶段、推荐工具方法、评审交付物质量。',
    color: 'border-l-mckinsey-gold',
  },
  {
    href: '/methodology',
    title: 'DMAIC方法论',
    subtitle: 'Define · Measure · Analyze · Improve · Control',
    description: '系统化展示AI如何在DMAIC每个阶段赋能，从理念到落地的完整框架。',
    color: 'border-l-emerald-500',
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>AI Quality Portal - AI赋能质量管理</title>
        <meta name="description" content="AI赋能质量管理平台 - 将人工智能与六西格玛深度融合" />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-mckinsey-navy text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="accent-bar bg-mckinsey-gold mb-8" />
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              AI赋能
              <br />
              <span className="text-mckinsey-teal">质量管理</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl">
              将人工智能与六西格玛方法论深度融合，重新定义质量管理的效率边界。
              从数据采集到根因分析，从过程控制到持续改进 —— AI让每一步都更智能。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/tools" className="btn-primary bg-mckinsey-teal hover:bg-mckinsey-teal/90">
                探索AI工具
              </Link>
              <Link href="/methodology" className="btn-secondary border-white/30 text-white hover:bg-white/10">
                了解方法论
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 pt-12 border-t border-white/10"
          >
            {[
              { value: '5+', label: 'AI增强工具' },
              { value: 'DMAIC', label: '全流程覆盖' },
              { value: '24/7', label: 'AI教练在线' },
              { value: '10x', label: '效率提升' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl lg:text-3xl font-bold text-mckinsey-gold">{stat.value}</div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="section bg-mckinsey-light">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="text-center mb-16">
              <div className="accent-bar mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-bold text-mckinsey-navy mb-4">
                为什么选择AI赋能
              </h2>
              <p className="text-mckinsey-muted max-w-2xl mx-auto">
                传统质量管理依赖专家经验和人工分析，AI正在改变这一切。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {valueProps.map((prop) => (
                <motion.div
                  key={prop.title}
                  variants={fadeInUp}
                  className="card text-center"
                >
                  <div className="text-4xl mb-4">{prop.icon}</div>
                  <h3 className="text-xl font-semibold text-mckinsey-navy mb-3">
                    {prop.title}
                  </h3>
                  <p className="text-mckinsey-muted leading-relaxed">
                    {prop.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules Overview */}
      <section className="section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="accent-bar mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-mckinsey-navy mb-4">
              平台模块
            </h2>
            <p className="text-mckinsey-muted max-w-2xl mx-auto">
              三大核心模块，覆盖工具应用、智能教练和方法论体系。
            </p>
          </div>

          <div className="space-y-6">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={mod.href} className="block">
                  <div className={`card border-l-4 ${mod.color} hover:translate-x-1 transition-transform`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-mckinsey-navy">{mod.title}</h3>
                        <p className="text-sm text-mckinsey-teal font-medium mt-1">{mod.subtitle}</p>
                        <p className="text-mckinsey-muted mt-2">{mod.description}</p>
                      </div>
                      <div className="shrink-0">
                        <span className="text-mckinsey-muted">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
