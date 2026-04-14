/**
 * 合同审查服务 (Contract Review Service)
 * 使用 Dify API (挂载劳动法知识库的 Agent)
 * 支持流式传输
 */

import type {
  ExtractedClause,
  RiskAssessment,
  RiskCategory,
  RiskLevel,
  ContractReviewResult,
  WorkflowProgress,
} from '../types/contractReview';

// ── Dify API 配置 ────────────────────────────────────────────────

const DIFY_BASE_URL = 'https://api.dify.ai/v1';

// ── 获取 API Key ────────────────────────────────────────────────

function getApiKey(): string {
  const apiKey = (import.meta as any).env?.VITE_DIFY_API_KEY;

  if (!apiKey) {
    console.error('[ContractReview] 错误: 未找到 VITE_DIFY_API_KEY 环境变量');
    throw new Error(
      '未配置 Dify API Key。请在 .env 文件中设置 VITE_DIFY_API_KEY'
    );
  }

  return apiKey;
}

// ── 接口定义 ───────────────────────────────────────────────────

interface DifyRequestBody {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  user: string;
}

interface DifyResponse {
  answer?: string;
  message_id?: string;
  converged?: boolean;
  total_price?: string;
  error?: { message?: string };
}

// Dify 返回的 JSON 结构（你的 Agent 配置的格式）
interface DifyReviewResult {
  overallLevel: RiskLevel;
  summary: string;
  riskItems: Array<{
    level: RiskLevel;
    title: string;
    originalClause: string;
    explanation: string;
    legalBasis: string;
    negotiationTip: string;
  }>;
}

type StreamingCallback = (text: string, isFinal: boolean) => void;

// ── Dify API 调用 (阻塞模式) ───────────────────────────────────

async function callDifyAPI(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  const requestBody: DifyRequestBody = {
    inputs: {},
    query: prompt,
    response_mode: 'blocking',
    user: 'lawbor-frontend-user',
  };

  const response = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ContractReview] Dify HTTP 错误:', response.status, errorText);
    throw new Error(`Dify API 请求失败: ${response.status}`);
  }

  const data = (await response.json()) as DifyResponse;

  if (data.error) {
    console.error('[ContractReview] Dify API 错误:', data.error);
    throw new Error(`Dify API 错误: ${data.error.message}`);
  }

  const content = data.answer;

  if (!content) {
    throw new Error('Dify API 返回内容为空');
  }

  return content;
}

// ── Dify API 调用 (流式模式) ───────────────────────────────────

async function callDifyAPIStream(
  prompt: string,
  onChunk?: StreamingCallback
): Promise<string> {
  const apiKey = getApiKey();

  const requestBody: DifyRequestBody = {
    inputs: {},
    query: prompt,
    response_mode: 'streaming',
    user: 'lawbor-frontend-user',
  };

  const response = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ContractReview] Dify HTTP 错误:', response.status, errorText);
    throw new Error(`Dify API 请求失败: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Dify API 返回空响应体');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);

          if (dataStr.includes('"event":"message_end"') || dataStr.includes('"event":"troll"')) {
            onChunk?.(fullContent, true);
            return fullContent;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.answer) {
              fullContent += data.answer;  // 追加而不是覆盖
              onChunk?.(fullContent, false);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    onChunk?.(fullContent, true);
    return fullContent;
  } finally {
    reader.releaseLock();
  }
}

// ── JSON 解析 ──────────────────────────────────────────────────

function tryParseJSON(text: string): DifyReviewResult | null {
  if (!text || text.length < 10) return null;

  let cleaned = text.trim();

  // 移除 markdown 代码块
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    cleaned = lines.slice(1).join('\n');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // 方法1：直接解析
  try {
    return JSON.parse(cleaned) as DifyReviewResult;
  } catch { /* 继续尝试其他方法 */ }

  // 方法2：提取 JSON 对象（处理流式传输被截断的情况）
  // 找第一个 { 和最后一个 } 之间的内容
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const extracted = cleaned.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(extracted) as DifyReviewResult;
    } catch { /* 继续尝试 */ }
  }

  // 方法3：逐字符向后查找完整的 JSON（处理不完整的尾随字符）
  if (startIdx !== -1) {
    const partial = cleaned.substring(startIdx);
    // 尝试从后向前移除不完整的尾随字符
    for (let i = partial.length - 1; i >= 0; i--) {
      const candidate = partial.substring(0, i + 1);
      try {
        const result = JSON.parse(candidate) as DifyReviewResult;
        // 确保解析结果有必要的字段（移除 overallScore 检查）
        if (result.overallLevel !== undefined && result.riskItems) {
          return result;
        }
      } catch { /* 继续尝试更短的 */ }
    }
  }

  return null;
}

function parseDifyResponse(text: string): DifyReviewResult | null {
  const result = tryParseJSON(text);
  if (!result) {
    console.error('[ContractReview] JSON 解析失败, 文本长度:', text.length);
    console.error('[ContractReview] 文本末尾:', text.slice(-200));
  }
  return result;
}

// ── 风险等级排序 ──────────────────────────────────────────────

const LEVEL_ORDER: Record<RiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  safe: 3,
};

// ── 完整工作流：单次调用 Dify Agent ────────────────────────────

export async function runContractReview(
  rawText: string,
  onProgress?: (progress: WorkflowProgress) => void,
  onStream?: (text: string) => void
): Promise<ContractReviewResult> {
  getApiKey();

  // Step 1: 调用 Dify Agent（一次调用完成提取+审查）
  onProgress?.({
    step: 'extracting',
    message: '正在分析合同条款...',
    progress: 10,
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });

  onProgress?.({
    step: 'retrieving',
    message: '📚 检索相关劳动法条文中...',
    progress: 30,
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  onProgress?.({
    step: 'reviewing',
    message: '⚖️ 正在生成风险评估报告...',
    progress: 50,
  });

  // 调用 Dify（System Prompt 已在 Dify 后台配置）
  // 前端只需传合同内容，Dify 会自动拼接 System Prompt + 用户输入
  let content = '';
  let streamError = null;

  try {
    content = await callDifyAPIStream(
      rawText,
      (text, isFinal) => {
        onStream?.(text);
        if (isFinal) {
          onProgress?.({
            step: 'reviewing',
            message: '正在解析评估结果...',
            progress: 80,
          });
        }
      }
    );
  } catch (e) {
    streamError = e;
    console.warn('[ContractReview] 流式调用失败，尝试阻塞模式');
  }

  // 如果流式失败或解析失败，尝试阻塞模式
  if (streamError || !parseDifyResponse(content)) {
    try {
      content = await callDifyAPI(rawText);
    } catch (e2) {
      console.error('[ContractReview] 阻塞模式也失败:', e2);
      throw new Error('Dify API 调用失败，请稍后重试');
    }
  }

  // 解析 Dify 返回的 JSON
  const difyResult = parseDifyResponse(content);

  if (!difyResult) {
    console.error('[ContractReview] Dify 返回无效 JSON, 长度:', content?.length);
    throw new Error('无法解析 Dify 返回的评估结果');
  }

  // 转换为前端需要的格式
  const riskAssessments: RiskAssessment[] = difyResult.riskItems.map((item) => ({
    category: 'job_description' as RiskCategory, // Dify 没有返回 category，用默认值
    level: item.level,
    title: item.title,
    original_clause: item.originalClause,
    explanation: item.explanation,
    legal_basis: item.legalBasis,
    negotiation_tip: item.negotiationTip,
  }));

  // 按风险等级排序
  riskAssessments.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  // 构建结果（空提取列表，因为 Dify 一次返回了结果）
  const result: ContractReviewResult = {
    extractedClauses: [], // Dify 没有单独返回条款结构
    riskAssessments,
    overallLevel: difyResult.overallLevel,
    summary: difyResult.summary,
  };

  onProgress?.({
    step: 'completed',
    message: '审查完成！',
    progress: 100,
  });

  return result;
}

// ── 保留提取函数（备用，但现在不用了） ────────────────────────

export async function extractClauses(
  rawText: string,
  onProgress?: (progress: WorkflowProgress) => void
): Promise<ExtractedClause[]> {
  // 暂时不需要实现，因为 Dify 一次返回了全部结果
  return [];
}

export async function reviewClauses(
  clauses: ExtractedClause[],
  onProgress?: (progress: WorkflowProgress) => void,
  onStream?: (text: string) => void
): Promise<RiskAssessment[]> {
  // 暂时不需要实现
  return [];
}