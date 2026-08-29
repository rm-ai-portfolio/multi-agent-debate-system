import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runDebate, callModel } from './debate.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Store pending human questions per debate session
const pendingHumanResponses = new Map<string, (answer: string) => void>()

app.post('/api/debate', async (req, res) => {
  const { agents, flow, topic, rounds, document } = req.body

  if (!topic || !agents?.length || !flow?.length) {
    res.status(400).json({ error: 'Missing topic, agents, or flow configuration' })
    return
  }

  const sessionId = crypto.randomUUID()

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Send session ID so frontend can respond to human questions
  send({ type: 'session', sessionId })

  const waitForHuman = (question: { agentId: string; agentName: string; question: string; options: { label: string; value: string }[] }): Promise<string> => {
    send({ type: 'ask_human', sessionId, ...question })
    return new Promise((resolve) => {
      pendingHumanResponses.set(sessionId, resolve)
    })
  }

  try {
    await runDebate({ agents, flow, topic, rounds: rounds || 3, document: document || null, send, waitForHuman })
    res.write('data: [DONE]\n\n')
  } catch (err) {
    send({ type: 'error', error: (err as Error).message })
  } finally {
    pendingHumanResponses.delete(sessionId)
    res.end()
  }
})

app.post('/api/debate/respond', (req, res) => {
  const { sessionId, answer } = req.body

  const resolver = pendingHumanResponses.get(sessionId)
  if (resolver) {
    resolver(answer)
    pendingHumanResponses.delete(sessionId)
    res.json({ ok: true })
  } else {
    res.status(404).json({ error: 'No pending question for this session' })
  }
})

app.post('/api/followup', async (req, res) => {
  const { topic, debateMessages, verdict, chatHistory } = req.body

  const transcript = (debateMessages || []).join('\n\n')
  const verdictSummary = verdict
    ? `Verdict: ${verdict.summary}\nConclusion: ${verdict.conclusion}`
    : ''

  const systemPrompt = `You are a helpful AI assistant. The user just completed a multi-agent debate on the topic: "${topic}"

Here is a summary of the debate:
${transcript.slice(-3000)}

${verdictSummary}

Answer the user's follow-up questions based on this debate context. Be concise, direct, and helpful. If they ask for deeper analysis on a specific point, provide it. Keep responses under 150 words unless they ask for detail.`

  const messages = (chatHistory || []).map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  try {
    const reply = await callModel(systemPrompt, messages, 512)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

app.post('/api/generate-questions', async (req, res) => {
  const { topic, document } = req.body

  if (!topic) {
    res.status(400).json({ error: 'Topic is required' })
    return
  }

  const docContext = document ? `\n\nThe user also uploaded a reference document:\n${document.slice(0, 3000)}` : ''

  const prompt = `The user wants to set up a multi-agent debate.

Their objective: "${topic}"${docContext}

Generate 3-5 clarifying questions to better understand what kind of debate they want. Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text",
      "options": [
        { "label": "Human-readable option", "value": "short_value" }
      ],
      "allowCustom": true
    }
  ]
}

Rules:
- Questions should help determine: the tone/style, number of perspectives, depth vs breadth, specific focus areas, and what outcome the user wants
- Each question should have 3-4 predefined options plus allowCustom=true for open text
- Options should be concrete and distinct, not vague
- Keep questions short and clear
- The questions should be tailored to the specific topic/document, not generic`

  try {
    const result = await callModel(
      'You are a debate setup assistant. Return only valid JSON, no markdown.',
      [{ role: 'user', content: prompt }],
      1024
    )

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

app.post('/api/generate-flow', async (req, res) => {
  const { topic, document, clarifications } = req.body

  if (!topic) {
    res.status(400).json({ error: 'Topic is required' })
    return
  }

  const docContext = document ? `\n\nReference document (the user uploaded this for context):\n${document}` : ''

  const clarificationContext = clarifications
    ? `\n\nUser's clarifications to refine the debate setup:\n${Object.entries(clarifications).map(([q, a]) => `- ${q}: ${a}`).join('\n')}`
    : ''

  const prompt = `The user wants a structured multi-agent debate.

Their objective: "${topic}"
${docContext}${clarificationContext}

Based on the objective${document ? ', the reference document,' : ''} and the user's clarifications, design the optimal debate setup. Return ONLY valid JSON:
{
  "agents": [
    { "name": "Short role name", "systemPrompt": "1-2 sentence persona and stance. Be direct, punchy, max 80 words per response." }
  ],
  "flow": [
    { "source": 0, "target": 1, "turns": 3 }
  ]
}

Rules:
- Create 2-4 agents with distinct perspectives tailored to the user's objective and their clarifications
- Agent names should be short role labels (e.g. "Pragmatist", "Ethicist", "Devil's Advocate")
- System prompts must enforce brevity (chat-style, no filler) and give each agent a clear stance
- If a document is provided, agents should reference it and argue about specific points in it
- Flow defines the debate order using agent array indices
- Keep total turns reasonable (2-4 per edge)
- Design flow so different viewpoints clash productively — consider which perspectives should interact
- Honor the user's preferences from their clarifications (tone, depth, focus areas, etc.)`

  try {
    const result = await callModel(
      'You are a debate architect. Return only valid JSON, no markdown.',
      [{ role: 'user', content: prompt }],
      1024
    )

    const jsonMatch = result.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '{}')
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
