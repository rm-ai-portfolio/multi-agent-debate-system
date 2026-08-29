import { v4 as uuid } from 'uuid'

interface AgentConfig {
  id: string
  name: string
  systemPrompt: string
  color: string
}

interface FlowEdge {
  id: string
  source: string
  target: string
  turns: number
}

interface DebateParams {
  agents: AgentConfig[]
  flow: FlowEdge[]
  topic: string
  rounds: number
  document: string | null
  send: (data: unknown) => void
  waitForHuman: (question: HumanQuestion) => Promise<string>
}

interface ConversationHistory {
  role: 'user' | 'assistant'
  content: string
}

interface HumanQuestion {
  agentId: string
  agentName: string
  question: string
  options: { label: string; value: string }[]
}

const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
const MODEL_ID = process.env.ANTHROPIC_MODEL || 'anthropic.claude-sonnet-4-20250514-v1:0'
const API_KEY = process.env.ANTHROPIC_API_KEY || ''

export async function callModel(
  system: string,
  messages: ConversationHistory[],
  maxTokens = 1024
): Promise<string> {
  const url = `${BASE_URL}/model/${MODEL_ID}/invoke`

  const body = {
    max_tokens: maxTokens,
    anthropic_version: 'bedrock-2023-05-31',
    system,
    messages,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (API_KEY) {
    headers['x-api-key'] = API_KEY
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Model API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text')
  return textBlock?.text ?? ''
}

function parseHumanRequest(response: string): HumanQuestion | null {
  const match = response.match(/\[ASK_HUMAN\]([\s\S]*?)\[\/ASK_HUMAN\]/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1])
    return {
      agentId: '',
      agentName: '',
      question: parsed.question,
      options: parsed.options || [],
    }
  } catch {
    return null
  }
}

function stripHumanRequest(response: string): string {
  return response.replace(/\[ASK_HUMAN\][\s\S]*?\[\/ASK_HUMAN\]/, '').trim()
}

async function getAgentResponse(
  agent: AgentConfig,
  topic: string,
  history: ConversationHistory[],
  context: string,
  document: string | null,
  vetoes: string[]
): Promise<string> {
  const docSection = document ? `\n\nREFERENCE DOCUMENT:\n${document}\n` : ''
  const vetoSection = vetoes.length > 0
    ? `\n\nHUMAN DECISIONS (these have veto power — you MUST respect and build upon these):\n${vetoes.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n`
    : ''

  const systemPrompt = `${agent.systemPrompt}\n\nTopic: "${topic}"\n${context}${docSection}${vetoSection}
RULES: Keep responses under 80 words. No markdown headers. No bullet lists. Write in short, direct sentences like a chat message. No filler phrases.

HUMAN-IN-THE-LOOP: If you reach a point where the debate needs human judgment, expertise, or a decision that you can't make autonomously, you may ask the human. To do so, append this EXACT format at the end of your message:
[ASK_HUMAN]{"question":"Your question to the human","options":[{"label":"Option A description","value":"a"},{"label":"Option B description","value":"b"},{"label":"Option C description","value":"c"}]}[/ASK_HUMAN]

Only ask the human when genuinely stuck or when the debate has reached a fork that requires human values/preferences. Do NOT ask every turn. Max once per debate per agent.`

  const messages = history.length > 0
    ? history
    : [{ role: 'user' as const, content: `Topic: "${topic}". Your opening argument:` }]

  return callModel(systemPrompt, messages, 512)
}

export async function runDebate({ agents, flow, topic, rounds, document, send, waitForHuman }: DebateParams) {
  const agentMap = new Map(agents.map((a) => [a.id, a]))
  const histories = new Map<string, ConversationHistory[]>()
  const vetoes: string[] = []
  const agentAskCount = new Map<string, number>()

  for (const edge of flow) {
    histories.set(edge.id, [])
  }

  let globalTurn = 0

  for (const edge of flow) {
    const sourceAgent = agentMap.get(edge.source)
    const targetAgent = agentMap.get(edge.target)
    if (!sourceAgent || !targetAgent) continue

    const history = histories.get(edge.id)!

    const edgeTurns = rounds || edge.turns || 3
    for (let turn = 0; turn < edgeTurns; turn++) {
      globalTurn++

      // Source agent speaks
      send({ type: 'typing', agentId: sourceAgent.id, agentName: sourceAgent.name })
      const sourceContext = `You are debating with ${targetAgent.name}. This is turn ${turn + 1} of ${edgeTurns}.`
      let sourceResponse = await getAgentResponse(sourceAgent, topic, history, sourceContext, document, vetoes)

      // Check if agent wants to ask human
      const sourceHumanReq = parseHumanRequest(sourceResponse)
      if (sourceHumanReq && (agentAskCount.get(sourceAgent.id) || 0) < 1) {
        const cleanResponse = stripHumanRequest(sourceResponse)
        if (cleanResponse) {
          const sourceMessage = {
            id: uuid(),
            agentId: sourceAgent.id,
            agentName: sourceAgent.name,
            content: cleanResponse,
            timestamp: Date.now(),
            turnNumber: globalTurn,
          }
          send({ type: 'message', message: sourceMessage })
        }

        sourceHumanReq.agentId = sourceAgent.id
        sourceHumanReq.agentName = sourceAgent.name
        const humanAnswer = await waitForHuman(sourceHumanReq)
        vetoes.push(`[${sourceAgent.name} asked: "${sourceHumanReq.question}"] Human decided: "${humanAnswer}"`)
        agentAskCount.set(sourceAgent.id, (agentAskCount.get(sourceAgent.id) || 0) + 1)

        send({
          type: 'human_decision',
          decision: { agentName: sourceAgent.name, question: sourceHumanReq.question, answer: humanAnswer },
        })

        sourceResponse = cleanResponse || sourceResponse
      }

      const displayResponse = stripHumanRequest(sourceResponse)
      if (!sourceHumanReq || !stripHumanRequest(sourceResponse)) {
        const sourceMessage = {
          id: uuid(),
          agentId: sourceAgent.id,
          agentName: sourceAgent.name,
          content: displayResponse || sourceResponse,
          timestamp: Date.now(),
          turnNumber: globalTurn,
        }
        send({ type: 'message', message: sourceMessage })
      }

      history.push({ role: 'assistant', content: displayResponse || sourceResponse })

      // Target agent responds
      const targetHistory: ConversationHistory[] = history.map((h, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.content,
      }))

      send({ type: 'typing', agentId: targetAgent.id, agentName: targetAgent.name })
      const targetContext = `You are debating with ${sourceAgent.name}. This is turn ${turn + 1} of ${edgeTurns}. Respond to their arguments.`
      let targetResponse = await getAgentResponse(targetAgent, topic, targetHistory, targetContext, document, vetoes)

      // Check if target agent wants to ask human
      const targetHumanReq = parseHumanRequest(targetResponse)
      if (targetHumanReq && (agentAskCount.get(targetAgent.id) || 0) < 1) {
        const cleanResponse = stripHumanRequest(targetResponse)
        if (cleanResponse) {
          const targetMessage = {
            id: uuid(),
            agentId: targetAgent.id,
            agentName: targetAgent.name,
            content: cleanResponse,
            timestamp: Date.now(),
            turnNumber: globalTurn + 1,
          }
          send({ type: 'message', message: targetMessage })
        }

        targetHumanReq.agentId = targetAgent.id
        targetHumanReq.agentName = targetAgent.name
        const humanAnswer = await waitForHuman(targetHumanReq)
        vetoes.push(`[${targetAgent.name} asked: "${targetHumanReq.question}"] Human decided: "${humanAnswer}"`)
        agentAskCount.set(targetAgent.id, (agentAskCount.get(targetAgent.id) || 0) + 1)

        send({
          type: 'human_decision',
          decision: { agentName: targetAgent.name, question: targetHumanReq.question, answer: humanAnswer },
        })

        targetResponse = cleanResponse || targetResponse
      }

      globalTurn++
      const finalTargetResponse = stripHumanRequest(targetResponse)
      if (!targetHumanReq || !stripHumanRequest(targetResponse)) {
        const targetMessage = {
          id: uuid(),
          agentId: targetAgent.id,
          agentName: targetAgent.name,
          content: finalTargetResponse || targetResponse,
          timestamp: Date.now(),
          turnNumber: globalTurn,
        }
        send({ type: 'message', message: targetMessage })
      }

      history.push({ role: 'user', content: finalTargetResponse || targetResponse })
    }
  }

  // Generate verdict
  const allMessages = flow.flatMap((edge) => {
    const h = histories.get(edge.id) || []
    const source = agentMap.get(edge.source)
    const target = agentMap.get(edge.target)
    return h.map((m, i) => {
      const speaker = i % 2 === 0 ? source : target
      return `${speaker?.name}: ${m.content}`
    })
  })

  const vetoContext = vetoes.length > 0
    ? `\n\nHuman decisions made during the debate (these have veto authority):\n${vetoes.join('\n')}\n`
    : ''

  const verdictPrompt = `You are a neutral judge analyzing a multi-agent debate on the topic: "${topic}"

Here is the complete debate transcript:

${allMessages.join('\n\n---\n\n')}
${vetoContext}
Provide a structured analysis in the following JSON format (return ONLY valid JSON):
{
  "summary": "A 2-3 sentence overview of the debate",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "agreements": ["areas where agents agreed"],
  "disagreements": ["areas of disagreement"],
  "humanDecisions": ["what the human decided and how it shaped the debate"],
  "conclusion": "Your balanced conclusion and key takeaway for the user"
}`

  const verdictText = await callModel(
    'You are a neutral debate judge. Return only valid JSON.',
    [{ role: 'user', content: verdictPrompt }],
    2048
  )

  try {
    const jsonMatch = verdictText.match(/\{[\s\S]*\}/)
    const verdict = JSON.parse(jsonMatch?.[0] ?? '{}')
    send({ type: 'verdict', verdict })
  } catch {
    send({
      type: 'verdict',
      verdict: {
        summary: verdictText,
        keyPoints: [],
        agreements: [],
        disagreements: [],
        humanDecisions: [],
        conclusion: 'See summary above.',
      },
    })
  }
}
