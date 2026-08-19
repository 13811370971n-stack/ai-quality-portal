import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

// Control chart constants (d2, D3, D4 for subgroup sizes 2-10)
const d2Table: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 }
const D3Table: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 }
const D4Table: Record<number, number> = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 }

type ChartType = 'xbar-r' | 'i-mr'

export default function ControlChartTool() {
  const [chartType, setChartType] = useState<ChartType>('i-mr')
  const [rawData, setRawData] = useState('25.02\n25.01\n24.98\n25.03\n25.00\n24.97\n25.04\n25.01\n24.99\n25.02\n25.06\n25.01\n24.98\n25.00\n25.03\n24.99\n25.01\n25.00\n24.97\n25.02')
  const [subgroupSize, setSubgroupSize] = useState(5)
  const chartRef = useRef<SVGSVGElement>(null)

  const parseData = (): number[] => {
    return rawData
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '')
      .map(Number)
      .filter((n) => !isNaN(n))
  }

  const calcIMR = (data: number[]) => {
    if (data.length < 2) return null
    const mean = d3.mean(data)!
    const mrs = data.slice(1).map((v, i) => Math.abs(v - data[i]))
    const mrBar = d3.mean(mrs)!
    const ucl = mean + 2.66 * mrBar
    const lcl = mean - 2.66 * mrBar
    const mrUcl = 3.267 * mrBar
    return { values: data, mean, ucl, lcl, mrs, mrBar, mrUcl, mrLcl: 0 }
  }

  const calcXbarR = (data: number[], n: number) => {
    if (data.length < n * 2) return null
    const groups: number[][] = []
    for (let i = 0; i + n <= data.length; i += n) {
      groups.push(data.slice(i, i + n))
    }
    const means = groups.map((g) => d3.mean(g)!)
    const ranges = groups.map((g) => d3.max(g)! - d3.min(g)!)
    const xBarBar = d3.mean(means)!
    const rBar = d3.mean(ranges)!
    const A2 = 3 / (d2Table[n] * Math.sqrt(n))
    const uclX = xBarBar + A2 * rBar
    const lclX = xBarBar - A2 * rBar
    const uclR = D4Table[n] * rBar
    const lclR = D3Table[n] * rBar
    return { means, ranges, xBarBar, rBar, uclX, lclX, uclR, lclR }
  }

  useEffect(() => {
    const data = parseData()
    if (data.length < 3) return
    if (!chartRef.current) return

    const svg = d3.select(chartRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 60, bottom: 40, left: 60 }
    const width = 700 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg
      .attr('viewBox', `0 0 700 300`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    if (chartType === 'i-mr') {
      const result = calcIMR(data)
      if (!result) return

      const x = d3.scaleLinear().domain([0, result.values.length - 1]).range([0, width])
      const y = d3.scaleLinear().domain([Math.min(result.lcl, d3.min(result.values)!) * 0.999, Math.max(result.ucl, d3.max(result.values)!) * 1.001]).range([height, 0])

      // Grid
      g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(data.length > 20 ? 10 : data.length))
      g.append('g').call(d3.axisLeft(y).ticks(6))

      // Control limits
      const drawLine = (value: number, color: string, dash?: string) => {
        g.append('line').attr('x1', 0).attr('x2', width).attr('y1', y(value)).attr('y2', y(value))
          .attr('stroke', color).attr('stroke-width', 1.5).attr('stroke-dasharray', dash || '')
      }
      drawLine(result.ucl, '#ef4444', '5,3')
      drawLine(result.mean, '#3b82f6')
      drawLine(result.lcl, '#ef4444', '5,3')

      // Labels
      g.append('text').attr('x', width + 5).attr('y', y(result.ucl) + 4).text(`UCL=${result.ucl.toFixed(3)}`).attr('font-size', 10).attr('fill', '#ef4444')
      g.append('text').attr('x', width + 5).attr('y', y(result.mean) + 4).text(`CL=${result.mean.toFixed(3)}`).attr('font-size', 10).attr('fill', '#3b82f6')
      g.append('text').attr('x', width + 5).attr('y', y(result.lcl) + 4).text(`LCL=${result.lcl.toFixed(3)}`).attr('font-size', 10).attr('fill', '#ef4444')

      // Data line
      const line = d3.line<number>().x((_, i) => x(i)).y((d) => y(d))
      g.append('path').datum(result.values).attr('d', line).attr('fill', 'none').attr('stroke', '#6366f1').attr('stroke-width', 1.5)

      // Data points
      g.selectAll('circle').data(result.values).enter().append('circle')
        .attr('cx', (_, i) => x(i)).attr('cy', (d) => y(d)).attr('r', 3)
        .attr('fill', (d) => (d > result.ucl || d < result.lcl) ? '#ef4444' : '#6366f1')
        .attr('stroke', (d) => (d > result.ucl || d < result.lcl) ? '#ef4444' : 'none')
        .attr('stroke-width', 2)

      // Title
      g.append('text').attr('x', width / 2).attr('y', -10).attr('text-anchor', 'middle').text('I Chart (Individual Values)').attr('font-size', 12).attr('fill', 'currentColor')
    } else {
      const result = calcXbarR(data, subgroupSize)
      if (!result) return

      const x = d3.scaleLinear().domain([0, result.means.length - 1]).range([0, width])
      const y = d3.scaleLinear().domain([Math.min(result.lclX, d3.min(result.means)!) * 0.999, Math.max(result.uclX, d3.max(result.means)!) * 1.001]).range([height, 0])

      g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(result.means.length))
      g.append('g').call(d3.axisLeft(y).ticks(6))

      const drawLine = (value: number, color: string, dash?: string) => {
        g.append('line').attr('x1', 0).attr('x2', width).attr('y1', y(value)).attr('y2', y(value))
          .attr('stroke', color).attr('stroke-width', 1.5).attr('stroke-dasharray', dash || '')
      }
      drawLine(result.uclX, '#ef4444', '5,3')
      drawLine(result.xBarBar, '#3b82f6')
      drawLine(result.lclX, '#ef4444', '5,3')

      g.append('text').attr('x', width + 5).attr('y', y(result.uclX) + 4).text(`UCL=${result.uclX.toFixed(3)}`).attr('font-size', 10).attr('fill', '#ef4444')
      g.append('text').attr('x', width + 5).attr('y', y(result.xBarBar) + 4).text(`CL=${result.xBarBar.toFixed(3)}`).attr('font-size', 10).attr('fill', '#3b82f6')
      g.append('text').attr('x', width + 5).attr('y', y(result.lclX) + 4).text(`LCL=${result.lclX.toFixed(3)}`).attr('font-size', 10).attr('fill', '#ef4444')

      const line = d3.line<number>().x((_, i) => x(i)).y((d) => y(d))
      g.append('path').datum(result.means).attr('d', line).attr('fill', 'none').attr('stroke', '#6366f1').attr('stroke-width', 1.5)

      g.selectAll('circle').data(result.means).enter().append('circle')
        .attr('cx', (_, i) => x(i)).attr('cy', (d) => y(d)).attr('r', 3)
        .attr('fill', (d) => (d > result.uclX || d < result.lclX) ? '#ef4444' : '#6366f1')

      g.append('text').attr('x', width / 2).attr('y', -10).attr('text-anchor', 'middle').text(`X̄ Chart (n=${subgroupSize})`).attr('font-size', 12).attr('fill', 'currentColor')
    }
  }, [rawData, chartType, subgroupSize])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">📈 控制图</h1>
      <p className="text-sm text-mckinsey-muted mb-6">
        输入数据，自动计算控制限并绘制控制图。超出控制限的点标红。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Input */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-mckinsey-border">
            <h3 className="font-semibold mb-3">数据输入</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setChartType('i-mr')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${chartType === 'i-mr' ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'bg-mckinsey-light'}`}
              >
                I-MR图
              </button>
              <button
                onClick={() => setChartType('xbar-r')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${chartType === 'xbar-r' ? 'bg-mckinsey-teal/10 text-mckinsey-teal' : 'bg-mckinsey-light'}`}
              >
                X̄-R图
              </button>
            </div>
            {chartType === 'xbar-r' && (
              <div className="mb-3">
                <label className="text-xs text-mckinsey-muted block mb-1">子组大小 (n):</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={subgroupSize}
                  onChange={(e) => setSubgroupSize(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                />
              </div>
            )}
            <label className="text-xs text-mckinsey-muted block mb-1">每行一个数据点：</label>
            <textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 rounded-lg border border-mckinsey-border bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-mckinsey-teal resize-none"
            />
            <p className="text-xs text-mckinsey-muted mt-2">
              数据点数: {parseData().length}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="p-4 rounded-xl border border-mckinsey-border bg-white">
            <svg ref={chartRef} className="w-full" style={{ minHeight: 300 }} />
          </div>
          <div className="mt-4 p-4 rounded-xl border border-mckinsey-border">
            <h3 className="font-semibold mb-2 text-sm">判异规则 (Western Electric Rules)</h3>
            <ul className="text-xs text-mckinsey-muted space-y-1">
              <li>🔴 规则1: 单点超出控制限（±3σ）</li>
              <li>⚠️ 规则2: 连续9点在中心线同一侧</li>
              <li>⚠️ 规则3: 连续6点递增或递减</li>
              <li>⚠️ 规则4: 连续14点交替上下</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
