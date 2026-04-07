# Lawbor - 劳动者权益守护平台

重塑新锐劳动者权益，让每一位职场新人都能懂法、用法、维权。

[🌐 访问网站](https://lawbor.com) · [📖 功能介绍](#功能特点) · [🚀 快速开始](#快速开始)

---

## 功能特点

| 功能 | 描述 |
|------|------|
| **合同天眼** | AI 逐字扫描合同，识别试用期、薪资、社保、违约金、竞业限制等陷阱 |
| **职场法眼** | 劳动法知识卡片，试用期、加班、离职、赔偿等常见问题一查便知 |
| **补贴雷达** | 一键匹配城市政策，租房补贴、人才补贴、就业扶持等应得权益不错过 |
| **维权冲锋队** | 劳动仲裁全程陪跑，帮忙写文书、算赔偿、理证据、走流程 |
| **薪资清算师** | 税前税后、加班费、补偿金、个税计算，工资明明白白 |
| **AI 法律搭子** | 24 小时在线随时问答，随时随地解答你的职场法律问题 |

---

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **UI 框架**: Ant Design + Tailwind CSS
- **动画**: Motion (framer-motion)
- **路由**: React Router DOM
- **AI 能力**: DeepSeek API (合同审查、AI 问答)
- **部署**: Vercel

---

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 bun

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填入你的 API Key：

```env
DEEPSEEK_API_KEY=your_api_key_here
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

---

## 项目结构

```
src/
├── pages/
│   ├── Home.tsx           # 首页
│   ├── ContractReview.tsx # 合同审查
│   ├── BenefitsGuide.tsx  # 政策补贴指南
│   ├── TaxCalculator.tsx  # 薪资计算器
│   ├── KnowledgeCards.tsx # 劳动法知识卡片
│   ├── Dashboard.tsx      # 用户仪表盘
│   ├── Arbitration/       # 劳动仲裁
│   └── Interview/         # AI 面试模拟
├── services/
│   └── llmService.ts      # AI 服务封装
├── components/            # 公共组件
└── public/
    └── policies/          # 城市政策文件
```

---

## 部署

项目已配置 Vercel 部署，直接推送到 GitHub 即可自动部署。

### Vercel 配置文件

`vercel.json` 已配置 SPA 路由和静态资源：

```json
{
  "rewrites": [
    { "source": "/policies/:path*", "destination": "/policies/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

##  License

MIT

端口被占用。先杀掉占用的进程：                                                                                                  
                                                                                                                                  
  # 查找占用端口的进程                                                                                                                   
  lsof -ti:3000 | xargs kill -9 2>/dev/null                                                                                              
  lsof -ti:24678 | xargs kill -9 2>/dev/null                                                                                             
                                                                                                                                         
  然后重新启动：                                                                                                                         
                                                                                                                                         
  npm run dev                                                                                                                            
                                                            
  如果你想一次性执行：                                                                                                                   
                                                            
  npx kill-port 3000 24678 && npm run dev                                                                                                
                                                                                                                                         
  或者直接：                                                                                                                             
                                                                                                                                         
  lsof -ti:3000,24678 | xargs kill -9 2>/dev/null; npm run dev                                                                           
                                               
