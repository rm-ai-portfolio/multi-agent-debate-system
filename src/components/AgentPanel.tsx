import { useDebateStore } from '../store/useDebateStore'

export function AgentPanel() {
  const agents = useDebateStore((s) => s.agents)
  const addAgent = useDebateStore((s) => s.addAgent)
  const removeAgent = useDebateStore((s) => s.removeAgent)
  const updateAgent = useDebateStore((s) => s.updateAgent)

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Agents</h2>
        <button
          onClick={addAgent}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-md transition"
        >
          + Add Agent
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Drag agents from here onto the canvas. Connect them to define the debate flow.
      </p>

      {agents.map((agent) => (
        <div
          key={agent.id}
          className="rounded-lg border border-gray-700 p-3 space-y-2"
          style={{ borderLeftColor: agent.color, borderLeftWidth: 4 }}
        >
          <div className="flex items-center justify-between">
            <input
              value={agent.name}
              onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
              className="bg-transparent text-sm font-medium text-white border-none outline-none w-full"
            />
            {agents.length > 2 && (
              <button
                onClick={() => removeAgent(agent.id)}
                className="text-gray-500 hover:text-red-400 text-xs ml-2"
              >
                ✕
              </button>
            )}
          </div>
          <textarea
            value={agent.systemPrompt}
            onChange={(e) => updateAgent(agent.id, { systemPrompt: e.target.value })}
            placeholder="System prompt..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  )
}
