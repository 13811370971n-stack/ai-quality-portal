import { useState } from 'react'
import { motion } from 'framer-motion'

interface Cause {
  id: string
  text: string
  subCauses: { id: string; text: string }[]
  isAiGenerated?: boolean
  isExpanding?: boolean
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

export default function FishboneTool() {
  const [problem, setProblem] = useState('')
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSource, setAiSource] = useState<string | null>(null)

  const generateWithAI = async () => {
    if (!problem.trim()) return
    setIsGenerating(true)
    setAiSource(null)
    
    try {
      const res = await fetch('/api/v1/ai/fishbone/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      })
      const json = await res.json()
      
      if (json.success && json.data?.categories) {
        const newCats: Category[] = json.data.categories.map((cat: any, i: number) => ({
          id: defaultCategories[i]?.id || `cat-${i}`,
          name: cat.name,
          causes: cat.causes.map((c: any) => ({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
            text: c.text,
            subCauses: (c.subCauses || []).map((sc: any) => ({ id: Date.now().toString() + Math.random().toString(36).slice(2, 8), text: typeof sc === 'string' ? sc : (sc.text || sc) })),
            isAiGenerated: true,
          })),
        }))
        setCategories(newCats)
        setAiSource(json.source)
      }
    } catch (e) {
      console.error('AI generation failed:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  const expandCause = async (catId: string, causeId: string) => {
    const cat = categories.find(c => c.id === catId)
    const cause = cat?.causes.find(c => c.id === causeId)
    if (!cause) return

    // Set loading state
    setCategories(categories.map(c => c.id === catId ? {
      ...c, causes: c.causes.map(cs => cs.id === causeId ? { ...cs, isExpanding: true } : cs)
    } : c))

    try {
      const res = await fetch('/api/v1/ai/fishbone/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, category: cat!.name, cause: cause.text }),
      })
      const json = await res.json()
      
      if (json.success && json.data?.subCauses) {
        setCategories(categories.map(c => c.id === catId ? {
          ...c, causes: c.causes.map(cs => cs.id === causeId ? {
            ...cs,
            isExpanding: false,
            subCauses: json.data.subCauses.map((sc: string) => ({
              id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
              text: sc,
            })),
          } : cs)
        } : c))
      }
    } catch (e) {
      setCategories(categories.map(c => c.id === catId ? {
        ...c, causes: c.causes.map(cs => cs.id === causeId ? { ...cs, isExpanding: false } : cs)
      } : c))
    }
  }

  const addCause = (catId: string) => {
    setCategories(categories.map(cat =>
      cat.id === catId
        ? { ...cat, causes: [...cat.causes, { id: Date.now().toString(), text: '新原因', subCauses: [], isAiGenerated: false }] }
        : cat
    ))
  }

  const updateCause = (catId: string, causeId: string, text: string) => {
    setCategories(categories.map(cat =>
      cat.id === catId
        ? { ...cat, causes: cat.causes.map(c => c.id === causeId ? { ...c, text } : c) }
        : cat
    ))
  }

  const removeCause = (catId: string, causeId: string) => {
    setCategories(categories.map(cat =>
      cat.id === catId
        ? { ...cat, causes: cat.causes.filter(c => c.id !== causeId) }
        : cat
    ))
  }

  const resetAll = () => {
    setCategories(defaultCategories)
    setProblem('')
    setAiSource(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">🐟 AI-鱼骨图</h1>
          <p className="text-sm text-mckinsey-muted">输入问题，AI 自动生成 6M 原因分析</p>
        </div>
        <button onClick={resetAll} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition">
          🗑️ 重置
        </button>
      </div>

      {/* Problem Input + AI Button */}
      <div className="card !p-5 mb-6">
        <label className="text-sm font-semibold text-mckinsey-navy block mb-2">🎯 问题描述：</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="例如：产品表面划伤率从2%升到5%"
            className="flex-1 px-4 py-3 rounded-xl border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition"
            onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
          />
          <button
            onClick={generateWithAI}
            disabled={isGenerating || !problem.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <><span className="animate-spin">⚙️</span> 分析中...</>
            ) : (
              <><span>🤖</span> AI 分析</>
            )}
          </button>
        </div>
        {aiSource && (
          <p className="text-xs mt-2 text-mckinsey-muted">
            {aiSource === 'deepseek' ? '✨ AI 生成' : '📚 知识库匹配'} — 可编辑修改
          </p>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-5">
            <h3 className="font-semibold text-mckinsey-navy text-sm mb-3 pb-2 border-b border-mckinsey-border">
              {cat.name}
            </h3>
            <div className="space-y-2 mb-3">
              {cat.causes.map((cause) => (
                <div key={cause.id}>
                  <div className="flex items-center gap-1">
                    {cause.isAiGenerated && <span className="text-xs text-mckinsey-teal">✨</span>}
                    <input
                      type="text"
                      value={cause.text}
                      onChange={(e) => updateCause(cat.id, cause.id, e.target.value)}
                      className="flex-1 text-xs px-2 py-1.5 rounded border border-mckinsey-border/50 bg-mckinsey-light/30 focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                    />
                    <button
                      onClick={() => expandCause(cat.id, cause.id)}
                      disabled={cause.isExpanding}
                      className="text-xs px-1.5 py-0.5 text-mckinsey-teal hover:bg-mckinsey-teal/10 rounded disabled:opacity-50"
                      title="AI 展开子原因"
                    >
                      {cause.isExpanding ? '⏳' : '🔍'}
                    </button>
                    <button onClick={() => removeCause(cat.id, cause.id)} className="text-xs px-1.5 py-0.5 text-red-500 hover:bg-red-50 rounded">✕</button>
                  </div>
                  {cause.subCauses.length > 0 && (
                    <div className="ml-5 mt-1 space-y-1 border-l-2 border-mckinsey-teal/20 pl-2">
                      {cause.subCauses.map((sub) => (
                        <div key={sub.id} className="text-xs text-mckinsey-muted flex items-center gap-1">
                          <span className="text-mckinsey-teal">↳</span> {sub.text}
                        </div>
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
              + 手动添加
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
