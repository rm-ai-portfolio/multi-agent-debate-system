import { useState } from 'react'
import { useDebateStore } from '../store/useDebateStore'
import { FlowBuilder } from './FlowBuilder'
import { AgentPanel } from './AgentPanel'
import { AIGenerateModal } from './AIGenerateModal'

interface Props {
  onBack: () => void
  onStart: () => void
}

export function WorkflowStep({ onBack, onStart }: Props) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'ai-done'>('choose')
  const [showAIModal, setShowAIModal] = useState(false)
  const topic = useDebateStore((s) => s.topic)
  const agents = useDebateStore((s) => s.agents)
  const flow = useDebateStore((s) => s.flow)
  const rounds = useDebateStore((s) => s.rounds)
  const setRounds = useDebateStore((s) => s.setRounds)
  const status = useDebateStore((s) => s.status)
  const generating = useDebateStore((s) => s.generating)

  const hasWorkflow = flow.length > 0
  const canStart = hasWorkflow && status !== 'running'

  const handleAIGenerate = () => {
    setShowAIModal(true)
  }

  const handleAIModalClose = () => {
    setShowAIModal(false)
    // If flow was generated, switch to showing the preview
    const currentFlow = useDebateStore.getState().flow
    if (currentFlow.length > 0) {
      setMode('ai-done')
    }
  }

  const handleStartDebate = () => {
    onStart()
  }

  // Choice cards view
  if (mode === 'choose') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Configure Workflow</h2>
            <p className="text-gray-400">
              How would you like to set up the debate agents and their interactions?
            </p>
          </div>

          {/* Objective summary */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3">
            <span className="text-xs text-gray-500 uppercase font-medium">Objective</span>
            <p className="text-sm text-gray-200 mt-1 line-clamp-2">{topic}</p>
          </div>

          {/* Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Generate Card */}
            <button
              onClick={handleAIGenerate}
              disabled={generating}
              className="group relative text-left bg-gray-800/60 border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 disabled:opacity-50"
            >
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                  Recommended
                </span>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-200 transition">
                    AI Generate
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    AI analyzes your objective, asks clarifying questions, then generates the ideal agent configuration and debate flow.
                  </p>
                </div>
              </div>
            </button>

            {/* Manual Setup Card */}
            <button
              onClick={() => setMode('manual')}
              className="group text-left bg-gray-800/60 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11.42 15.17l-5.384 3.079 1.028-5.997-4.357-4.248 6.024-.876L11.42 2.25l2.69 4.878 6.024.876-4.357 4.248 1.028 5.997-5.384-3.079z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-200 transition">
                    Manual Setup
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Build the debate flow yourself. Add agents, configure their prompts, and connect them on a visual canvas.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Back Button */}
          <div className="flex justify-start">
            <button
              onClick={onBack}
              className="px-5 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>

        <AIGenerateModal open={showAIModal} onClose={handleAIModalClose} />
      </div>
    )
  }

  // Manual flow builder view
  if (mode === 'manual') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
        {/* Top bar with controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode('choose')}
              className="text-gray-400 hover:text-white text-sm font-medium transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <h3 className="text-sm font-medium text-gray-200">Flow Builder</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Rounds:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleStartDebate}
              disabled={!canStart}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/30 disabled:shadow-none flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Debate
            </button>
          </div>
        </div>

        {/* Flow builder content */}
        <div className="flex-1 flex overflow-hidden">
          <AgentPanel />
          <div className="flex-1">
            <FlowBuilder />
          </div>
        </div>
      </div>
    )
  }

  // AI-done preview view (after AI generates)
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Workflow Ready</h2>
          <p className="text-gray-400">
            AI has configured your debate. Review the setup below.
          </p>
        </div>

        {/* Agent Preview */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Agents ({agents.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-2"
                style={{ borderLeftColor: agent.color, borderLeftWidth: 4 }}
              >
                <h4 className="text-sm font-medium text-white">{agent.name}</h4>
                <p className="text-xs text-gray-400 line-clamp-2">{agent.systemPrompt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Flow Preview */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Connections ({flow.length})
          </h3>
          <div className="space-y-2">
            {flow.map((edge) => {
              const sourceAgent = agents.find((a) => a.id === edge.source)
              const targetAgent = agents.find((a) => a.id === edge.target)
              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-3 bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5"
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: sourceAgent?.color }}
                  >
                    {sourceAgent?.name}
                  </span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span
                    className="text-sm font-medium"
                    style={{ color: targetAgent?.color }}
                  >
                    {targetAgent?.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    {edge.turns ?? rounds} turns
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rounds config */}
        <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Rounds per connection:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => setRounds(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setMode('manual')}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Edit in Flow Builder
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setMode('choose')}
            className="px-5 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            onClick={handleStartDebate}
            disabled={!canStart}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-green-600/20 hover:shadow-green-500/30 disabled:shadow-none flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Debate
          </button>
        </div>
      </div>
    </div>
  )
}
