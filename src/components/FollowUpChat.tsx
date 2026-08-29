import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useDebateStore } from '../store/useDebateStore'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function FollowUpChat() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const topic = useDebateStore((s) => s.topic)
  const messages = useDebateStore((s) => s.messages)
  const verdict = useDebateStore((s) => s.verdict)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    setChatMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          debateMessages: messages.map((m) => `${m.agentName}: ${m.content}`),
          verdict,
          chatHistory: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.reply }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      setChatMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-700 flex flex-col">
      <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-800">
        <span className="text-[10px] text-gray-500 uppercase font-medium">Follow-up Discussion</span>
      </div>

      {chatMessages.length > 0 && (
        <div ref={scrollRef} className="max-h-[300px] overflow-y-auto px-4 py-3 space-y-2">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%]`}>
                <div className={`flex items-center gap-1.5 mb-0.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-green-400' : 'text-purple-400'}`}>
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-snug ${
                    msg.role === 'user'
                      ? 'bg-green-900/30 text-gray-200 rounded-tr-sm'
                      : 'bg-purple-900/20 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-1.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-xs px-2">
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce w-1 h-1 bg-purple-400 rounded-full [animation-delay:0ms]" />
                <span className="animate-bounce w-1 h-1 bg-purple-400 rounded-full [animation-delay:150ms]" />
                <span className="animate-bounce w-1 h-1 bg-purple-400 rounded-full [animation-delay:300ms]" />
              </span>
              AI is thinking...
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question about the debate..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-full transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
