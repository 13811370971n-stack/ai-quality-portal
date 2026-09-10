import { useState } from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  { id: 1, name: '规划和准备', icon: '📋' },
  { id: 2, name: '结构分析', icon: '🏗️' },
  { id: 3, name: '功能分析', icon: '⚙️' },
  { id: 4, name: '失效分析', icon: '⚠️' },
  { id: 5, name: '风险分析', icon: '📊' },
  { id: 6, name: '优化', icon: '🚀' },
  { id: 7, name: '结果文档化', icon: '📄' },
]

export default function PfmeaWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [projectInfo, setProjectInfo] = useState({ name: '', team: '', scope: '', date: '' })
  const [processSteps, setProcessSteps] = useState<{id: string; name: string; type: string}[]>([])
  const [functions, setFunctions] = useState<{id: string; stepId: string; function: string; requirement: string}[]>([])
  const [failures, setFailures] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [optimizations, setOptimizations] = useState<any[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showStandards, setShowStandards] = useState(false)
  const [standards, setStandards] = useState<any>(null)

  const loadStandards = async () => {
    if (standards) { setShowStandards(!showStandards); return }
    try { const res = await fetch('/api/v1/ai/fmea/standards/pfmea'); setStandards(await res.json()); setShowStandards(true) } catch {}
  }

  const calcAP = async (s: number, o: number, d: number) => {
    try { const res = await fetch('/api/v1/ai/fmea/ap', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({severity:s,occurrence:o,detection:d}) }); return (await res.json()).ap } catch { return 'M' }
  }

  const aiGenerateFailures = async (stepName: string, func: string) => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/v1/ai/fmea/failure-analysis', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fmea_type: 'pfmea', focus_element: stepName, function: func }) })
      const json = await res.json()
      if (json.success && json.data?.failure_chains) {
        setFailures([...failures, ...json.data.failure_chains.map((fc: any, i: number) => ({ id: `ai-${Date.now()}-${i}`, mode: fc.failure_mode, effects: fc.failure_effects || [], causes: fc.failure_causes || [], isAi: true }))])
      }
    } catch {} finally { setIsAiLoading(false) }
  }

  const apColor = (ap: string) => ap === 'H' ? 'bg-red-100 text-red-700' : ap === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">AI-PFMEA</h1>
      <p className="text-sm text-mckinsey-muted mb-6">过程失效模式与影响分析 · AIAG-VDA 2019 七步法</p>

      {/* Step Navigation */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map(step => (
          <button key={step.id} onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${currentStep === step.id ? 'bg-mckinsey-teal text-white shadow-md' : currentStep > step.id ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'bg-mckinsey-light text-mckinsey-muted'}`}>
            <span>{step.icon}</span><span className="hidden sm:inline">{step.name}</span><span className="sm:hidden">{step.id}</span>
          </button>
        ))}
      </div>

      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📋 Step 1: 规划和准备</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">过程名称</label><input type="text" value={projectInfo.name} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" placeholder="例如：PCB焊接过程" /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">日期</label><input type="date" value={projectInfo.date} onChange={e => setProjectInfo({...projectInfo, date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">团队成员</label><input type="text" value={projectInfo.team} onChange={e => setProjectInfo({...projectInfo, team: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">过程范围</label><input type="text" value={projectInfo.scope} onChange={e => setProjectInfo({...projectInfo, scope: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" /></div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">🏗️ Step 2: 过程结构</h2>
            <p className="text-sm text-mckinsey-muted">按顺序输入过程步骤（工序）。</p>
            {processSteps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-mckinsey-teal/10 text-mckinsey-teal flex items-center justify-center text-xs font-bold">{i+1}</span>
                <input type="text" value={step.name} onChange={e => setProcessSteps(processSteps.map(s => s.id === step.id ? {...s, name: e.target.value} : s))} placeholder={`工序 ${i+1}`} className="flex-1 px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none text-sm" />
                <button onClick={() => setProcessSteps(processSteps.filter(s => s.id !== step.id))} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
            <button onClick={() => setProcessSteps([...processSteps, { id: `ps-${Date.now()}`, name: '', type: 'process' }])} className="text-sm text-mckinsey-teal hover:underline">+ 添加过程步骤</button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">⚙️ Step 3: 功能分析</h2>
            {processSteps.filter(s => s.name.trim()).map(step => (
              <div key={step.id} className="border border-mckinsey-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-mckinsey-navy mb-2">{step.name}</h3>
                {functions.filter(f => f.stepId === step.id).map(f => (
                  <div key={f.id} className="flex gap-2 mb-2">
                    <input type="text" value={f.function} onChange={e => setFunctions(functions.map(fn => fn.id === f.id ? {...fn, function: e.target.value} : fn))} placeholder="过程功能" className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border/50 text-xs focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
                    <input type="text" value={f.requirement} onChange={e => setFunctions(functions.map(fn => fn.id === f.id ? {...fn, requirement: e.target.value} : fn))} placeholder="过程要求" className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border/50 text-xs focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
                  </div>
                ))}
                <button onClick={() => setFunctions([...functions, { id: `fn-${Date.now()}`, stepId: step.id, function: '', requirement: '' }])} className="text-xs text-mckinsey-teal hover:underline">+ 添加功能</button>
              </div>
            ))}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">⚠️ Step 4: 失效分析</h2>
            {processSteps.filter(s => s.name.trim()).length > 0 && (
              <div className="bg-mckinsey-teal/5 border border-mckinsey-teal/20 rounded-lg p-4">
                <p className="text-sm text-mckinsey-navy mb-2">选择工序，AI 自动生成失效链：</p>
                <div className="flex flex-wrap gap-2">
                  {processSteps.filter(s => s.name.trim()).map(s => {
                    const func = functions.find(f => f.stepId === s.id)?.function || s.name
                    return <button key={s.id} onClick={() => aiGenerateFailures(s.name, func)} disabled={isAiLoading} className="px-3 py-1.5 rounded-lg bg-mckinsey-teal text-white text-xs font-medium hover:bg-mckinsey-teal/90 disabled:opacity-50">🤖 {s.name}</button>
                  })}
                </div>
                {isAiLoading && <p className="text-xs text-mckinsey-teal mt-2 animate-pulse">AI 分析中...</p>}
              </div>
            )}
            {failures.map(f => (
              <div key={f.id} className={`border rounded-lg p-4 ${f.isAi ? 'border-mckinsey-teal/30 bg-mckinsey-teal/5' : 'border-mckinsey-border'}`}>
                {f.isAi && <span className="text-xs text-mckinsey-teal font-medium">✨ AI</span>}
                <div className="mt-1 space-y-1">
                  <div><span className="text-xs text-mckinsey-muted">失效模式：</span><span className="text-sm font-medium text-mckinsey-navy">{f.mode}</span></div>
                  <div><span className="text-xs text-mckinsey-muted">影响：</span><span className="text-xs">{f.effects.join(' | ')}</span></div>
                  <div><span className="text-xs text-mckinsey-muted">原因：</span><span className="text-xs">{f.causes.join(' | ')}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📊 Step 5: 风险分析</h2>
            <button onClick={loadStandards} className="text-xs px-3 py-1.5 rounded bg-mckinsey-light border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy">{showStandards ? '收起标准' : '📖 展开 PFMEA 评分标准'}</button>
            {showStandards && standards && (
              <div className="border border-mckinsey-border rounded-lg p-4 max-h-60 overflow-y-auto text-xs">
                <h4 className="font-semibold mb-2">严重度 (S)</h4>{standards.severity.map((s: any) => <div key={s.score}><span className="font-mono w-6 inline-block">{s.score}</span> {s.effect}</div>)}
                <h4 className="font-semibold mt-3 mb-2">发生度 (O)</h4>{standards.occurrence.map((o: any) => <div key={o.score}><span className="font-mono w-6 inline-block">{o.score}</span> {o.level} — {o.description}</div>)}
                <h4 className="font-semibold mt-3 mb-2">探测度 (D)</h4>{standards.detection.map((d: any) => <div key={d.score}><span className="font-mono w-6 inline-block">{d.score}</span> {d.level} — {d.description}</div>)}
              </div>
            )}
            <p className="text-sm text-mckinsey-muted">为每个失效原因评估 S/O/D（功能与 DFMEA Step 5 相同）</p>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">🚀 Step 6: 优化</h2>
            <p className="text-sm text-mckinsey-muted">对高AP项制定改进措施（功能与 DFMEA Step 6 相同）。</p>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📄 Step 7: 结果文档化</h2>
            <p className="text-sm text-mckinsey-muted">汇总PFMEA分析结果。</p>
            <button className="btn-primary">📥 导出 Excel (AIAG-VDA 格式)</button>
          </div>
        )}
      </motion.div>

      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm text-mckinsey-muted disabled:opacity-30">← 上一步</button>
        <button onClick={() => setCurrentStep(Math.min(7, currentStep + 1))} disabled={currentStep === 7} className="px-4 py-2 rounded-lg bg-mckinsey-teal text-white text-sm font-medium disabled:opacity-30">下一步 →</button>
      </div>
    </div>
  )
}
