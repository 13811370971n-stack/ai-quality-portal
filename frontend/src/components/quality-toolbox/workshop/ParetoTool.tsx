import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface ParetoItem {
  category: string
  count: number
}

export default function ParetoTool() {
  const [items, setItems] = useState<ParetoItem[]>([
    { category: '外观缺陷', count: 45 },
    { category: '尺寸超差', count: 25 },
    { category: '功能故障', count: 15 },
    { category: '包装损坏', count: 10 },
    { category: '其他', count: 5 },
  ])
  const chartRef = useRef<SVGSVGElement>(null)

  const addItem = () => {
    setItems([...items, { category: '新类别', count: 0 }])
  }

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: 'category' | 'count', value: string) => {
    const updated = [...items]
    if (field === 'count') {
      updated[idx] = { ...updated[idx], count: Number(value) || 0 }
    } else {
      updated[idx] = { ...updated[idx], category: value }
    }
    setItems(updated)
  }

  useEffect(() => {
    if (!chartRef.current || items.length === 0) return
    const svg = d3.select(chartRef.current)
    svg.selectAll('*').remove()

    // Sort descending
    const sorted = [...items].sort((a, b) => b.count - a.count)
    const total = d3.sum(sorted, (d) => d.count)
    if (total === 0) return

    // Cumulative percentages
    let cumulative = 0
    const dataWithCum = sorted.map((d) => {
      cumulative += d.count
      return { ...d, cumPct: (cumulative / total) * 100 }
    })

    const margin = { top: 30, right: 60, bottom: 80, left: 60 }
    const width = 650 - margin.left - margin.right
    const height = 380 - margin.top - margin.bottom

    const g = svg.attr('viewBox', '0 0 650 380').append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand().domain(dataWithCum.map((d) => d.category)).range([0, width]).padding(0.2)
    const yLeft = d3.scaleLinear().domain([0, d3.max(dataWithCum, (d) => d.count)! * 1.1]).range([height, 0])
    const yRight = d3.scaleLinear().domain([0, 100]).range([height, 0])

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x))
      .selectAll('text').attr('transform', 'rotate(-30)').attr('text-anchor', 'end').attr('font-size', 10)
    g.append('g').call(d3.axisLeft(yLeft).ticks(6))
    g.append('g').attr('transform', `translate(${width},0)`).call(d3.axisRight(yRight).ticks(5).tickFormat((d) => d + '%'))

    // 80% line
    g.append('line').attr('x1', 0).attr('x2', width).attr('y1', yRight(80)).attr('y2', yRight(80))
      .attr('stroke', '#ef4444').attr('stroke-width', 1).attr('stroke-dasharray', '5,3')
    g.append('text').attr('x', width + 5).attr('y', yRight(80) - 5).text('80%').attr('fill', '#ef4444').attr('font-size', 10)

    // Bars
    g.selectAll('.bar').data(dataWithCum).enter().append('rect')
      .attr('x', (d) => x(d.category)!)
      .attr('y', (d) => yLeft(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - yLeft(d.count))
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)
      .attr('rx', 3)

    // Cumulative line
    const line = d3.line<typeof dataWithCum[0]>()
      .x((d) => x(d.category)! + x.bandwidth() / 2)
      .y((d) => yRight(d.cumPct))
    g.append('path').datum(dataWithCum).attr('d', line).attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2.5)

    // Cumulative dots
    g.selectAll('.cum-dot').data(dataWithCum).enter().append('circle')
      .attr('cx', (d) => x(d.category)! + x.bandwidth() / 2)
      .attr('cy', (d) => yRight(d.cumPct))
      .attr('r', 4).attr('fill', '#f59e0b')

    // Labels on bars
    g.selectAll('.label').data(dataWithCum).enter().append('text')
      .attr('x', (d) => x(d.category)! + x.bandwidth() / 2)
      .attr('y', (d) => yLeft(d.count) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#6366f1')
      .text((d) => d.count)

    g.append('text').attr('x', width / 2).attr('y', -10).attr('text-anchor', 'middle').text('Pareto Chart').attr('font-size', 12).attr('fill', 'currentColor')
  }, [items])

  const total = d3.sum(items, (d) => d.count)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">📉 帕累托图</h1>
      <p className="text-sm text-mckinsey-muted mb-6">
        输入类别和数量，自动排序绘制帕累托图，标注80%线识别"关键少数"。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-mckinsey-border">
            <h3 className="font-semibold mb-3">数据输入</h3>
            <div className="space-y-2 mb-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) => updateItem(i, 'category', e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                    placeholder="类别名"
                  />
                  <input
                    type="number"
                    value={item.count}
                    onChange={(e) => updateItem(i, 'count', e.target.value)}
                    className="w-20 px-2 py-1.5 rounded border border-mckinsey-border bg-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
                  />
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="w-full py-2 rounded-lg border border-dashed border-mckinsey-border text-sm hover:border-mckinsey-teal/30 transition"
            >
              + 添加类别
            </button>
            {total > 0 && (
              <p className="mt-3 text-xs text-mckinsey-muted">
                总计: {total}
              </p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="p-4 rounded-xl border border-mckinsey-border bg-white">
            <svg ref={chartRef} className="w-full" style={{ minHeight: 380 }} />
          </div>
          {total > 0 && (
            <div className="mt-4 p-4 rounded-xl border border-mckinsey-border">
              <h3 className="font-semibold mb-2 text-sm">分析结果</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-mckinsey-muted">
                    <th className="pb-1">类别</th>
                    <th className="pb-1 text-center">数量</th>
                    <th className="pb-1 text-center">占比</th>
                    <th className="pb-1 text-center">累积%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...items].sort((a, b) => b.count - a.count).reduce((acc, item) => {
                    const prevCum = acc.length > 0 ? acc[acc.length - 1].cum : 0
                    const cum = prevCum + (item.count / total) * 100
                    acc.push({ ...item, pct: (item.count / total) * 100, cum })
                    return acc
                  }, [] as { category: string; count: number; pct: number; cum: number }[]).map((item, i) => (
                    <tr key={i} className={item.cum <= 80 ? 'text-mckinsey-teal font-medium' : ''}>
                      <td className="py-1">{item.category}</td>
                      <td className="py-1 text-center">{item.count}</td>
                      <td className="py-1 text-center">{item.pct.toFixed(1)}%</td>
                      <td className="py-1 text-center">{item.cum.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
