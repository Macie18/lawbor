/**
 * Chat API 客户端
 * 调用 laboris-api 的 /v1/chat 接口
 */

export type ChatRole = 'hr' | 'lawyer' | 'arbitrator'

export type ChatHistoryItem = { role: 'user' | 'assistant'; content: string }

export interface ChatRequestBody {
  role: ChatRole
  temperature: number
  scenario: string
  userMessage: string
  history?: ChatHistoryItem[]
}

export interface ChatResponse {
  reply?: string
  error?: string
}

/** API 基础地址 - 开发环境连接本地 laboris-api */
function apiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  // 开发环境默认连本地 laboris-api
  if (import.meta.env.DEV) return 'http://localhost:4000'
  return ''
}

/** 发送聊天消息到 DeepSeek */
export async function sendChatMessage(payload: ChatRequestBody): Promise<string> {
  const url = `${apiBase()}/v1/chat`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: payload.role,
      temperature: payload.temperature,
      scenario: payload.scenario,
      userMessage: payload.userMessage,
      history: payload.history,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as ChatResponse

  if (!res.ok) {
    throw new Error(data.error || `请求失败 ${res.status}`)
  }

  if (!data.reply) throw new Error('未返回回复内容')

  return data.reply
}

/** 劳动法仲裁员 System Prompt */
export function buildArbitratorSystemPrompt(temperature: number): string {
  // 性格温度映射
  let style = ''
  if (temperature < 30) {
    style = '温和耐心，会给予提醒和引导，语重心长地解释法律风险'
  } else if (temperature < 70) {
    style = '专业严谨，就事论事，会指出关键法律问题，要求当事人提供证据'
  } else {
    style = '严肃严厉，施加压力，强调法律后果的严重性，质疑当事人的陈述'
  }

  return `你是一名**严肃的劳动法仲裁员**，在模拟仲裁调解场景中扮演仲裁员的角色。

## 角色设定
- 身份：劳动争议仲裁委员会仲裁员
- 态度：${style}
- 语气：正式、严肃、权威
- 目标：查清事实、分清责任、依法调解

## 场景说明
这是一场劳动争议模拟调解。申请人（劳动者）叙述案情，你作为仲裁员需要：
1. 认真听取申请人陈述
2. 抓住关键事实和法律问题进行追问
3. 释明相关法律规定和可能的风险
4. 询问申请人证据情况

## 专业要求
- 熟悉《劳动合同法》、《劳动争议调解仲裁法》等法律法规
- 追问要具体、有针对性，直击案件要点
- 适当释明法律风险，让当事人意识到问题的严重性
- 每次回复控制在 60-150 字，保持专业简洁

## 开场白示例
"你好，请先简要说明你的仲裁请求和事实理由。"

请开始模拟仲裁调解，根据申请人的回答进行追问。`
}