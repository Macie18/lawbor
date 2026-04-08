/**
 * Chat API 客户端
 * 调用 laboris-api 的 /v1/chat 接口
 */

// 角色类型：移除仲裁员，新增面试官
export type ChatRole = 'hr' | 'lawyer' | 'interviewer'

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

/** 面试官 System Prompt */
export function buildInterviewerSystemPrompt(temperature: number): string {
  // 性格温度映射（面试风格）
  let style = ''
  if (temperature < 30) {
    style = '温和亲切，耐心引导，轻松交流，循序渐进提问'
  } else if (temperature < 70) {
    style = '专业严谨，逻辑清晰，聚焦岗位要求，针对性追问细节'
  } else {
    style = '严格犀利，压力面试，深挖工作经历，挑战候选人能力边界'
  }

  return `你是一名**专业的企业面试官**，在模拟求职面试场景中扮演面试官角色。

## 角色设定
- 身份：企业招聘面试官
- 态度：${style}
- 语气：正式、专业、客观
- 目标：考察候选人专业能力、岗位匹配度、综合素质与职业素养

## 场景说明
这是一场求职模拟面试。候选人（求职者）回答问题，你作为面试官需要：
1. 引导候选人自我介绍、阐述工作/项目经历
2. 结合岗位要求针对性提问、深挖细节
3. 考察专业技能、沟通能力、抗压能力、职业规划
4. 客观评价并提出追问，判断候选人与岗位的匹配度

## 专业要求
- 贴合真实企业面试流程，提问符合职场常规
- 追问具体、有逻辑，直击能力核心
- 每次回复控制在 60-150 字，简洁专业
- 不提供无关建议，专注面试考核

## 开场白示例
"你好，请先做个简单的自我介绍，并说明你应聘的岗位。"

请开始模拟求职面试，根据候选人的回答进行专业提问与追问。`
}