import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentConfig, FlowEdge, DebateMessage, DebateVerdict } from '../types'

export interface SavedDebate {
  id: string
  topic: string
  rounds: number
  agents: AgentConfig[]
  flow: FlowEdge[]
  messages: DebateMessage[]
  verdict: DebateVerdict | null
  documentNames: string[]
  createdAt: number
}

interface HistoryStore {
  debates: SavedDebate[]
  saveDebate: (debate: Omit<SavedDebate, 'id' | 'createdAt'>) => void
  deleteDebate: (id: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      debates: [],

      saveDebate: (debate) => {
        const entry: SavedDebate = {
          ...debate,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }
        set({ debates: [entry, ...get().debates] })
      },

      deleteDebate: (id) => {
        set({ debates: get().debates.filter((d) => d.id !== id) })
      },

      clearAll: () => set({ debates: [] }),
    }),
    { name: 'debate-history' }
  )
)
