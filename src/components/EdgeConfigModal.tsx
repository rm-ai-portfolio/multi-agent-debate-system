import { useState } from 'react'
import type { Edge } from 'reactflow'

interface Props {
  edge: Edge
  onSave: (edgeId: string, turns: number) => void
  onClose: () => void
}

export function EdgeConfigModal({ edge, onSave, onClose }: Props) {
  const [turns, setTurns] = useState(edge.data?.turns ?? 3)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-80 shadow-2xl">
        <h3 className="text-sm font-semibold text-white mb-4">Configure Connection</h3>
        <label className="block text-xs text-gray-400 mb-1">Number of turns</label>
        <input
          type="number"
          min={1}
          max={20}
          value={turns}
          onChange={(e) => setTurns(Number(e.target.value))}
          className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          How many back-and-forth messages between these two agents.
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave(edge.id, turns)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
