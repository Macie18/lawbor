# Lawbor 项目长期记忆

## 项目技术栈
- 前端：React 19 + TypeScript + Vite + Tailwind CSS
- UI 组件：Ant Design + Lucide React + Framer Motion
- 后端：Express.js + WebSocket
- AI 服务：DeepSeek API + Gemini API
- 数据库：Supabase（用户认证和数据持久化）
- 部署：Vercel

## 核心功能模块
1. **AI 对话助手** - 法律咨询服务
2. **合同审查** - 智能合同风险识别
3. **税务计算** - 个人所得税计算器
4. **知识卡片** - 劳动法知识库
5. **仲裁指南** - 劳动仲裁流程指导
6. **福利政策指南** - 上海福利政策查询
7. **模拟面试** - 求职面试练习

## 用户认证系统（2026-04-09）
- 使用 Supabase 实现用户认证
- 支持邮箱/密码注册登录
- Row Level Security (RLS) 保证数据安全
- 数据持久化：对话历史、审查记录、计算记录、知识卡片收藏
- 环境变量配置统一在 `.env.local`

## 数据库表结构
- `conversation_history` - AI 对话历史
- `contract_reviews` - 合同审查记录
- `tax_calculations` - 税务计算记录
- `knowledge_card_favorites` - 知识卡片收藏

## 重要配置文件
- `.env.local` - 本地环境变量（不提交 Git）
- `.env.example` - 环境变量模板（提交 Git）
- `supabase-schema.sql` - 数据库初始化脚本
- `vercel.json` - Vercel 部署配置

## 国际化
- 支持中文/英文双语
- 使用 `TranslationContext` 管理语言切换
- 所有页面已适配双语

## 用户偏好
- 用户需要详细的代码注释和清晰的修改说明
- 偏好使用图例标注（✅ 新增、📝 修改、🗑️ 删除）