import { useMemo } from 'react'
import { tools } from '../data/tools'
import { dmaicPhases } from '../data/dmaicPhases'
import { DmaicPhase, QualityTool } from '../types'

export function useTools() {
  return tools
}

export function useToolById(id: string): QualityTool | undefined {
  return useMemo(() => tools.find((t) => t.id === id), [id])
}

export function useToolsByPhase(phase: DmaicPhase): QualityTool[] {
  return useMemo(
    () => tools.filter((t) => t.dmaic.includes(phase)),
    [phase]
  )
}

export function useToolsByCategory(category: string): QualityTool[] {
  return useMemo(
    () => tools.filter((t) => t.category === category),
    [category]
  )
}

export function useSearchTools(query: string): QualityTool[] {
  return useMemo(() => {
    if (!query.trim()) return tools
    const q = query.toLowerCase()
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.nameZh.includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.descriptionZh.includes(q) ||
        t.tags.some((tag) => tag.includes(q))
    )
  }, [query])
}

export function useDmaicPhases() {
  return dmaicPhases
}

export function useCategories(): string[] {
  return useMemo(() => Array.from(new Set(tools.map((t) => t.category))), [])
}
