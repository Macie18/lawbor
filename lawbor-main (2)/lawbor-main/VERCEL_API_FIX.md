# Vercel 企业风险审查 API 修复指南

## 问题描述
在Vercel预览环境中，企业风险审查功能报错：
```
api/qcc/company-risk:1 Failed to load resource: the server responded with a status of 405 ()
```

## 问题原因
1. Vercel默认将所有请求重定向到 `index.html`（单页应用SPA配置）
2. API路由 `/api/qcc/company-risk` 被错误地重定向，导致405 Method Not Allowed错误
3. 原项目使用Express服务器(`server.ts`)，但在Vercel上需要转换为Serverless Functions

## 解决方案
已创建以下Serverless Functions：

1. **`/api/health`** - 健康检查API
2. **`/api/qcc/company-risk`** - 企业风险查询API (POST)
3. **`/api/qcc/tools`** - 企查查工具列表API (GET)
4. **`/api/download/[key]`** - 文档下载API (GET)

## 文件结构
```
api/
├── health.js                    # 健康检查
├── qcc/
│   ├── company-risk.js          # 企业风险查询
│   └── tools.js                 # 工具列表
└── download/
    └── [key].js                 # 文档下载（动态路由）
```

## Vercel配置更新
更新了 `vercel.json`，添加API路由重写规则：
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/policies/:path*",
      "destination": "/policies/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 环境变量配置
在Vercel项目中需要设置以下环境变量：

### 必需环境变量
1. **`QCC_API_KEY`** - 企查查API密钥
   - 获取地址：https://agent.qcc.com/
   - 默认值：`MsYrFNGHpfRi3g03nL3Fe3CyDZ9dfwgqOhDzQGGDCCvUerrP`（测试用）

### 可选环境变量
1. **`QCC_USE_CLI`** - 是否使用CLI模式
   - 设置值：`false`（推荐在生产环境使用MCP API）
   - 默认行为：生产环境自动使用MCP API，开发环境尝试CLI

### 其他环境变量
参考 `.env.example` 文件中的其他配置，特别是：
- `VITE_SUPABASE_URL` - Supabase项目URL
- `VITE_SUPABASE_ANON_KEY` - Supabase匿名密钥
- `VITE_DEEPSEEK_API_KEY` - DeepSeek API密钥

## 部署步骤
1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "fix: 修复Vercel API 405错误，添加Serverless Functions"
   git push
   ```

2. **在Vercel中配置环境变量**
   - 进入Vercel项目设置
   - 点击 "Environment Variables"
   - 添加上述环境变量
   - 点击 "Save"

3. **重新部署**
   - Vercel会自动检测代码变更并重新部署
   - 或手动触发重新部署

## 测试验证
部署后测试以下端点：

1. **健康检查** - `GET /api/health`
   - 应返回：`{"status":"ok","timestamp":"..."}`

2. **企业风险查询** - 使用前端界面测试
   - 输入企业名称，点击查询
   - 应正常返回企业风险报告

## 注意事项
1. **CLI模式限制**：Vercel Serverless Functions不支持子进程执行，因此生产环境强制使用MCP API模式
2. **文件路径**：文档下载功能需要确保 `public/templates/` 目录包含所有模板文件
3. **CORS配置**：所有API都已配置CORS头，支持跨域请求
4. **开发环境**：本地开发仍可使用 `npm run dev` 和 Express服务器

## 故障排除
如果仍然遇到问题：

1. **检查Vercel部署日志**
   - 在Vercel控制台查看Function日志
   - 检查是否有初始化错误

2. **验证环境变量**
   ```bash
   # 本地测试环境变量
   echo $QCC_API_KEY
   ```

3. **测试API端点**
   ```bash
   # 使用curl测试健康检查
   curl https://your-domain.vercel.app/api/health
   ```

4. **检查网络请求**
   - 浏览器开发者工具查看Network标签
   - 确认请求方法正确（POST/GET）
   - 检查响应状态码和内容

## 版本信息
- **修复日期**: 2026-04-10
- **影响版本**: 所有Vercel部署版本
- **相关提交**: 修复Vercel API路由配置