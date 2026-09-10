import { useState } from 'react'
import { motion } from 'framer-motion'

interface StructureItem { id: string; name: string; level: 'system' | 'subsystem' | 'component' }
interface FunctionItem { id: string; elementId: string; function: string; requirement: string }
interface FailureItem { id: string; mode: string; effects: string[]; causes: string[]; isAi?: boolean }
interface RiskItem { id: string; failureId: string; cause: string; severity: number; occurrence: number; detection: number; ap: string; preventionControl: string; detectionControl: string }
interface OptimizeItem { id: string; riskId: string; action: string; responsible: string; target: string; newS: number; newO: number; newD: number; newAp: string }

const STEPS = [
  { id: 1, name: '规划和准备', icon: '📋' },
  { id: 2, name: '结构分析', icon: '🏗️' },
  { id: 3, name: '功能分析', icon: '⚙️' },
  { id: 4, name: '失效分析', icon: '⚠️' },
  { id: 5, name: '风险分析', icon: '📊' },
  { id: 6, name: '优化', icon: '🚀' },
  { id: 7, name: '结果文档化', icon: '📄' },
]

export default function DfmeaWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [projectInfo, setProjectInfo] = useState({ name: '', team: '', scope: '', date: '' })
  const [structures, setStructures] = useState<StructureItem[]>([])
  const [functions, setFunctions] = useState<FunctionItem[]>([])
  const [failures, setFailures] = useState<FailureItem[]>([])
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [optimizations, setOptimizations] = useState<OptimizeItem[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showStandards, setShowStandards] = useState(false)
  const [standards, setStandards] = useState<any>(null)

  // Load standards
  const loadStandards = async () => {
    if (standards) { setShowStandards(!showStandards); return }
    try {
      const res = await fetch('/api/v1/ai/fmea/standards/dfmea')
      const data = await res.json()
      setStandards(data)
      setShowStandards(true)
    } catch (e) { console.error(e) }
  }

  // Calculate AP
  const calcAP = async (s: number, o: number, d: number): Promise<string> => {
    try {
      const res = await fetch('/api/v1/ai/fmea/ap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: s, occurrence: o, detection: d }),
      })
      const data = await res.json()
      return data.ap
    } catch { return 'M' }
  }

  // AI: Generate failure chains
  const aiGenerateFailures = async (elementName: string, func: string) => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/v1/ai/fmea/failure-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fmea_type: 'dfmea', focus_element: elementName, function: func, upper_level: structures.find(s => s.level === 'system')?.name }),
      })
      const json = await res.json()
      if (json.success && json.data?.failure_chains) {
        const newFailures = json.data.failure_chains.map((fc: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          mode: fc.failure_mode,
          effects: fc.failure_effects || [],
          causes: fc.failure_causes || [],
          isAi: true,
        }))
        setFailures([...failures, ...newFailures])
      }
    } catch (e) { console.error(e) }
    finally { setIsAiLoading(false) }
  }

  // AI: Optimize
  const aiOptimize = async (risk: RiskItem) => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/v1/ai/fmea/optimize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fmea_type: 'dfmea', failure_mode: failures.find(f => f.id === risk.failureId)?.mode || '', cause: risk.cause, current_controls: risk.preventionControl + '; ' + risk.detectionControl, severity: risk.severity, occurrence: risk.occurrence, detection: risk.detection }),
      })
      const json = await res.json()
      if (json.success && json.data?.recommendations) {
        const newOpts = json.data.recommendations.map((r: any, i: number) => ({
          id: `opt-${Date.now()}-${i}`, riskId: risk.id, action: r.action, responsible: r.responsible || '', target: r.target || 'O', newS: risk.severity, newO: Math.max(1, risk.occurrence - 2), newD: Math.max(1, risk.detection - 2), newAp: 'M',
        }))
        setOptimizations([...optimizations, ...newOpts])
      }
    } catch (e) { console.error(e) }
    finally { setIsAiLoading(false) }
  }

  const apColor = (ap: string) => ap === 'H' ? 'bg-red-100 text-red-700' : ap === 'M' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">AI-DFMEA</h1>
      <p className="text-sm text-mckinsey-muted mb-6">设计失效模式与影响分析 · AIAG-VDA 2019 七步法</p>

      {/* Step Navigation */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <button key={step.id} onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              currentStep === step.id ? 'bg-mckinsey-teal text-white shadow-md' : currentStep > step.id ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'bg-mckinsey-light text-mckinsey-muted'
            }`}>
            <span>{step.icon}</span>
            <span className="hidden sm:inline">{step.name}</span>
            <span className="sm:hidden">{step.id}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
        
        {/* Step 1: Planning */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📋 Step 1: 规划和准备</h2>
            <p className="text-sm text-mckinsey-muted">定义FMEA项目的范围、团队和目标。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">项目名称</label>
                <input type="text" value={projectInfo.name} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" placeholder="例如：刹车系统DFMEA" /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">日期</label>
                <input type="date" value={projectInfo.date} onChange={e => setProjectInfo({...projectInfo, date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">团队成员</label>
                <input type="text" value={projectInfo.team} onChange={e => setProjectInfo({...projectInfo, team: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" placeholder="设计、工艺、质量..." /></div>
              <div><label className="text-xs font-medium text-mckinsey-navy block mb-1">分析范围</label>
                <input type="text" value={projectInfo.scope} onChange={e => setProjectInfo({...projectInfo, scope: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-mckinsey-border focus:ring-2 focus:ring-mckinsey-teal focus:outline-none" placeholder="系统边界、接口..." /></div>
            </div>
          </div>
        )}

        {/* Step 2: Structure Analysis */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">🏗️ Step 2: 结构分析</h2>
            <p className="text-sm text-mckinsey-muted">定义系统 → 子系统 → 组件的三层结构。</p>
            {['system', 'subsystem', 'component'].map(level => (
              <div key={level} className="border border-mckinsey-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-mckinsey-navy mb-2 capitalize">{level === 'system' ? '🔷 系统层' : level === 'subsystem' ? '🔹 子系统层' : '▪️ 组件层'}</h3>
                <div className="space-y-2">
                  {structures.filter(s => s.level === level).map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input type="text" value={s.name} onChange={e => setStructures(structures.map(st => st.id === s.id ? {...st, name: e.target.value} : st))}
                        className="flex-1 px-3 py-1.5 rounded border border-mckinsey-border/50 text-sm focus:ring-1 focus:ring-mckinsey-teal focus:outline-none" />
                      <button onClick={() => setStructures(structures.filter(st => st.id !== s.id))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setStructures([...structures, { id: `${level}-${Date.now()}`, name: '', level: level as any }])}
                    className="text-xs text-mckinsey-teal hover:underline">+ 添加{level === 'system' ? '系统' : level === 'subsystem' ? '子系统' : '组件'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Function Analysis */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">⚙️ Step 3: 功能分析</h2>
            <p className="text-sm text-mckinsey-muted">为每个结构元素定义功能和要求。</p>
            {structures.filter(s => s.name.trim()).map(s => (
              <div key={s.id} className="border border-mckinsey-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-mckinsey-navy mb-2">{s.name}</h3>
                {functions.filter(f => f.elementId === s.id).map(f => (
                  <div key={f.id} className="flex gap-2 mb-2">
                    <input type="text" value={f.function} onChange={e => setFunctions(functions.map(fn => fn.id === f.id ? {...fn, function: e.target.value} : fn))} placeholder="功能" className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border/50 text-xs focus:ring-1 focus:ring-mckinsey-teal focus:outline-none" />
                    <input type="text" value={f.requirement} onChange={e => setFunctions(functions.map(fn => fn.id === f.id ? {...fn, requirement: e.target.value} : fn))} placeholder="要求/规格" className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border/50 text-xs focus:ring-1 focus:ring-mckinsey-teal focus:outline-none" />
                  </div>
                ))}
                <button onClick={() => setFunctions([...functions, { id: `fn-${Date.now()}`, elementId: s.id, function: '', requirement: '' }])}
                  className="text-xs text-mckinsey-teal hover:underline">+ 添加功能</button>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Failure Analysis (AI) */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">⚠️ Step 4: 失效分析</h2>
            <p className="text-sm text-mckinsey-muted">识别失效模式、影响和原因。可使用 AI 自动生成。</p>
            
            {/* AI Generate Button */}
            {structures.filter(s => s.level === 'component' && s.name.trim()).length > 0 && (
              <div className="bg-mckinsey-teal/5 border border-mckinsey-teal/20 rounded-lg p-4">
                <p className="text-sm text-mckinsey-navy mb-2">选择组件，AI 自动生成失效链：</p>
                <div className="flex flex-wrap gap-2">
                  {structures.filter(s => s.level === 'component' && s.name.trim()).map(s => {
                    const func = functions.find(f => f.elementId === s.id)?.function || s.name
                    return (
                      <button key={s.id} onClick={() => aiGenerateFailures(s.name, func)} disabled={isAiLoading}
                        className="px-3 py-1.5 rounded-lg bg-mckinsey-teal text-white text-xs font-medium hover:bg-mckinsey-teal/90 disabled:opacity-50 transition">
                        🤖 {s.name}
                      </button>
                    )
                  })}
                </div>
                {isAiLoading && <p className="text-xs text-mckinsey-teal mt-2 animate-pulse">AI 分析中...</p>}
              </div>
            )}

            {/* Failure List */}
            {failures.map((f, i) => (
              <div key={f.id} className={`border rounded-lg p-4 ${f.isAi ? 'border-mckinsey-teal/30 bg-mckinsey-teal/5' : 'border-mckinsey-border'}`}>
                {f.isAi && <span className="text-xs text-mckinsey-teal font-medium">✨ AI 生成</span>}
                <div className="mt-1 space-y-2">
                  <div><span className="text-xs text-mckinsey-muted">失效模式：</span><span className="text-sm text-mckinsey-navy font-medium">{f.mode}</span></div>
                  <div><span className="text-xs text-mckinsey-muted">影响：</span><span className="text-xs text-mckinsey-navy">{f.effects.join(' | ')}</span></div>
                  <div><span className="text-xs text-mckinsey-muted">原因：</span><span className="text-xs text-mckinsey-navy">{f.causes.join(' | ')}</span></div>
                </div>
              </div>
            ))}
            
            <button onClick={() => setFailures([...failures, { id: `f-${Date.now()}`, mode: '', effects: [''], causes: [''], isAi: false }])}
              className="text-sm text-mckinsey-teal hover:underline">+ 手动添加失效模式</button>
          </div>
        )}

        {/* Step 5: Risk Analysis */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📊 Step 5: 风险分析</h2>
            <p className="text-sm text-mckinsey-muted">评估 S/O/D 并计算 AP（行动优先级）。</p>
            
            <button onClick={loadStandards} className="text-xs px-3 py-1.5 rounded bg-mckinsey-light border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy transition">
              {showStandards ? '📖 收起评分标准' : '📖 展开评分标准参考'}
            </button>
            
            {showStandards && standards && (
              <div className="border border-mckinsey-border rounded-lg p-4 max-h-60 overflow-y-auto text-xs">
                <h4 className="font-semibold mb-2">严重度 (S)</h4>
                {standards.severity.map((s: any) => <div key={s.score} className="flex gap-2 mb-1"><span className="font-mono w-6">{s.score}</span><span className="text-mckinsey-muted">{s.effect} — {s.description}</span></div>)}
                <h4 className="font-semibold mt-3 mb-2">发生度 (O)</h4>
                {standards.occurrence.map((o: any) => <div key={o.score} className="flex gap-2 mb-1"><span className="font-mono w-6">{o.score}</span><span className="text-mckinsey-muted">{o.level} — {o.description}</span></div>)}
                <h4 className="font-semibold mt-3 mb-2">探测度 (D)</h4>
                {standards.detection.map((d: any) => <div key={d.score} className="flex gap-2 mb-1"><span className="font-mono w-6">{d.score}</span><span className="text-mckinsey-muted">{d.level} — {d.description}</span></div>)}
              </div>
            )}

            {failures.filter(f => f.mode).map(f => (
              <div key={f.id} className="border border-mckinsey-border rounded-lg p-4">
                <p className="text-sm font-medium text-mckinsey-navy mb-2">{f.mode}</p>
                {f.causes.map((cause, ci) => {
                  const existing = risks.find(r => r.failureId === f.id && r.cause === cause)
                  return (
                    <div key={ci} className="flex items-center gap-2 mb-2 ml-4">
                      <span className="text-xs text-mckinsey-muted w-32 truncate">{cause}</span>
                      <select value={existing?.severity || 1} onChange={async e => { const s = Number(e.target.value); const o = existing?.occurrence || 1; const d = existing?.detection || 1; const ap = await calcAP(s, o, d); const r = { id: existing?.id || `r-${Date.now()}-${ci}`, failureId: f.id, cause, severity: s, occurrence: o, detection: d, ap, preventionControl: '', detectionControl: '' }; setRisks(existing ? risks.map(ri => ri.id === existing.id ? r : ri) : [...risks, r]) }}
                        className="w-14 px-1 py-1 rounded border border-mckinsey-border/50 text-xs">{[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select>
                      <span className="text-xs text-mckinsey-muted">S</span>
                      <select value={existing?.occurrence || 1} onChange={async e => { const o = Number(e.target.value); const s = existing?.severity || 1; const d = existing?.detection || 1; const ap = await calcAP(s, o, d); if (existing) setRisks(risks.map(r => r.id === existing.id ? {...r, occurrence: o, ap} : r)) }}
                        className="w-14 px-1 py-1 rounded border border-mckinsey-border/50 text-xs">{[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select>
                      <span className="text-xs text-mckinsey-muted">O</span>
                      <select value={existing?.detection || 1} onChange={async e => { const d = Number(e.target.value); const s = existing?.severity || 1; const o = existing?.occurrence || 1; const ap = await calcAP(s, o, d); if (existing) setRisks(risks.map(r => r.id === existing.id ? {...r, detection: d, ap} : r)) }}
                        className="w-14 px-1 py-1 rounded border border-mckinsey-border/50 text-xs">{[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select>
                      <span className="text-xs text-mckinsey-muted">D</span>
                      {existing && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${apColor(existing.ap)}`}>AP={existing.ap}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Step 6: Optimization (AI) */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">🚀 Step 6: 优化</h2>
            <p className="text-sm text-mckinsey-muted">对高AP项制定改进措施。AI可建议改进方案。</p>
            
            {risks.filter(r => r.ap === 'H' || r.ap === 'M').sort((a, b) => (a.ap === 'H' ? 0 : 1) - (b.ap === 'H' ? 0 : 1)).map(risk => (
              <div key={risk.id} className="border border-mckinsey-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-mckinsey-navy">{risk.cause}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${apColor(risk.ap)}`}>AP={risk.ap}</span>
                    <button onClick={() => aiOptimize(risk)} disabled={isAiLoading} className="px-3 py-1 rounded bg-mckinsey-teal text-white text-xs hover:bg-mckinsey-teal/90 disabled:opacity-50">
                      🤖 AI建议
                    </button>
                  </div>
                </div>
                <div className="text-xs text-mckinsey-muted">S={risk.severity} O={risk.occurrence} D={risk.detection}</div>
                {optimizations.filter(o => o.riskId === risk.id).map(opt => (
                  <div key={opt.id} className="mt-2 ml-4 p-2 rounded bg-mckinsey-teal/5 border border-mckinsey-teal/20 text-xs">
                    <span className="text-mckinsey-teal font-medium">✨ </span>{opt.action} <span className="text-mckinsey-muted ml-2">({opt.responsible}, 目标: {opt.target})</span>
                  </div>
                ))}
              </div>
            ))}
            {isAiLoading && <p className="text-xs text-mckinsey-teal animate-pulse">AI 优化建议生成中...</p>}
          </div>
        )}

        {/* Step 7: Documentation */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-mckinsey-navy">📄 Step 7: 结果文档化</h2>
            <p className="text-sm text-mckinsey-muted">汇总所有分析结果。</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-mckinsey-light">
                  <th className="p-2 text-left border border-mckinsey-border">失效模式</th>
                  <th className="p-2 text-left border border-mckinsey-border">影响</th>
                  <th className="p-2 text-left border border-mckinsey-border">原因</th>
                  <th className="p-2 text-center border border-mckinsey-border">S</th>
                  <th className="p-2 text-center border border-mckinsey-border">O</th>
                  <th className="p-2 text-center border border-mckinsey-border">D</th>
                  <th className="p-2 text-center border border-mckinsey-border">AP</th>
                  <th className="p-2 text-left border border-mckinsey-border">优化措施</th>
                </tr></thead>
                <tbody>
                  {failures.filter(f => f.mode).map(f => 
                    f.causes.map((cause, ci) => {
                      const risk = risks.find(r => r.failureId === f.id && r.cause === cause)
                      const opts = optimizations.filter(o => o.riskId === risk?.id)
                      return (
                        <tr key={`${f.id}-${ci}`} className="border-t border-mckinsey-border">
                          {ci === 0 && <td className="p-2 border border-mckinsey-border" rowSpan={f.causes.length}>{f.mode}</td>}
                          {ci === 0 && <td className="p-2 border border-mckinsey-border" rowSpan={f.causes.length}>{f.effects.join('; ')}</td>}
                          <td className="p-2 border border-mckinsey-border">{cause}</td>
                          <td className="p-2 text-center border border-mckinsey-border">{risk?.severity || '-'}</td>
                          <td className="p-2 text-center border border-mckinsey-border">{risk?.occurrence || '-'}</td>
                          <td className="p-2 text-center border border-mckinsey-border">{risk?.detection || '-'}</td>
                          <td className="p-2 text-center border border-mckinsey-border">{risk && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${apColor(risk.ap)}`}>{risk.ap}</span>}</td>
                          <td className="p-2 border border-mckinsey-border">{opts.map(o => o.action).join('; ') || '-'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button className="btn-primary">📥 导出 Excel (AIAG-VDA 格式)</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}
          className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm text-mckinsey-muted hover:text-mckinsey-navy disabled:opacity-30 transition">
          ← 上一步
        </button>
        <button onClick={() => setCurrentStep(Math.min(7, currentStep + 1))} disabled={currentStep === 7}
          className="px-4 py-2 rounded-lg bg-mckinsey-teal text-white text-sm font-medium hover:bg-mckinsey-teal/90 disabled:opacity-30 transition">
          下一步 →
        </button>
      </div>
    </div>
  )
}
