// 企查查企业风险查询 API (Vercel Serverless Function)
// 基于 server.ts 中的实现

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ✅ 企查查 API 配置
const QCC_API_KEY = process.env.QCC_API_KEY || 'MsYrFNGHpfRi3g03nL3Fe3CyDZ9dfwgqOhDzQGGDCCvUerrP';
const QCC_MCP_ENDPOINTS = {
  company: 'https://agent.qcc.com/mcp/company/stream',
  risk: 'https://agent.qcc.com/mcp/risk/stream',
};

// ✅ 开发环境优先使用 CLI（更省 token）
const USE_CLI = process.env.NODE_ENV !== 'production' && process.env.QCC_USE_CLI !== 'false';

// ✅ CLI 命令执行函数（开发环境）
async function callQccCli(service, toolName, args) {
  // CLI 格式: npx qcc <服务名> <工具名> --参数 值
  const argsList = Object.entries(args)
    .map(([key, value]) => `--${key} "${value}"`)
    .join(' ');
  const command = `npx qcc ${service} ${toolName} ${argsList}`;

  console.log(`[QCC CLI] 执行命令: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1MB
    });

    if (stderr && !stdout) {
      console.error(`[QCC CLI] 错误输出:`, stderr);
      throw new Error(stderr);
    }

    console.log(`[QCC CLI] 成功，响应长度: ${stdout.length}`);

    // CLI 返回 JSON 格式
    try {
      return JSON.parse(stdout);
    } catch {
      // 如果不是 JSON，返回原始文本
      return { raw: stdout };
    }
  } catch (error) {
    console.error(`[QCC CLI] 执行失败:`, error.message);
    throw error;
  }
}

async function callQccMcpApi(serverName, toolName, args) {
  const endpoint = serverName === 'company' ? QCC_MCP_ENDPOINTS.company : QCC_MCP_ENDPOINTS.risk;

  // 生成唯一请求 ID
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ✅ MCP 使用 JSON-RPC 2.0 格式
  const requestBody = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  console.log(`[QCC MCP] 调用 ${serverName}/${toolName}`, JSON.stringify(requestBody, null, 2));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${QCC_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[QCC MCP] 请求失败: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`企查查 API 调用失败: ${response.status} ${response.statusText}`);
  }

  // MCP API 返回 SSE 流式数据，解析为 JSON
  const text = await response.text();
  console.log(`[QCC MCP] 原始响应长度: ${text.length} 字符`);
  console.log(`[QCC MCP] 原始响应内容:`, text.substring(0, 1000));

  // 尝试解析 SSE 格式: "data: {...}\n\n"
  const lines = text.split('\n').filter(line => line.trim().startsWith('data: '));
  if (lines.length > 0) {
    // 合并所有 data 行的结果
    const results = [];
    for (const line of lines) {
      const jsonStr = line.trim().replace('data: ', '');
      try {
        const parsed = JSON.parse(jsonStr);
        // 检查 JSON-RPC 响应格式
        if (parsed.result) {
          results.push(parsed.result);
        } else if (parsed.error) {
          console.error(`[QCC MCP] JSON-RPC 错误:`, parsed.error);
          throw new Error(parsed.error.message || 'API 返回错误');
        } else {
          results.push(parsed);
        }
      } catch (e) {
        console.warn(`[QCC MCP] 解析行失败:`, jsonStr.substring(0, 200));
      }
    }
    // 返回最后一个有效结果
    if (results.length > 0) {
      console.log(`[QCC MCP] 解析到 ${results.length} 个结果，返回最后一个:`, JSON.stringify(results[results.length - 1], null, 2).substring(0, 500));
      return results[results.length - 1];
    }
  }

  // 直接解析 JSON（非 SSE 格式）
  try {
    const parsed = JSON.parse(text);
    if (parsed.result) {
      return parsed.result;
    } else if (parsed.error) {
      throw new Error(parsed.error.message || 'API 返回错误');
    }
    return parsed;
  } catch {
    console.warn(`[QCC MCP] 无法解析响应:`, text.substring(0, 500));
    return { raw: text };
  }
}

// ✅ 解析风险数据 - 支持 MCP 格式、Markdown 表格格式和 JSON 格式
const parseRiskData = (result, dataType) => {
  if (!result) return [];

  // ✅ 优先处理 MCP 格式：{ content: [{ type: "text", text: "JSON字符串" }] }
  if (result.content && Array.isArray(result.content)) {
    const textContent = result.content.find(c => c.type === 'text');
    if (textContent?.text) {
      try {
        const parsed = JSON.parse(textContent.text);
        console.log(`[QCC API] ${dataType} MCP 格式解析成功`);
        
        // 根据 dataType 提取对应的数组
        const dataKeyMap = {
          '立案信息': '立案信息',
          '司法文书': '裁判文书',
          '经营异常': '经营异常',
          '失信信息': '失信信息',
        };
        
        const targetKey = dataKeyMap[dataType] || dataType;
        if (parsed[targetKey] && Array.isArray(parsed[targetKey])) {
          console.log(`[QCC API] ${dataType} 解析到 ${parsed[targetKey].length} 条记录`);
          return parsed[targetKey];
        }
        
        // 如果没有找到对应字段，返回空数组
        console.log(`[QCC API] ${dataType} 未找到数据字段 ${targetKey}`);
        return [];
      } catch (e) {
        console.warn(`[QCC API] ${dataType} JSON 解析失败:`, e.message);
      }
    }
  }

  // CLI 返回纯文本格式（Markdown 表格）
  if (result.raw && typeof result.raw === 'string') {
    console.log(`[QCC API] 解析 ${dataType} 纯文本格式...`);
    const items = [];
    const rawText = result.raw;

    // ✅ 解析 Markdown 表格
    const lines = rawText.split('\n');
    let inTable = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测表格开始（包含 | 分隔符）
      if (line.startsWith('|') && line.endsWith('|')) {
        // 跳过分隔行（| :--- | :--- |）
        if (line.includes(':---')) {
          continue;
        }

        // 提取表格内容
        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);

        if (!inTable) {
          // 第一行是表头
          headers = cells;
          inTable = true;
          console.log(`[QCC API] ${dataType} 表头:`, headers);
        } else {
          // 数据行
          if (cells.length === headers.length) {
            const item = {};
            headers.forEach((header, index) => {
              // 字段名映射
              const keyMap = {
                '案号': 'caseNo',
                '案由': 'caseReason',
                '案件类型': 'caseType',
                '立案日期': 'filingDate',
                '开庭日期': 'trialDate',
                '原告': 'plaintiff',
                '被告': 'defendant',
                '当事人': 'parties',
                '法院': 'court',
                '案件状态': 'caseStatus',
                '执行标的': 'amount',
                '标的额': 'amount',
                '案件金额': 'amount',
                '文书标题': 'documentTitle',
                '裁判结果': 'judgmentResult',
                '裁判日期': 'judgmentDate',
                '发布日期': 'publishDate',
                '列入日期': 'includedDate',
                '列入原因': 'reason',
                '决定机关': 'authority',
                '移出日期': 'removedDate',
              };

              const mappedKey = keyMap[header] || header;
              item[mappedKey] = cells[index];
            });

            // 添加到列表
            if (Object.keys(item).length > 0) {
              items.push(item);
            }
          }
        }
      } else if (inTable && !line.startsWith('|')) {
        // 表格结束
        inTable = false;
      }
    }

    console.log(`[QCC API] ${dataType} 解析结果: ${items.length} 条记录`);
    return items;
  }

  // 其他 JSON 格式
  if (result.error) return [];
  if (result.data) {
    const data = result.data;
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
  }
  return [];
};

// 主处理函数
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理 OPTIONS 请求（CORS 预检）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { companyName, options } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: '请提供企业名称' });
    }

    console.log(`[QCC API] 正在查询企业: ${companyName}, 模式: ${USE_CLI ? 'CLI' : 'MCP'}`);

    // ✅ 根据环境选择调用方式
    let companyInfoResult;
    let caseFilingResult = {};
    let judicialDocsResult = {};
    let businessExceptionResult = {};
    let dishonestResult = {};

    if (USE_CLI) {
      // ✅ 开发环境：使用 CLI（更省 token，更快）
      try {
        companyInfoResult = await callQccCli('company', 'get_company_registration_info', { searchKey: companyName });
        // 并行查询风险信息
        [caseFilingResult, judicialDocsResult, businessExceptionResult, dishonestResult] = await Promise.all([
          callQccCli('risk', 'get_case_filing_info', { searchKey: companyName }).catch(() => ({})),
          callQccCli('risk', 'get_judicial_documents', { searchKey: companyName }).catch(() => ({})),
          callQccCli('risk', 'get_business_exception', { searchKey: companyName }).catch(() => ({})),
          callQccCli('risk', 'get_dishonest_info', { searchKey: companyName }).catch(() => ({})),
        ]);
      } catch (cliError) {
        console.warn('[QCC] CLI 调用失败，回退到 MCP:', cliError);
        // CLI 失败时回退到 MCP
        companyInfoResult = await callQccMcpApi('company', 'get_company_registration_info', { searchKey: companyName });
        [caseFilingResult, judicialDocsResult, businessExceptionResult, dishonestResult] = await Promise.all([
          callQccMcpApi('risk', 'get_case_filing_info', { searchKey: companyName }).catch(() => ({})),
          callQccMcpApi('risk', 'get_judicial_documents', { searchKey: companyName }).catch(() => ({})),
          callQccMcpApi('risk', 'get_business_exception', { searchKey: companyName }).catch(() => ({})),
          callQccMcpApi('risk', 'get_dishonest_info', { searchKey: companyName }).catch(() => ({})),
        ]);
      }
    } else {
      // ✅ 生产环境：使用 MCP API
      companyInfoResult = await callQccMcpApi('company', 'get_company_registration_info', { searchKey: companyName });
      [caseFilingResult, judicialDocsResult, businessExceptionResult, dishonestResult] = await Promise.all([
        callQccMcpApi('risk', 'get_case_filing_info', { searchKey: companyName }).catch(() => ({})),
        callQccMcpApi('risk', 'get_judicial_documents', { searchKey: companyName }).catch(() => ({})),
        callQccMcpApi('risk', 'get_business_exception', { searchKey: companyName }).catch(() => ({})),
        callQccMcpApi('risk', 'get_dishonest_info', { searchKey: companyName }).catch(() => ({})),
      ]);
    }

    console.log(`[QCC API] 企业信息结果:`, JSON.stringify(companyInfoResult, null, 2));

    // 解析企业信息 - 根据实际返回格式调整
    let companyData = {};
    if (companyInfoResult?.content && Array.isArray(companyInfoResult.content)) {
      // MCP 返回格式: { content: [{ type: "text", text: "..." }] }
      const textContent = companyInfoResult.content.find(c => c.type === 'text');
      if (textContent?.text) {
        try {
          companyData = JSON.parse(textContent.text);
        } catch {
          companyData = { raw: textContent.text };
        }
      }
    } else {
      companyData = companyInfoResult?.data || companyInfoResult || {};
    }

    // ✅ 解析CLI纯文本格式
    if (companyData.raw && typeof companyData.raw === 'string') {
      const rawText = companyData.raw;
      const extractedData = {};

      // 使用正则提取 "* 字段名: 值" 格式
      const lines = rawText.split('\n');
      for (const line of lines) {
        const match = line.match(/^\* (.+?): (.+)$/);
        if (match) {
          const [, key, value] = match;
          extractedData[key] = value;
        }
      }

      // 映射字段名到英文
      if (Object.keys(extractedData).length > 0) {
        companyData = {
          name: extractedData['企业名称'] || companyName,
          creditCode: extractedData['统一社会信用代码'] || '-',
          legalPerson: extractedData['法定代表人'] || '-',
          registeredCapital: extractedData['注册资本'] || '-',
          establishDate: extractedData['成立日期'] || '-',
          businessStatus: extractedData['登记状态'] || '-',
          businessScope: extractedData['经营范围'] || '-',
          address: extractedData['注册地址'] || '-',
          businessType: extractedData['企业类型'] || '-',
          insuredCount: extractedData['参保人数'] || '-',
        };
      }
    }

    console.log(`[QCC API] 解析后的企业数据:`, JSON.stringify(companyData, null, 2));

    // ✅ 检查是否无匹配项 - CLI返回纯文本格式
    const rawText = companyData.raw || '';
    const hasErrorMessage =
      rawText.includes('地域限制') ||
      rawText.includes('仅支持') ||
      rawText.includes('无匹配项') ||
      rawText.includes('未找到') ||
      rawText.includes('查询失败');

    const isNotFound =
      companyData['无匹配项'] || // JSON格式
      hasErrorMessage || // CLI文本错误信息
      (typeof companyData === 'string' && companyData.includes('无匹配项')) || // 直接返回字符串
      Object.keys(companyData).length === 0 || // 空对象
      (companyData.name === '-' && companyData.creditCode === '-'); // 所有字段为空

    if (isNotFound) {
      console.log(`[QCC API] 未找到企业: ${companyName}`);

      // 根据错误类型返回不同提示
      let errorMessage = `未找到企业"${companyName}"，请确认企业名称是否正确。建议使用完整企业名称（如：XX科技有限公司）`;
      if (rawText.includes('地域限制') || rawText.includes('仅支持')) {
        errorMessage = `关键词"${companyName}"太模糊或不符合查询条件。请使用完整企业名称（如：北京三快在线科技有限公司）`;
      }

      return res.json({
        notFound: true,
        message: errorMessage,
        companyInfo: {
          name: companyName,
          creditCode: '-',
          legalPerson: '-',
          registeredCapital: '-',
          establishDate: '-',
          businessStatus: '-',
          businessScope: '-',
          address: '-',
        },
        laborDisputes: [],
        judicialRisks: [],
        businessAbnormals: [],
        riskSummary: {
          laborDisputeCount: 0,
          judicialRiskCount: 0,
          abnormalCount: 0,
          hasDishonest: false,
          overallRiskLevel: 'unknown',
        },
        queryTime: new Date().toISOString(),
        dataUpdateDate: new Date().toISOString().split('T')[0],
      });
    }

    // ✅ 筛选劳动纠纷案件
    const caseFilingData = parseRiskData(caseFilingResult, '立案信息');
    console.log(`[QCC API] 立案信息数据:`, JSON.stringify(caseFilingData.slice(0, 2), null, 2));

    const laborDisputes = caseFilingData.filter((item) => {
      const caseType = item.caseType || item.caseReason || item.案由 || '';
      return caseType.includes('劳动') || caseType.includes('工资') ||
             caseType.includes('工伤') || caseType.includes('社保') ||
             caseType.includes('劳动合同') || caseType.includes('经济补偿');
    }).map((item) => ({
      caseNo: item.caseNo || item.caseNumber || item.案号 || '-',
      caseType: item.caseType || item.caseReason || item.案由 || '劳动争议',
      filingDate: item.filingDate || item.立案日期 || '-',
      plaintiff: item.plaintiff || item.原告 || '-',
      defendant: companyName,
      caseStatus: item.caseStatus || item.案件状态 || '-',
      amount: item.amount || item.标的额 || '-',
      summary: item.summary || '劳动争议案件',
    }));

    const judicialRisks = parseRiskData(judicialDocsResult, '司法文书');
    const businessAbnormals = parseRiskData(businessExceptionResult, '经营异常');
    const dishonestData = parseRiskData(dishonestResult, '失信信息');

    console.log(`[QCC API] 风险统计: 劳动纠纷=${laborDisputes.length}, 司法风险=${judicialRisks.length}, 经营异常=${businessAbnormals.length}`);
    const hasDishonest = dishonestData.length > 0;

    // 计算风险等级
    const laborDisputeCount = laborDisputes.length;
    const judicialRiskCount = judicialRisks.length;
    const abnormalCount = businessAbnormals.length;

    let overallRiskLevel = 'low';
    if (hasDishonest || laborDisputeCount > 3 || abnormalCount > 2) {
      overallRiskLevel = 'high';
    } else if (laborDisputeCount > 0 || judicialRiskCount > 0 || abnormalCount > 0) {
      overallRiskLevel = 'medium';
    }

    // 构建企业风险报告
    const report = {
      companyInfo: {
        name: companyData.name || companyData.企业名称 || companyName,
        creditCode: companyData.creditCode || companyData.统一社会信用代码 || '-',
        legalPerson: companyData.legalPerson || companyData.法定代表人 || '-',
        registeredCapital: companyData.registeredCapital || companyData.注册资本 || '-',
        establishDate: companyData.establishDate || companyData.成立日期 || '-',
        businessStatus: companyData.businessStatus || companyData.登记状态 || '-',
        businessScope: companyData.businessScope || companyData.经营范围 || '-',
        address: companyData.address || companyData.注册地址 || '-',
        businessType: companyData.businessType || companyData.企业类型 || '-',
        insuredCount: companyData.insuredCount || companyData.参保人数 || '-',
      },
      laborDisputes,
      judicialRisks: judicialRisks.slice(0, 5), // 限制数量
      businessAbnormals: businessAbnormals.slice(0, 5),
      riskSummary: {
        laborDisputeCount,
        judicialRiskCount,
        abnormalCount,
        hasDishonest,
        overallRiskLevel,
      },
      queryTime: new Date().toISOString(),
      dataUpdateDate: new Date().toISOString().split('T')[0],
    };

    console.log(`[QCC API] 查询成功: ${companyName}, 风险等级: ${overallRiskLevel}`);
    res.json(report);
  } catch (error) {
    console.error('[QCC API] 查询失败:', error);
    const errorMessage = error instanceof Error ? error.message : '查询失败';
    res.status(500).json({ message: errorMessage });
  }
}