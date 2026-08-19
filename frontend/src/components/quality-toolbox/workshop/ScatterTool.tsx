import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface DataPoint {
  x: number
  y: number
}

export default function ScatterTool() {
  const [xLabel, setXLabel] = useState('温度 (°C)')
  const [yLabel, setYLabel] = useState('不良率 (%)')
  const [dataText, setDataText] = useState(
    '20,1.2\n22,1.5\n24,1.8\n26,2.1\n28,2.5\n30,2.8\n32,3.2\n34,3.5\n36,3.9\n38,4.2\n25,2.0\n27,2.3\n29,2.7\n31,3.0\n33,3.4'
  )
  const [showRegression, setShowRegression] = useState(true)
  const chartRef = useRef<SVGSVGElement>(null)

  const parseData = (): DataPoint[] =>
    dataText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '')
      .map((l) => {
        const parts = l.split(/[,\t\s]+/)
        return { x: Number(parts[0]), y: Number(parts[1]) }
      })
      .filter((p) => !isNaN(p.x) && !isNaN(p.y))

  const calcCorrelation = (data: DataPoint[]) => {
    if (data.length < 3) return { r: 0, slope: 0, intercept: 0, r2: 0 }
    const n = data.length
    const sumX = d3.sum(data, (d) => d.x)
    const sumY = d3.sum(data, (d) => d.y)
    const sumXY = d3.sum(data, (d) => d.x * d.y)
    const sumX2 = d3.sum(data, (d) => d.x * d.x)
    const sumY2 = d3.sum(data, (d) => d.y * d.y)

    const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2)
    const intercept = (sumY - slope * sumX) / n
    return { r, slope, intercept, r2: r * r }
  }

  const getCorrelationDesc = (r: number): string => {
    const abs = Math.abs(r)
    const dir = r >= 0 ? '正' : '负'
    if (abs >= 0.9) return `强${dir}相关`
    if (abs >= 0.7) return `较强${dir}相关`
    if (abs >= 0.4) return `中等${dir}相关`
    if (abs >= 0.2) return `弱${dir}相关`
    return '基本无相关'
  }

  useEffect(() => {
    const data = parseData()
    if (data.length < 3 || !chartRef.current) return

    const svg = d3.select(chartRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.attr('viewBox', '0 0 600 400').append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(data, (d) => d.x) as [number, number]
    const yExtent = d3.extent(data, (d) => d.y) as [number, number]
    const xPad = (xExtent[1] - xExtent[0]) * 0.1 || 1
    const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 1

    const x = d3.scaleLinear().domain([xExtent[0] - xPad, xExtent[1] + xPad]).range([0, width])
    const y = d3.scaleLinear().domain([yExtent[0] - yPad, yExtent[1] + yPad]).range([height, 0])

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(8))
    g.append('g').call(d3.axisLeft(y).ticks(6))

    // Axis labels
    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').text(xLabel).attr('font-size', 11).attr('fill', 'currentColor')
    g.append('text').attr('x', -height / 2).attr('y', -45).attr('text-anchor', 'middle').attr('transform', 'rotate(-90)').text(yLabel).attr('font-size', 11).attr('fill', 'currentColor')

    // Regression line
    if (showRegression) {
      const { slope, intercept } = calcCorrelation(data)
      const xMin = xExtent[0] - xPad
      const xMax = xExtent[1] + xPad
      g.append('line')
        .attr('x1', x(xMin)).attr('y1', y(slope * xMin + intercept))
        .attr('x2', x(xMax)).attr('y2', y(slope * xMax + intercept))
        .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
    }

    // Data points
    g.selectAll('circle').data(data).enter().append('circle')
      .attr('cx', (d) => x(d.x)).attr('cy', (d) => y(d.y)).attr('r', 5)
      .attr('fill', '#6366f1').attr('opacity', 0.8)
      .attr('stroke', '#4f46e5').attr('stroke-width', 1)

    g.append('text').attr('x', width / 2).attr('y', -10).attr('text-anchor', 'middle').text('Scatter Diagram').attr('font-size', 12).attr('fill', 'currentColor')
  }, [dataText, xLabel, yLabel, showRegression])

  const data = parseData()
  const stats = calcCorrelation(data)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">⚡ 散点图</h1>
      <p className="text-sm text-mckinsey-muted mb-6">
        输入 X-Y 数据对，分析两变量间的相关性，自动计算相关系数和回归方程。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-mckinsey-border space-y-3">
            <h3 className="font-semibold">数据输入</h3>
            <div>
              <label className="text-xs text-mckinsey-muted block mb-1">X轴标签:</label>
              <input type="text" value={xLabel} onChange={(e) => setXLabel(e.target.value)} className="w-full px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
            </div>
            <div>
              <label className="text-xs text-mckinsey-muted block mb-1">Y轴标签:</label>
              <input type="text" value={yLabel} onChange={(e) => setYLabel(e.target.value)} className="w-full px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal" />
            </div>
            <div>
              <label className="text-xs text-mckinsey-muted block mb-1">数据 (X,Y 每行一对):</label>
              <textarea
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 rounded-lg border border-mckinsey-border bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-mckinsey-teal resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showRegression} onChange={(e) => setShowRegression(e.target.checked)} className="rounded" />
              显示回归线
            </label>
            <p className="text-xs text-mckinsey-muted">数据点数: {data.length}</p>
          </div>
        </div>

        {/* Chart + Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-mckinsey-border bg-white">
            <svg ref={chartRef} className="w-full" style={{ minHeight: 400 }} />
          </div>
          {data.length >= 3 && (
            <div className="p-4 rounded-xl border border-mckinsey-border">
              <h3 className="font-semibold mb-3">📐 相关分析</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className={`text-lg font-bold ${Math.abs(stats.r) >= 0.7 ? 'text-green-600' : Math.abs(stats.r) >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {stats.r.toFixed(4)}
                  </div>
                  <div className="text-xs text-mckinsey-muted">相关系数 r</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.r2.toFixed(4)}</div>
                  <div className="text-xs text-mckinsey-muted">R²</div>
                </div>
                <div>
                  <div className="text-sm font-medium">{getCorrelationDesc(stats.r)}</div>
                  <div className="text-xs text-mckinsey-muted">相关强度</div>
                </div>
                <div>
                  <div className="text-xs font-mono">y = {stats.slope.toFixed(4)}x + {stats.intercept.toFixed(4)}</div>
                  <div className="text-xs text-mckinsey-muted">回归方程</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
