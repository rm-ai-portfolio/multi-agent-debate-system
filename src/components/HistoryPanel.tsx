import { useHistoryStore, type SavedDebate } from '../store/useHistoryStore'
import { useDebateStore } from '../store/useDebateStore'

interface Props {
  open: boolean
  onToggle: () => void
  onLoad?: () => void
}

export function HistoryPanel({ open, onToggle, onLoad }: Props) {
  const debates = useHistoryStore((s) => s.debates)
  const deleteDebate = useHistoryStore((s) => s.deleteDebate)
  const clearAll = useHistoryStore((s) => s.clearAll)

  const loadDebate = (debate: SavedDebate) => {
    const store = useDebateStore.getState()
    store.setTopic(debate.topic)
    store.setRounds(debate.rounds)
    useDebateStore.setState({
      agents: debate.agents,
      flow: debate.flow,
      messages: debate.messages,
      verdict: debate.verdict,
      status: 'completed',
    })
    onLoad?.()
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Overlay when open on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 flex flex-col bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out ${
          open ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'
        }`}
      >
        {open && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-200">History</h2>
              </div>
              <button
                onClick={onToggle}
                className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {debates.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No saved debates yet</p>
                  <p className="text-xs text-gray-600">Completed debates will appear here</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
                  <span className="text-[11px] text-gray-500">
                    {debates.length} debate{debates.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-red-500/70 hover:text-red-400 transition"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {debates.map((debate) => (
                    <div
                      key={debate.id}
                      className="px-4 py-3 border-b border-gray-800/30 hover:bg-gray-800/40 transition cursor-pointer group"
                      onClick={() => loadDebate(debate)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-200 truncate font-medium">
                            {debate.topic}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500">
                              {formatDate(debate.createdAt)}
                            </span>
                            <span className="text-[10px] text-gray-600">
                              {debate.agents.length} agents
                            </span>
                            <span className="text-[10px] text-gray-600">
                              {debate.messages.length} msgs
                            </span>
                          </div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {debate.agents.map((a) => (
                              <span
                                key={a.id}
                                className="text-[9px] px-1.5 py-0.5 rounded-full text-white/80"
                                style={{
                                  backgroundColor: a.color + '40',
                                  border: `1px solid ${a.color}60`,
                                }}
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDebate(debate.id)
                          }}
                          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs mt-0.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </>
  )
}
