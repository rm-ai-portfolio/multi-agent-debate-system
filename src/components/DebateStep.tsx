import { useDebateStore } from '../store/useDebateStore'
import { DebateView } from './DebateView'

interface Props {
  onBack: () => void
  onNewDebate: () => void
}

export function DebateStep({ onBack, onNewDebate }: Props) {
  const agents = useDebateStore((s) => s.agents)
  const status = useDebateStore((s) => s.status)
  const topic = useDebateStore((s) => s.topic)
  const rounds = useDebateStore((s) => s.rounds)
  const stopDebate = useDebateStore((s) => s.stopDebate)
  const reset = useDebateStore((s) => s.reset)

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* Main debate chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DebateView />
      </div>

      {/* Right sidebar */}
      <div className="w-72 bg-gray-900/80 border-l border-gray-800 flex flex-col overflow-hidden">
        {/* Debate Info */}
        <div className="px-4 py-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Debate</h3>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                status === 'running'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : status === 'completed'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : status === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}
            >
              {status === 'running' ? 'Live' : status === 'completed' ? 'Completed' : status === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-3">{topic}</p>
          <div className="text-xs text-gray-500">
            {rounds} rounds per connection
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Agents ({agents.length})
          </h3>
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 space-y-1"
              style={{ borderLeftColor: agent.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-sm font-medium text-white">{agent.name}</span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-2 pl-[18px]">
                {agent.systemPrompt}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="px-4 py-4 border-t border-gray-800 space-y-2">
          {status === 'running' && (
            <button
              onClick={stopDebate}
              className="w-full px-4 py-2.5 bg-red-600/90 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Debate
            </button>
          )}
          {status === 'completed' && (
            <button
              onClick={() => { reset(); onNewDebate() }}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Debate
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
