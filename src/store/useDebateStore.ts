import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { AgentConfig, FlowEdge, DebateMessage, DebateVerdict } from '../types'
import { useHistoryStore } from './useHistoryStore'

const AGENT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
]

interface HumanQuestion {
  agentId: string
  agentName: string
  question: string
  options: { label: string; value: string }[]
}

interface DebateStore {
  agents: AgentConfig[]
  flow: FlowEdge[]
  topic: string
  rounds: number
  documents: { name: string; content: string }[]
  status: 'idle' | 'running' | 'completed' | 'error'
  messages: DebateMessage[]
  verdict: DebateVerdict | null
  error: string | null
  typingAgent: string | null
  abortController: AbortController | null
  sessionId: string | null
  humanQuestion: HumanQuestion | null

  generating: boolean
  setGenerating: (v: boolean) => void
  addAgent: () => void
  removeAgent: (id: string) => void
  updateAgent: (id: string, updates: Partial<AgentConfig>) => void
  setFlow: (flow: FlowEdge[]) => void
  updateEdgeTurns: (edgeId: string, turns: number) => void
  setTopic: (topic: string) => void
  setRounds: (rounds: number) => void
  addDocuments: (files: { name: string; content: string }[]) => void
  removeDocument: (name: string) => void
  clearDocuments: () => void
  respondToHuman: (answer: string) => Promise<void>
  startDebate: () => Promise<void>
  stopDebate: () => void
  reset: () => void
}

export const useDebateStore = create<DebateStore>((set, get) => ({
  agents: [
    { id: uuid(), name: 'Agent 1', systemPrompt: 'Argue FOR the topic. Max 2-3 short paragraphs. No filler, no preamble. Be direct and punchy like a text message.', color: AGENT_COLORS[0] },
    { id: uuid(), name: 'Agent 2', systemPrompt: 'Argue AGAINST the topic. Max 2-3 short paragraphs. No filler, no preamble. Be direct and punchy like a text message.', color: AGENT_COLORS[1] },
  ],
  flow: [],
  topic: '',
  rounds: 3,
  documents: [],
  generating: false,
  status: 'idle',
  messages: [],
  verdict: null,
  error: null,
  typingAgent: null,
  abortController: null,
  sessionId: null,
  humanQuestion: null,

  addAgent: () => {
    const { agents } = get()
    const newAgent: AgentConfig = {
      id: uuid(),
      name: `Agent ${agents.length + 1}`,
      systemPrompt: 'You are a balanced debater. Provide thoughtful arguments.',
      color: AGENT_COLORS[agents.length % AGENT_COLORS.length],
    }
    set({ agents: [...agents, newAgent] })
  },

  removeAgent: (id) => {
    const { agents, flow } = get()
    set({
      agents: agents.filter((a) => a.id !== id),
      flow: flow.filter((f) => f.source !== id && f.target !== id),
    })
  },

  updateAgent: (id, updates) => {
    const { agents } = get()
    set({ agents: agents.map((a) => (a.id === id ? { ...a, ...updates } : a)) })
  },

  setFlow: (flow) => set({ flow }),

  updateEdgeTurns: (edgeId, turns) => {
    const { flow } = get()
    set({ flow: flow.map((f) => (f.id === edgeId ? { ...f, turns } : f)) })
  },

  setTopic: (topic) => set({ topic }),

  setRounds: (rounds) => set({ rounds }),

  addDocuments: (files) => {
    const { documents } = get()
    const existingNames = new Set(documents.map((d) => d.name))
    const newFiles = files.filter((f) => !existingNames.has(f.name))
    set({ documents: [...documents, ...newFiles] })
  },

  removeDocument: (name) => {
    const { documents } = get()
    set({ documents: documents.filter((d) => d.name !== name) })
  },

  clearDocuments: () => set({ documents: [] }),

  setGenerating: (v) => set({ generating: v }),

  respondToHuman: async (answer) => {
    const { sessionId } = get()
    if (!sessionId) return

    set({ humanQuestion: null })

    await fetch('/api/debate/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answer }),
    })
  },

  stopDebate: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ status: 'completed', abortController: null })
  },

  startDebate: async () => {
    const { agents, flow, topic, rounds, documents } = get()
    if (!topic.trim() || flow.length === 0) return

    const combinedDocument = documents.length > 0
      ? documents.map((d) => `--- ${d.name} ---\n${d.content}`).join('\n\n')
      : null

    const controller = new AbortController()
    set({ status: 'running', messages: [], verdict: null, error: null, abortController: controller })

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents, flow, topic, rounds, document: combinedDocument }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Debate failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            if (event.type === 'session') {
              set({ sessionId: event.sessionId })
            } else if (event.type === 'typing') {
              set({ typingAgent: event.agentName })
            } else if (event.type === 'message') {
              set((s) => ({ messages: [...s.messages, event.message], typingAgent: null }))
            } else if (event.type === 'ask_human') {
              set({
                humanQuestion: {
                  agentId: event.agentId,
                  agentName: event.agentName,
                  question: event.question,
                  options: event.options,
                },
                typingAgent: null,
              })
            } else if (event.type === 'human_decision') {
              set((s) => ({
                messages: [...s.messages, {
                  id: uuid(),
                  agentId: 'human',
                  agentName: 'You (Veto)',
                  content: `**${event.decision.agentName}** asked: "${event.decision.question}"\n\nYour decision: **${event.decision.answer}**`,
                  timestamp: Date.now(),
                  turnNumber: 0,
                }],
              }))
            } else if (event.type === 'verdict') {
              set({ verdict: event.verdict, status: 'completed', typingAgent: null })
              const s = get()
              useHistoryStore.getState().saveDebate({
                topic: s.topic,
                rounds: s.rounds,
                agents: s.agents,
                flow: s.flow,
                messages: s.messages,
                verdict: event.verdict,
                documentNames: s.documents.map((d) => d.name),
              })
            } else if (event.type === 'error') {
              set({ error: event.error, status: 'error', typingAgent: null })
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      const state = get()
      if (state.status === 'running') {
        set({ status: 'completed' })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        set({ status: 'completed', abortController: null })
      } else {
        set({ error: (err as Error).message, status: 'error', abortController: null })
      }
    }
  },

  reset: () => set({ status: 'idle', messages: [], verdict: null, error: null }),
}))
