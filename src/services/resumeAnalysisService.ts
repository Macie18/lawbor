/**
 * 简历分析服务
 * 使用 DeepSeek API 分析简历内容并提供改进建议
 */

import { llmService, type LLMMessage } from './llmService';

export interface ResumeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keyInfo: {
    name?: string;
    education?: string;
    experience?: string[];
    skills?: string[];
  };
}

/**
 * 分析简历内容
 * @param resumeText - 简历文本内容
 * @param locale - 语言（zh 或 en）
 * @returns 简历分析结果
 */
export async function analyzeResume(
  resumeText: string,
  locale: 'zh' | 'en' = 'zh'
): Promise<ResumeAnalysis> {
  const isEn = locale === 'en';

  const systemPrompt = isEn
    ? `You are a senior HR and career coach specializing in reviewing resumes for legal, compliance, and corporate positions. Analyze the resume and provide constructive feedback.

Output a valid JSON object with exactly this structure:
- summary: string (2-3 sentences overall impression)
- strengths: array of exactly 3 strings (what stands out positively)
- weaknesses: array of exactly 3 strings (areas needing improvement)
- suggestions: array of exactly 3 strings (actionable improvement tips)
- keyInfo: object with fields:
  - name: string (candidate name if found, or "Not found")
  - education: string (highest education summary)
  - experience: array of up to 3 strings (key work experiences)
  - skills: array of up to 5 strings (key skills mentioned)

IMPORTANT: Output only the JSON object, no markdown code fences. All string values must be in English.`
    : `你是资深 HR 和职业发展顾问，擅长审核法律、合规、企业岗位求职简历。请分析简历并提供改进建议。

输出严格符合以下结构的 JSON 对象：
- summary: 字符串，2-3 句话的整体印象
- strengths: 长度恰好为 3 的字符串数组，列出亮点
- weaknesses: 长度恰好为 3 的字符串数组，指出不足
- suggestions: 长度恰好为 3 的字符串数组，给出具体改进建议
- keyInfo: 对象，包含：
  - name: 候选人姓名（如未找到则填"未找到"）
  - education: 最高学历概况
  - experience: 长度最多为 3 的字符串数组，关键工作经历
  - skills: 长度最多为 5 的字符串数组，核心技能

只输出 JSON 对象，不要 markdown 代码围栏。`;

  const userPrompt = isEn
    ? `Please analyze the following resume:\n\n${resumeText}`
    : `请分析以下简历内容：\n\n${resumeText}`;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    // 使用 DeepSeek API
    const apiKey = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY;
    const baseUrl = (import.meta as any).env?.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey) {
      console.warn('[Resume] No API key, using mock analysis');
      return getMockAnalysis(locale);
    }

    const endpoint = baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      console.error('[Resume] API error:', response.status);
      return getMockAnalysis(locale);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return getMockAnalysis(locale);
    }

    // 尝试提取 JSON
    try {
      // 去除可能的 markdown 代码围栏
      content = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(content);
      return validateAnalysis(parsed);
    } catch {
      // 尝试提取 JSON 块
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return validateAnalysis(parsed);
      }
      return getMockAnalysis(locale);
    }
  } catch (error) {
    console.error('[Resume] Analysis error:', error);
    return getMockAnalysis(locale);
  }
}

/**
 * 验证并补全分析结果
 */
function validateAnalysis(data: Record<string, unknown>): ResumeAnalysis {
  const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
  const asStrArr = (v: unknown, max: number): string[] => {
    if (!Array.isArray(v)) return [];
    return v.map(asStr).filter(Boolean).slice(0, max);
  };

  const padArray = (arr: string[], target: number, fillers: string[]): string[] => {
    const result = [...arr];
    let i = 0;
    while (result.length < target && i < fillers.length) {
      result.push(fillers[i]);
      i++;
    }
    return result.slice(0, target);
  };

  const zhFillers = ['暂无具体信息', '需进一步补充', '建议优化后重新评估'];
  const enFillers = ['Information not specified', 'Needs further details', 'Please update and re-evaluate'];

  const keyInfoData = (data.keyInfo as Record<string, unknown>) || {};

  return {
    summary: asStr(data.summary) || '分析完成',
    strengths: padArray(asStrArr(data.strengths, 5), 3, zhFillers),
    weaknesses: padArray(asStrArr(data.weaknesses, 5), 3, zhFillers),
    suggestions: padArray(asStrArr(data.suggestions, 5), 3, zhFillers),
    keyInfo: {
      name: asStr(keyInfoData.name) || '未找到',
      education: asStr(keyInfoData.education) || '未找到',
      experience: asStrArr(keyInfoData.experience, 3),
      skills: asStrArr(keyInfoData.skills, 5),
    },
  };
}

/**
 * 模拟分析结果（API 不可用时）
 */
function getMockAnalysis(locale: 'zh' | 'en'): ResumeAnalysis {
  if (locale === 'en') {
    return {
      summary: 'Resume uploaded successfully. Please ensure the file contains clear text for analysis.',
      strengths: [
        'Resume file format is correct',
        'Document appears to be readable',
        'Basic structure is present',
      ],
      weaknesses: [
        'API connection unavailable for detailed analysis',
        'Unable to verify specific content accuracy',
        'Please check network settings and try again',
      ],
      suggestions: [
        'Ensure your resume has clear section headings',
        'Use bullet points for better readability',
        'Include quantifiable achievements where possible',
      ],
      keyInfo: {
        name: 'Not found (API unavailable)',
        education: 'Not found (API unavailable)',
        experience: [],
        skills: [],
      },
    };
  }

  return {
    summary: '简历已成功上传。请确保文件包含清晰的文本内容以便分析。',
    strengths: [
      '简历文件格式正确',
      '文档可正常读取',
      '基本结构完整',
    ],
    weaknesses: [
      'API 连接暂时不可用，无法进行深度分析',
      '无法验证具体内容准确性',
      '请检查网络设置后重试',
    ],
    suggestions: [
      '确保简历有清晰的章节标题',
      '使用项目符号提高可读性',
      '尽可能包含量化的成就描述',
    ],
    keyInfo: {
      name: '未找到（API 暂不可用）',
      education: '未找到（API 暂不可用）',
      experience: [],
      skills: [],
    },
  };
}

/**
 * 生成用于面试的简历摘要
 * @param analysis - 简历分析结果
 * @param locale - 语言
 * @param resumeText - 简历原文（可选）
 * @returns 用于注入面试官系统提示的简历摘要
 */
export function generateResumePrompt(analysis: ResumeAnalysis, locale: 'zh' | 'en', resumeText?: string): string {
  const isEn = locale === 'en';

  const lines: string[] = [];

  if (isEn) {
    lines.push('## Candidate Resume Summary (for interviewer reference only)');
    lines.push('');
    lines.push(`Overall: ${analysis.summary}`);
    lines.push('');

    if (analysis.keyInfo.name && analysis.keyInfo.name !== 'Not found (API unavailable)') {
      lines.push(`Name: ${analysis.keyInfo.name}`);
    }

    if (analysis.keyInfo.education && analysis.keyInfo.education !== 'Not found (API unavailable)') {
      lines.push(`Education: ${analysis.keyInfo.education}`);
    }

    if (analysis.keyInfo.experience.length > 0) {
      lines.push(`Experience: ${analysis.keyInfo.experience.join('; ')}`);
    }

    if (analysis.keyInfo.skills.length > 0) {
      lines.push(`Skills: ${analysis.keyInfo.skills.join(', ')}`);
    }

    // 添加简历原文（如果有）
    if (resumeText && resumeText.trim()) {
      lines.push('');
      lines.push('## Resume Excerpt');
      lines.push('');
      lines.push(resumeText.trim());
    }

    lines.push('');
    lines.push('Instructions:');
    lines.push('- You may ask about specific experiences or skills mentioned above');
    lines.push('- You may probe deeper into education or career transitions');
    lines.push('- Do not reveal that you have seen the resume; ask naturally as a real interviewer would');
  } else {
    lines.push('## 候选人简历摘要（仅供面试官参考）');
    lines.push('');
    lines.push(`整体评价：${analysis.summary}`);
    lines.push('');

    if (analysis.keyInfo.name && analysis.keyInfo.name !== '未找到（API 暂不可用）') {
      lines.push(`姓名：${analysis.keyInfo.name}`);
    }

    if (analysis.keyInfo.education && analysis.keyInfo.education !== '未找到（API 暂不可用）') {
      lines.push(`学历：${analysis.keyInfo.education}`);
    }

    if (analysis.keyInfo.experience.length > 0) {
      lines.push(`经历：${analysis.keyInfo.experience.join('；')}`);
    }

    if (analysis.keyInfo.skills.length > 0) {
      lines.push(`技能：${analysis.keyInfo.skills.join('、')}`);
    }

    // 添加简历原文（如果有）
    if (resumeText && resumeText.trim()) {
      lines.push('');
      lines.push('## 简历原文');
      lines.push('');
      lines.push(resumeText.trim());
    }

    lines.push('');
    lines.push('注意事项：');
    lines.push('- 你可以针对上述经历或技能提问');
    lines.push('- 可以深入追问教育背景或职业转换');
    lines.push('- 不要暴露你看过简历，像真实面试官一样自然提问');
  }

  return lines.join('\n');
}