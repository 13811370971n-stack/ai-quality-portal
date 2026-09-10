import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'

interface ParetoItem {
  category: string
  count: number
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export default function ParetoTool() {
  const [items, setItems] = useState<ParetoItem[]>([
    { category: '外观缺陷', count: 45 },
    { category: '尺寸超差', count: 25 },
    { category: '功能故障', count: 15 },
    { category: '包装损坏', count: 10 },
    { category: '其他', count: 5 },
  ])
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [afterItems, setAfterItems] = useState<ParetoItem[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [compareResult, setCompareResult] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const chartRef = useRef<SVGSVGElement>(null)

  const total = d3.sum(items, d => d.count)

  const addItem = () => setItems([...items, { category: '新类别', count: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: 'category' | 'count', value: string) => {
    const updated = [...items]
    updated[idx] = field === 'count' ? { ...updated[idx], count: Number(value) || 0 } : { ...updated[idx], category: value }
    setItems(updated)
  }

  // Auto-analyze when data changes significantly
  const analyzeWithAI = async () => {
    if (total === 0) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/v1/ai/pareto/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (json.success) setAiAnalysis(json.data)
    } catch (e) { console.error(e) }
    finally { setIsAnalyzing(false) }
  }

  const compareWithAI = async () => {
    if (afterItems.length === 0) return
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/v1/ai/pareto/compare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ before: items, after: afterItems }),
      })
      const json = await res.json()
      if (json.success) setCompareResult(json.data)
    } catch (e) { console.error(e) }
    finally { setIsAnalyzing(false) }
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const newMessages = [...chatMessages, { role: 'user' as const, content: chatInput }]
    setChatMessages(newMessages)
    setChatInput('')
    setIsChatting(true)
    try {
      const res = await fetch('/api/v1/ai/pareto/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, question: chatInput, history: newMessages.slice(-10) }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setChatMessages([...newMessages, { role: 'ai', content: json.data.answer }])
      }
    } catch (e) { console.error(e) }
    finally { setIsChatting(false) }
  }

  // Draw chart (same D3 logic as before)
  useEffect(() => {
    if (!chartRef.current || items.length === 0 || total === 0) return
    const svg = d3.select(chartRef.current); svg.selectAll('*').remove()
    const sorted = [...items].sort((a, b) => b.count - a.count)
    let cumulative = 0
    const dataWithCum = sorted.map(d => { cumulative += d.count; return { ...d, cumPct: (cumulative / total) * 100 } })
    const margin = { top: 30, right: 60, bottom: 80, left: 60 }
    const width = 600 - margin.left - margin.right, height = 340 - margin.top - margin.bottom
    const g = svg.attr('viewBox', '0 0 600 340').append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const x = d3.scaleBand().domain(dataWithCum.map(d => d.category)).range([0, width]).padding(0.2)
    const yLeft = d3.scaleLinear().domain([0, d3.max(dataWithCum, d => d.count)! * 1.1]).range([height, 0])
    const yRight = d3.scaleLinear().domain([0, 100]).range([height, 0])
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text').attr('transform', 'rotate(-25)').attr('text-anchor', 'end').attr('font-size', 10)
    g.append('g').call(d3.axisLeft(yLeft).ticks(6))
    g.append('g').attr('transform', `translate(${width},0)`).call(d3.axisRight(yRight).ticks(5).tickFormat(d => d + '%'))
    g.append('line').attr('x1', 0).attr('x2', width).attr('y1', yRight(80)).attr('y2', yRight(80)).attr('stroke', '#ef4444').attr('stroke-width', 1).attr('stroke-dasharray', '5,3')
    g.selectAll('.bar').data(dataWithCum).enter().append('rect').attr('x', d => x(d.category)!).attr('y', d => yLeft(d.count)).attr('width', x.bandwidth()).attr('height', d => height - yLeft(d.count)).attr('fill', '#00A0AF').attr('opacity', 0.8).attr('rx', 3)
    const line = d3.line<typeof dataWithCum[0]>().x(d => x(d.category)! + x.bandwidth() / 2).y(d => yRight(d.cumPct))
    g.append('path').datum(dataWithCum).attr('d', line).attr('fill', 'none').attr('stroke', '#C5A572').attr('stroke-width', 2.5)
    g.selectAll('.dot').data(dataWithCum).enter().append('circle').attr('cx', d => x(d.category)! + x.bandwidth() / 2).attr('cy', d => yRight(d.cumPct)).attr('r', 4).attr('fill', '#C5A572')
  }, [items, total])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">📉 AI-帕累托图</h1>
          <p className="text-sm text-mckinsey-muted">AI 解读分析 + 对话追问 + 改善前后对比</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('single')} className={`px-3 py-1.5 rounded text-xs font-medium ${mode === 'single' ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'text-mckinsey-muted'}`}>单组分析</button>
          <button onClick={() => setMode('compare')} className={`px-3 py-1.5 rounded text-xs font-medium ${mode === 'compare' ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'text-mckinsey-muted'}`}>前后对比</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Input */}
        <div className="lg:col-span-1">
          <div className="card !p-4">
            <h3 className="font-semibold text-mckinsey-navy text-sm mb-3">{mode === 'compare' ? '改善前数据' : '数据输入'}</h3>
            <div className="space-y-2 mb-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={item.category} onChange={(e) => updateItem(i, 'category', e.target.value)} className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
                  <input type="number" value={item.count} onChange={(e) => updateItem(i, 'count', e.target.value)} className="w-16 px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="w-full py-1.5 rounded-lg border border-dashed border-mckinsey-border text-xs hover:border-mckinsey-teal/30 transition">+ 添加</button>
            
            {mode === 'compare' && (
              <div className="mt-4 pt-4 border-t border-mckinsey-border">
                <h3 className="font-semibold text-mckinsey-navy text-sm mb-3">改善后数据</h3>
                {afterItems.length === 0 ? (
                  <button onClick={() => setAfterItems(items.map(i => ({ ...i, count: Math.round(i.count * 0.7) })))} className="w-full py-2 rounded-lg bg-mckinsey-light text-xs text-mckinsey-muted hover:text-mckinsey-teal transition">
                    点击复制改善前数据作为模板
                  </button>
                ) : (
                  <div className="space-y-2">
                    {afterItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex-1 text-xs text-mckinsey-muted truncate">{item.category}</span>
                        <input type="number" value={item.count} onChange={(e) => { const u = [...afterItems]; u[i] = { ...u[i], count: Number(e.target.value) || 0 }; setAfterItems(u) }}
                          className="w-16 px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button onClick={mode === 'compare' ? compareWithAI : analyzeWithAI} disabled={isAnalyzing || total === 0}
              className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white text-sm font-medium hover:shadow-lg transition disabled:opacity-50">
              {isAnalyzing ? '⚙️ 分析中...' : '🤖 AI 分析'}
            </button>
          </div>
        </div>

        {/* Chart + AI Analysis */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card !p-4 bg-white">
            <svg ref={chartRef} className="w-full" style={{ minHeight: 340 }} />
          </div>
          
          {aiAnalysis && mode === 'single' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-4">
              <h3 className="font-semibold text-mckinsey-navy text-sm mb-2">🤖 AI 分析</h3>
              <p className="text-sm text-mckinsey-navy mb-2">{aiAnalysis.summary}</p>
              <ul className="text-xs text-mckinsey-muted space-y-1 mb-3">
                {aiAnalysis.key_findings?.map((f: string, i: number) => <li key={i}>• {f}</li>)}
              </ul>
              {aiAnalysis.recommendation && <p className="text-xs text-mckinsey-teal">💡 {aiAnalysis.recommendation}</p>}
            </motion.div>
          )}

          {compareResult && mode === 'compare' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card !p-4">
              <h3 className="font-semibold text-mckinsey-navy text-sm mb-2">🤖 对比分析</h3>
              <p className="text-sm text-mckinsey-navy mb-2">{compareResult.summary}</p>
              {compareResult.findings?.map((f: string, i: number) => <p key={i} className="text-xs text-mckinsey-muted">• {f}</p>)}
              {compareResult.next_steps && (
                <div className="mt-2 pt-2 border-t border-mckinsey-border">
                  <p className="text-xs font-medium text-mckinsey-navy">后续建议：</p>
                  {compareResult.next_steps.map((s: string, i: number) => <p key={i} className="text-xs text-mckinsey-teal">→ {s}</p>)}
                </div>
              )}
            </motion.div>
          )}

          {/* Chat */}
          <div className="card !p-4">
            <h3 className="font-semibold text-mckinsey-navy text-sm mb-2">💬 追问 AI</h3>
            <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`text-xs p-2 rounded ${msg.role === 'user' ? 'bg-mckinsey-light text-mckinsey-navy ml-8' : 'bg-mckinsey-teal/5 text-mckinsey-navy mr-8'}`}>
                  {msg.role === 'ai' && <span className="text-mckinsey-teal font-medium">🤖 </span>}
                  {msg.content}
                </div>
              ))}
              {isChatting && <p className="text-xs text-mckinsey-teal animate-pulse">🤖 思考中...</p>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="例如：划伤的主要原因可能是什么？"
                className="flex-1 px-3 py-2 rounded-lg border border-mckinsey-border bg-white text-xs focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
              <button onClick={sendChat} disabled={isChatting} className="px-4 py-2 rounded-lg bg-mckinsey-teal text-white text-xs font-medium hover:bg-mckinsey-teal/90 disabled:opacity-50">发送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
