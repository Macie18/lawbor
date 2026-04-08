import './loadEnv.js';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { VoiceCallService } from './src/services/voiceCallService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
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
