import { useState, useEffect } from 'react'
import { useDebateStore } from '../store/useDebateStore'

interface QuestionOption {
  label: string
  value: string
}

interface ClarifyingQuestion {
  id: string
  question: string
  options: QuestionOption[]
  allowCustom: boolean
}

type ModalStep = 'loading' | 'questions' | 'generating' | 'error'

interface Props {
  open: boolean
  onClose: () => void
}

export function AIGenerateModal({ open, onClose }: Props) {
  const topic = useDebateStore((s) => s.topic)
  const documents = useDebateStore((s) => s.documents)
  const document = documents.length > 0
    ? documents.map((d) => `--- ${d.name} ---\n${d.content}`).join('\n\n')
    : null
  const [step, setStep] = useState<ModalStep>('loading')
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('loading')
    setAnswers({})
    setError('')

    fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, document }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to get questions')
        return res.json()
      })
      .then((data) => {
        setQuestions(data.questions)
        setStep('questions')
      })
      .catch((err) => {
        setError(err.message)
        setStep('error')
      })
  }, [open, topic, document])

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleCustomInput = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const allAnswered = questions.every((q) => answers[q.id]?.trim())

  const handleSubmit = async () => {
    setStep('generating')
    try {
      const response = await fetch('/api/generate-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, document, clarifications: answers }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Generation failed')
      }

      const data = await response.json()
      const store = useDebateStore.getState()

      const AGENT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
      const agents = data.agents.map((a: { name: string; systemPrompt: string }, i: number) => ({
        id: crypto.randomUUID(),
        name: a.name,
        systemPrompt: a.systemPrompt,
        color: AGENT_COLORS[i % AGENT_COLORS.length],
      }))

      const flow = data.flow.map((f: { source: number; target: number; turns: number }) => ({
        id: `${agents[f.source].id}-${agents[f.target].id}`,
        source: agents[f.source].id,
        target: agents[f.target].id,
        turns: f.turns,
      }))

      store.setFlow(flow)
      useDebateStore.setState({ agents, flow, generating: false })
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setStep('error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">AI Generate Debate Setup</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full" />
                Analyzing your objective...
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-300">
                {error}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md"
              >
                Close
              </button>
            </div>
          )}

          {step === 'questions' && (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                Help me understand what you need so I can create the best debate setup.
              </p>
              {questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-gray-200 font-medium">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition ${
                          answers[q.id] === opt.value
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => handleSelect(q.id, opt.value)}
                          className="accent-blue-500"
                        />
                        <span className="text-xs text-gray-300">{opt.label}</span>
                      </label>
                    ))}
                    {q.allowCustom && (
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Or type your own..."
                          value={
                            q.options.some((o) => o.value === answers[q.id])
                              ? ''
                              : answers[q.id] || ''
                          }
                          onChange={(e) => handleCustomInput(q.id, e.target.value)}
                          onFocus={() => {
                            if (q.options.some((o) => o.value === answers[q.id])) {
                              handleCustomInput(q.id, '')
                            }
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'generating' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-purple-500 rounded-full" />
                Generating debate setup...
              </div>
            </div>
          )}
        </div>

        {step === 'questions' && (
          <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-md transition"
            >
              Generate Setup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
