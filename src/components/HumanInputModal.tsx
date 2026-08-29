import { useState } from 'react'
import { useDebateStore } from '../store/useDebateStore'

export function HumanInputModal() {
  const humanQuestion = useDebateStore((s) => s.humanQuestion)
  const respondToHuman = useDebateStore((s) => s.respondToHuman)
  const agents = useDebateStore((s) => s.agents)
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  if (!humanQuestion) return null

  const agentColor = agents.find((a) => a.id === humanQuestion.agentId)?.color ?? '#8b5cf6'

  const handleSubmit = () => {
    const answer = customText.trim() || selected
    if (!answer) return
    respondToHuman(answer)
    setSelected(null)
    setCustomText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agentColor }}
          />
          <h2 className="text-sm font-semibold text-white">
            {humanQuestion.agentName} needs your input
          </h2>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-200">{humanQuestion.question}</p>

          <div className="space-y-2">
            {humanQuestion.options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                  selected === opt.value && !customText.trim()
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="human-choice"
                  value={opt.value}
                  checked={selected === opt.value && !customText.trim()}
                  onChange={() => {
                    setSelected(opt.value)
                    setCustomText('')
                  }}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-1">
            <label className="text-[10px] text-gray-500 uppercase font-medium block mb-1">
              Or provide your own answer (veto power)
            </label>
            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value)
                if (e.target.value.trim()) setSelected(null)
              }}
              placeholder="Type your decision or direction..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selected && !customText.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-md transition"
          >
            Submit Decision
          </button>
        </div>
      </div>
    </div>
  )
}
