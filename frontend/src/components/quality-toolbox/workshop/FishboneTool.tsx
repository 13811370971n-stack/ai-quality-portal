import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Cause {
  id: string
  text: string
  subCauses: { id: string; text: string }[]
}

interface Category {
  id: string
  name: string
  causes: Cause[]
}

const defaultCategories: Category[] = [
  { id: 'man', name: '人 (Man)', causes: [] },
  { id: 'machine', name: '机 (Machine)', causes: [] },
  { id: 'material', name: '料 (Material)', causes: [] },
  { id: 'method', name: '法 (Method)', causes: [] },
  { id: 'environment', name: '环 (Environment)', causes: [] },
  { id: 'measurement', name: '测 (Measurement)', causes: [] },
]

function loadState(): { problem: string; categories: Category[] } {
  try {
    const saved = localStorage.getItem('qt-fishbone')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { problem: '', categories: defaultCategories }
}

export default function FishboneTool() {
  const [state, setState] = useState(loadState)
  const { problem, categories } = state

  const save = useCallback((newState: typeof state) => {
    setState(newState)
    localStorage.setItem('qt-fishbone', JSON.stringify(newState))
  }, [])

  const setProblem = (p: string) => save({ ...state, problem: p })

  const addCause = (catId: string) => {
    const updated = categories.map((cat) =>
      cat.id === catId
        ? { ...cat, causes: [...cat.causes, { id: Date.now().toString(), text: '新原因', subCauses: [] }] }
        : cat
    )
    save({ ...state, categories: updated })
  }

  const updateCause = (catId: string, causeId: string, text: string) => {
    const updated = categories.map((cat) =>
      cat.id === catId
        ? { ...cat, causes: cat.causes.map((c) => (c.id === causeId ? { ...c, text } : c)) }
        : cat
    )
    save({ ...state, categories: updated })
  }

  const removeCause = (catId: string, causeId: string) => {
    const updated = categories.map((cat) =>
      cat.id === catId
        ? { ...cat, causes: cat.causes.filter((c) => c.id !== causeId) }
        : cat
    )
    save({ ...state, categories: updated })
  }

  const addSubCause = (catId: string, causeId: string) => {
    const updated = categories.map((cat) =>
      cat.id === catId
        ? {
            ...cat,
            causes: cat.causes.map((c) =>
              c.id === causeId
                ? { ...c, subCauses: [...c.subCauses, { id: Date.now().toString(), text: '子原因' }] }
                : c
            ),
          }
        : cat
    )
    save({ ...state, categories: updated })
  }

  const updateSubCause = (catId: string, causeId: string, subId: string, text: string) => {
    const updated = categories.map((cat) =>
      cat.id === catId
        ? {
            ...cat,
            causes: cat.causes.map((c) =>
              c.id === causeId
                ? { ...c, subCauses: c.subCauses.map((s) => (s.id === subId ? { ...s, text } : s)) }
                : c
            ),
          }
        : cat
    )
    save({ ...state, categories: updated })
  }

  const updateCategoryName = (catId: string, name: string) => {
    const updated = categories.map((cat) => (cat.id === catId ? { ...cat, name } : cat))
    save({ ...state, categories: updated })
  }

  const resetAll = () => {
    save({ problem: '', categories: defaultCategories })
  }

  // SVG dimensions
  const svgW = 1000
  const svgH = 600
  const centerY = svgH / 2
  const headX = svgW - 80
  const tailX = 60
  const boneLength = headX - tailX

  // Distribute categories: top 3, bottom 3
  const topCats = categories.slice(0, 3)
  const botCats = categories.slice(3, 6)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">🐟 鱼骨图</h1>
          <p className="text-sm text-mckinsey-muted">
            因果图 / Ishikawa Diagram — 分析问题的根本原因
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 重置
        </button>
      </div>

      {/* Problem Input */}
      <div className="mb-6 p-4 rounded-xl border border-mckinsey-border">
        <label className="text-sm font-medium mb-2 block">🎯 问题/效果（鱼头）：</label>
        <input
          type="text"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="输入要分析的问题，例如：产品表面划伤率高"
          className="w-full px-4 py-2.5 rounded-lg border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal"
        />
      </div>

      {/* Fishbone SVG */}
      <div className="mb-6 rounded-xl border border-mckinsey-border overflow-x-auto bg-white p-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[700px]" style={{ maxHeight: 500 }}>
          {/* Main bone */}
          <line x1={tailX} y1={centerY} x2={headX} y2={centerY} stroke="currentColor" strokeWidth={3} className="text-mckinsey-navy" />
          
          {/* Fish head */}
          <ellipse cx={headX + 30} cy={centerY} rx={50} ry={35} fill="none" stroke="currentColor" strokeWidth={2} className="text-mckinsey-teal" />
          <text x={headX + 30} y={centerY + 4} textAnchor="middle" className="text-xs fill-current text-mckinsey-teal" fontSize="11">
            {problem || '问题?'}
          </text>

          {/* Category branches */}
          {topCats.map((cat, i) => {
            const x = tailX + ((i + 1) * boneLength) / 4
            const branchColor = ['#8b5cf6', '#3b82f6', '#f59e0b'][i]
            return (
              <g key={cat.id}>
                <line x1={x} y1={centerY} x2={x - 60} y2={centerY - 120} stroke={branchColor} strokeWidth={2} />
                <text x={x - 65} y={centerY - 130} fill={branchColor} fontSize="12" fontWeight="bold">
                  {cat.name}
                </text>
                {cat.causes.map((cause, ci) => {
                  const cy = centerY - 40 - ci * 30
                  const cx = x - 20 - ci * 15
                  return (
                    <g key={cause.id}>
                      <line x1={cx} y1={cy} x2={cx - 40} y2={cy - 15} stroke={branchColor} strokeWidth={1} opacity={0.7} />
                      <text x={cx - 45} y={cy - 18} fill={branchColor} fontSize="10" opacity={0.8}>
                        {cause.text}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
          {botCats.map((cat, i) => {
            const x = tailX + ((i + 1) * boneLength) / 4
            const branchColor = ['#10b981', '#ef4444', '#ec4899'][i]
            return (
              <g key={cat.id}>
                <line x1={x} y1={centerY} x2={x - 60} y2={centerY + 120} stroke={branchColor} strokeWidth={2} />
                <text x={x - 65} y={centerY + 145} fill={branchColor} fontSize="12" fontWeight="bold">
                  {cat.name}
                </text>
                {cat.causes.map((cause, ci) => {
                  const cy = centerY + 40 + ci * 30
                  const cx = x - 20 - ci * 15
                  return (
                    <g key={cause.id}>
                      <line x1={cx} y1={cy} x2={cx - 40} y2={cy + 15} stroke={branchColor} strokeWidth={1} opacity={0.7} />
                      <text x={cx - 45} y={cy + 20} fill={branchColor} fontSize="10" opacity={0.8}>
                        {cause.text}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Category editors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-mckinsey-border"
          >
            <input
              type="text"
              value={cat.name}
              onChange={(e) => updateCategoryName(cat.id, e.target.value)}
              className="w-full font-semibold text-sm mb-3 px-2 py-1 rounded border border-transparent hover:border-mckinsey-border bg-transparent focus:outline-none focus:border-mckinsey-teal"
            />
            <div className="space-y-2 mb-3">
              {cat.causes.map((cause) => (
                <div key={cause.id}>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={cause.text}
                      onChange={(e) => updateCause(cat.id, cause.id, e.target.value)}
                      className="flex-1 text-xs px-2 py-1 rounded border border-mckinsey-border bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                    />
                    <button
                      onClick={() => addSubCause(cat.id, cause.id)}
                      className="text-xs px-1.5 py-0.5 text-mckinsey-teal hover:bg-mckinsey-teal/5 rounded"
                      title="添加子原因"
                    >
                      +子
                    </button>
                    <button
                      onClick={() => removeCause(cat.id, cause.id)}
                      className="text-xs px-1.5 py-0.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  </div>
                  {cause.subCauses.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {cause.subCauses.map((sub) => (
                        <input
                          key={sub.id}
                          type="text"
                          value={sub.text}
                          onChange={(e) => updateSubCause(cat.id, cause.id, sub.id, e.target.value)}
                          className="w-full text-xs px-2 py-0.5 rounded border border-mckinsey-border/50 bg-mckinsey-light/50 focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addCause(cat.id)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-dashed border-mckinsey-border hover:border-mckinsey-teal/30 text-mckinsey-muted hover:text-mckinsey-teal transition"
            >
              + 添加原因
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
