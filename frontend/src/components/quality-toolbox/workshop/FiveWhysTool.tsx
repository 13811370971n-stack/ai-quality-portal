import { useState } from 'react'
import { motion } from 'framer-motion'

interface WhyStep {
  id: number
  answer: string
  aiSuggestion?: string
  guideQuestion?: string
  branches?: { direction: string; hint: string }[]
  isLoading?: boolean
}

interface ValidationResult {
  validation?: { is_valid: boolean; reasoning: string; confidence: string }
  corrective_actions?: { action: string; type: string; priority: string }[]
  prevention?: string
}

export default function FiveWhysTool() {
  const [problem, setProblem] = useState('')
  const [steps, setSteps] = useState<WhyStep[]>([{ id: 1, answer: '' }])
  const [rootCause, setRootCause] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const getAiSuggestion = async (depth: number) => {
    const chain = steps.slice(0, depth).map(s => s.answer).filter(Boolean)
    
    setSteps(steps.map((s, i) => i === depth ? { ...s, isLoading: true } : s))
    
    try {
      const res = await fetch('/api/v1/ai/five-whys/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, chain, current_depth: depth }),
      })
      const json = await res.json()
      
      if (json.success && json.data) {
        setSteps(steps.map((s, i) => i === depth ? {
          ...s,
          isLoading: false,
          aiSuggestion: json.data.suggestion,
          guideQuestion: json.data.guide_question,
          branches: json.data.branches,
        } : s))
      }
    } catch (e) {
      setSteps(steps.map((s, i) => i === depth ? { ...s, isLoading: false } : s))
    }
  }

  const adoptSuggestion = (idx: number) => {
    const suggestion = steps[idx].aiSuggestion
    if (suggestion) {
      setSteps(steps.map((s, i) => i === idx ? { ...s, answer: suggestion } : s))
    }
  }

  const adoptBranch = (idx: number, direction: string) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, answer: direction } : s))
  }

  const addStep = () => {
    if (steps.length < 7) {
      const newSteps = [...steps, { id: steps.length + 1, answer: '' }]
      setSteps(newSteps)
      // Auto-trigger AI suggestion for new step
      setTimeout(() => getAiSuggestion(newSteps.length - 1), 100)
    }
  }

  const validateRootCause = async () => {
    if (!rootCause.trim()) return
    setIsValidating(true)
    
    try {
      const res = await fetch('/api/v1/ai/five-whys/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, chain: steps.map(s => s.answer).filter(Boolean), root_cause: rootCause }),
      })
      const json = await res.json()
      if (json.success) setValidation(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsValidating(false)
    }
  }

  const resetAll = () => {
    setProblem('')
    setSteps([{ id: 1, answer: '' }])
    setRootCause('')
    setValidation(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">❓ AI-5个为什么</h1>
          <p className="text-sm text-mckinsey-muted">AI 辅助逐层追问，支持分叉探索</p>
        </div>
        <button onClick={resetAll} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition">🗑️ 重置</button>
      </div>

      {/* Problem */}
      <div className="card !p-5 mb-6">
        <label className="text-sm font-semibold text-mckinsey-navy block mb-2">🎯 问题现象</label>
        <input type="text" value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="例如：产品表面有划伤"
          className="w-full px-4 py-3 rounded-xl border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition text-lg" />
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, idx) => (
          <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card !p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-mckinsey-teal to-cyan-500 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</div>
              <div className="flex-1">
                <label className="text-sm font-medium text-mckinsey-muted block mb-2">
                  {idx === 0 ? `为什么"${problem || '...'}"？` : `为什么"${steps[idx - 1].answer || '...'}"？`}
                </label>
                <input type="text" value={step.answer} onChange={(e) => setSteps(steps.map((s, i) => i === idx ? { ...s, answer: e.target.value } : s))}
                  placeholder="输入答案，或点击下方AI建议"
                  className="w-full px-4 py-2.5 rounded-lg border border-mckinsey-border bg-mckinsey-light/30 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition" />
                
                {/* AI Suggestions */}
                {step.isLoading && <p className="text-xs text-mckinsey-teal mt-2 animate-pulse">🤖 AI 分析中...</p>}
                
                {step.aiSuggestion && (
                  <div className="mt-3 p-3 rounded-lg bg-mckinsey-teal/5 border border-mckinsey-teal/20">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-medium text-mckinsey-teal">✨ AI 建议</span>
                      <button onClick={() => adoptSuggestion(idx)} className="text-xs px-2 py-0.5 rounded bg-mckinsey-teal text-white hover:bg-mckinsey-teal/90">采纳</button>
                    </div>
                    <p className="text-sm text-mckinsey-navy">{step.aiSuggestion}</p>
                    {step.guideQuestion && <p className="text-xs text-mckinsey-muted mt-2 italic">💡 {step.guideQuestion}</p>}
                  </div>
                )}

                {step.branches && step.branches.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-mckinsey-muted mb-1">🔀 可能的方向：</p>
                    <div className="flex flex-wrap gap-2">
                      {step.branches.map((b, bi) => (
                        <button key={bi} onClick={() => adoptBranch(idx, b.direction)}
                          className="text-xs px-3 py-1.5 rounded-full border border-mckinsey-border hover:border-mckinsey-teal/50 hover:bg-mckinsey-teal/5 transition"
                          title={b.hint}>
                          {b.direction}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {!step.aiSuggestion && !step.isLoading && problem && (
                  <button onClick={() => getAiSuggestion(idx)} className="mt-2 text-xs text-mckinsey-teal hover:underline">
                    🤖 获取 AI 建议
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={addStep} disabled={steps.length >= 7} className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition disabled:opacity-40">+ 继续追问</button>
      </div>

      {/* Root Cause + Validation */}
      <div className="card !p-5 border-l-4 border-l-mckinsey-teal">
        <label className="text-sm font-semibold text-mckinsey-navy block mb-2">🔍 确认根本原因</label>
        <div className="flex gap-3">
          <input type="text" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="确认的根本原因..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-mckinsey-border bg-mckinsey-light/30 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition" />
          <button onClick={validateRootCause} disabled={isValidating || !rootCause.trim()}
            className="px-5 py-2.5 rounded-lg bg-mckinsey-teal text-white text-sm font-medium hover:bg-mckinsey-teal/90 transition disabled:opacity-50">
            {isValidating ? '验证中...' : '🤖 AI 验证'}
          </button>
        </div>
        
        {validation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <div className={`p-3 rounded-lg ${validation.validation?.is_valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className="text-sm font-medium">{validation.validation?.is_valid ? '✅ 根因验证通过' : '⚠️ 根因可能需要进一步验证'}</p>
              <p className="text-xs text-mckinsey-muted mt-1">{validation.validation?.reasoning}</p>
            </div>
            {validation.corrective_actions && (
              <div>
                <h4 className="text-sm font-semibold text-mckinsey-navy mb-2">✅ 建议纠正措施</h4>
                <div className="space-y-2">
                  {validation.corrective_actions.map((ca, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-mckinsey-light/50">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ca.priority === '高' ? 'bg-red-100 text-red-700' : ca.priority === '中' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{ca.priority}</span>
                      <span className="text-sm text-mckinsey-navy">{ca.action}</span>
                      <span className="text-xs text-mckinsey-muted ml-auto">{ca.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {validation.prevention && (
              <p className="text-xs text-mckinsey-muted italic">🛡️ 预防建议：{validation.prevention}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
