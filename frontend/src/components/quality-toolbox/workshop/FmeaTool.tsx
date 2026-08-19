import { useState } from 'react'
import { motion } from 'framer-motion'

interface FmeaRow {
  id: string
  processStep: string
  failureMode: string
  effect: string
  severity: number
  cause: string
  occurrence: number
  control: string
  detection: number
  action: string
}

const emptyRow = (): FmeaRow => ({
  id: Date.now().toString(),
  processStep: '',
  failureMode: '',
  effect: '',
  severity: 1,
  cause: '',
  occurrence: 1,
  control: '',
  detection: 1,
  action: '',
})

export default function FmeaTool() {
  const [title, setTitle] = useState('过程FMEA')
  const [rows, setRows] = useState<FmeaRow[]>([emptyRow()])

  const addRow = () => setRows([...rows, emptyRow()])

  const removeRow = (idx: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: keyof FmeaRow, value: string | number) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], [field]: value }
    setRows(updated)
  }

  const rpn = (row: FmeaRow) => row.severity * row.occurrence * row.detection

  const rpnColor = (val: number) => {
    if (val >= 200) return 'bg-red-100 text-red-700'
    if (val >= 100) return 'bg-amber-100 text-amber-700'
    if (val >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const resetAll = () => {
    setRows([emptyRow()])
    setTitle('过程FMEA')
  }

  // Sort by RPN descending for display
  const sortedRows = [...rows].map((r, i) => ({ ...r, originalIdx: i })).sort((a, b) => rpn(b) - rpn(a))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">⚠️ FMEA</h1>
          <p className="text-sm text-mckinsey-muted">
            失效模式与影响分析 — 识别风险，计算RPN，确定改进优先级
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 重置
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold text-mckinsey-navy px-3 py-1 rounded border border-transparent hover:border-mckinsey-border bg-transparent focus:outline-none focus:border-mckinsey-teal w-full"
        />
      </div>

      {/* FMEA Table */}
      <div className="overflow-x-auto rounded-2xl border border-mckinsey-border shadow-sm mb-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-mckinsey-light text-mckinsey-navy">
              <th className="px-3 py-3 text-left font-semibold min-w-[100px]">过程步骤</th>
              <th className="px-3 py-3 text-left font-semibold min-w-[120px]">潜在失效模式</th>
              <th className="px-3 py-3 text-left font-semibold min-w-[120px]">潜在影响</th>
              <th className="px-3 py-3 text-center font-semibold w-12">S</th>
              <th className="px-3 py-3 text-left font-semibold min-w-[120px]">潜在原因</th>
              <th className="px-3 py-3 text-center font-semibold w-12">O</th>
              <th className="px-3 py-3 text-left font-semibold min-w-[120px]">现行控制</th>
              <th className="px-3 py-3 text-center font-semibold w-12">D</th>
              <th className="px-3 py-3 text-center font-semibold w-16">RPN</th>
              <th className="px-3 py-3 text-left font-semibold min-w-[120px]">建议措施</th>
              <th className="px-3 py-3 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-mckinsey-border hover:bg-mckinsey-light/30"
              >
                <td className="px-2 py-2">
                  <input type="text" value={row.processStep} onChange={(e) => updateRow(idx, 'processStep', e.target.value)} placeholder="步骤" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <input type="text" value={row.failureMode} onChange={(e) => updateRow(idx, 'failureMode', e.target.value)} placeholder="失效模式" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <input type="text" value={row.effect} onChange={(e) => updateRow(idx, 'effect', e.target.value)} placeholder="影响" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <select value={row.severity} onChange={(e) => updateRow(idx, 'severity', Number(e.target.value))} className="w-full px-1 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none text-xs text-center">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input type="text" value={row.cause} onChange={(e) => updateRow(idx, 'cause', e.target.value)} placeholder="原因" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <select value={row.occurrence} onChange={(e) => updateRow(idx, 'occurrence', Number(e.target.value))} className="w-full px-1 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none text-xs text-center">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <input type="text" value={row.control} onChange={(e) => updateRow(idx, 'control', e.target.value)} placeholder="控制方法" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <select value={row.detection} onChange={(e) => updateRow(idx, 'detection', Number(e.target.value))} className="w-full px-1 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none text-xs text-center">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2 text-center">
                  <span className={`inline-block px-2 py-1 rounded-full font-bold text-xs ${rpnColor(rpn(row))}`}>
                    {rpn(row)}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <input type="text" value={row.action} onChange={(e) => updateRow(idx, 'action', e.target.value)} placeholder="改进措施" className="w-full px-2 py-1.5 rounded border border-mckinsey-border/50 bg-white focus:outline-none focus:ring-1 focus:ring-mckinsey-teal text-xs" />
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600">✕</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="px-4 py-2 rounded-lg border border-dashed border-mckinsey-border text-sm hover:border-mckinsey-teal/30 text-mckinsey-muted hover:text-mckinsey-teal transition"
      >
        + 添加行
      </button>

      {/* RPN Summary */}
      {rows.some(r => rpn(r) > 1) && (
        <div className="mt-8 card">
          <h3 className="font-semibold text-mckinsey-navy mb-3">📊 RPN 风险排序</h3>
          <div className="space-y-2">
            {sortedRows.filter(r => rpn(r) > 1).map((row, i) => (
              <div key={row.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-mckinsey-muted w-6">#{i + 1}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rpnColor(rpn(row))}`}>
                  RPN={rpn(row)}
                </span>
                <span className="text-sm text-mckinsey-navy">
                  {row.failureMode || '(未填写)'}
                </span>
                <span className="text-xs text-mckinsey-muted">
                  S={row.severity} × O={row.occurrence} × D={row.detection}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-mckinsey-muted">
            <span className="inline-block w-3 h-3 rounded-full bg-red-100 mr-1"></span>≥200 高风险
            <span className="inline-block w-3 h-3 rounded-full bg-amber-100 mr-1 ml-3"></span>100-199 中高
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 mr-1 ml-3"></span>50-99 中等
            <span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-1 ml-3"></span>&lt;50 低风险
          </div>
        </div>
      )}
    </div>
  )
}
