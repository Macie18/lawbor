// 企查查工具列表 API (Vercel Serverless Function)

const QCC_API_KEY = process.env.QCC_API_KEY || 'MsYrFNGHpfRi3g03nL3Fe3CyDZ9dfwgqOhDzQGGDCCvUerrP';
const QCC_MCP_ENDPOINTS = {
  company: 'https://agent.qcc.com/mcp/company/stream',
  risk: 'https://agent.qcc.com/mcp/risk/stream',
};

async function listQccMcpTools(serverName) {
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
}