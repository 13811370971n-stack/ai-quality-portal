import { useState } from 'react'
import { motion } from 'framer-motion'

interface Row {
  id: string
  label: string
  counts: number[]
}

export default function CheckSheetTool() {
  const [title, setTitle] = useState('缺陷检查表')
  const [columns, setColumns] = useState(['周一', '周二', '周三', '周四', '周五'])
  const [rows, setRows] = useState<Row[]>([
    { id: '1', label: '划伤', counts: [0, 0, 0, 0, 0] },
    { id: '2', label: '凹坑', counts: [0, 0, 0, 0, 0] },
    { id: '3', label: '色差', counts: [0, 0, 0, 0, 0] },
    { id: '4', label: '变形', counts: [0, 0, 0, 0, 0] },
  ])

  const increment = (rowIdx: number, colIdx: number) => {
    const updated = [...rows]
    updated[rowIdx] = {
      ...updated[rowIdx],
      counts: updated[rowIdx].counts.map((c, i) => (i === colIdx ? c + 1 : c)),
    }
    setRows(updated)
  }

  const decrement = (rowIdx: number, colIdx: number) => {
    const updated = [...rows]
    updated[rowIdx] = {
      ...updated[rowIdx],
      counts: updated[rowIdx].counts.map((c, i) => (i === colIdx ? Math.max(0, c - 1) : c)),
    }
    setRows(updated)
  }

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), label: '新类别', counts: columns.map(() => 0) }])
  }

  const addColumn = () => {
    setColumns([...columns, `列${columns.length + 1}`])
    setRows(rows.map((r) => ({ ...r, counts: [...r.counts, 0] })))
  }

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx))
  }

  const rowTotals = rows.map((r) => r.counts.reduce((a, b) => a + b, 0))
  const colTotals = columns.map((_, ci) => rows.reduce((sum, r) => sum + r.counts[ci], 0))
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0)

  const resetAll = () => {
    setRows(rows.map((r) => ({ ...r, counts: r.counts.map(() => 0) })))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">☑️ 检查表</h1>
          <p className="text-sm text-mckinsey-muted">
            点击单元格计数，自动汇总统计
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 清零
        </button>
      </div>

      {/* Title */}
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold px-3 py-1 rounded border border-transparent hover:border-mckinsey-border bg-transparent focus:outline-none focus:border-mckinsey-teal w-full"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-mckinsey-border mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mckinsey-light">
              <th className="px-4 py-3 text-left font-medium">缺陷类别</th>
              {columns.map((col, ci) => (
                <th key={ci} className="px-4 py-3 text-center font-medium min-w-[80px]">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => {
                      const updated = [...columns]
                      updated[ci] = e.target.value
                      setColumns(updated)
                    }}
                    className="w-full text-center bg-transparent border-none focus:outline-none font-medium"
                  />
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold">合计</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-mckinsey-border"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => {
                        const updated = [...rows]
                        updated[ri] = { ...updated[ri], label: e.target.value }
                        setRows(updated)
                      }}
                      className="bg-transparent border-none focus:outline-none w-full"
                    />
                    <button
                      onClick={() => removeRow(ri)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </td>
                {row.counts.map((count, ci) => (
                  <td key={ci} className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => decrement(ri, ci)}
                        className="w-6 h-6 rounded text-xs bg-mckinsey-light hover:bg-red-100 transition"
                      >
                        -
                      </button>
                      <button
                        onClick={() => increment(ri, ci)}
                        className="w-10 h-8 rounded font-mono text-sm font-bold bg-mckinsey-light/50 hover:bg-mckinsey-teal/10 transition cursor-pointer"
                      >
                        {count}
                      </button>
                      <button
                        onClick={() => increment(ri, ci)}
                        className="w-6 h-6 rounded text-xs bg-mckinsey-light hover:bg-green-100 transition"
                      >
                        +
                      </button>
                    </div>
                  </td>
                ))}
                <td className="px-4 py-2 text-center font-bold text-mckinsey-teal">
                  {rowTotals[ri]}
                </td>
              </motion.tr>
            ))}
            {/* Column totals */}
            <tr className="border-t-2 border-mckinsey-border bg-mckinsey-light/50">
              <td className="px-4 py-3 font-bold">合计</td>
              {colTotals.map((total, ci) => (
                <td key={ci} className="px-4 py-3 text-center font-bold">
                  {total}
                </td>
              ))}
              <td className="px-4 py-3 text-center font-bold text-mckinsey-teal text-lg">
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={addRow}
          className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition"
        >
          + 添加行
        </button>
        <button
          onClick={addColumn}
          className="px-4 py-2 rounded-lg border border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition"
        >
          + 添加列
        </button>
      </div>

      {/* Summary stats */}
      {grandTotal > 0 && (
        <div className="mt-8 p-4 rounded-xl border border-mckinsey-border">
          <h3 className="font-semibold mb-3">📊 数据摘要</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-mckinsey-teal">{grandTotal}</div>
              <div className="text-xs text-mckinsey-muted">总计数</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{rows.length}</div>
              <div className="text-xs text-mckinsey-muted">缺陷类别</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{columns.length}</div>
              <div className="text-xs text-mckinsey-muted">时间段</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {rows.length > 0 ? rows[rowTotals.indexOf(Math.max(...rowTotals))].label : '-'}
              </div>
              <div className="text-xs text-mckinsey-muted">最多缺陷类型</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
