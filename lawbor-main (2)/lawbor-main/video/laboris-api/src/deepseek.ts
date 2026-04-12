import { buildSystemPrompt, sliderToApiTemperature, type ChatRole } from './prompts.js'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatRequestBody = {
  role: ChatRole
  temperature: number
  scenario: string
  userMessage: string
  /** 前几轮对话，不含 system */
  history?: { role: 'user' | 'assistant'; content: string }[]
}

export async function callDeepSeek(apiKey: string, baseUrl: string, model: string, body: ChatRequestBody): Promise<string> {
  const system = buildSystemPrompt({
    role: body.role,
    sliderValue: body.temperature,
    scenarioKey: body.scenario,
  })

  const messages: ChatMessage[] = [{ role: 'system', content: system }]

  for (const h of body.history ?? []) {
    messages.push({ role: h.role, content: h.content })
  }
  messages.push({ role: 'user', content: body.userMessage })

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: sliderToApiTemperature(body.temperature),
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`DeepSeek HTTP ${res.status}: ${errText.slice(0, 500)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('DeepSeek 返回为空')
  return content
}
