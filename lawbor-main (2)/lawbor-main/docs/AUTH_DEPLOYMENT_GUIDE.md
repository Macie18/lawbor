# Lawbor 用户认证系统部署指南

本文档详细说明如何配置和部署基于 Supabase 的用户认证系统。

## 📋 目录

1. [前置要求](#前置要求)
2. [Supabase 项目设置](#supabase-项目设置)
3. [数据库初始化](#数据库初始化)
4. [环境变量配置](#环境变量配置)
5. [本地开发](#本地开发)
6. [生产部署](#生产部署)
7. [功能说明](#功能说明)
8. [常见问题](#常见问题)

---

## 前置要求

- Node.js 18+ 已安装
- 一个 Supabase 账户(免费版即可)
- Git 已配置

---

## Supabase 项目设置

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "New Project"
3. 填写项目信息:
   - **Name**: `lawbor-production`
   - **Database Password**: 设置一个强密码(请保存好)
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或最接近的区域
4. 点击 "Create new project",等待项目创建完成(约 2 分钟)

### 2. 获取 API 密钥

项目创建完成后:

1. 进入项目仪表板
2. 点击左侧菜单 "Settings" (齿轮图标)
3. 点击 "API"
4. 记录以下信息:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: 一个长的 JWT token

---

## 数据库初始化

### 方法一: 使用 SQL Editor(推荐)

1. 在 Supabase 控制台,点击左侧菜单 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行 SQL

### 方法二: 使用命令行

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 关联项目(使用你的项目 ID)
supabase link --project-ref your-project-id

# 推送数据库迁移
supabase db push
```

### 验证数据库表

执行 SQL 后,在 "Table Editor" 中应该看到以下表:

- ✅ `conversation_history` - AI 对话历史
- ✅ `contract_reviews` - 合同审查记录
- ✅ `tax_calculations` - 税务计算记录
- ✅ `knowledge_card_favorites` - 知识卡片收藏

---

## 环境变量配置

### 本地开发环境

1. 复制环境变量模板:
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local`,添加 Supabase 配置:
```env
# Supabase 配置
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# 其他配置(保持不变)
GEMINI_API_KEY="your-gemini-api-key"
VITE_DEEPSEEK_API_KEY="your-deepseek-api-key"
APP_URL="http://localhost:3000"
```

### 生产环境(Vercel)

1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加以下变量:
   - `VITE_SUPABASE_URL`: 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 anon key
4. 点击 "Save"
5. 重新部署项目

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000),你应该能在导航栏看到 "登录" 按钮。

### 测试流程

1. **注册账户**:
   - 点击 "登录" 按钮
   - 点击 "立即注册"
   - 输入邮箱和密码(至少 6 位)
   - 提交注册
   - 检查邮箱收验证邮件(Supabase 会发送确认邮件)

2. **邮箱验证**(开发环境可选):
   - 在 Supabase 控制台 "Authentication" > "Users"
   - 手动确认用户邮箱

3. **登录测试**:
   - 使用注册的邮箱和密码登录
   - 登录后应显示用户菜单(邮箱地址和用户名)

---

## 生产部署

### Supabase 生产配置

1. **配置邮件模板**:
   - Settings > Authentication > Email Templates
   - 自定义确认邮件、密码重置邮件

2. **配置 CORS**:
   - Settings > API > CORS
   - 添加你的生产域名(如 `https://lawbor.vercel.app`)

3. **启用额外登录方式**(可选):
   - Settings > Authentication > Providers
   - 启用 Google、GitHub 等社交登录

### Vercel 部署

```bash
# 构建项目
npm run build

# 部署到 Vercel
vercel --prod
```

### 验证部署

部署完成后:

1. 访问生产 URL
2. 测试注册和登录功能
3. 检查数据是否正确保存到 Supabase
4. 测试数据持久化(刷新页面后数据应保留)

---

## 功能说明

### 已实现功能

✅ **用户认证**
- 邮箱/密码注册
- 邮箱验证
- 登录/登出
- 密码重置

✅ **数据持久化**
- AI 对话历史保存
- 合同审查记录保存
- 税务计算记录保存
- 知识卡片收藏

✅ **安全特性**
- Row Level Security (RLS) 策略
- 用户数据隔离
- API 密钥保护

### 待集成功能

⚠️ **需要手动集成**:
- AI 对话历史展示和加载
- 合同审查记录列表
- 税务计算历史记录
- 知识卡片收藏功能

详细集成步骤请参考: [docs/AUTH_INTEGRATION_GUIDE.md](./AUTH_INTEGRATION_GUIDE.md)

---

## 常见问题

### Q: 注册后收不到验证邮件?

**A**: 检查垃圾邮件文件夹。开发环境可以:
1. 在 Supabase 控制台手动确认用户
2. 或禁用邮箱验证: Settings > Authentication > Email auth > 取消勾选 "Enable email confirmations"

### Q: 登录后看不到历史数据?

**A**: 确认:
1. 数据库表已正确创建
2. RLS 策略已启用
3. 用户 ID 正确关联(user_id 字段)

### Q: 如何查看数据库数据?

**A**: 在 Supabase 控制台:
1. 点击 "Table Editor"
2. 选择对应表
3. 可以查看、编辑、导出数据

### Q: 如何添加管理员功能?

**A**: Supabase 支持自定义角色:
```sql
-- 创建管理员角色
CREATE ROLE admin;

-- 授予管理员额外权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
```

### Q: 数据量超出免费额度怎么办?

**A**: Supabase 免费版包含:
- 500MB 数据库存储
- 5GB 带流量
- 无限 API 请求

超出后可升级 Pro 计划($25/月)或优化数据存储。

### Q: 如何备份数据?

**A**: Supabase Pro 计划提供自动备份。免费版可以:
1. 使用 SQL 导出: `pg_dump` 命令
2. 定期导出表数据为 CSV

---

## 技术支持

- **Supabase 文档**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **项目 Issues**: 在 GitHub 提交 Issue

---

## 更新日志

### v1.0.0 (2026-04-09)
- ✅ 初始版本
- ✅ 用户认证系统
- ✅ 数据持久化基础架构
- ✅ 安全策略配置

---

**祝你部署顺利!** 🎉