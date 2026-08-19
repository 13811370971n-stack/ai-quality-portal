import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { dmaicPhases } from '@/components/quality-toolbox/data/dmaicPhases'
import { tools } from '@/components/quality-toolbox/data/tools'
import { useLearningStore } from '@/components/quality-toolbox/learningStore'

type Mode = 'self' | 'guided' | 'project'

const projectCase = {
  title: '减少产品表面缺陷率',
  phases: [
    { phase: 'D' as const, desc: '某电子产品线表面缺陷率从2%升至5%，需要在3个月内降至2%以下。', tools: ['flowchart'] },
    { phase: 'M' as const, desc: '收集过去3个月的缺陷数据，建立测量系统，确认当前缺陷率基线。', tools: ['check-sheet', 'control-chart', 'histogram'] },
    { phase: 'A' as const, desc: '分析缺陷的根本原因，确定关键影响因素。', tools: ['cause-effect-diagram', 'pareto-chart', 'scatter-diagram'] },
    { phase: 'I' as const, desc: '针对关键原因制定改进方案并实施验证。', tools: ['flowchart', 'pareto-chart'] },
    { phase: 'C' as const, desc: '建立控制计划，监控改进成果的持续性。', tools: ['control-chart', 'check-sheet'] },
  ],
}

export default function LearnPage() {
  const [mode, setMode] = useState<Mode>('guided')
  const [projectPhase, setProjectPhase] = useState(0)
  const { completedTools, markComplete } = useLearningStore()

  const allToolIds = tools.map((t) => t.id)
  const progressPercent = Math.round((completedTools.length / allToolIds.length) * 100)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">📚 学习路径</h1>
      <p className="text-mckinsey-muted mb-6">
        选择你的学习模式，按自己的节奏掌握质量工具。
      </p>

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-mckinsey-light mb-8 w-fit">
        {[
          { key: 'self' as Mode, label: '📖 自学参考' },
          { key: 'guided' as Mode, label: '🗺️ 引导式学习' },
          { key: 'project' as Mode, label: '🏭 项目实战' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === tab.key
                ? 'bg-white text-mckinsey-teal shadow-sm'
                : 'text-mckinsey-navy hover:text-mckinsey-teal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Self-Study Mode */}
      {mode === 'self' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="p-6 rounded-xl border border-mckinsey-border text-center">
            <p className="text-lg mb-4">自由浏览所有质量工具，按需学习。</p>
            <Link
              href="/tools/quality-toolbox"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-mckinsey-teal hover:bg-mckinsey-teal text-white font-medium transition-colors"
            >
              🧰 进入工具库
            </Link>
          </div>
        </motion.div>
      )}

      {/* Guided Learning Mode */}
      {mode === 'guided' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Progress */}
          <div className="mb-8 p-4 rounded-xl border border-mckinsey-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">学习进度</span>
              <span className="text-sm text-mckinsey-muted">
                {completedTools.length}/{allToolIds.length} 工具
              </span>
            </div>
            <div className="h-2 rounded-full bg-mckinsey-border overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-mckinsey-teal to-cyan-500"
              />
            </div>
          </div>

          {/* Phase-based learning paths */}
          <div className="space-y-6">
            {dmaicPhases.map((phase) => {
              const phaseTools = tools.filter((t) => t.dmaic.includes(phase.id))
              return (
                <div
                  key={phase.id}
                  className="p-5 rounded-xl border border-mckinsey-border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: phase.color + '20' }}
                    >
                      {phase.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: phase.color }}>
                        {phase.id} · {phase.nameZh} ({phase.name})
                      </h3>
                      <p className="text-xs text-mckinsey-muted">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {phaseTools.map((tool) => {
                      const isComplete = completedTools.includes(tool.id)
                      return (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-mckinsey-light/50"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => markComplete(tool.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                                isComplete
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-surface-700/30'
                              }`}
                            >
                              {isComplete && '✓'}
                            </button>
                            <Link
                              href={`/tools/quality-toolbox/tools/${tool.id}`}
                              className={`text-sm font-medium hover:text-mckinsey-teal transition ${
                                isComplete ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {tool.nameZh}
                            </Link>
                          </div>
                          {tool.hasInteractive && (
                            <Link
                              href={tool.interactivePath!}
                              className="text-xs px-2 py-1 rounded bg-mckinsey-teal/10 text-mckinsey-teal"
                            >
                              ⚒️ 练习
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Project Simulation Mode */}
      {mode === 'project' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="p-6 rounded-xl border border-mckinsey-border mb-6">
            <h2 className="text-xl font-semibold mb-2">🏭 项目案例：{projectCase.title}</h2>
            <p className="text-mckinsey-muted">
              模拟一个完整的六西格玛改进项目，在每个 DMAIC 阶段使用对应的质量工具。
            </p>
          </div>

          {/* Phase Progress */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {projectCase.phases.map((p, i) => {
              const phaseInfo = dmaicPhases.find((dp) => dp.id === p.phase)!
              return (
                <button
                  key={i}
                  onClick={() => setProjectPhase(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    i === projectPhase
                      ? 'shadow-lg scale-105'
                      : i < projectPhase
                      ? 'opacity-60'
                      : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: i === projectPhase ? phaseInfo.color + '20' : 'transparent',
                    borderColor: phaseInfo.color,
                    borderWidth: 1,
                    color: phaseInfo.color,
                  }}
                >
                  {phaseInfo.icon} {phaseInfo.id} · {phaseInfo.nameZh}
                </button>
              )
            })}
          </div>

          {/* Current Phase Content */}
          <motion.div
            key={projectPhase}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-xl border border-mckinsey-border"
          >
            <h3 className="text-lg font-semibold mb-3">
              阶段 {projectPhase + 1}: {dmaicPhases[projectPhase].nameZh}
            </h3>
            <p className="text-mckinsey-navy mb-4">
              {projectCase.phases[projectPhase].desc}
            </p>
            <h4 className="font-medium mb-2">推荐使用工具：</h4>
            <div className="flex flex-wrap gap-2">
              {projectCase.phases[projectPhase].tools.map((toolId) => {
                const tool = tools.find((t) => t.id === toolId)
                if (!tool) return null
                return (
                  <Link
                    key={toolId}
                    href={tool.interactivePath || `/tools/${toolId}`}
                    className="px-3 py-2 rounded-lg border border-mckinsey-teal/20 text-sm text-mckinsey-teal hover:bg-mckinsey-teal/5 transition"
                  >
                    ⚒️ {tool.nameZh}
                  </Link>
                )
              })}
            </div>
            {projectPhase < projectCase.phases.length - 1 && (
              <button
                onClick={() => setProjectPhase((p) => p + 1)}
                className="mt-6 px-5 py-2.5 rounded-lg bg-mckinsey-teal hover:bg-mckinsey-teal text-white font-medium transition-colors"
              >
                下一阶段 →
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
