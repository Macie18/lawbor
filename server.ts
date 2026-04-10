import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { VoiceCallService } from './src/services/voiceCallService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      
      // 解析 CLI 输出（格式为 key: value）
      const parseCliOutput = (output: string): Record<string, string> => {
        const result: Record<string, string> = {};
        const lines = output.split('\n');
        for (const line of lines) {
          const match = line.match(/^\*?\s*(.+?):\s*(.+)$/);
          if (match) {
            result[match[1].trim()] = match[2].trim();
          }
        }
        return result;
      };
      
      // 1. 查询企业工商信息
      const { stdout: companyInfoRaw } = await execAsync(
        `npx qcc company get_company_registration_info "${companyName}"`,
        { timeout: 30000 }
      );
      const companyData = parseCliOutput(companyInfoRaw);
      
      // 2. 并行查询风险信息
      const [caseFilingRaw, judicialDocsRaw, businessExceptionRaw, dishonestRaw] = await Promise.all([
        // 法院立案信息
        execAsync(`npx qcc risk get_case_filing_info "${companyName}"`, { timeout: 30000 }).catch(() => ({ stdout: '' })),
        // 法院判决文书
        execAsync(`npx qcc risk get_judicial_documents "${companyName}"`, { timeout: 30000 }).catch(() => ({ stdout: '' })),
        // 经营异常
        execAsync(`npx qcc risk get_business_exception "${companyName}"`, { timeout: 30000 }).catch(() => ({ stdout: '' })),
        // 失信信息
        execAsync(`npx qcc risk get_dishonest_info "${companyName}"`, { timeout: 30000 }).catch(() => ({ stdout: '' })),
      ]);
      
      // 解析风险信息（简化版，实际需要更复杂的解析）
      const parseRiskItems = (output: string): any[] => {
        if (!output || output.includes('未找到') || output.includes('无数据')) return [];
        // 简单提取案件数量
        const items: any[] = [];
        const lines = output.split('\n').filter(l => l.trim() && !l.includes('正在调用'));
        // 如果有数据行，提取关键信息
        if (lines.length > 2) {
          items.push({ raw: output.substring(0, 500) });
        }
        return items;
      };
      
      const laborDisputes: any[] = [];
      const judicialRisks: any[] = [];
      const businessAbnormals: any[] = [];
      
      // 分析法院立案信息，筛选劳动争议
      if (caseFilingRaw.stdout) {
        const caseLines = caseFilingRaw.stdout.split('\n');
        let currentCase: any = {};
        for (const line of caseLines) {
          if (line.includes('案由') && (line.includes('劳动') || line.includes('工资') || line.includes('工伤'))) {
            currentCase.caseType = line.split(':')[1]?.trim() || '劳动争议';
          }
          if (line.includes('案号')) {
            currentCase.caseNo = line.split(':')[1]?.trim() || '-';
          }
          if (line.includes('立案日期')) {
            currentCase.filingDate = line.split(':')[1]?.trim() || '-';
          }
          if (Object.keys(currentCase).length >= 2) {
            laborDisputes.push({ ...currentCase, summary: '检测到劳动相关案件' });
            currentCase = {};
          }
        }
      }
      
      // 分析判决文书
      if (judicialDocsRaw.stdout) {
        judicialRisks.push(...parseRiskItems(judicialDocsRaw.stdout));
      }
      
      // 分析经营异常
      if (businessExceptionRaw.stdout && !businessExceptionRaw.stdout.includes('未找到')) {
        businessAbnormals.push(...parseRiskItems(businessExceptionRaw.stdout));
      }
      
      // 分析失信信息
      const hasDishonest = dishonestRaw.stdout && !dishonestRaw.stdout.includes('未找到') && !dishonestRaw.stdout.includes('无数据');
      
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
          name: companyData['企业名称'] || companyName,
          creditCode: companyData['统一社会信用代码'] || '-',
          legalPerson: companyData['法定代表人'] || '-',
          registeredCapital: companyData['注册资本'] || '-',
          establishDate: companyData['成立日期'] || '-',
          businessStatus: companyData['登记状态'] || '-',
          businessScope: companyData['经营范围'] || '-',
          address: companyData['注册地址'] || '-',
          businessType: companyData['企业类型'] || '-',
          insuredCount: companyData['参保人数'] || '-',
        },
        laborDisputes,
        judicialRisks,
        businessAbnormals,
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
