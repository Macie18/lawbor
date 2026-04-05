/**
 * LLM (Large Language Model) Service
 * Handles dialogue logic and context.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature: number; // 0-100, 控制 AI 性格
  role?: 'hr' | 'lawyer';
  scenario?: string;
}

export interface LLMService {
  generateResponse(messages: LLMMessage[], options: LLMOptions): Promise<string>;
  generateReport(messages: LLMMessage[]): Promise<string>; // Returns JSON string
}

// 面试官 System Prompt
function buildSystemPrompt(options: LLMOptions): string {
  const { temperature, role = 'hr', scenario = 'layoff' } = options;

  // 性格温度映射
  let style = '';
  if (temperature < 30) {
    style = '温和友善，主动引导面试者，会给予积极的反馈和鼓励';
  } else if (temperature < 70) {
    style = '专业严谨，就事论事，会追问细节，模拟真实面试场景';
  } else {
    style = '犀利尖锐，施加压力，会质疑面试者的回答，考验心理素质';
  }

  // 场景配置
  const scenarioMap: Record<string, string> = {
    layoff: '劳动仲裁面试 - 模拟劳动者与公司HR/律师关于裁员赔偿的谈判',
    salary: '薪资谈判面试 - 模拟员工与HR关于薪资涨幅的谈判',
    contract: '劳动合同面试 - 模拟劳动合同签订前的谈判',
  };

  const scenarioDesc = scenarioMap[scenario] || scenarioMap.layoff;

  return `你是一个专业的面试官/谈判对手。请根据以下角色设定进行对话：

## 角色设定
- 角色类型：${role === 'hr' ? '公司HR高级经理' : '专业劳动法律师'}
- 性格特点：${style}
- 面试强度：${temperature}/100

## 场景
${scenarioDesc}

## 要求
1. 保持角色一致性，根据设定的性格特点来回应
2. 提出的问题要具体、有针对性
3. 根据面试者的回答进行追问
4. 适当施加压力（根据温度参数）来测试面试者的应变能力
5. 回答应该简洁专业，每次回复控制在 50-150 字左右
6. 不要重复同样的话术

请开始面试，首先问一个开场问题。`
}

function sliderToApiTemperature(slider: number): number {
  // 将 0-100 的滑块值转换为 0-2 的 API 温度值
  return (slider / 100) * 2;
}

/**
 * DeepSeek LLM 服务实现
 * 通过浏览器直接调用 DeepSeek API（需要用户在环境变量中配置 API Key）
 */
export class DeepSeekLLMService implements LLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string = '',
    baseUrl: string = 'https://api.deepseek.com',
    model: string = 'deepseek-chat'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;

    // 浏览器环境从 import.meta.env 获取，Node.js 从 process.env 获取
    if (!this.apiKey) {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEEPSEEK_API_KEY) {
        this.apiKey = (import.meta as any).env.DEEPSEEK_API_KEY;
      } else if (typeof process !== 'undefined' && process.env?.DEEPSEEK_API_KEY) {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
      }
    }

    if (!this.apiKey) {
      console.warn('[LLM] 未配置 DEEPSEEK_API_KEY，将使用模拟响应');
    }
  }

  async generateResponse(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    if (!this.apiKey) {
      return this.getMockResponse(messages, options);
    }

    // 构建消息列表（第一个 system 消息之后的所有消息）
    const systemPrompt = buildSystemPrompt(options);
    const chatMessages: LLMMessage[] = [{ role: 'system', content: systemPrompt }];

    // 添加历史消息（排除可能存在的重复 system）
    for (const msg of messages) {
      if (msg.role !== 'system') {
        chatMessages.push(msg);
      }
    }

    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: chatMessages,
          temperature: sliderToApiTemperature(options.temperature),
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.error('[LLM] DeepSeek HTTP error:', res.status, errText);
        return this.getMockResponse(messages, options);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        return this.getMockResponse(messages, options);
      }
      return content;
    } catch (error) {
      console.error('[LLM] DeepSeek API error:', error);
      return this.getMockResponse(messages, options);
    }
  }

  async generateReport(messages: LLMMessage[]): Promise<string> {
    // 过滤出对话内容
    const transcript = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? '面试者' : '面试官'}：${m.content}`)
      .join('\n');

    if (!this.apiKey) {
      return this.getMockReport();
    }

    try {
      const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的面试评估专家。请根据以下面试对话生成一份详细的评估报告。',
            },
            {
              role: 'user',
              content: `请根据以下面试对话记录，生成一份 JSON 格式的面试评估报告，包含以下字段：
- score: 综合评分 (0-100)
- strengths: 面试者优势 (数组，最大3项)
- weaknesses: 待改进项 (数组，最大3项)
- suggestions: 改进建议 (数组，最大3项)
- radar: 能力雷达图 (logic, emotion, professionalism, resilience 各 0-100)

对话记录：
${transcript}

请只返回 JSON，不要包含其他内容。`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        return this.getMockReport();
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return this.getMockReport();
      }

      // 尝试解析 JSON
      try {
        JSON.parse(content); // 验证是否为有效 JSON
        return content;
      } catch {
        // 如果不是有效 JSON，尝试提取 JSON 部分
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          return match[0];
        }
        return this.getMockReport();
      }
    } catch (error) {
      console.error('[LLM] Report generation error:', error);
      return this.getMockReport();
    }
  }

  // 模拟响应（当没有 API Key 时使用）
  private getMockResponse(messages: LLMMessage[], options: LLMOptions): string {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const userText = lastUserMsg?.content || '';

    const responses: Record<string, string[]> = {
      hr: [
        "很好，关于这个问题，你能详细说说你的具体经历吗？",
        "我理解你的想法。那么你认为自己的优势是什么呢？",
        "从你的回答来看，你对劳动法有一定了解。不过我想追问一下，你之前处理过类似的案例吗？",
        "你的表达能力不错。但我想知道你为什么离职？有没有更好的发展机会？",
        "不错，让我们继续。你对薪资有什么期望？",
      ],
      lawyer: [
        "关于这点，你需要提供更多证据来支持你的主张。",
        "你的思路是对的，但法律依据还不够充分。你了解相关司法解释吗？",
        "我们换个角度聊聊。你收集到哪些书面材料了？",
        "这个问题很关键 - 你能提供具体的计算依据吗？",
        "从法律角度，我建议你下一步这样做...",
      ],
    };

    const roleResponses = responses[options.role || 'hr'];
    return roleResponses[Math.floor(Math.random() * roleResponses.length)];
  }

  private getMockReport(): string {
    return JSON.stringify({
      score: Math.floor(65 + Math.random() * 25),
      strengths: ['表达流畅', '逻辑清晰', '对劳动法有基础了解'],
      weaknesses: ['专业知识深度不足', '缺乏实际案例经验', '应对压力时略显紧张'],
      suggestions: [
        '建议系统学习劳动法相关条文，特别是《劳动合同法》',
        '多练习案例分析，提高实际问题解决能力',
        '保持自信，即使面对压力也要控制语速',
      ],
      radar: {
        logic: Math.floor(70 + Math.random() * 20),
        emotion: Math.floor(65 + Math.random() * 25),
        professionalism: Math.floor(60 + Math.random() * 25),
        resilience: Math.floor(65 + Math.random() * 20),
      },
    });
  }
}

// 导出默认实例
export const llmService = new DeepSeekLLMService();

// 兼容导出（旧代码使用）
export { DeepSeekLLMService as MockLLMService };