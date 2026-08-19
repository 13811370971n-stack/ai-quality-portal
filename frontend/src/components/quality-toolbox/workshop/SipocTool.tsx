import { useState } from 'react'
import { motion } from 'framer-motion'

interface SipocData {
  processName: string
  suppliers: string[]
  inputs: string[]
  processSteps: string[]
  outputs: string[]
  customers: string[]
}

const defaultData: SipocData = {
  processName: '',
  suppliers: [''],
  inputs: [''],
  processSteps: ['', '', '', '', ''],
  outputs: [''],
  customers: [''],
}

export default function SipocTool() {
  const [data, setData] = useState<SipocData>(defaultData)

  const updateField = (field: keyof SipocData, value: string) => {
    setData({ ...data, [field]: value })
  }

  const updateList = (field: keyof SipocData, idx: number, value: string) => {
    const list = [...(data[field] as string[])]
    list[idx] = value
    setData({ ...data, [field]: list })
  }

  const addToList = (field: keyof SipocData) => {
    setData({ ...data, [field]: [...(data[field] as string[]), ''] })
  }

  const removeFromList = (field: keyof SipocData, idx: number) => {
    const list = (data[field] as string[]).filter((_, i) => i !== idx)
    if (list.length === 0) list.push('')
    setData({ ...data, [field]: list })
  }

  const resetAll = () => setData(defaultData)

  const columns: { key: keyof SipocData; label: string; labelEn: string; color: string }[] = [
    { key: 'suppliers', label: '供应商', labelEn: 'Suppliers', color: '#8b5cf6' },
    { key: 'inputs', label: '输入', labelEn: 'Inputs', color: '#3b82f6' },
    { key: 'processSteps', label: '过程', labelEn: 'Process', color: '#f59e0b' },
    { key: 'outputs', label: '输出', labelEn: 'Outputs', color: '#10b981' },
    { key: 'customers', label: '客户', labelEn: 'Customers', color: '#ef4444' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-mckinsey-navy">📋 SIPOC图</h1>
          <p className="text-sm text-mckinsey-muted">
            供应商 → 输入 → 过程 → 输出 → 客户 — 高层次过程定义
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 重置
        </button>
      </div>

      {/* Process Name */}
      <div className="card mb-6">
        <label className="text-sm font-semibold text-mckinsey-navy block mb-2">
          过程名称
        </label>
        <input
          type="text"
          value={data.processName}
          onChange={(e) => updateField('processName', e.target.value)}
          placeholder="例如：订单处理过程"
          className="w-full px-4 py-3 rounded-xl border border-mckinsey-border bg-white focus:outline-none focus:ring-2 focus:ring-mckinsey-teal transition text-lg"
        />
      </div>

      {/* SIPOC Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {columns.map((col) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card !p-5"
          >
            {/* Header */}
            <div
              className="text-center mb-4 pb-3 border-b"
              style={{ borderColor: col.color + '30' }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: col.color }}
              >
                {col.labelEn.charAt(0)}
              </div>
              <div className="text-sm font-semibold text-mckinsey-navy">
                {col.label}
              </div>
              <div className="text-xs text-mckinsey-muted">{col.labelEn}</div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-3">
              {(data[col.key] as string[]).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateList(col.key, idx, e.target.value)}
                    placeholder={`${col.label} ${idx + 1}`}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-mckinsey-border/50 bg-mckinsey-light/30 text-xs focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                  />
                  <button
                    onClick={() => removeFromList(col.key, idx)}
                    className="text-red-400 hover:text-red-600 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addToList(col.key)}
              className="w-full py-1.5 rounded-lg border border-dashed border-mckinsey-border/50 text-xs text-mckinsey-muted hover:border-mckinsey-teal/30 hover:text-mckinsey-teal transition"
            >
              +
            </button>
          </motion.div>
        ))}
      </div>

      {/* Flow Arrows (visual) */}
      <div className="hidden md:flex justify-center items-center gap-4 mb-8 text-mckinsey-muted">
        <span style={{ color: '#8b5cf6' }} className="font-bold">S</span>
        <span>→</span>
        <span style={{ color: '#3b82f6' }} className="font-bold">I</span>
        <span>→</span>
        <span style={{ color: '#f59e0b' }} className="font-bold">P</span>
        <span>→</span>
        <span style={{ color: '#10b981' }} className="font-bold">O</span>
        <span>→</span>
        <span style={{ color: '#ef4444' }} className="font-bold">C</span>
      </div>

      {/* Summary View */}
      {data.processName && (
        <div className="card border-l-4 border-l-mckinsey-teal">
          <h3 className="font-semibold text-mckinsey-navy mb-3">📝 SIPOC 摘要</h3>
          <div className="text-sm text-mckinsey-navy">
            <p className="mb-2">
              <strong>过程：</strong>{data.processName}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs">
              {columns.map((col) => {
                const items = (data[col.key] as string[]).filter(i => i.trim() !== '')
                return (
                  <div key={col.key}>
                    <div className="font-semibold mb-1" style={{ color: col.color }}>
                      {col.label} ({items.length})
                    </div>
                    <ul className="text-mckinsey-muted space-y-0.5">
                      {items.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 rounded-xl bg-mckinsey-light border border-mckinsey-border">
        <h3 className="font-semibold text-sm text-mckinsey-navy mb-2">💡 使用技巧</h3>
        <ul className="text-xs text-mckinsey-muted space-y-1">
          <li>• 先确定 P（过程步骤），再向两端扩展</li>
          <li>• 过程步骤控制在 4-7 个高层步骤</li>
          <li>• 供应商和客户可以是内部的（其他部门）</li>
          <li>• SIPOC 是 Define 阶段的第一张图，帮助团队对齐范围</li>
        </ul>
      </div>
    </div>
  )
}
