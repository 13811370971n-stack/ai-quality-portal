import { DmaicPhaseInfo } from '../types'

export const dmaicPhases: DmaicPhaseInfo[] = [
  {
    id: 'D',
    name: 'Define',
    nameZh: '定义',
    description: '明确问题、目标、范围和客户需求。确定项目章程和团队。',
    color: '#8b5cf6',
    icon: '🎯',
    tools: ['flowchart', 'sipoc', 'affinity-diagram', 'tree-diagram', 'matrix-diagram'],
  },
  {
    id: 'M',
    name: 'Measure',
    nameZh: '测量',
    description: '收集数据，建立过程基线，量化当前绩效水平。',
    color: '#3b82f6',
    icon: '📏',
    tools: ['check-sheet', 'control-chart', 'histogram', 'flowchart'],
  },
  {
    id: 'A',
    name: 'Analyze',
    nameZh: '分析',
    description: '分析数据找出根本原因，验证因果关系。',
    color: '#f59e0b',
    icon: '🔍',
    tools: ['cause-effect-diagram', 'five-whys', 'pareto-chart', 'scatter-diagram', 'histogram', 'control-chart', 'fmea', 'affinity-diagram', 'interrelationship-digraph', 'matrix-diagram', 'matrix-data-analysis'],
  },
  {
    id: 'I',
    name: 'Improve',
    nameZh: '改进',
    description: '开发和实施改进方案，验证效果。',
    color: '#10b981',
    icon: '🚀',
    tools: ['pareto-chart', 'flowchart', 'fmea', 'tree-diagram', 'pdpc', 'arrow-diagram'],
  },
  {
    id: 'C',
    name: 'Control',
    nameZh: '控制',
    description: '建立控制系统，维持改进成果，防止回退。',
    color: '#ef4444',
    icon: '🛡️',
    tools: ['control-chart', 'check-sheet', 'fmea', 'pdpc'],
  },
]

export default dmaicPhases
