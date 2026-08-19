import { useState } from 'react'
import { motion } from 'framer-motion'

interface WhyStep {
  id: number
  answer: string
}

export default function FiveWhysTool() {
  const [problem, setProblem] = useState('')
  const [steps, setSteps] = useState<WhyStep[]>([{ id: 1, answer: '' }])
  const [rootCause, setRootCause] = useState('')
  const [action, setAction] = useState('')

  const addStep = () => {
    if (steps.length < 7) {
      setSteps([...steps, { id: steps.length + 1, answer: '' }])
    }
  }

  const updateStep = (idx: number, answer: string) => {
    const updated = [...steps]
    updated[idx] = { ...updated[idx], answer }
    setSteps(updated)
  }

  const removeStep = () => {
    if (steps.length > 1) {
      setSteps(steps.slice(0, -1))
    }
  }

  const resetAll = () => {
    setProblem('')
    setSteps([{ id: 1, answer: '' }])
    setRootCause('')
    setAction('')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">❓ 5个为什么</h1>
          <p className="text-sm text-mckinsey-muted">
            逐层追问"为什么"，直到触达根本原因
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 重置
        </button>
      </div>

      {/* Problem Statement */}
      <div className="card mb-6">
        <label className="text-sm font-semibold text-mckinsey-navy block mb-2">
          🎯 问题现象（要分析的问题）
        </label>
        <input
          type="text"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="例如：产品表面有划伤"
          className="w-full px-4 py-3 rounded-xl border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition text-lg"
        />
      </div>

      {/* Why Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-mckinsey-teal to-cyan-500 text-white flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-mckinsey-muted block mb-2">
                  {idx === 0
                    ? `为什么会发生"${problem || '这个问题'}"？`
                    : `为什么会"${steps[idx - 1].answer || '...'}"？`}
                </label>
                <input
                  type="text"
                  value={step.answer}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  placeholder={`第 ${idx + 1} 个为什么的答案...`}
                  className="w-full px-4 py-2.5 rounded-lg border border-mckinsey-border bg-mckinsey-light/50 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition"
                />
              </div>
            </div>
            {idx === steps.length - 1 && step.answer && (
              <div className="mt-3 ml-14 flex items-center gap-2 text-xs text-mckinsey-muted">
                <span>💡</span>
                <span>这是根本原因吗？如果是，填写下方"根本原因"。如果不是，点击"继续追问"。</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add/Remove buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={addStep}
          disabled={steps.length >= 7}
          className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition disabled:opacity-40"
        >
          + 继续追问为什么
        </button>
        {steps.length > 1 && (
          <button
            onClick={removeStep}
            className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm hover:border-red-200 text-mckinsey-muted transition"
          >
            - 删除最后一步
          </button>
        )}
      </div>

      {/* Root Cause & Action */}
      <div className="card border-l-4 border-l-mckinsey-teal">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-mckinsey-navy block mb-2">
              🔍 根本原因
            </label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="确认的根本原因..."
              className="w-full px-4 py-2.5 rounded-lg border border-mckinsey-border bg-mckinsey-light/50 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-mckinsey-navy block mb-2">
              ✅ 纠正措施
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="针对根本原因的纠正措施..."
              className="w-full px-4 py-2.5 rounded-lg border border-mckinsey-border bg-mckinsey-light/50 focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition"
            />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 rounded-xl bg-mckinsey-light border border-mckinsey-border">
        <h3 className="font-semibold text-sm text-mckinsey-navy mb-2">💡 使用技巧</h3>
        <ul className="text-xs text-mckinsey-muted space-y-1">
          <li>• 每个"为什么"的答案应该是事实，而非猜测</li>
          <li>• 通常3-7次追问即可触达根因，不一定要恰好5次</li>
          <li>• 如果答案分叉（多个原因），可以为每个分支分别追问</li>
          <li>• 验证根因：如果消除它，问题是否不再发生？</li>
        </ul>
      </div>
    </div>
  )
}
