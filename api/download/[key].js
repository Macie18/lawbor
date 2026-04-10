// 文档下载 API (Vercel Serverless Function)

import { join } from 'path';
import { readFile } from 'fs/promises';

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

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { key } = req.query;

  const docInfo = DOCUMENT_MAPPING[key];

  if (!docInfo) {
    return res.status(404).send('Template not found');
  }

  try {
    // 在Vercel中，文件路径需要使用相对路径
    // 模板文件应该在 public/templates 目录下
    const filePath = join(process.cwd(), 'public/templates', docInfo.file);

    // 读取文件
    const fileBuffer = await readFile(filePath);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // 使用 RFC 5987 for UTF-8 filename encoding in Content-Disposition
    const encodedName = encodeURIComponent(docInfo.originalName).replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);

    // 发送文件
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download error:', error);

    // 检查是否已经发送了响应头
    if (!res.headersSent) {
      res.status(500).send('Error downloading file');
    }
  }
}