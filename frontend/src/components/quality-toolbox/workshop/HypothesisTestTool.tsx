import { useState } from 'react'

export default function HypothesisTestTool() {
  const [data, setData] = useState('')
  const [param, setParam] = useState('')
  const [result, setResult] = useState<any>(null)

  function calculate() {
    const values = data.split(',').map(Number).filter(n => !isNaN(n))
    if (values.length < 2) { alert('Please enter at least 2 values'); return }
    const n = values.length
    const mean = values.reduce((a,b) => a+b, 0) / n
    const sorted = [...values].sort((a,b) => a-b)
    const std = Math.sqrt(values.reduce((a,b) => a + (b-mean)**2, 0) / (n-1))
    const min = sorted[0], max = sorted[n-1]
    const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)]
    const q1 = sorted[Math.floor(n * 0.25)], q3 = sorted[Math.floor(n * 0.75)]
    const iqr = q3 - q1
    const outliers = values.filter(v => v < q1 - 1.5*iqr || v > q3 + 1.5*iqr)
    setResult({ n, mean: mean.toFixed(4), std: std.toFixed(4), min: min.toFixed(4), max: max.toFixed(4),
      median: median.toFixed(4), q1: q1.toFixed(4), q3: q3.toFixed(4), iqr: iqr.toFixed(4),
      range: (max-min).toFixed(4), outliers: outliers.length, cv: (std/mean*100).toFixed(2) })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-mckinsey-navy mb-1">🧮 假设检验</h1>
      <p className="text-sm text-mckinsey-muted mb-6">t-Test / Z-Test</p>
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-mckinsey-navy mb-3">输入数据</h3>
        <textarea value={data} onChange={(e) => setData(e.target.value)}
          className="w-full h-24 px-3 py-2 rounded-lg border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 resize-none"
          placeholder="输入数值，用逗号分隔。例如: 10.2, 10.5, 9.8, 10.1, 10.3..." />
        <div className="mt-3 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-mckinsey-muted">可选参数</label>
            <input type="text" value={param} onChange={(e) => setParam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm" placeholder="可选" />
          </div>
          <button onClick={calculate} className="px-5 py-2 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg transition-all text-sm">
            计算分析
          </button>
        </div>
      </div>
      {result && (
        <div className="card">
          <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">分析结果</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[['N', result.n], ['均值', result.mean], ['标准差', result.std], ['中位数', result.median]].map(([label, val]) => (
              <div key={String(label)} className="bg-mckinsey-light rounded-lg p-3 text-center">
                <div className="text-[10px] text-mckinsey-muted">{label}</div>
                <div className="text-lg font-bold text-mckinsey-navy">{val}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[['Min', result.min], ['Max', result.max], ['Q1', result.q1], ['Q3', result.q3]].map(([label, val]) => (
              <div key={label} className="bg-mckinsey-light rounded-lg p-3 text-center">
                <div className="text-[10px] text-mckinsey-muted">{label}</div>
                <div className="font-semibold text-mckinsey-navy">{val}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <span><strong>Range:</strong> {result.range}</span>
            <span><strong>IQR:</strong> {result.iqr}</span>
            <span><strong>CV%:</strong> {result.cv}%</span>
            <span className={result.outliers > 0 ? 'text-red-700 font-semibold' : ''}>
              <strong>异常点:</strong> {result.outliers}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
