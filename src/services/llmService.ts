/**
 * LLM (Large Language Model) Service
 * Handles dialogue logic and context.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ReportLocale = 'zh' | 'en';

export interface LLMOptions {
  temperature: number; // 0-100, 控制 AI 性格
  role?: 'hr' | 'lawyer';
  scenario?: string;
  /** 模拟面试等场景：英文界面用 en，使面试官台词与 AI 回复为英文 */
  locale?: ReportLocale;
  /** 简历摘要，用于面试官参考（可选） */
  resumePrompt?: string;
}

function buildLawCampusSystemPromptEn(
  temperature: number,
  role: 'hr' | 'lawyer',
): string {
  let style: string;
  if (temperature < 30) {
    style =
      'Warm and supportive—actively guides the candidate and gives constructive reinforcement.';
  } else if (temperature < 70) {
    style = 'Professional and rigorous—asks focused follow-ups like a real hiring interview.';
  } else {
    style =
      'Challenging and direct—pressures the candidate to test resilience and clear thinking under stress.';
  }

  const roleType =
    role === 'hr'
      ? 'Company interviewer (legal, compliance, HR, or business hiring perspective)'
      : 'Company-side interviewer emphasizing legal practice and judgment';

  const scenarioDesc = [
    'Campus hiring: a law student interviews for roles such as legal intern, compliance assistant, contracts and risk, or similar.',
    'You are an internal interviewer; questions may reflect legal, compliance, HR, or business hiring angles.',
    'Simulate first or second round: education, coursework, internships and projects, writing and communication, motivation, basic compliance sense; you may probe case reasoning, labor or corporate law in practice, and short situational judgment.',
    'Output only spoken words the interviewer would say out loud—natural English. No parentheses or text inside them. No stage directions, gestures, or tone narration. No literary flourishes or meta lines like "The interviewer said…".',
    'Each reply roughly 50–150 words (English): one or two clear questions, or brief feedback plus a follow-up—no empty platitudes.',
  ].join(' ');

  return `You are a professional corporate interviewer. Stay in character throughout.

## Role
- Type: ${roleType}
- Style: ${style}
- Intensity: ${temperature}/100

## Scenario
${scenarioDesc}

## Rules
1. Stay consistent with the style and intensity.
2. Questions must be specific and relevant to the candidate's answers.
3. Follow up and probe where it matters.
4. Calibrate pressure to the intensity score.
5. Keep each turn concise and professional, about 50–150 words.
6. Do not repeat the same script every turn.
7. Spoken dialogue only—no bracketed asides, actions, or stage directions.

LANGUAGE: The candidate may speak Chinese or English; you MUST reply only in fluent, professional English.

Begin the interview: ask for a brief self-introduction (target role and earliest availability), then ask your first role-relevant question.`;
}

export interface LLMService {
  generateResponse(messages: LLMMessage[], options: LLMOptions): Promise<string>;
  generateReport(messages: LLMMessage[], locale?: ReportLocale): Promise<string>;
}

function buildSystemPrompt(options: LLMOptions): string {
  const { temperature, role = 'hr', scenario = 'layoff', locale = 'zh', resumePrompt } = options;
  const isCampusLawInterview = scenario === 'law_campus';

  if (isCampusLawInterview && locale === 'en') {
    const basePrompt = buildLawCampusSystemPromptEn(temperature, role);
    // 如果有简历信息，附加到系统提示末尾
    if (resumePrompt) {
      return basePrompt + '\n\n' + resumePrompt;
    }
    return basePrompt;
  }

  let style = '';
  if (temperature < 30) {
    style = '温和友善，主动引导面试者，会给予积极的反馈和鼓励';
  } else if (temperature < 70) {
    style = '专业严谨，就事论事，会追问细节，模拟真实面试场景';
  } else {
    style = '犀利尖锐，施加压力，会质疑面试者的回答，考验心理素质';
  }

  const scenarioMap: Record<string, string> = {
    law_campus: [
      '求职面试：候选人是在校法学生，到贵公司参加岗位面试（如法务实习、合规助理、合同与风控等相关岗位）。',
      '你是公司内部用人面试官，可从法务、合规、人力资源或业务部门视角提问。',
      '模拟真实初面或复面：了解教育背景、法学与专业课基础、实习与项目、文书与沟通、职业动机与合规意识；可追问案例分析思路、劳动法或公司法基础在实务中的运用、简单情境处置。',
      '输出必须是面试官当场要说的口语台词，自然、可直接朗读；禁止括号及括号内任何文字；禁止动作、神态、语气类描写；禁止心理活动、舞台指示或旁白；不要使用「虚伪」「轻蔑一笑」等文学化刻画；不要写「面试官说道：」等元叙述。',
      '每次回复 50～150 字，一次只包含 1～2 个清晰问题，或简短反馈加追问，不重复空洞套话。',
    ].join(''),
    layoff: '劳动仲裁面试 - 模拟劳动者与公司HR/律师关于裁员赔偿的谈判',
    salary: '薪资谈判面试 - 模拟员工与HR关于薪资涨幅的谈判',
    contract: '劳动合同面试 - 模拟劳动合同签订前的谈判',
  };

  const scenarioDesc = scenarioMap[scenario] ?? scenarioMap.layoff;

  const roleTitle = isCampusLawInterview
    ? '你是一个专业的企业面试官。请根据以下角色设定进行对话：'
    : '你是一个专业的面试官/谈判对手。请根据以下角色设定进行对话：';

  const roleType =
    isCampusLawInterview && role === 'hr'
      ? '公司面试官（法务、合规、人力资源或业务用人方向）'
      : isCampusLawInterview && role === 'lawyer'
        ? '公司侧专业面试官（偏法律实务提问）'
        : role === 'hr'
          ? '公司HR高级经理'
          : '专业劳动法律师';

  const opening = isCampusLawInterview
    ? '请开始面试：先请候选人简短自我介绍，说明应聘岗位与可到岗时间，再提出第一个与岗位相关的问题。'
    : '请开始面试，首先问一个开场问题。';

  return `${roleTitle}

## 角色设定
- 角色类型：${roleType}
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
7. 只输出口头对话内容，不得添加括号、破折号旁白、动作或神态描写

${opening}`;

  // 如果有简历信息，附加到系统提示末尾
  if (resumePrompt) {
    return basePrompt + '\n\n' + resumePrompt;
  }
  return basePrompt;
}

function sliderToApiTemperature(slider: number): number {
  return (slider / 100) * 2;
}

function openAiCompatibleChatUrl(baseUrl: string): string {
  const b = baseUrl.replace(/\/$/, '');
  return b.endsWith('/v1') ? `${b}/chat/completions` : `${b}/v1/chat/completions`;
}

/**
 * DeepSeek LLM：
 * - 面试场景（law_campus）：使用 DeepSeek 官方 API
 * - 聊天助手等其他场景：使用硅基流动的 DeepSeek-V3 模型（更经济）
 */
export class DeepSeekLLMService implements LLMService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string = '',
    baseUrl: string = 'https://api.deepseek.com',
    model: string = 'deepseek-chat',
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;

    const env = (import.meta as any).env;

    // In Vite, .env.local is loaded automatically and has higher priority
    if (!this.apiKey && env?.VITE_DEEPSEEK_API_KEY) {
      this.apiKey = env.VITE_DEEPSEEK_API_KEY;
    }

    // Fallback for Node.js environment
    if (!this.apiKey && typeof process !== 'undefined' && process.env) {
      const k = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEE_API_KEY;
      if (k) this.apiKey = k.trim();
    }

    if (!this.apiKey) {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        console.warn('[LLM] 未配置 VITE_DEEPSEEK_API_KEY，将使用模拟响应（仅用于演示）');
      }
    } else {
      console.log('[LLM] DeepSeek API Key 已加载');
    }
  }

  async generateResponse(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    if (options.scenario === 'law_campus') {
      return this.generateInterviewResponse(messages, options);
    }

    const magicSystemPrompt = `你是一个专业的中国劳动法律助手 Lawbor。
除了提供法律建议，你还具备调用系统功能的能力。
规则：
1. 如果用户的问题可以通过系统内的模块解决（如算税、查看政策、审查合同），你必须在回答的末尾加上跳转指令，格式为：[跳转:路由路径|按钮文字]。
可用路由：
- /contract : 劳动合同审查
- /tax : 税务薪资计算器
- /knowledge : 法律知识卡片
- /benefits : 城市福利政策查询
- /arbitration : 劳动仲裁帮助
例："关于五险一金，您可以去福利政策模块查看：[跳转:/benefits|去查福利政策]"

2. 如果用户的意图是想去实地解决问题（如"我要去告公司"、"附近的仲裁委在哪"、"想找律师"），你必须在回答末尾提供地图导航指令，格式为：[地图导航:搜索关键词]。
例："我建议您直接前往所在区的劳动争议仲裁委员会：[地图导航:劳动争议仲裁委员会]"`;

    const chatMessages: LLMMessage[] = [{ role: 'system', content: magicSystemPrompt }];

    for (const msg of messages) {
      if (msg.role !== 'system') chatMessages.push(msg);
    }

    try {
      const res = await fetch(openAiCompatibleChatUrl(this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: chatMessages,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[DeepSeek API error]:', errText);
        throw new Error('网络请求失败');
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[前端调用出错]:', error);
      return this.getMockResponse(messages, options);
    }
  }

  /** 1v1 模拟面试：OpenAI 兼容 DeepSeek 官方，带校招法务面试官 system prompt */
  private async generateInterviewResponse(
    messages: LLMMessage[],
    options: LLMOptions,
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getMockResponse(messages, options);
    }

    const systemPrompt = buildSystemPrompt(options);
    const chatMessages: LLMMessage[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of messages) {
      if (msg.role !== 'system') {
        chatMessages.push(msg);
      }
    }

    try {
      const res = await fetch(openAiCompatibleChatUrl(this.baseUrl), {
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

  async generateReport(messages: LLMMessage[], locale: ReportLocale = 'zh'): Promise<string> {
    const isEn = locale === 'en';
    const userLabel = isEn ? 'Candidate' : '面试者';
    const aiLabel = isEn ? 'Interviewer' : '面试官';
    const transcript = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? userLabel : aiLabel}: ${m.content}`)
      .join('\n');

    if (!this.apiKey) {
      return this.getMockReport(messages, locale);
    }

    const systemContent = isEn
      ? 'You are a senior HR and career advisor who evaluates law students in mock corporate interviews (legal, compliance, or related roles). Output must be valid JSON matching the user schema exactly. Do not use markdown code fences. IMPORTANT: Every human-readable string value you output must be in English only—never Chinese or other languages.'
      : '你是资深 HR 与职业发展顾问，擅长评估在校法学生参加企业岗位面试的表现。输出必须是合法 JSON，字段名与结构严格符合用户说明，不要 markdown 代码围栏。';

    const userContent = isEn
      ? `Context: A law-student mock interview for corporate legal, compliance, or related roles.

Analyze ONLY the real dialogue below. Do not invent facts that do not appear in the transcript.

LANGUAGE RULE: The transcript may be in Chinese or English. Regardless, you MUST write every item in "performanceInsights" and "suggestions" in fluent English only (no Chinese characters, no mixed-language sentences).

Return a single JSON object with exactly this shape (field names in English as listed):
- score: integer 0–100 aligned with performance
- performanceInsights: array of exactly 3 strings, all English only. Each about 25–55 words: concrete references or fair summary of the dialogue, strengths and gaps, professional and specific—no empty platitudes
- suggestions: array of exactly 3 strings, all English only. Empathetic, tactful, actionable tips for follow-up communication and preparation—avoid harsh blame
- radar: object with keys logic, emotion, professionalism, resilience—each an integer 0–100 reflecting logic, expression/empathy, role fit/professionalism, composure/adaptability as shown in the dialogue

Transcript:
${transcript || '(No valid dialogue.)'}

Output only the JSON object, no other text.`
      : `场景：在校法学生参加企业法务/合规/相关岗位模拟面试。

请仅根据下方真实对话逐句分析，不要编造对话中未出现的事实。生成一份 JSON，字段如下（严格 3+3 条，中文）：
- score: number，综合分 0～100 的整数，与对话表现一致
- performanceInsights: 长度恰好为 3 的字符串数组。「面试表现分析」用：每条 25～55 字，具体引用或概括对话中的事实，可含亮点与不足，客观专业，不要用空洞套话
- suggestions: 长度恰好为 3 的字符串数组。「高情商建议」用：语气体贴、委婉、可执行，面向求职者后续如何沟通与准备，避免生硬批评
- radar: 对象，键 logic、emotion、professionalism、resilience，各为 0～100 的整数；与对话中体现的逻辑、表达与共情、专业与岗位匹配、抗压与应变一致

对话记录：
${transcript || '（无有效对话）'}

只输出一行 JSON 对象，不要其它任何文字。`;

    try {
      const res = await fetch(openAiCompatibleChatUrl(this.baseUrl), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
          ],
          temperature: 0.35,
        }),
      });

      if (!res.ok) {
        return this.getMockReport(messages, locale);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return this.getMockReport(messages, locale);
      }

      try {
        JSON.parse(content);
        return content;
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          return match[0];
        }
        return this.getMockReport(messages, locale);
      }
    } catch (error) {
      console.error('[LLM] Report generation error:', error);
      return this.getMockReport(messages, locale);
    }
  }

  private getMockResponse(messages: LLMMessage[], options: LLMOptions): string {
    const locale = options.locale ?? 'zh';

    if (locale === 'en') {
      const responses: Record<string, string[]> = {
        hr: [
          'Good—could you walk me through a concrete example from your background?',
          'I see. What would you highlight as your strongest fit for this role?',
          'That shows some legal awareness. Have you faced a similar situation in practice?',
          'You communicate clearly. Why this team, and what is your timeline to start?',
          'Thanks—what compensation range are you targeting for this position?',
        ],
        lawyer: [
          'On that point, what evidence would you rely on to support the claim?',
          'The logic is fine—which statute or rule would you cite first?',
          'Let us shift angle—which documents have you assembled so far?',
          'That is critical—how did you derive that number or conclusion?',
          'From a legal standpoint, the next step I would suggest is…',
        ],
      };
      const roleResponses = responses[options.role || 'hr'];
      return roleResponses[Math.floor(Math.random() * roleResponses.length)];
    }

    const responses: Record<string, string[]> = {
      hr: [
        '很好，关于这个问题，你能详细说说你的具体经历吗？',
        '我理解你的想法。那么你认为自己的优势是什么呢？',
        '从你的回答来看，你对劳动法有一定了解。不过我想追问一下，你之前处理过类似的案例吗？',
        '你的表达能力不错。但我想知道你为什么离职？有没有更好的发展机会？',
        '不错，让我们继续。你对薪资有什么期望？',
      ],
      lawyer: [
        '关于这点，你需要提供更多证据来支持你的主张。',
        '你的思路是对的，但法律依据还不够充分。你了解相关司法解释吗？',
        '我们换个角度聊聊。你收集到哪些书面材料了？',
        '这个问题很关键 - 你能提供具体的计算依据吗？',
        '从法律角度，我建议你下一步这样做...',
      ],
    };

    const roleResponses = responses[options.role || 'hr'];
    return roleResponses[Math.floor(Math.random() * roleResponses.length)];
  }

  private getMockReport(messages: LLMMessage[], locale: ReportLocale = 'zh'): string {
    const dialog = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    const userParts = messages.filter(m => m.role === 'user');
    const n = userParts.length;
    const avgLen = n ? userParts.reduce((acc, m) => acc + (m.content?.length ?? 0), 0) / n : 0;
    const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
    const totalChars = userParts.reduce((acc, m) => acc + (m.content?.length ?? 0), 0);

    const score =
      n === 0
        ? clamp(22 + Math.floor(Math.random() * 10))
        : clamp(46 + n * 5 + Math.min(24, totalChars / 25) + Math.floor(Math.random() * 6) - 3);

    const hasLawHints = userParts.some(m =>
      /法|法学|合规|合同|诉讼|条款|条|司考|法考|law|legal|compliance|contract|litigation|LL\.?B|JD|counsel/i.test(
        m.content ?? '',
      ),
    );

    let performanceInsights: string[];
    let suggestions: string[];

    if (locale === 'en') {
      performanceInsights =
        n === 0
          ? [
              'No substantive answers were captured yet, so there is little to score on specifics.',
              'Ending too early or mic issues often produce an empty transcript—try again.',
              'Restart the session and answer in full sentences after each question.',
            ]
          : [
              `You spoke in ${n} turn(s) with about ${totalChars} characters total; average depth per answer is ${avgLen >= 45 ? 'solid' : 'thin'}.`,
              hasLawHints
                ? 'Your answers touched legal or compliance themes, which fits a law-student hiring context.'
                : 'Tie coursework, moot court, or internships more explicitly to what this role needs.',
              avgLen >= 55
                ? 'You tend to elaborate; sharpen the headline point first so interviewers hear your best claim early.'
                : 'Expand slightly using "situation—task—brief result" so the interviewer can calibrate your skills.',
            ];
      suggestions = [
        'On an unfamiliar question, say "Here is how I understand it…" then add how you would research—better than freezing.',
        'Close an answer with one sincere question about the team or mandate—it signals real interest.',
        'Prepare three anchors: who you are, why this role, one concrete example—openings will feel steadier.',
      ];
    } else {
      performanceInsights =
        n === 0
          ? [
              '本次尚未记录到你的有效作答，无法结合具体内容点评。',
              '结束面试过快或麦克风未正常提交时，容易出现空对话。',
              '建议重新开始面试，听完问题后用完整句子回答。',
            ]
          : [
              `你共完成 ${n} 轮发言，总字数约 ${totalChars}，信息量${avgLen >= 45 ? '较足' : '偏少'}。`,
              hasLawHints
                ? '回答里出现了法学或合规相关表述，与法学生求职场景有一定契合度。'
                : '可主动把课程、模拟法庭、实习中的专业点与应聘岗位勾连，增强专业感。',
              avgLen >= 55
                ? '单次回答篇幅较长，表达意愿明显，注意抓住岗位最关心的重点会更出彩。'
                : '建议在「经历 + 任务 + 简短结果」结构上再展开一两句，方便面试官判断能力。',
            ];
      suggestions = [
        '不会的问题可以先说「我目前理解是…」，再诚实补充会如何查资料补课，比停顿更显情商。',
        '回答末尾加一句与团队或业务相关的小追问，既礼貌又显得对岗位有认真思考。',
        '提前写三句万能架：我是谁、我为何适合这个岗、我能举一个什么小例子，开口会更稳。',
      ];
    }

    const radar = {
      logic: clamp(50 + n * 4 + Math.min(18, avgLen / 4)),
      emotion: clamp(48 + n * 3 + (avgLen > 35 ? 10 : 0)),
      professionalism: clamp(50 + n * 3 + (hasLawHints ? 12 : 0)),
      resilience: clamp(52 + n * 2 + Math.min(14, dialog.length * 2)),
    };

    return JSON.stringify({
      score,
      performanceInsights,
      suggestions,
      radar,
    });
  }
}

export const llmService = new DeepSeekLLMService();

export { DeepSeekLLMService as MockLLMService };