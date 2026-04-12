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
                                               

                                      

 ### 启动开发服务器
     ...
      65   
      66  访问 http://localhost:5173
      67   
      68 +### 杀掉占用端口的进程                                                                                                      
      69 +                                                                                                                            
      70 +如果端口被占用，先杀掉进程：                                                                                                
      71 +                                                                                                                            
      72 +```bash                                                                                                                     
      73 +# 查找占用端口的进程                                                                                                        
      74 +lsof -ti:3000 | xargs kill -9 2>/dev/null                                                                                   
      75 +lsof -ti:5173 | xargs kill -9 2>/dev/null                                                                                   
      76 +                                                                                                                            
      77 +# 或者一次性杀掉多个端口                                                                                                    
      78 +npx kill-port 3000 5173 && npm run dev                                                                                      
      79 +                                                                                                                            
      80 +# 或者直接                                                                                                                  
      81 +lsof -ti:3000,5173 | xargs kill -9 2>/dev/null; npm run dev                                                                 
      82 +```                                                                                                                         
      83 +                                                                                                                            
      84  ### 构建生产版本
      85   
      86  ```bash
     ...
       73   
       74  ---
       75   
       76 +## 推送代码到 GitHub                                                                                                       
       77 +                                                                                                                           
       78 +### 提交更改                                                                                                               
       79 +                                                                                                                           
       80 +```bash                                                                                                                    
       81 +# 查看更改状态                                                                                                             
       82 +git status                                                                                                                 
       83 +                                                                                                                           
       84 +# 添加需要提交的文件                                                                                                       
       85 +git add src/pages/KnowledgeCards.tsx                                                                                       
       86 +                                                                                                                           
       87 +# 提交更改                                                                                                                 
       88 +git commit -m "feat: 添加知识卡片中英文双语支持"                                                                           
       89 +                                                                                                                           
       90 +# 推送到远程                                                                                                               
       91 +git push                                                                                                                   
       92 +```                                                                                                                        
       93 +                                                                                                                           
       94 +### 如果远程有更新需要先 pull                                                                                              
       95 +                                                                                                                           
       96 +```bash                                                                                                                    
       97 +# 先 stash 本地更改                                                                                                        
       98 +git stash                                                                                                                  
       99 +                                                                                                                           
      100 +# 拉取远程更新                                                                                                             
      101 +git pull --rebase                                                                                                          
      102 +                                                                                                                           
      103 +# 恢复本地更改                                                                                                             
      104 +git stash pop                                                                                                              
      105 +                                                                                                                           
      106 +# 推送                                                                                                                     
      107 +git push                                                                                                                   
      108 +```                                                                                                                        
      109 +                                                                                                                           
      110 +---                                                                                                                        
      111 +                                                                                                                           
      112  ## 项目结构
      113   
      114  ```
     ...
      87  │   ├── Arbitration/       # 劳动仲裁
      88  │   └── Interview/         # AI 面试模拟
      89  ├── services/
      90 -│   └── llmService.ts      # AI 服务封装                                                                                    
      90 +│   ├── llmService.ts      # DeepSeek AI 服务封装                                                                           
      91 +│   └── contractReviewService.ts # 合同审查服务 (Dify API)                                                                  
      92  ├── components/            # 公共组件
      93  └── public/
      94      └── policies/          # 城市政策文件
     ...
       95   
       96  ---
       97   
       98 +## 合同审查功能说明                                                                                                        
       99 +                                                                                                                           
      100 +### 支持格式                                                                                                               
      101 +- PDF 文件（文字版，非扫描版）                                                                                             
      102 +- DOCX 文件                                                                                                                
      103 +                                                                                                                           
      104 +### 工作流程                                                                                                               
      105 +1. 用户上传合同文件 (PDF/DOCX)                                                                                             
      106 +2. 前端提取文件文字内容                                                                                                    
      107 +3. 调用 Dify AI Agent API 分析合同                                                                                         
      108 +4. 返回风险评估结果（高/中/低风险）                                                                                        
      109 +                                                                                                                           
      110 +### 风险等级                                                                                                               
      111 +- **高风险 (high)**: 严重违法，需立即关注                                                                                  
      112 +- **中风险 (medium)**: 存在风险，建议谈判                                                                                  
      113 +- **低风险 (low)**: 关注点，有改进空间                                                                                     
      114 +                                                                                                                           
      115 +---                                                                                                                        
      116 +                                                                                                                           
      117 +## AI 对话功能说明                                                                                                         
      118 +                                                                                                                           
      119 +### 工作流程                                                                                                               
      120 +1. 用户发送消息                                                                                                            
      121 +2. 前端调用 DeepSeek API                                                                                                   
      122 +3. 返回 AI 回答                                                                                                            
      123 +                                                                                                                           
      124 +### 配置                                                                                                                   
      125 +确保 `.env` 文件中有 `VITE_DEEPSEEK_API_KEY`                                                                               
      126 +                                                                                                                           
      127 +---                                                                                                                        
      128 +                                       