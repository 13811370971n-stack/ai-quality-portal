import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { dmaicPhases } from '@/components/quality-toolbox/data/dmaicPhases'
import { tools } from '@/components/quality-toolbox/data/tools'
import { QualityTool } from '@/components/quality-toolbox/types'

export default function GraphPage() {
  const [selectedTool, setSelectedTool] = useState<QualityTool | null>(null)
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null)

  // Calculate layout
  const phaseWidth = 200
  const totalWidth = dmaicPhases.length * phaseWidth

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">🗺️ DMAIC 知识图谱</h1>
      <p className="text-mckinsey-muted mb-8">
        横轴展示 DMAIC 五个阶段，每个阶段下分布对应的质量工具。点击工具节点查看详情。
      </p>

      {/* Timeline Visualization */}
      <div
        className="relative overflow-x-auto rounded-2xl border border-mckinsey-border bg-white p-6"
      >
        <div style={{ minWidth: totalWidth + 100 }} className="relative">
          {/* Phase axis */}
          <div className="flex items-center justify-between mb-12 px-8">
            {/* Connecting line */}
            <div className="absolute top-12 left-12 right-12 h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-amber-500 via-green-500 to-red-500 rounded-full opacity-30" />

            {dmaicPhases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative z-10 flex flex-col items-center cursor-pointer"
                onMouseEnter={() => setHoveredPhase(phase.id)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110"
                  style={{
                    backgroundColor: phase.color + '20',
                    borderColor: phase.color,
                    borderWidth: 2,
                    boxShadow: hoveredPhase === phase.id ? `0 8px 25px ${phase.color}40` : undefined,
                  }}
                >
                  {phase.icon}
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: phase.color }}
                >
                  {phase.id}
                </div>
                <div className="text-xs text-mckinsey-muted">
                  {phase.nameZh}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tool nodes under each phase */}
          <div className="flex justify-between px-8">
            {dmaicPhases.map((phase, phaseIdx) => {
              const phaseTools = tools.filter((t) => t.dmaic.includes(phase.id))
              return (
                <div
                  key={phase.id}
                  className="flex flex-col items-center gap-2"
                  style={{ width: phaseWidth }}
                >
                  {phaseTools.map((tool, toolIdx) => (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: phaseIdx * 0.1 + toolIdx * 0.05 + 0.3 }}
                      onClick={() => setSelectedTool(tool)}
                      className="px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:scale-105 hover:shadow-md w-full max-w-[160px] text-center"
                      style={{
                        borderColor: phase.color + '60',
                        backgroundColor: selectedTool?.id === tool.id ? phase.color + '20' : 'transparent',
                        color: phase.color,
                      }}
                    >
                      {tool.nameZh}
                      {tool.hasInteractive && (
                        <span className="ml-1 opacity-60">⚒️</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Tool Detail Panel */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-6 rounded-xl border border-mckinsey-border bg-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedTool.nameZh}</h3>
                <p className="text-sm text-mckinsey-muted font-mono">
                  {selectedTool.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-mckinsey-muted hover:text-mckinsey-navy"
              >
                ✕
              </button>
            </div>
            <p className="text-mckinsey-navy mb-4">
              {selectedTool.descriptionZh}
            </p>
            <div className="flex gap-3">
              <Link
                href={`/tools/quality-toolbox/tools/${selectedTool.id}`}
                className="px-4 py-2 rounded-lg border border-mckinsey-teal/30 text-mckinsey-teal text-sm font-medium hover:bg-mckinsey-teal/5 transition"
              >
                查看详情 →
              </Link>
              {selectedTool.hasInteractive && (
                <Link
                  href={selectedTool.interactivePath!}
                  className="px-4 py-2 rounded-lg bg-mckinsey-teal hover:bg-mckinsey-teal text-white text-sm font-medium transition"
                >
                  ⚒️ 打开工具
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
