import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { callDeepSeek, type ChatRequestBody } from './deepseek.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'laboris-api' })
})

app.post('/v1/chat', async (req, res) => {
  const key = process.env.DEEPSEEK_API_KEY?.trim()
  if (!key) {
    res.status(503).json({ error: '未配置 DEEPSEEK_API_KEY，请在 laboris-api/.env 中填写' })
    return
  }

  const body = req.body as Partial<ChatRequestBody>
  if (!body.userMessage?.trim()) {
    res.status(400).json({ error: '缺少 userMessage' })
    return
  }
  if (body.role !== 'hr' && body.role !== 'lawyer' && body.role !== 'arbitrator') {
    res.status(400).json({ error: 'role 必须为 hr、lawyer 或 arbitrator' })
    return
  }

  const payload: ChatRequestBody = {
    role: body.role,
    temperature: typeof body.temperature === 'number' ? body.temperature : 50,
    scenario: typeof body.scenario === 'string' ? body.scenario : 'layoff',
    userMessage: body.userMessage.trim(),
    history: Array.isArray(body.history) ? body.history : undefined,
  }

  try {
    const reply = await callDeepSeek(
      key,
      process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com',
      process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      payload,
    )
    res.json({ reply })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'DeepSeek 调用失败'
    res.status(502).json({ error: msg })
  }
})

app.post('/v1/chat/preview', (_req, res) => {
  res.status(410).json({ error: '请使用 POST /v1/chat' })
})

app.listen(PORT, () => {
  console.log(`laboris-api http://localhost:${PORT}`)
})
