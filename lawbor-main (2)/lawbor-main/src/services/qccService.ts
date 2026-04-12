/**
 * 企查查企业风险查询服务
 * 
 * 功能：
 * 1. 企业工商信息查询
 * 2. 劳动纠纷/司法风险查询
 * 3. 经营异常查询
 * 
 * 使用方式：
 * - CLI 命令行调用 qcc-agent-cli
 * - 或通过后端代理 MCP API
 */

// 企业风险信息类型定义
export interface CompanyInfo {
  // 基本信息
  name: string;                    // 企业名称
  creditCode: string;              // 统一社会信用代码
  legalPerson: string;             // 法定代表人
  registeredCapital: string;       // 注册资本
  establishDate: string;           // 成立日期
  businessStatus: string;          // 经营状态
  businessScope: string;           // 经营范围
  address: string;                 // 注册地址
  
  // 联系方式
  phone?: string;
  email?: string;
  website?: string;
}

export interface LaborDispute {
  caseNo: string;                  // 案号
  caseType: string;                // 案件类型
  filingDate: string;              // 立案日期
  plaintiff: string;               // 原告
  defendant: string;               // 被告
  caseStatus: string;              // 案件状态
  amount?: string;                 // 涉案金额
  summary: string;                 // 案件摘要
}

export interface JudicialRisk {
  caseNo: string;                  // 案号
  caseType: string;                // 案件类型
  filingDate: string;              // 立案日期
  parties: string[];                // 当事人
  caseStatus: string;              // 案件状态
  amount?: string;                 // 执行标的
  court: string;                   // 法院
}

export interface BusinessAbnormal {
  reason: string;                  // 列入原因
  date: string;                    // 列入日期
  authority: string;               // 决定机关
  removed?: boolean;               // 是否已移出
  removedDate?: string;            // 移出日期
}

export interface CompanyRiskReport {
  companyInfo: CompanyInfo;        // 工商信息
  laborDisputes: LaborDispute[];   // 劳动纠纷
  judicialRisks: JudicialRisk[];  // 司法风险
  businessAbnormals: BusinessAbnormal[]; // 经营异常
  
  // 风险统计
  riskSummary: {
    laborDisputeCount: number;     // 劳动纠纷数量
    judicialRiskCount: number;     // 司法风险数量
    abnormalCount: number;         // 经营异常数量
    overallRiskLevel: 'low' | 'medium' | 'high' | 'unknown'; // 综合风险等级
  };
  
  // 查询元信息
  queryTime: string;              // 查询时间
  dataUpdateDate: string;          // 数据更新日期
  
  // 未找到企业标志
  notFound?: boolean;
  message?: string;
}

/**
 * 调用后端 CLI 查询企业风险信息
 */
export async function queryCompanyRisk(
  companyName: string,
  options?: {
    includeLaborDisputes?: boolean;
    includeJudicialRisks?: boolean;
    includeBusinessAbnormals?: boolean;
  }
): Promise<CompanyRiskReport> {
  try {
    const response = await fetch('/api/qcc/company-risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyName,
        options: {
          includeLaborDisputes: true,
          includeJudicialRisks: true,
          includeBusinessAbnormals: true,
          ...options,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询失败');
    }

    return await response.json();
  } catch (error) {
    console.error('[QCC Service] 查询企业风险失败:', error);
    throw error;
  }
}

/**
 * 从合同文本中提取公司名称
 * 使用正则匹配"甲方"、"用人单位"等关键词后的公司名称
 */
export function extractCompanyNameFromContract(contractText: string): string | null {
  // 常见的公司名称模式
  const patterns = [
    // 甲方（用人单位）：XXX有限公司 - 允许前缀和冒号之间有任意字符
    /甲方[^：:\n]*[：:]\s*([^\s，。；,.\n（）\(\)]{4,50}?(?:公司|企业|集团|中心|院|所|社))/,
    // 用人单位：XXX有限公司
    /用人单位[^：:\n]*[：:]\s*([^\s，。；,.\n（）\(\)]{4,50}?(?:公司|企业|集团|中心|院|所|社))/,
    // 雇主：XXX有限公司
    /雇主[^：:\n]*[：:]\s*([^\s，。；,.\n（）\(\)]{4,50}?(?:公司|企业|集团|中心|院|所|社))/,
    // 乙方：XXX有限公司（优先匹配甲方）
    /乙方[^：:\n]*[：:]\s*([^\s，。；,.\n（）\(\)]{4,50}?(?:公司|企业|集团|中心|院|所|社))/,
    // 与XXX有限公司签订
    /与\s*([^\s，。；,.\n（）\(\)]{4,50}?(?:公司|企业|集团))\s*签订/,
    // 直接匹配公司名称（XX有限公司）- 排除括号和前缀字符
    /(?:^|[：:\s，（())])([^\s，。；,.\n（）\(\)甲方乙方]{4,50}?(?:有限公司|股份有限公司|有限责任公司))/,
  ];

  for (const pattern of patterns) {
    const match = contractText.match(pattern);
    if (match && match[1]) {
      // 清理公司名称
      let companyName = match[1].trim();
      // 移除可能的标点符号和前缀
      companyName = companyName.replace(/^[：:\s，（())]+/, ''); // 移除开头标点
      companyName = companyName.replace(/[，。；,.\s（）()（）]+$/g, ''); // 移除结尾标点
      // 确保公司名称不包含"甲方"、"乙方"等前缀
      if (companyName.includes('甲方') || companyName.includes('乙方')) {
        continue; // 跳过，尝试下一个正则
      }
      if (companyName.length >= 4) {
        console.log(`[QCC Service] 提取到公司名称: ${companyName}`);
        return companyName;
      }
    }
  }

  return null;
}

/**
 * 格式化企业风险报告为用户友好文本
 */
export function formatRiskReport(report: CompanyRiskReport): string {
  const { companyInfo, riskSummary } = report;
  
  let text = `🏢 **${companyInfo.name}**\n\n`;
  text += `📋 **工商信息**\n`;
  text += `- 法定代表人：${companyInfo.legalPerson}\n`;
  text += `- 注册资本：${companyInfo.registeredCapital}\n`;
  text += `- 成立日期：${companyInfo.establishDate}\n`;
  text += `- 经营状态：${companyInfo.businessStatus}\n\n`;
  
  const levelEmoji = {
    low: '✅',
    medium: '⚠️',
    high: '🚨',
  };
  
  text += `${levelEmoji[riskSummary.overallRiskLevel]} **风险评估**\n`;
  text += `- 劳动纠纷：${riskSummary.laborDisputeCount} 起\n`;
  text += `- 司法风险：${riskSummary.judicialRiskCount} 起\n`;
  text += `- 经营异常：${riskSummary.abnormalCount} 条\n`;
  
  return text;
}