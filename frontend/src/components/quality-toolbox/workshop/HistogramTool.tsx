import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function HistogramTool() {
  const [rawData, setRawData] = useState(
    Array.from({ length: 50 }, () => (10 + Math.random() * 0.3 - 0.15).toFixed(3)).join('\n')
  )
  const [usl, setUsl] = useState('10.15')
  const [lsl, setLsl] = useState('9.85')
  const [showNormal, setShowNormal] = useState(true)
  const chartRef = useRef<SVGSVGElement>(null)

  const parseData = (): number[] =>
    rawData.split('\n').map((l) => l.trim()).filter((l) => l !== '').map(Number).filter((n) => !isNaN(n))

  useEffect(() => {
    const data = parseData()
    if (data.length < 3 || !chartRef.current) return

    const svg = d3.select(chartRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 40, bottom: 50, left: 50 }
    const width = 650 - margin.left - margin.right
    const height = 350 - margin.top - margin.bottom

    const g = svg.attr('viewBox', '0 0 650 350').append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const mean = d3.mean(data)!
    const std = d3.deviation(data)!
    const min = d3.min(data)!
    const max = d3.max(data)!

    // Sturges' rule for number of bins
    const binCount = Math.ceil(1 + 3.322 * Math.log10(data.length))
    
    const x = d3.scaleLinear().domain([min - std * 0.5, max + std * 0.5]).range([0, width])
    const bins = d3.bin().domain(x.domain() as [number, number]).thresholds(binCount)(data)
    const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length)! * 1.2]).range([height, 0])

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(8))
    g.append('g').call(d3.axisLeft(y).ticks(6))

    // Bars
    g.selectAll('rect').data(bins).enter().append('rect')
      .attr('x', (d) => x(d.x0!) + 1)
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(0, x(d.x1!) - x(d.x0!) - 2))
      .attr('height', (d) => height - y(d.length))
      .attr('fill', '#6366f1')
      .attr('opacity', 0.7)
      .attr('rx', 2)

    // Normal curve
    if (showNormal && std > 0) {
      const normalData = d3.range(x.domain()[0], x.domain()[1], (x.domain()[1] - x.domain()[0]) / 100)
      const binWidth = bins[0] ? (bins[0].x1! - bins[0].x0!) : 1
      const normalY = normalData.map((xv) => {
        const prob = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((xv - mean) / std) ** 2)
        return prob * data.length * binWidth
      })
      const line = d3.line<number>().x((_, i) => x(normalData[i])).y((d) => y(d)).curve(d3.curveBasis)
      g.append('path').datum(normalY).attr('d', line).attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2)
    }

    // Spec limits
    const uslVal = parseFloat(usl)
    const lslVal = parseFloat(lsl)
    if (!isNaN(uslVal)) {
      g.append('line').attr('x1', x(uslVal)).attr('x2', x(uslVal)).attr('y1', 0).attr('y2', height)
        .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '5,3')
      g.append('text').attr('x', x(uslVal)).attr('y', -5).attr('text-anchor', 'middle').text('USL').attr('fill', '#ef4444').attr('font-size', 10)
    }
    if (!isNaN(lslVal)) {
      g.append('line').attr('x1', x(lslVal)).attr('x2', x(lslVal)).attr('y1', 0).attr('y2', height)
        .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '5,3')
      g.append('text').attr('x', x(lslVal)).attr('y', -5).attr('text-anchor', 'middle').text('LSL').attr('fill', '#ef4444').attr('font-size', 10)
    }

    // Mean line
    g.append('line').attr('x1', x(mean)).attr('x2', x(mean)).attr('y1', 0).attr('y2', height)
      .attr('stroke', '#3b82f6').attr('stroke-width', 1.5).attr('stroke-dasharray', '3,2')
    g.append('text').attr('x', x(mean)).attr('y', -5).attr('text-anchor', 'middle').text(`μ=${mean.toFixed(3)}`).attr('fill', '#3b82f6').attr('font-size', 10)

    g.append('text').attr('x', width / 2).attr('y', -15).attr('text-anchor', 'middle').text('Histogram').attr('font-size', 12).attr('fill', 'currentColor')
  }, [rawData, usl, lsl, showNormal])

  const data = parseData()
  const mean = data.length > 0 ? d3.mean(data)! : 0
  const std = data.length > 1 ? d3.deviation(data)! : 0
  const uslVal = parseFloat(usl)
  const lslVal = parseFloat(lsl)
  const cp = !isNaN(uslVal) && !isNaN(lslVal) && std > 0 ? (uslVal - lslVal) / (6 * std) : NaN
  const cpk = !isNaN(uslVal) && !isNaN(lslVal) && std > 0
    ? Math.min((uslVal - mean) / (3 * std), (mean - lslVal) / (3 * std))
    : NaN

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">📊 直方图</h1>
      <p className="text-sm text-mckinsey-muted mb-6">
        输入测量数据，自动分组绘制频率分布图，计算过程能力 Cp/Cpk。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-mckinsey-border space-y-3">
            <h3 className="font-semibold">数据输入</h3>
            <div>
              <label className="text-xs text-mckinsey-muted block mb-1">测量值（每行一个）：</label>
              <textarea
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 rounded-lg border border-mckinsey-border bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-mckinsey-teal resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-mckinsey-muted block mb-1">USL:</label>
                <input type="text" value={usl} onChange={(e) => setUsl(e.target.value)} className="w-full px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
              </div>
              <div>
                <label className="text-xs text-mckinsey-muted block mb-1">LSL:</label>
                <input type="text" value={lsl} onChange={(e) => setLsl(e.target.value)} className="w-full px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showNormal} onChange={(e) => setShowNormal(e.target.checked)} className="rounded" />
              叠加正态曲线
            </label>
            <p className="text-xs text-mckinsey-muted">数据点数: {data.length}</p>
          </div>
        </div>

        {/* Chart + Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-mckinsey-border bg-white">
            <svg ref={chartRef} className="w-full" style={{ minHeight: 350 }} />
          </div>
          {data.length > 1 && (
            <div className="p-4 rounded-xl border border-mckinsey-border">
              <h3 className="font-semibold mb-3">📐 描述统计</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-mckinsey-teal">{mean.toFixed(4)}</div>
                  <div className="text-xs text-mckinsey-muted">均值 (μ)</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{std.toFixed(4)}</div>
                  <div className="text-xs text-mckinsey-muted">标准差 (σ)</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${!isNaN(cp) && cp >= 1.33 ? 'text-green-600' : 'text-red-600'}`}>
                    {isNaN(cp) ? 'N/A' : cp.toFixed(3)}
                  </div>
                  <div className="text-xs text-mckinsey-muted">Cp</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${!isNaN(cpk) && cpk >= 1.33 ? 'text-green-600' : 'text-red-600'}`}>
                    {isNaN(cpk) ? 'N/A' : cpk.toFixed(3)}
                  </div>
                  <div className="text-xs text-mckinsey-muted">Cpk</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
