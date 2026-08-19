import { create } from 'zustand'

interface LearningProgress {
  completedTools: string[]
  currentPhase: number
  markComplete: (toolId: string) => void
  resetProgress: () => void
}

export const useLearningStore = create<LearningProgress>((set) => ({
  completedTools: JSON.parse(localStorage.getItem('qt-learning-progress') || '[]'),
  currentPhase: Number(localStorage.getItem('qt-current-phase') || '0'),
  markComplete: (toolId: string) =>
    set((state) => {
      const updated = Array.from(new Set([...state.completedTools, toolId]))
      localStorage.setItem('qt-learning-progress', JSON.stringify(updated))
      return { completedTools: updated }
    }),
  resetProgress: () => {
    localStorage.removeItem('qt-learning-progress')
    localStorage.removeItem('qt-current-phase')
    set({ completedTools: [], currentPhase: 0 })
  },
}))
