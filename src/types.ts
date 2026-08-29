export interface AgentConfig {
  id: string
  name: string
  systemPrompt: string
  color: string
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  turns: number
}

export interface DebateConfig {
  topic: string
  agents: AgentConfig[]
  flow: FlowEdge[]
  maxTurnsPerEdge: number
}

export interface DebateMessage {
  id: string
  agentId: string
  agentName: string
  content: string
  timestamp: number
  turnNumber: number
}

export interface DebateVerdict {
  summary: string
  keyPoints: string[]
  agreements: string[]
  disagreements: string[]
  humanDecisions?: string[]
  conclusion: string
}

export interface DebateState {
  status: 'idle' | 'running' | 'completed' | 'error'
  messages: DebateMessage[]
  verdict: DebateVerdict | null
  currentTurn: number
  currentEdgeIndex: number
  error?: string
}
