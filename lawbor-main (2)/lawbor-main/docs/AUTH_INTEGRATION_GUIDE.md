# 用户认证数据持久化集成指南（详细版）

本文档提供**逐行级**的集成步骤，清楚标注每个改动。

**图例说明**：
- ✅ **新增** = 需要添加的新代码
- 📝 **修改** = 需要修改的现有代码
- 🗑️ **删除** = 需要删除的旧代码
- ✨ **保留** = 保持不变

---

## 1. AI 对话历史集成

### 文件：`src/components/AIChat.tsx`

#### 步骤 1.1：添加导入语句（文件开头）

**找到第 1-13 行**：

```typescript
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// 👇 新增 ExternalLink 和 MapPin 图标
import { MessageSquare, X, Send, ShieldCheck, Loader2, ExternalLink, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { useTranslation } from '../contexts/TranslationContext';
import { llmService, LLMMessage } from '../services/llmService';
// 👇 新增引入路由跳转钩子
import { useNavigate } from 'react-router-dom';
// 👇 新增引入全局状态
import { useAIChat } from '../contexts/AIChatContext';
```

**替换为**：

```typescript
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, ShieldCheck, Loader2, ExternalLink, MapPin, History, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { useTranslation } from '../contexts/TranslationContext';
import { llmService, LLMMessage } from '../services/llmService';
import { useNavigate } from 'react-router-dom';
import { useAIChat } from '../contexts/AIChatContext';
// ✅ 新增：导入认证和数据持久化 Hook
import { useAuth } from '../contexts/AuthContext';
import { useConversationHistory } from '../hooks/useConversationHistory';
```

---

#### 步骤 1.2：修改组件内部逻辑（第 20-87 行）

**找到第 20-27 行**：

```typescript
export default function AIChat() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { isOpen, setIsOpen, initialMessage, setInitialMessage } = useAIChat();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
```

**替换为**：

```typescript
export default function AIChat() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { isOpen, setIsOpen, initialMessage, setInitialMessage } = useAIChat();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // ✅ 新增：用户认证和对话历史状态
  const { user } = useAuth();
  const { 
    conversations, 
    createConversation, 
    updateConversation, 
    deleteConversation 
  } = useConversationHistory();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
```

---

#### 步骤 1.3：修改 handleSend 函数（第 47-87 行）

**找到第 47 行的 `const handleSend = async (overrideInput?: string) => {`**

**整个函数替换为**：

```typescript
  const handleSend = async (overrideInput?: string) => {
    const userMessage = overrideInput || input.trim();
    if (!userMessage && !overrideInput) return;
    if (loading) return;

    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const systemPrompt = language === 'zh'
        ? "你是一个专业的中国劳动法律助手，名叫 Lawbor。请基于中国劳动法提供专业、准确、客观的建议。回答要简洁、有帮助。"
        : "You are a professional Chinese labor law assistant named Lawbor. Please provide professional, accurate, and objective advice based on Chinese labor law. Keep your answers concise and helpful.";

      const historyMessages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'model' ? 'assistant' : (m.role as 'user' | 'assistant'),
          content: m.text
        })),
        { role: 'user', content: userMessage }
      ];

      const responseText = await llmService.generateResponse(historyMessages, {
        temperature: 50,
        role: 'lawyer',
        scenario: 'consultation'
      });

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      // ✅ 新增：保存对话历史到数据库（仅登录用户）
      if (user) {
        const allMessages = [
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.text,
            timestamp: new Date().toISOString()
          })),
          { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() },
          { role: 'assistant' as const, content: responseText, timestamp: new Date().toISOString() }
        ];
        
        if (!currentConversationId) {
          // 创建新对话
          const conversation = await createConversation(
            userMessage.slice(0, 50) + '...',
            allMessages
          );
          setCurrentConversationId(conversation?.id || null);
        } else {
          // 更新现有对话
          await updateConversation(currentConversationId, allMessages);
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMsg = language === 'zh'
        ? '抱歉，连接助手时出现错误，请确保已配置 DeepSeek API Key。'
        : 'Sorry, an error occurred. Please ensure DeepSeek API Key is configured.';
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };
```

---

#### 步骤 1.4：添加历史对话加载函数（在 handleSend 后面新增）

**在第 87 行后添加**：

```typescript
  // ✅ 新增：加载历史对话
  const loadHistoryConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        text: m.content
      })));
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };

  // ✅ 新增：开始新对话
  const startNewConversation = () => {
    setMessages([{ role: 'model', text: t('chat.welcome') }]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  // ✅ 新增：删除历史对话
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm(language === 'zh' ? '确定删除这个对话吗？' : 'Delete this conversation?')) {
      await deleteConversation(conversationId);
      if (currentConversationId === conversationId) {
        startNewConversation();
      }
    }
  };
```

---

#### 步骤 1.5：修改 JSX 渲染部分（在 header 后面）

**找到第 129 行（`</header>` 后面）**：

```typescript
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
```

**替换为**：

```typescript
            </header>

            {/* ✅ 新增：历史对话面板 */}
            {user && conversations.length > 0 && (
              <div className="border-b border-gray-200 bg-slate-50">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {language === 'zh' ? '历史对话' : 'History'}
                  </span>
                  <span className="text-xs text-slate-500">({conversations.length})</span>
                </button>
                
                {showHistory && (
                  <div className="max-h-48 overflow-y-auto border-t border-gray-200">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => loadHistoryConversation(conv.id)}
                        className={cn(
                          "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100",
                          currentConversationId === conv.id && "bg-blue-100"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{conv.title}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="ml-2 p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={startNewConversation}
                      className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 text-center"
                    >
                      {language === 'zh' ? '+ 新对话' : '+ New Chat'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
```

---

#### 步骤 1.6：修改底部提示（可选）

**找到第 239-241 行**：

```typescript
              <p className="mt-2 text-center text-[10px] text-slate-400">
                {t('chat.disclaimer')}
              </p>
```

**替换为**：

```typescript
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <p>{t('chat.disclaimer')}</p>
                {user && (
                  <p className="flex items-center gap-1">
                    <History className="h-3 w-3" />
                    {language === 'zh' ? '已登录' : 'Logged in'}
                  </p>
                )}
              </div>
```

---

## 2. 合同审查记录集成

### 文件：`src/pages/ContractReview.tsx`

由于这个文件较长，我只标注需要添加的关键部分。

#### 步骤 2.1：添加导入（文件开头）

**在现有导入语句后添加**：

```typescript
// ✅ 新增：导入认证和数据持久化 Hook
import { useAuth } from '../contexts/AuthContext';
import { useContractReviews } from '../hooks/useContractReviews';
```

---

#### 步骤 2.2：在组件内部添加状态

**找到组件函数开头（大约第 50 行），添加**：

```typescript
export default function ContractReview() {
  const { t, language } = useTranslation();
  
  // ✅ 新增：用户认证和审查记录状态
  const { user } = useAuth();
  const { reviews, saveReview, deleteReview, loading: reviewsLoading } = useContractReviews();
  
  // ... 原有的其他状态
```

---

#### 步骤 2.3：在审查完成后保存记录

**找到审查完成的处理函数（可能在 handleReview 或类似的函数中），在返回结果前添加**：

```typescript
  // 假设你的审查完成逻辑类似这样：
  const handleReviewComplete = async (result: ContractReviewResult) => {
    // ... 原有的审查完成逻辑
    
    // ✅ 新增：保存审查记录（仅登录用户）
    if (user && fileName && result) {
      await saveReview(
        fileName,
        contractType || 'unknown',
        JSON.stringify(result)
      );
    }
    
    return result;
  };
```

---

#### 步骤 2.4：在 JSX 中添加历史记录展示

**在页面底部（return 语句中），添加**：

```typescript
      {/* ✅ 新增：历史审查记录列表（仅登录用户显示） */}
      {user && reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            {language === 'zh' ? '历史审查记录' : 'Review History'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{review.contract_name}</h3>
                    <p className="text-sm text-gray-600">{review.contract_type}</p>
                  </div>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={language === 'zh' ? '删除' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
```

---

## 3. 税务计算记录集成

### 文件：`src/pages/TaxCalculator.tsx`

#### 步骤 3.1：添加导入

```typescript
// ✅ 新增：导入认证和数据持久化 Hook
import { useAuth } from '../contexts/AuthContext';
import { useTaxCalculations } from '../hooks/useTaxCalculations';
import { History, Trash2 } from 'lucide-react';
```

---

#### 步骤 3.2：在组件内部添加状态

```typescript
export default function TaxCalculator() {
  const { t, language } = useTranslation();
  
  // ✅ 新增：用户认证和计算记录状态
  const { user } = useAuth();
  const { calculations, saveCalculation, deleteCalculation } = useTaxCalculations();
  
  // ... 原有的其他状态
```

---

#### 步骤 3.3：在计算完成后保存记录

**找到计算函数（可能叫 handleCalculate 或类似），在计算结果生成后添加**：

```typescript
  const handleCalculate = () => {
    // ... 原有的计算逻辑
    
    const taxAmount = calculateTax(grossIncome, deductions);
    const netIncome = grossIncome - deductions - taxAmount;
    
    // ✅ 新增：保存计算记录（仅登录用户）
    if (user) {
      saveCalculation(
        incomeType,
        grossIncome,
        deductions,
        taxAmount,
        netIncome
      );
    }
    
    // ... 原有的显示结果逻辑
  };
```

---

#### 步骤 3.4：在 JSX 中添加历史记录展示

```typescript
      {/* ✅ 新增：历史计算记录列表（仅登录用户显示） */}
      {user && calculations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            {language === 'zh' ? '历史计算记录' : 'Calculation History'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calculations.map(calc => (
              <div key={calc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{calc.income_type}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-600">
                        {language === 'zh' ? '税前收入' : 'Gross'}: ¥{calc.gross_income.toLocaleString()}
                      </p>
                      <p className="text-gray-600">
                        {language === 'zh' ? '扣除额' : 'Deductions'}: ¥{calc.deductions.toLocaleString()}
                      </p>
                      <p className="text-orange-600 font-medium">
                        {language === 'zh' ? '税费' : 'Tax'}: ¥{calc.tax_amount.toLocaleString()}
                      </p>
                      <p className="text-green-600 font-bold">
                        {language === 'zh' ? '税后收入' : 'Net Income'}: ¥{calc.net_income.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCalculation(calc.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={language === 'zh' ? '删除' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(calc.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
```

---

## 4. 知识卡片收藏集成

### 文件：`src/pages/KnowledgeCards.tsx`

#### 步骤 4.1：添加导入

```typescript
// ✅ 新增：导入认证和收藏 Hook
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { Heart } from 'lucide-react';
```

---

#### 步骤 4.2：在组件内部添加状态

```typescript
export default function KnowledgeCards() {
  const { t, language } = useTranslation();
  
  // ✅ 新增：用户认证和收藏状态
  const { user } = useAuth();
  const { favorites, isFavorited, toggleFavorite } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // ✅ 新增：根据收藏状态筛选卡片
  const filteredCards = showFavoritesOnly
    ? cards.filter(card => isFavorited(card.id))
    : cards;
  
  // ... 原有的其他状态
```

---

#### 步骤 4.3：在卡片渲染中添加收藏按钮

**找到卡片渲染部分，在每个卡片的适当位置添加收藏按钮**：

```typescript
            <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6">
              {/* ✅ 新增：收藏按钮（右上角） */}
              {user && (
                <button
                  onClick={() => toggleFavorite(card.id, card.title, card.category)}
                  className={cn(
                    "absolute top-4 right-4 p-2 rounded-full transition-all",
                    isFavorited(card.id)
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                  title={isFavorited(card.id) 
                    ? (language === 'zh' ? '取消收藏' : 'Unfavorite')
                    : (language === 'zh' ? '收藏' : 'Favorite')
                  }
                >
                  <Heart className={cn(
                    "h-5 w-5",
                    isFavorited(card.id) && "fill-current"
                  )} />
                </button>
              )}
              
              {/* 卡片内容... */}
            </div>
```

---

#### 步骤 4.4：添加收藏筛选按钮

**在卡片列表上方添加**：

```typescript
      {/* ✅ 新增：收藏筛选按钮（仅登录用户显示） */}
      {user && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowFavoritesOnly(false)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              !showFavoritesOnly
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {language === 'zh' ? '全部卡片' : 'All Cards'}
          </button>
          <button
            onClick={() => setShowFavoritesOnly(true)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              showFavoritesOnly
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Heart className="h-4 w-4" />
            {language === 'zh' ? '我的收藏' : 'My Favorites'}
            {favorites.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      )}
```

---

## 5. 重要提示

### ✅ 确认清单

在集成前，请确认：

1. **Supabase 配置正确**：
   - `.env.local` 已填写 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
   - 数据库表已创建（运行 `supabase-schema.sql`）

2. **认证系统工作**：
   - 启动项目后能看到 "登录" 按钮
   - 注册和登录功能正常

3. **类型安全**：
   - 所有新增代码已导入正确的类型
   - TypeScript 编译无错误

### ⚠️ 注意事项

1. **数据持久化仅对登录用户生效**
   - 所有保存逻辑都包含 `if (user)` 检查
   - 未登录用户功能不受影响

2. **错误处理**
   - Hook 已包含错误处理，但建议在关键操作添加 try-catch
   - 可以在控制台查看错误信息

3. **性能优化**
   - 历史记录默认显示最近 10 条，可添加分页
   - 使用 `useMemo` 优化列表渲染

---

## 6. 测试步骤

### 测试 AI 对话历史：

1. 登录账户
2. 发送一条消息给 AI
3. 刷新页面，点击 "历史对话"
4. 应该能看到刚才的对话记录

### 测试合同审查：

1. 登录账户
2. 上传合同并完成审查
3. 滚动到页面底部
4. 应该能看到历史审查记录卡片

### 测试税务计算：

1. 登录账户
2. 输入收入数据并计算
3. 页面底部应显示历史计算记录

### 测试知识卡片收藏：

1. 登录账户
2. 点击卡片右上角的心形图标
3. 点击 "我的收藏" 筛选按钮
4. 应该只显示已收藏的卡片

---

## 7. 常见问题

**Q: 编译错误 "Cannot find module '../hooks/useXXX'"**

A: 确认 Hook 文件已创建在正确位置：
- `src/hooks/useConversationHistory.ts`
- `src/hooks/useContractReviews.ts`
- `src/hooks/useTaxCalculations.ts`
- `src/hooks/useFavorites.ts`

**Q: 登录后看不到历史记录**

A: 检查：
1. 数据库表是否创建成功
2. RLS 策略是否启用
3. 浏览器控制台是否有错误

**Q: 收藏按钮不显示**

A: 确认：
1. 用户已登录
2. `useAuth()` 和 `useFavorites()` 正确调用
3. `isFavorited()` 函数已定义

---

**集成完成后，所有用户数据都会自动保存到 Supabase，实现跨设备同步！** 🎉