export type DmaicPhase = 'D' | 'M' | 'A' | 'I' | 'C'

export interface QualityTool {
  id: string
  name: string
  nameZh: string
  category: string
  categoryZh: string
  dmaic: DmaicPhase[]
  description: string
  descriptionZh: string
  whenToUse: string[]
  procedure: string[]
  example: string
  relatedTools: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  hasInteractive: boolean
  interactivePath?: string
}

export interface DmaicPhaseInfo {
  id: DmaicPhase
  name: string
  nameZh: string
  description: string
  color: string
  icon: string
  tools: string[] // tool IDs
}

export interface LearningPath {
  id: string
  name: string
  nameZh: string
  description: string
  tools: string[]
  phaseId: DmaicPhase
}

export interface ProjectCase {
  id: string
  title: string
  titleZh: string
  scenario: string
  phases: {
    phase: DmaicPhase
    description: string
    recommendedTools: string[]
  }[]
}
