import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { VoiceCallService } from './src/services/voiceCallService';

// ✅ 企查查 MCP API 配置
const QCC_API_KEY = process.env.QCC_API_KEY || 'MsYrFNGHpfRi3g03nL3Fe3CyDZ9dfwgqOhDzQGGDCCvUerrP';
const QCC_MCP_ENDPOINTS = {
  company: 'https://agent.qcc.com/mcp/company/stream',
  risk: 'https://agent.qcc.com/mcp/risk/stream',
};

// ✅ 企查查 MCP API 调用函数
async function callQccMcpApi(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
  const endpoint = serverName === 'company' ? QCC_MCP_ENDPOINTS.company : QCC_MCP_ENDPOINTS.risk;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QCC_API_KEY}`,
    },
    body: JSON.stringify({
      tool: toolName,
      arguments: args,
    }),
  });

  if (!response.ok) {
    throw new Error(`企查查 API 调用失败: ${response.status} ${response.statusText}`);
  }

  // MCP API 返回 SSE 流式数据，解析为 JSON
  const text = await response.text();
  
  // 尝试解析 SSE 格式: "data: {...}\n\n"
  const lines = text.split('\n').filter(line => line.startsWith('data: '));
  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    const jsonStr = lastLine.replace('data: ', '');
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { raw: jsonStr };
    }
  }
  
  // 直接解析 JSON
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ✅ 企查查企业风险查询 API
  app.post('/api/qcc/company-risk', express.json(), async (req, res) => {
    const { companyName, options } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ message: '请提供企业名称' });
    }

    try {
      console.log(`[QCC API] 正在查询企业: ${companyName}`);
      
      // 1. 查询企业工商信息 (MCP API)
      const companyInfoResult = await callQccMcpApi('company', 'get_company_registration_info', {
        companyName: companyName,
      });
      
      // 解析企业信息
      const companyData = companyInfoResult?.data || companyInfoResult || {};
      
      // 2. 并行查询风险信息 (MCP API)
      const [caseFilingResult, judicialDocsResult, businessExceptionResult, dishonestResult] = await Promise.all([
        // 法院立案信息
        callQccMcpApi('risk', 'get_case_filing_info', { companyName }).catch(() => ({})),
        // 法院判决文书
        callQccMcpApi('risk', 'get_judicial_documents', { companyName }).catch(() => ({})),
        // 经营异常
        callQccMcpApi('risk', 'get_business_exception', { companyName }).catch(() => ({})),
        // 失信信息
        callQccMcpApi('risk', 'get_dishonest_info', { companyName }).catch(() => ({})),
      ]);
      
      // 解析风险数据
      const parseRiskData = (result: any): any[] => {
        if (!result || result.error || !result.data) return [];
        const data = result.data;
        if (Array.isArray(data)) return data;
        if (data.items && Array.isArray(data.items)) return data.items;
        return [];
      };
      
      // 筛选劳动纠纷案件
      const caseFilingData = parseRiskData(caseFilingResult);
      const laborDisputes = caseFilingData.filter((item: any) => {
        const caseType = item.caseType || item.caseReason || item.案由 || '';
        return caseType.includes('劳动') || caseType.includes('工资') || 
               caseType.includes('工伤') || caseType.includes('社保') ||
               caseType.includes('劳动合同');
      }).map((item: any) => ({
        caseNo: item.caseNo || item.caseNumber || item.案号 || '-',
        caseType: item.caseType || item.caseReason || item.案由 || '劳动争议',
        filingDate: item.filingDate || item.立案日期 || '-',
        plaintiff: item.plaintiff || item.原告 || '-',
        defendant: companyName,
        caseStatus: item.caseStatus || item.案件状态 || '-',
        amount: item.amount || item.标的额 || '-',
        summary: item.summary || '劳动争议案件',
      }));
      
      const judicialRisks = parseRiskData(judicialDocsResult);
      const businessAbnormals = parseRiskData(businessExceptionResult);
      const dishonestData = parseRiskData(dishonestResult);
      const hasDishonest = dishonestData.length > 0;
      
      // 计算风险等级
      const laborDisputeCount = laborDisputes.length;
      const judicialRiskCount = judicialRisks.length;
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
