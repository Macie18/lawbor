// ✅ 加载环境变量（必须在最顶部）
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { VoiceCallService } from './src/services/voiceCallService';
import ttsRouter from './api/tts';

// ✅ 企查查 API 配置
const QCC_API_KEY = process.env.QCC_API_KEY || 'MsYrFNGHpfRi3g03nL3Fe3CyDZ9dfwgqOhDzQGGDCCvUerrP';
const QCC_MCP_ENDPOINTS = {
  company: 'https://agent.qcc.com/mcp/company/stream',
  risk: 'https://agent.qcc.com/mcp/risk/stream',
};
// ✅ 开发环境优先使用 CLI（更省 token）
const USE_CLI = process.env.NODE_ENV !== 'production' && process.env.QCC_USE_CLI !== 'false';

// ✅ CLI 命令执行函数（开发环境）
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function callQccCli(service: 'company' | 'risk', toolName: string, args: Record<string, any>): Promise<any> {
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
  } catch (error: any) {
    console.error(`[QCC CLI] 执行失败:`, error.message);
    throw error;
  }
}
async function callQccMcpApi(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
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
    const results: any[] = [];
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

// ✅ 获取 MCP 服务器的可用工具列表
async function listQccMcpTools(serverName: string): Promise<any> {
  const endpoint = serverName === 'company' ? QCC_MCP_ENDPOINTS.company : QCC_MCP_ENDPOINTS.risk;
  
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const requestBody = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/list',
  };
  
  console.log(`[QCC MCP] 列出工具: ${serverName}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${QCC_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  const text = await response.text();
  console.log(`[QCC MCP] 工具列表响应:`, text);
  return text;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ✅ 腾讯云 TTS 语音合成路由
  app.use('/api/tts', ttsRouter);

  // ✅ 调试接口：列出企查查 MCP 可用工具
  app.get('/api/qcc/tools', async (req, res) => {
    try {
      const companyTools = await listQccMcpTools('company');
      const riskTools = await listQccMcpTools('risk');
      res.json({
        company: companyTools,
        risk: riskTools,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : '未知错误' });
    }
  });

  // ✅ 企查查企业风险查询 API
  app.post('/api/qcc/company-risk', express.json(), async (req, res) => {
    const { companyName, options } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ message: '请提供企业名称' });
    }

    try {
      console.log(`[QCC API] 正在查询企业: ${companyName}, 模式: ${USE_CLI ? 'CLI' : 'MCP'}`);
      
      // ✅ 根据环境选择调用方式
      let companyInfoResult: any;
      let caseFilingResult: any = {};
      let judicialDocsResult: any = {};
      let businessExceptionResult: any = {};
      let dishonestResult: any = {};
      
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
      let companyData: any = {};
      if (companyInfoResult?.content && Array.isArray(companyInfoResult.content)) {
        // MCP 返回格式: { content: [{ type: "text", text: "..." }] }
        const textContent = companyInfoResult.content.find((c: any) => c.type === 'text');
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
        const extractedData: any = {};
        
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
            overallRiskLevel: 'unknown' as const,
          },
          queryTime: new Date().toISOString(),
          dataUpdateDate: new Date().toISOString().split('T')[0],
        });
      }
      
      // ✅ 解析风险数据 - 支持 Markdown 表格格式和 JSON 格式
      const parseRiskData = (result: any, dataType: string): any[] => {
        if (!result) return [];
        
        // CLI 返回纯文本格式（Markdown 表格）
        if (result.raw && typeof result.raw === 'string') {
          console.log(`[QCC API] 解析 ${dataType} 纯文本格式...`);
          const items: any[] = [];
          const rawText = result.raw;
          
          // ✅ 解析 Markdown 表格
          const lines = rawText.split('\n');
          let inTable = false;
          let headers: string[] = [];
          
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
                  const item: any = {};
                  headers.forEach((header, index) => {
                    // 字段名映射
                    const keyMap: Record<string, string> = {
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
        
        // MCP JSON 格式
        if (result.error) return [];
        if (result.data) {
          const data = result.data;
          if (Array.isArray(data)) return data;
          if (data.items && Array.isArray(data.items)) return data.items;
        }
        return [];
      };
      
      // ✅ 筛选劳动纠纷案件
      const caseFilingData = parseRiskData(caseFilingResult, '立案信息');
      console.log(`[QCC API] 立案信息数据:`, JSON.stringify(caseFilingData.slice(0, 2), null, 2));

      // ✅ 辅助函数：解析当事人JSON字符串
      const parseParties = (partiesStr: string): { plaintiff: string; defendant: string } => {
        if (!partiesStr) return { plaintiff: '-', defendant: '-' };

        try {
          // 尝试解析JSON
          const parties = typeof partiesStr === 'string' ? JSON.parse(partiesStr) : partiesStr;

          // 提取原告和被告
          const plaintiff = parties['原告']?.join('、') || parties.plaintiff || '-';
          const defendant = parties['被告']?.join('、') || parties.defendant || '-';

          return { plaintiff, defendant };
        } catch {
          // JSON解析失败，返回原始字符串
          return { plaintiff: partiesStr, defendant: '-' };
        }
      };

      // ✅ 辅助函数：判断是否为劳动纠纷
      const isLaborDispute = (caseReason: string): boolean => {
        if (!caseReason) return false;
        const keywords = [
          '劳动', '工资', '工伤', '社保', '劳动合同', '经济补偿',
          '劳务', '加班', '休假', '辞退', '解除劳动合同',
          '劳动争议', '人事争议', '工伤保险', '生育保险',
          '医疗保险', '养老保险', '失业保险', '住房公积金'
        ];
        return keywords.some(keyword => caseReason.includes(keyword));
      };

      const laborDisputes = caseFilingData.filter((item: any) => {
        const caseReason = item.caseType || item.caseReason || item.案由 || '';
        const isLabor = isLaborDispute(caseReason);
        console.log(`[QCC API] 检查立案信息: 案号=${item.caseNo || item.案号}, 案由=${caseReason}, 是否劳动纠纷=${isLabor}`);
        return isLabor;
      }).map((item: any) => {
        const { plaintiff, defendant } = parseParties(item.parties || item.当事人);

        console.log(`[QCC API] ✅ 立案信息-劳动纠纷: 案号=${item.caseNo || item.案号}, 案由=${item.caseReason || item.案由}`);

        return {
          caseNo: item.caseNo || item.caseNumber || item.案号 || '-',
          caseType: item.caseType || item.caseReason || item.案由 || '劳动争议',
          filingDate: item.filingDate || item.立案日期 || '-',
          plaintiff: plaintiff,
          defendant: defendant === '-' ? companyName : defendant,
          caseStatus: item.caseStatus || item.案件状态 || '-',
          amount: item.amount || item.标的额 || '-',
          summary: `${item.caseReason || item.案由 || '劳动争议'}案件`,  // ✅ 使用案由生成摘要
        };
      });

      // ✅ 从司法文书数据中也提取劳动纠纷案件（包含裁判结果）
      const judicialRisks = parseRiskData(judicialDocsResult, '司法文书');
      console.log(`[QCC API] 司法文书数据 (${judicialRisks.length}条):`, JSON.stringify(judicialRisks.slice(0, 2), null, 2));

      const laborDisputesFromJudicial = judicialRisks.filter((item: any) => {
        const caseReason = item.caseReason || item.案由 || '';
        const isLabor = isLaborDispute(caseReason);
        console.log(`[QCC API] 检查案件: 案号=${item.caseNo || item.案号}, 案由=${caseReason}, 是否劳动纠纷=${isLabor}`);
        return isLabor;
      }).map((item: any) => {
        const { plaintiff, defendant } = parseParties(item.parties || item.当事人);

        console.log(`[QCC API] ✅ 司法文书-劳动纠纷: 案号=${item.caseNo || item.案号}`);
        console.log(`  案由=${item.caseReason || item.案由}`);
        console.log(`  原告=${plaintiff}, 被告=${defendant}`);
        console.log(`  裁判结果=${item.judgmentResult || item.裁判结果 || '(无)'}`);
        console.log(`  裁判日期=${item.judgmentDate || item.裁判日期 || '(无)'}`);

        return {
          caseNo: item.caseNo || item.caseNumber || item.案号 || '-',
          caseType: item.caseType || item.caseReason || item.案由 || '劳动争议',
          filingDate: item.filingDate || item.立案日期 || '-',
          plaintiff: plaintiff,
          defendant: defendant === '-' ? companyName : defendant,
          caseStatus: item.caseStatus || item.案件状态 || '-',
          amount: item.amount || item.标的额 || '-',
          summary: `${item.caseReason || item.案由 || '劳动争议'}案件`,
          judgmentResult: item.judgmentResult || item.裁判结果 || '-',
          judgmentDate: item.judgmentDate || item.裁判日期 || '-',
        };
      });

      console.log(`[QCC API] 从司法文书提取的劳动纠纷: ${laborDisputesFromJudicial.length}条`);

      // ✅ 合并立案信息和司法文书的劳动纠纷（去重，优先使用司法文书数据）
      const allLaborDisputes = [...laborDisputesFromJudicial];
      console.log(`[QCC API] 开始合并，初始allLaborDisputes=${allLaborDisputes.length}条`);

      laborDisputes.forEach((dispute) => {
        console.log(`[QCC API] 检查立案信息: 案号=${dispute.caseNo}, 原告=${dispute.plaintiff}`);
        // 如果案号不在司法文书中，添加立案信息
        const exists = allLaborDisputes.some(d => d.caseNo === dispute.caseNo);
        if (!exists) {
          console.log(`[QCC API] 添加立案信息: ${dispute.caseNo}`);
          allLaborDisputes.push(dispute);
        } else {
          console.log(`[QCC API] 跳过重复案号: ${dispute.caseNo}`);
        }
      });

      console.log(`[QCC API] 劳动纠纷统计: 立案信息=${laborDisputes.length}, 司法文书=${laborDisputesFromJudicial.length}, 合并后=${allLaborDisputes.length}`);

      // ✅ 其他司法风险（非劳动纠纷）
      const otherJudicialRisks = judicialRisks.filter((item: any) => {
        const caseReason = item.caseReason || item.案由 || '';
        return !isLaborDispute(caseReason);
      });
      const businessAbnormals = parseRiskData(businessExceptionResult, '经营异常');
      const dishonestData = parseRiskData(dishonestResult, '失信信息');

      console.log(`[QCC API] 风险统计: 劳动纠纷=${allLaborDisputes.length}, 其他司法风险=${otherJudicialRisks.length}, 经营异常=${businessAbnormals.length}`);
      const hasDishonest = dishonestData.length > 0;

      // 计算风险等级
      const laborDisputeCount = allLaborDisputes.length;
      const judicialRiskCount = otherJudicialRisks.length;
      const abnormalCount = businessAbnormals.length;
      
      let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';
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
        laborDisputes: allLaborDisputes,
        judicialRisks: otherJudicialRisks.slice(0, 5), // 其他司法风险（非劳动纠纷）
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
      console.log(`[QCC API] 返回数据: 劳动纠纷=${report.laborDisputes.length}条`);
      console.log(`[QCC API] 劳动纠纷详情:`, JSON.stringify(report.laborDisputes, null, 2));
      res.json(report);
    } catch (error) {
      console.error('[QCC API] 查询失败:', error);
      const errorMessage = error instanceof Error ? error.message : '查询失败';
      res.status(500).json({ message: errorMessage });
    }
  });

  const DOCUMENT_MAPPING = {
    'general': { file: 'template_general.docx', originalName: '劳动仲裁申请书（通用版）最全-含证据清单、申请仲裁材料清单、注意事项.docx' },
    'salary': { file: 'template_salary.docx', originalName: '劳动仲裁申请书模板（追索拖欠工资）.docx' },
    'overtime': { file: 'template_overtime.docx', originalName: '劳动仲裁申请书（追索加班费）.docx' },
    'compensation': { file: 'template_compensation.docx', originalName: '劳动仲裁申请书（离职补偿）.docx' },
    'injury': { file: 'template_injury.docx', originalName: '劳动仲裁申请书（工伤认定）.docx' },
    'relation': { file: 'template_relation.docx', originalName: '劳动人事争议仲裁申请书.docx' },
    'social_security': { file: 'template_social_security.docx', originalName: '未缴纳社保劳动仲裁申请书范本.docx' },
    'non_compete': { file: 'template_non_compete.docx', originalName: '劳动仲裁答辩书（竞业限制争议—劳动者通用填空模板）.docx' },
    'multiple': { file: 'template_multiple.docx', originalName: '劳动仲裁申请书模板（确认劳动关系、拖欠薪资、经济补偿金、加班工资、加发赔偿金）.docx' }
  };

  app.get('/api/download/:key', (req, res) => {
    const key = req.params.key;
    const docInfo = DOCUMENT_MAPPING[key as keyof typeof DOCUMENT_MAPPING];
    
    if (!docInfo) {
      return res.status(404).send('Template not found');
    }

    const filePath = path.join(process.cwd(), 'public/templates', docInfo.file);
    
    // Explicitly set headers for binary Word document
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Use RFC 5987 for UTF-8 filename encoding in Content-Disposition
    const encodedName = encodeURIComponent(docInfo.originalName).replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).send('Error downloading file');
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] New connection established');
    const voiceCall = new VoiceCallService();

    ws.on('message', async (data: any, isBinary: boolean) => {
      if (isBinary) {
        // Handle audio chunk
        const audioBuffer = Buffer.from(data);
        const result = await voiceCall.processAudioChunk(audioBuffer);
        if (result) {
          // Send thinking status
          ws.send(JSON.stringify({ status: 'thinking' }));
          // Send text first
          ws.send(JSON.stringify({ text: result.text }));
          // Then send audio
          ws.send(result.audio, { binary: true });
        }
      } else {
        // Handle JSON commands
        try {
          const command = JSON.parse(data.toString());
          if (command.action === 'start_interview') {
            voiceCall.setConfig(command.config);
          } else if (command.action === 'end_call') {
            const report = await voiceCall.generateFinalReport();
            ws.send(JSON.stringify({ action: 'report', data: JSON.parse(report) }));
            ws.close();
          }
        } catch (e) {
          console.error('[WS] Error parsing message:', e);
        }
      }
    });

    ws.on('close', () => {
      console.log('[WS] Connection closed');
    });
  });
}

startServer();
