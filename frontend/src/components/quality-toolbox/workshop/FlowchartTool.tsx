import { useState } from 'react'
import { motion } from 'framer-motion'

interface FlowNode {
  id: string
  type: 'start' | 'process' | 'decision' | 'end'
  text: string
  x: number
  y: number
}

interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
}

const defaultNodes: FlowNode[] = [
  { id: '1', type: 'start', text: '开始', x: 300, y: 30 },
  { id: '2', type: 'process', text: '接收物料', x: 300, y: 120 },
  { id: '3', type: 'decision', text: '检验合格？', x: 300, y: 220 },
  { id: '4', type: 'process', text: '入库', x: 150, y: 320 },
  { id: '5', type: 'process', text: '退货', x: 450, y: 320 },
  { id: '6', type: 'end', text: '结束', x: 300, y: 420 },
]

const defaultEdges: FlowEdge[] = [
  { id: 'e1', source: '1', target: '2' },
  { id: 'e2', source: '2', target: '3' },
  { id: 'e3', source: '3', target: '4', label: '是' },
  { id: 'e4', source: '3', target: '5', label: '否' },
  { id: 'e5', source: '4', target: '6' },
  { id: 'e6', source: '5', target: '6' },
]

export default function FlowchartTool() {
  const [nodes, setNodes] = useState<FlowNode[]>(defaultNodes)
  const [edges, setEdges] = useState<FlowEdge[]>(defaultEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const nodeShapes: Record<string, (node: FlowNode) => JSX.Element> = {
    start: (node) => (
      <ellipse cx={node.x} cy={node.y} rx={50} ry={25} fill="none" stroke="#10b981" strokeWidth={2} />
    ),
    end: (node) => (
      <ellipse cx={node.x} cy={node.y} rx={50} ry={25} fill="none" stroke="#ef4444" strokeWidth={2} />
    ),
    process: (node) => (
      <rect x={node.x - 60} y={node.y - 20} width={120} height={40} rx={6} fill="none" stroke="#3b82f6" strokeWidth={2} />
    ),
    decision: (node) => (
      <polygon
        points={`${node.x},${node.y - 30} ${node.x + 60},${node.y} ${node.x},${node.y + 30} ${node.x - 60},${node.y}`}
        fill="none" stroke="#f59e0b" strokeWidth={2}
      />
    ),
  }

  const addNode = (type: FlowNode['type']) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      text: type === 'start' ? '开始' : type === 'end' ? '结束' : type === 'decision' ? '条件？' : '新步骤',
      x: 300 + Math.random() * 100 - 50,
      y: 250 + Math.random() * 100,
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id))
    setEdges(edges.filter((e) => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }

  const startEdit = (node: FlowNode) => {
    setSelectedNode(node.id)
    setEditText(node.text)
  }

  const finishEdit = () => {
    if (selectedNode) {
      setNodes(nodes.map((n) => (n.id === selectedNode ? { ...n, text: editText } : n)))
      setSelectedNode(null)
    }
  }

  const resetAll = () => {
    setNodes(defaultNodes)
    setEdges(defaultEdges)
    setSelectedNode(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">🔀 流程图</h1>
          <p className="text-sm text-mckinsey-muted">
            使用标准符号绘制过程流程图。双击节点编辑文字。
          </p>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
        >
          🗑️ 重置
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-4 p-3 rounded-lg border border-mckinsey-border">
        <button onClick={() => addNode('start')} className="px-3 py-1.5 rounded text-xs bg-green-100 text-green-700 font-medium hover:bg-green-200 transition">
          ⬭ 开始/结束
        </button>
        <button onClick={() => addNode('process')} className="px-3 py-1.5 rounded text-xs bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition">
          ▬ 处理
        </button>
        <button onClick={() => addNode('decision')} className="px-3 py-1.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium hover:bg-yellow-200 transition">
          ◇ 判断
        </button>
        <button onClick={() => addNode('end')} className="px-3 py-1.5 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition">
          ⬭ 结束
        </button>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-mckinsey-border bg-white overflow-hidden">
        <svg viewBox="0 0 600 500" className="w-full" style={{ minHeight: 500 }}>
          {/* Edges */}
          {edges.map((edge) => {
            const source = nodes.find((n) => n.id === edge.source)
            const target = nodes.find((n) => n.id === edge.target)
            if (!source || !target) return null
            const midX = (source.x + target.x) / 2
            const midY = (source.y + target.y) / 2
            return (
              <g key={edge.id}>
                <line
                  x1={source.x} y1={source.y + 25}
                  x2={target.x} y2={target.y - 25}
                  stroke="currentColor" strokeWidth={1.5}
                  className="text-mckinsey-muted"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text x={midX + 10} y={midY} fontSize={10} fill="currentColor" className="text-mckinsey-muted">
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-mckinsey-muted" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => (
            <g
              key={node.id}
              onDoubleClick={() => startEdit(node)}
              className="cursor-pointer"
            >
              {nodeShapes[node.type](node)}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
                className="text-mckinsey-navy pointer-events-none"
              >
                {node.text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Edit panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl border border-mckinsey-teal/20 flex items-center gap-3"
        >
          <span className="text-sm">编辑节点:</span>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
            autoFocus
            className="flex-1 px-3 py-1.5 rounded border border-mckinsey-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-mckinsey-teal"
          />
          <button onClick={finishEdit} className="px-3 py-1.5 rounded bg-mckinsey-teal text-white text-sm">确认</button>
          <button onClick={() => removeNode(selectedNode)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm">删除</button>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-4 p-4 rounded-xl border border-mckinsey-border">
        <h3 className="font-semibold text-sm mb-2">图例</h3>
        <div className="flex flex-wrap gap-4 text-xs text-mckinsey-muted">
          <span>⬭ 椭圆 = 开始/结束</span>
          <span>▬ 矩形 = 处理步骤</span>
          <span>◇ 菱形 = 判断/决策</span>
          <span>→ 箭线 = 流向</span>
        </div>
      </div>
    </div>
  )
}
