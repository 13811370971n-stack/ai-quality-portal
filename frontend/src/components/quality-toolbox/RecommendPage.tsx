import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { tools } from '@/components/quality-toolbox/data/tools'
import { QualityTool } from '@/components/quality-toolbox/types'

interface Recommendation {
  tool: QualityTool
  score: number
  reason: string
}

const keywords: Record<string, { tools: string[]; reason: string }> = {
  '根本原因': { tools: ['cause-effect-diagram', 'pareto-chart', 'scatter-diagram'], reason: '这些工具专门用于根本原因分析' },
  '原因分析': { tools: ['cause-effect-diagram', 'pareto-chart'], reason: '帮助系统性地分析和排列原因' },
  '为什么': { tools: ['cause-effect-diagram'], reason: '鱼骨图帮助结构化追问"为什么"' },
  '数据收集': { tools: ['check-sheet'], reason: '检查表是最基本的数据收集工具' },
  '收集': { tools: ['check-sheet'], reason: '结构化收集现场数据' },
  '监控': { tools: ['control-chart'], reason: '控制图是过程监控的标准工具' },
  '稳定': { tools: ['control-chart'], reason: '控制图判断过程是否稳定' },
  'spc': { tools: ['control-chart'], reason: '统计过程控制的核心工具' },
  '分布': { tools: ['histogram'], reason: '直方图展示数据频率分布' },
  '正态': { tools: ['histogram'], reason: '直方图帮助判断数据是否正态分布' },
  '过程能力': { tools: ['histogram', 'control-chart'], reason: '评估过程满足规格的能力' },
  '优先': { tools: ['pareto-chart'], reason: '帕累托图帮助确定优先级' },
  '重要': { tools: ['pareto-chart'], reason: '识别最重要的关键少数' },
  '80/20': { tools: ['pareto-chart'], reason: '帕累托原理——关键少数与次要多数' },
  '关键': { tools: ['pareto-chart'], reason: '识别关键少数因素' },
  '相关': { tools: ['scatter-diagram'], reason: '散点图分析两变量间的相关性' },
  '关系': { tools: ['scatter-diagram'], reason: '验证变量间是否存在线性关系' },
  '流程': { tools: ['flowchart'], reason: '流程图可视化过程步骤' },
  '过程': { tools: ['flowchart', 'control-chart'], reason: '理解和控制过程' },
  '缺陷': { tools: ['pareto-chart', 'check-sheet', 'cause-effect-diagram'], reason: '缺陷分析的常用工具组合' },
  '不良': { tools: ['pareto-chart', 'cause-effect-diagram', 'control-chart'], reason: '不良率分析与改进' },
  '变异': { tools: ['control-chart', 'histogram'], reason: '分析和控制过程变异' },
  '趋势': { tools: ['control-chart'], reason: '控制图展示数据时间趋势' },
}

const quickQuestions = [
  '我想找出产品缺陷的主要原因',
  '如何监控生产过程是否稳定',
  '需要了解数据的分布情况',
  '怎样确定改进的优先级',
  '想分析温度和良率的关系',
  '需要画出当前的工作流程',
]

export default function RecommendPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Recommendation[]>([])

  function recommend(input: string) {
    const q = input.toLowerCase()
    const scores = new Map<string, { score: number; reasons: Set<string> }>()

    for (const [kw, config] of Object.entries(keywords)) {
      if (q.includes(kw.toLowerCase())) {
        for (const toolId of config.tools) {
          const existing = scores.get(toolId) || { score: 0, reasons: new Set<string>() }
          existing.score += 1
          existing.reasons.add(config.reason)
          scores.set(toolId, existing)
        }
      }
    }

    const recommendations: Recommendation[] = []
    for (const [toolId, { score, reasons }] of Array.from(scores.entries())) {
      const tool = tools.find((t) => t.id === toolId)
      if (tool) {
        recommendations.push({
          tool,
          score,
          reason: Array.from(reasons).join('；'),
        })
      }
    }

    recommendations.sort((a, b) => b.score - a.score)
    setResults(recommendations)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) recommend(query)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">🎯 智能推荐</h1>
      <p className="text-mckinsey-muted mb-8">
        描述你遇到的质量问题或目标，系统将推荐最适合的工具。
      </p>

      {/* Search */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例如：我想找出产品缺陷的主要原因..."
            className="flex-1 px-4 py-3 rounded-lg border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-mckinsey-teal hover:bg-mckinsey-teal text-white font-medium transition-colors"
          >
            推荐
          </button>
        </div>
      </form>

      {/* Quick Questions */}
      <div className="mb-8">
        <p className="text-sm text-mckinsey-muted mb-2">常见问题：</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); recommend(q) }}
              className="px-3 py-1.5 rounded-full border border-mckinsey-border text-xs hover:border-mckinsey-teal/30 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-semibold">
            为你推荐 {results.length} 个工具：
          </h2>
          {results.map((rec, i) => (
            <motion.div
              key={rec.tool.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border border-mckinsey-border hover:border-mckinsey-teal/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-mckinsey-teal/10 text-mckinsey-teal">
                      #{i + 1}
                    </span>
                    <h3 className="font-semibold">{rec.tool.nameZh}</h3>
                  </div>
                  <p className="text-sm text-mckinsey-muted mb-2">
                    💡 推荐理由：{rec.reason}
                  </p>
                  <p className="text-sm text-mckinsey-navy line-clamp-2">
                    {rec.tool.descriptionZh}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Link
                    href={`/tools/quality-toolbox/tools/${rec.tool.id}`}
                    className="px-3 py-1.5 rounded-lg border border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition"
                  >
                    详情
                  </Link>
                  {rec.tool.hasInteractive && (
                    <Link
                      href={rec.tool.interactivePath!}
                      className="px-3 py-1.5 rounded-lg bg-mckinsey-teal text-white text-sm hover:bg-mckinsey-teal transition"
                    >
                      ⚒️ 使用
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {results.length === 0 && query && (
        <div className="text-center p-8 text-mckinsey-muted">
          没有找到匹配的工具。请尝试使用不同的关键词描述你的问题。
        </div>
      )}
    </div>
  )
}
