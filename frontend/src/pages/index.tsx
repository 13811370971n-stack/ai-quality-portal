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
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: '效率提升10x',
    description: 'AI自动化数据分析流程，将数天的分析工作压缩至分钟级完成。',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: '精准根因定位',
    description: '机器学习模型从多维数据中识别关键因子，超越人工经验局限。',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: '预测性质量控制',
    description: '从被动响应转向主动预防，在质量问题发生前预警并干预。',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
];

const modules = [
  {
    href: '/tools',
    title: 'AI工具集',
    subtitle: 'AI-SPC · AI-MSA · AI-DOE',
    description: '经典六西格玛工具的AI增强版本，智能异常检测、自动化分析、自然语言解读。',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-2.94a.75.75 0 01-.22-1.07l3.6-4.61a.75.75 0 011.15-.03l5.58 5.17a.75.75 0 01-.43 1.28l-4.58.71z" />
      </svg>
    ),
    gradient: 'from-mckinsey-teal/10 to-cyan-500/10',
    borderColor: 'border-l-mckinsey-teal',
  },
  {
    href: '/coach',
    title: '六西格玛AI教练',
    subtitle: 'DMAIC · 工具推荐 · 项目评审',
    description: '随时可用的六西格玛专家，指导项目各阶段、推荐工具方法、评审交付物质量。',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    gradient: 'from-mckinsey-gold/10 to-amber-500/10',
    borderColor: 'border-l-mckinsey-gold',
  },
  {
    href: '/methodology',
    title: 'DMAIC方法论',
    subtitle: 'Define · Measure · Analyze · Improve · Control',
    description: '系统化展示AI如何在DMAIC每个阶段赋能，从理念到落地的完整框架。',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    gradient: 'from-emerald-500/10 to-green-500/10',
    borderColor: 'border-l-emerald-500',
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>AI Quality Portal - AI赋能质量管理</title>
        <meta name="description" content="AI赋能质量管理平台 - 将人工智能与六西格玛深度融合" />
      </Head>

      {/* Hero Section - Mesh Gradient + Glass */}
      <section className="relative mesh-gradient text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Floating orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16 py-24 lg:py-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '3rem' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-mckinsey-gold to-mckinsey-teal rounded-full mb-8"
            />
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-6">
              AI赋能
              <br />
              <span className="glow-text bg-gradient-to-r from-mckinsey-teal to-cyan-400 bg-clip-text text-transparent">
                质量管理
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-white/60 leading-relaxed mb-10 max-w-2xl">
              将人工智能与六西格玛方法论深度融合，重新定义质量管理的效率边界。
              从数据采集到根因分析，从过程控制到持续改进 —— AI让每一步都更智能。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/tools" className="btn-primary">
                探索AI工具
              </Link>
              <Link href="/methodology" className="btn-secondary">
                了解方法论
              </Link>
            </div>
          </motion.div>

          {/* Stats - Glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { value: '5+', label: 'AI增强工具' },
              { value: 'DMAIC', label: '全流程覆盖' },
              { value: '24/7', label: 'AI教练在线' },
              { value: '10x', label: '效率提升' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-5"
              >
                <div className="text-2xl lg:text-3xl font-bold stat-glow text-mckinsey-gold">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Value Proposition - with gradient icon backgrounds */}
      <section className="section bg-gradient-to-b from-mckinsey-light to-white">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {valueProps.map((prop) => (
                <motion.div
                  key={prop.title}
                  variants={fadeInUp}
                  className="card group hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center mb-5 text-mckinsey-teal group-hover:scale-110 transition-transform duration-300`}>
                    {prop.icon}
                  </div>
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

      {/* Modules Overview - enhanced cards */}
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

          <div className="space-y-5">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={mod.href} className="block group">
                  <div className={`card border-l-4 ${mod.borderColor} bg-gradient-to-r ${mod.gradient} hover:translate-x-2 transition-all duration-300`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 text-mckinsey-teal opacity-60 group-hover:opacity-100 transition-opacity">
                          {mod.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-mckinsey-navy">{mod.title}</h3>
                          <p className="text-sm text-mckinsey-teal font-medium mt-1">{mod.subtitle}</p>
                          <p className="text-mckinsey-muted mt-2">{mod.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-mckinsey-muted group-hover:text-mckinsey-teal group-hover:translate-x-1 transition-all">
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
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
