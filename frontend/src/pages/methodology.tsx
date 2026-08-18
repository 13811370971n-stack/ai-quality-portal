import Head from 'next/head';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AIEnhancement {
  tool: string;
  description_zh: string;
}

interface Phase {
  id: string;
  name: string;
  name_zh: string;
  description_zh: string;
  key_activities_zh: string[];
  ai_enhancements: AIEnhancement[];
  deliverables_zh: string[];
}

const phaseColors: Record<string, string> = {
  define: 'from-blue-500 to-blue-600',
  measure: 'from-teal-500 to-teal-600',
  analyze: 'from-amber-500 to-amber-600',
  improve: 'from-emerald-500 to-emerald-600',
  control: 'from-purple-500 to-purple-600',
};

const phaseIcons: Record<string, string> = {
  define: 'D',
  measure: 'M',
  analyze: 'A',
  improve: 'I',
  control: 'C',
};

export default function MethodologyPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [activePhase, setActivePhase] = useState<string>('define');

  useEffect(() => {
    fetch('/api/v1/methodology/dmaic')
      .then((res) => res.json())
      .then(setPhases)
      .catch(() => {
        // Fallback data
        setPhases([
          {
            id: 'define', name: 'Define', name_zh: '定义',
            description_zh: '定义问题、项目范围和客户需求。',
            key_activities_zh: ['问题陈述与商业论证', '客户之声(VOC)分析', '项目章程', 'SIPOC图', 'CTQ树'],
            ai_enhancements: [
              { tool: 'AI-VOC Analyzer', description_zh: '基于NLP的客户反馈聚类与情感分析' },
              { tool: 'AI-Scoping', description_zh: '从历史数据模式自动生成项目范围建议' },
            ],
            deliverables_zh: ['项目章程', 'SIPOC图', 'CTQ矩阵'],
          },
          {
            id: 'measure', name: 'Measure', name_zh: '测量',
            description_zh: '测量当前过程绩效并收集相关数据。',
            key_activities_zh: ['数据收集计划', '测量系统分析(MSA)', '过程能力分析(Cp/Cpk)', '基线Sigma水平', '价值流图'],
            ai_enhancements: [
              { tool: 'AI-MSA', description_zh: '自动化GRR分析，智能方差分解' },
              { tool: 'AI-SPC', description_zh: '智能控制图选择与自动规则检查' },
            ],
            deliverables_zh: ['数据收集计划', 'MSA报告', '过程能力报告'],
          },
          {
            id: 'analyze', name: 'Analyze', name_zh: '分析',
            description_zh: '分析数据以识别缺陷和变异的根本原因。',
            key_activities_zh: ['假设检验', '回归分析', '方差分析(ANOVA)', '根本原因分析', '失效模式分析(FMEA)'],
            ai_enhancements: [
              { tool: 'AI-RCA', description_zh: '基于机器学习的多变量数据根因识别' },
              { tool: 'AI-Hypothesis', description_zh: '自动检验方法选择与自然语言解读' },
            ],
            deliverables_zh: ['根因验证', '统计分析报告'],
          },
          {
            id: 'improve', name: 'Improve', name_zh: '改进',
            description_zh: '制定并实施解决方案以消除根本原因。',
            key_activities_zh: ['实验设计(DOE)', '方案选择矩阵', '试点测试', '实施计划', '风险评估(FMEA)'],
            ai_enhancements: [
              { tool: 'AI-DOE', description_zh: '最优实验设计，因子筛选与响应预测' },
              { tool: 'AI-Simulation', description_zh: '蒙特卡洛仿真验证方案鲁棒性' },
            ],
            deliverables_zh: ['DOE结果', '试点报告', '实施计划'],
          },
          {
            id: 'control', name: 'Control', name_zh: '控制',
            description_zh: '通过监控和控制系统维持改进成果。',
            key_activities_zh: ['控制计划', 'SPC监控', '标准操作程序', '培训与知识转移', '项目结项与收益追踪'],
            ai_enhancements: [
              { tool: 'AI-SPC Monitor', description_zh: '实时异常检测与预测性漂移预警' },
              { tool: 'AI-Control Plan', description_zh: '从项目经验自动生成控制计划' },
            ],
            deliverables_zh: ['控制计划', 'SPC仪表盘', '培训材料'],
          },
        ]);
      });
  }, []);

  const current = phases.find((p) => p.id === activePhase);

  return (
    <>
      <Head>
        <title>DMAIC方法论 - AI Quality Portal</title>
      </Head>

      {/* Header */}
      <section className="bg-mckinsey-navy text-white py-16 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="accent-bar bg-mckinsey-gold mb-6" />
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">DMAIC方法论</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            六西格玛DMAIC流程的每一个阶段都被AI增强。从定义到控制，
            AI助力你更快、更准、更智能地完成质量改进项目。
          </p>
        </div>
      </section>

      {/* DMAIC Timeline */}
      <section className="section">
        <div className="max-w-7xl mx-auto">
          {/* Phase selector */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 lg:gap-4">
              {phases.map((phase, i) => (
                <div key={phase.id} className="flex items-center">
                  <button
                    onClick={() => setActivePhase(phase.id)}
                    className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center
                              font-bold text-lg lg:text-xl transition-all duration-300
                              ${activePhase === phase.id
                                ? `bg-gradient-to-br ${phaseColors[phase.id]} text-white scale-110 shadow-lg`
                                : 'bg-mckinsey-light text-mckinsey-muted hover:bg-mckinsey-border'
                              }`}
                    aria-label={`${phase.name} phase`}
                  >
                    {phaseIcons[phase.id]}
                  </button>
                  {i < phases.length - 1 && (
                    <div className="w-6 lg:w-12 h-0.5 bg-mckinsey-border mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phase detail */}
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Phase info */}
              <div className="lg:col-span-1">
                <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${phaseColors[current.id]} text-white font-medium mb-4`}>
                  {current.name} · {current.name_zh}
                </div>
                <p className="text-mckinsey-muted leading-relaxed mb-6">
                  {current.description_zh}
                </p>
                <div>
                  <h4 className="text-sm font-semibold text-mckinsey-navy uppercase tracking-wide mb-3">
                    交付物
                  </h4>
                  <ul className="space-y-2">
                    {current.deliverables_zh.map((d) => (
                      <li key={d} className="text-sm text-mckinsey-muted flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-mckinsey-gold rounded-full" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key activities */}
              <div className="card">
                <h4 className="text-sm font-semibold text-mckinsey-navy uppercase tracking-wide mb-4">
                  关键活动
                </h4>
                <ul className="space-y-3">
                  {current.key_activities_zh.map((activity, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 bg-mckinsey-light rounded flex items-center justify-center text-xs text-mckinsey-muted font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm text-mckinsey-navy">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Enhancements */}
              <div className="card border-l-4 border-l-mckinsey-teal">
                <h4 className="text-sm font-semibold text-mckinsey-teal uppercase tracking-wide mb-4">
                  ⚡ AI增强点
                </h4>
                <div className="space-y-4">
                  {current.ai_enhancements.map((enh) => (
                    <div key={enh.tool} className="bg-mckinsey-light/50 rounded-lg p-4">
                      <div className="font-medium text-mckinsey-navy text-sm mb-1">
                        {enh.tool}
                      </div>
                      <p className="text-xs text-mckinsey-muted leading-relaxed">
                        {enh.description_zh}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Quality Toolbox Link */}
      <section className="section bg-mckinsey-light/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-mckinsey-navy mb-4">
            质量工具箱
          </h2>
          <p className="text-mckinsey-muted max-w-2xl mx-auto mb-8">
            150+种质量工具的交互式学习平台。以DMAIC为主线，支持在线使用鱼骨图、控制图、帕累托图等七大基本工具。
          </p>
          <a
            href="/tools/quality-toolbox"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span className="text-2xl">🧰</span>
            <span>打开质量工具箱</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="card text-center py-4">
              <div className="text-2xl mb-1">🗺️</div>
              <div className="text-xs text-mckinsey-muted">DMAIC知识图谱</div>
            </div>
            <div className="card text-center py-4">
              <div className="text-2xl mb-1">⚒️</div>
              <div className="text-xs text-mckinsey-muted">7大交互式工具</div>
            </div>
            <div className="card text-center py-4">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-xs text-mckinsey-muted">学习路径</div>
            </div>
            <div className="card text-center py-4">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs text-mckinsey-muted">智能推荐</div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
