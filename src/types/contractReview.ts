/**
 * 合同审查相关类型定义
 * 参考 Lumos 项目 Agent 工作流设计
 */

// ── 风险分类 (10 类) ────────────────────────────────────────────

export type RiskCategory =
  | 'non_compete'         // 竞业禁止/竞业限制
  | 'probation_salary'    // 试用期薪资
  | 'probation_insurance' // 试用期社保
  | 'salary_deduction'    // 扣薪/罚款条款
  | 'job_description'     // 岗位职责/工作内容
  | 'obedience_clause'    // 服从安排/无条件调岗
  | 'resignation'         // 离职/辞职条件
  | 'leave_rights'        // 休假/年假/病假
  | 'jurisdiction'        // 争议管辖/仲裁地
  | 'training_bond';     // 培训服务期/违约金

// 风险分类中文映射
export const RiskCategoryMap: Record<RiskCategory, string> = {
  non_compete: '竞业限制',
  probation_salary: '试用期薪资',
  probation_insurance: '试用期社保',
  salary_deduction: '扣薪罚款',
  job_description: '岗位职责',
  obedience_clause: '服从安排',
  resignation: '离职条件',
  leave_rights: '休假权益',
  jurisdiction: '争议管辖',
  training_bond: '培训服务期',
};

// ── 风险等级 ───────────────────────────────────────────────────

export type RiskLevel = 'high' | 'medium' | 'low' | 'safe';

// 风险等级中文映射
export const RiskLevelMap: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
  safe: '安全',
};

// 风险等级颜色映射
export const RiskLevelColor: Record<RiskLevel, string> = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  safe: 'text-green-600 bg-green-50 border-green-200',
};

// ── 结构化提取的条款 ───────────────────────────────────────────

export interface ExtractedClause {
  clause_index: number;      // 条款序号
  title: string;            // 条款标题
  content: string;          // 条款内容（已纠错）
  category: RiskCategory | null;  // 关联的风险分类
}

// ── 风险评估结果 ───────────────────────────────────────────────

export interface RiskAssessment {
  category: RiskCategory;      // 风险分类
  level: RiskLevel;           // 风险等级
  title: string;              // 风险标题（说人话）
  original_clause: string;    // 原始合同条文
  explanation: string;        // 大白话解读
  legal_basis: string;        // 法律依据
  negotiation_tip: string;    // 谈判话术建议
}

// ── 合同审查结果 ───────────────────────────────────────────────

export interface ContractReviewResult {
  extractedClauses: ExtractedClause[];      // 结构化提取的条款
  riskAssessments: RiskAssessment[];        // 风险评估列表
  overallLevel: RiskLevel;                  // 整体风险等级
  summary: string;                          // 一句话总结
}

// ── 工作流步骤状态 ─────────────────────────────────────────────

export type WorkflowStep = 'idle' | 'extracting' | 'retrieving' | 'reviewing' | 'completed' | 'error';

export interface WorkflowProgress {
  step: WorkflowStep;
  message: string;
  progress: number;  // 0-100
  streamingText?: string;  // 流式返回的文本片段
}

// 工作流步骤配置
export const WORKFLOW_STEPS: { key: WorkflowStep; label: { zh: string; en: string } }[] = [
  { key: 'extracting', label: { zh: '📝 结构化提取', en: '📝 Extracting Clauses' } },
  { key: 'retrieving', label: { zh: '📚 匹配法条', en: '📚 Retrieving Laws' } },
  { key: 'reviewing', label: { zh: '⚖️ 风险审查', en: '⚖️ Risk Review' } },
  { key: 'completed', label: { zh: '✅ 审查完成', en: '✅ Review Complete' } },
];