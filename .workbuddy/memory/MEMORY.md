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

## 模拟面试 TTS 实现（2026-04-14）
- 使用浏览器内置 Web Speech API（完全免费，无需网络）
- 语音选择：自动筛选中文和英文语音，优先选择男声
- macOS 用户推荐：Grandpa、Eddy、Reed、Rocko
- Windows 用户推荐：云扬、云希、云健等微软神经语音
- 功能：语音列表加载、试听、面试对话语音播放
- 实现文件：
  - `src/utils/browserTts.ts` - 浏览器语音封装
  - `src/pages/Interview/index.tsx` - UI 集成

## 用户偏好
- 用户需要详细的代码注释和清晰的修改说明
- 偏好使用图例标注（✅ 新增、📝 修改、🗑️ 删除）

## 税务计算器增强功能（2026-04-13）

### 修复职业资格继续教育逻辑
- 新增 `professionalCertMonth` 字段（取得证书月份）
- 扣除计算：按剩余月份分摊，而非全年12个月
- 示例：6月取得证书，扣除7个月（7-12月）

### 多收入来源计算
- **劳务报酬**：按20%/30%/40%预扣率计算
- **稿酬**：按70%计入收入，适用20%税率
- **特许权使用费**：按20%预扣率计算
- 前端展示预扣税额实时计算

### 年度汇算清缴
- 对比预缴税额与年度应纳税额
- 计算应补/应退税额
- 综合所有收入来源进行年度汇总
- 前端新增「年度汇算」Tab，包含完整的输入和结果展示

### PDF报告导出增强
- 支持导出其他收入来源明细
- 包含年度汇算清缴详细结果
- 动态章节编号（根据是否有其他收入调整）
- 应补/应退税额可视化展示

### 技术实现
- 新增类型：`OtherIncome`, `AnnualSettlementInput`, `AnnualSettlementResult`
- 新增计算函数：`calculateLaborTax`, `calculateRoyaltyTax`, `calculateFranchiseTax`, `calculateOtherIncomeTaxable`, `calculateAnnualSettlement`
- 前端状态管理：`otherIncome`, `settlementInput`, `settlementResult`
- 国际化：新增相关翻译键值

## 企业风险查询功能增强（2026-04-14）

### 功能优化
- **劳动纠纷数据来源**：从两个来源提取（立案信息 + 司法文书）
  - 立案信息：包含案号、案由、当事人、立案日期
  - 司法文书：额外包含裁判结果、裁判日期、涉案金额
- **数据合并策略**：优先使用司法文书数据（信息更完整），立案信息作为补充

### 前端显示优化
- **收起状态**：显示案件来源标识（已判决/立案中）、原告被告、裁判结果简要
- **展开状态**：完整显示裁判结果、裁判日期、涉案金额、案件状态
- **案件状态标识**：
  - 已判决（紫色标签）：司法文书中有裁判结果的案件
  - 立案中（灰色标签）：仅立案信息，无裁判结果

### 技术实现细节
- **后端**：`server.ts` 中实现劳动纠纷提取和合并逻辑
  - `parseParties()` - 解析当事人JSON字符串
  - `isLaborDispute()` - 判断是否为劳动纠纷（关键词匹配）
  - 合并逻辑：优先司法文书，立案信息去重补充
- **前端**：`src/pages/CompanyRiskPage.tsx` - 企业风险查询主页面
  - 收起状态：案号 + 案由 + 状态标识 + 原告被告 + 裁判结果简要
  - 展开状态：完整裁判结果、裁判日期、涉案金额等
- **类型定义**：`src/services/qccService.ts`
  - `LaborDispute` 接口新增 `judgmentResult?` 和 `judgmentDate?` 字段

### 关键教训
- **确认正确的文件**：修改前务必确认哪个组件正在使用（通过路由配置查找）
- **浏览器缓存**：前端修改后需强制刷新（Cmd+Shift+R / Ctrl+Shift+F5）
- **调试方法**：使用 Network 标签查看实际 API 响应数据

## 企业风险查询前端优化（2026-04-14）

### 显示优化
- **收起状态**：删除裁判结果显示，只显示案号、案由、状态标识、原告被告
- **展开状态**：新增"争议焦点"字段（蓝色背景卡片），使用案由作为争议焦点
- **新增字段**：立案日期（filingDate）在涉案金额之后显示

### 显示字段完整性
- ✅ 案号（caseNo）
- ✅ 案由/案件类型（caseType/caseReason）- 作为争议焦点
- ✅ 状态标识（已判决/立案中）
- ✅ 原告（plaintiff）
- ✅ 被告（defendant）
- ✅ 涉案金额（amount）
- ✅ 立案日期（filingDate）- 新增
- ✅ 案件状态（caseStatus）- 通常为"-"
- ✅ 裁判结果（judgmentResult）- 仅在展开状态显示
- ✅ 裁判日期（judgmentDate）- 仅在展开状态显示

## 合同审查页面企业风险显示优化（2026-04-14）

### 功能增强
- **CompanyRiskDisplay 组件优化**：与 CompanyRiskPage 显示方式一致
- **收起状态**：案号 + 案由 + 状态标识 + 原告被告（删除裁判结果显示）
- **展开状态**：争议焦点 + 原告被告 + 涉案金额 + 立案日期 + 裁判结果 + 裁判日期

### 技术实现
- 修改文件：`src/components/CompanyRiskDisplay.tsx`
- 删除收起状态的裁判结果显示
- 展开状态第一项显示"争议焦点"（使用案由）
- 新增立案日期显示（在涉案金额之后）
- 优化样式和布局