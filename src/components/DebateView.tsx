import { useDebateStore } from '../store/useDebateStore'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { FollowUpChat } from './FollowUpChat'

export function DebateView() {
  const messages = useDebateStore((s) => s.messages)
  const verdict = useDebateStore((s) => s.verdict)
  const status = useDebateStore((s) => s.status)
  const error = useDebateStore((s) => s.error)
  const agents = useDebateStore((s) => s.agents)
  const reset = useDebateStore((s) => s.reset)
  const typingAgent = useDebateStore((s) => s.typingAgent)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const getAgentColor = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.color ?? '#6b7280'
  }

  const isLeftAgent = (agentId: string) => {
    const idx = agents.findIndex((a) => a.id === agentId)
    return idx % 2 === 0
  }

  if (status === 'idle' && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No debate yet</p>
          <p className="text-sm">Set up your agents and flow, provide a topic, then start the debate.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          if (msg.agentId === 'human') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="max-w-[80%] bg-yellow-900/30 border border-yellow-700/50 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-yellow-400">Human Decision (Veto)</span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-1 text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          }

          const left = isLeftAgent(msg.agentId)
          return (
            <div key={msg.id} className={`flex ${left ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%]`}>
                <div className={`flex items-center gap-1.5 mb-0.5 ${left ? '' : 'justify-end'}`}>
                  <span className="text-xs font-medium" style={{ color: getAgentColor(msg.agentId) }}>
                    {msg.agentName}
                  </span>
                  <span className="text-[10px] text-gray-600">T{msg.turnNumber}</span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-snug ${
                    left
                      ? 'bg-gray-800 text-gray-200 rounded-tl-sm'
                      : 'bg-blue-900/50 text-gray-200 rounded-tr-sm'
                  }`}
                >
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-1.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {status === 'running' && typingAgent && (
          <div className="flex items-center gap-2 text-gray-500 text-xs py-2 px-2">
            <span className="inline-flex gap-0.5">
              <span className="animate-bounce w-1 h-1 bg-gray-400 rounded-full [animation-delay:0ms]" />
              <span className="animate-bounce w-1 h-1 bg-gray-400 rounded-full [animation-delay:150ms]" />
              <span className="animate-bounce w-1 h-1 bg-gray-400 rounded-full [animation-delay:300ms]" />
            </span>
            {typingAgent} is typing...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-300">
            Error: {error}
          </div>
        )}

        {verdict && (
          <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Verdict</h3>
              <CopyButton verdict={verdict} />
            </div>
            <div className="text-sm text-gray-300 leading-relaxed prose prose-sm prose-invert max-w-none [&>p]:m-0">
              <ReactMarkdown>{verdict.summary}</ReactMarkdown>
            </div>

            {verdict.keyPoints.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Key Points</h4>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                  {verdict.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {verdict.agreements.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-green-400 uppercase mb-1">Agreed</h4>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                  {verdict.agreements.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {verdict.disagreements.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-red-400 uppercase mb-1">Disagreed</h4>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                  {verdict.disagreements.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {verdict.humanDecisions && verdict.humanDecisions.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-yellow-400 uppercase mb-1">Human Decisions</h4>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                  {verdict.humanDecisions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-gray-700">
              <h4 className="text-[10px] font-semibold text-blue-400 uppercase mb-1">Conclusion</h4>
              <div className="text-xs text-gray-200 prose prose-sm prose-invert max-w-none [&>p]:m-0">
                <ReactMarkdown>{verdict.conclusion}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {status === 'completed' && verdict && <FollowUpChat />}

      {status === 'completed' && (
        <div className="border-t border-gray-800 p-3 flex justify-center">
          <button
            onClick={reset}
            className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition"
          >
            Reset & Run Again
          </button>
        </div>
      )}
    </div>
  )
}

function CopyButton({ verdict }: { verdict: { summary: string; keyPoints: string[]; agreements: string[]; disagreements: string[]; humanDecisions?: string[]; conclusion: string } }) {
  const [copied, setCopied] = useState(false)

  const buildMarkdown = () => {
    let md = `# Verdict\n\n${verdict.summary}\n`

    if (verdict.keyPoints.length > 0) {
      md += `\n## Key Points\n${verdict.keyPoints.map((p) => `- ${p}`).join('\n')}\n`
    }
    if (verdict.agreements.length > 0) {
      md += `\n## Agreements\n${verdict.agreements.map((a) => `- ${a}`).join('\n')}\n`
    }
    if (verdict.disagreements.length > 0) {
      md += `\n## Disagreements\n${verdict.disagreements.map((d) => `- ${d}`).join('\n')}\n`
    }
    if (verdict.humanDecisions && verdict.humanDecisions.length > 0) {
      md += `\n## Human Decisions\n${verdict.humanDecisions.map((d) => `- ${d}`).join('\n')}\n`
    }
    md += `\n## Conclusion\n${verdict.conclusion}\n`

    return md
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
    >
      {copied ? 'Copied!' : 'Copy as MD'}
    </button>
  )
}
