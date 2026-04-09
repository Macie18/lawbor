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

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

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

  useEffect(() => {
    setMessages([{ role: 'model', text: t('chat.welcome') }]);
  }, [language]);

  // 处理从外部传入的初始消息
  useEffect(() => {
    if (isOpen && initialMessage) {
      handleSend(initialMessage);
      setInitialMessage(''); // 清空初始消息
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);


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

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-300/50 transition-all hover:scale-110 active:scale-95"
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
        aria-label={language === 'zh' ? 'AI助手' : 'AI Assistant'}
      >
        <MessageSquare className="h-7 w-7" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">{t('app.name')} AI {language === 'zh' ? '助手' : 'Assistant'}</h3>
                  <p className="text-xs opacity-80">{language === 'zh' ? '在线法律咨询' : 'Online Legal Consultation'}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
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
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[90%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {msg.role === 'system' ? (
                    <div className="mx-auto my-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-400">
                      {msg.text}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm",
                        msg.role === 'user'
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none"
                      )}
                    >
                      {(() => {
  const text = msg.text;
  
  // 1. 使用正则表达式匹配所有的路由跳转和地图导航标签
  const routeMatches = Array.from(text.matchAll(/\[跳转:([^|]+)\|([^\]]+)\]/g));
  const mapMatches = Array.from(text.matchAll(/\[地图导航:([^\]]+)\]/g));
  
  // 2. 从展示给用户的纯文本中抹除这些标签
  const cleanText = text
    .replace(/\[跳转:[^\]]+\]/g, '')
    .replace(/\[地图导航:[^\]]+\]/g, '');

  return (
    <div className="flex flex-col gap-3">
      {/* 渲染干净的文本 */}
      <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown>
      </div>
      
      {/* 动态渲染所有的【功能跳转】卡片 */}
      {routeMatches.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {routeMatches.map((match, idx) => (
            <button
              key={`route-${idx}`}
              onClick={() => {
                setIsOpen(false); // 点击后自动收起聊天框
                navigate(match[1]); // 路由跳转到对应功能区
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 w-fit text-left shadow-sm border border-blue-100"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {match[2]}
            </button>
          ))}
        </div>
      )}

      {/* 动态渲染所有的【地图导航】卡片 */}
      {mapMatches.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {mapMatches.map((match, idx) => (
            <button
              key={`map-${idx}`}
              onClick={() => {
                // 利用高德地图通用 Web API 唤起搜索
                const keyword = encodeURIComponent(match[1]);
                window.open(`https://uri.amap.com/search?keyword=${keyword}`, '_blank');
              }}
              className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 w-fit text-left shadow-sm border border-emerald-100"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              在地图上查找: {match[1]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
})()}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">{t('chat.thinking')}</span>
                </div>
              )}
            </div>

            <footer className="border-t p-4">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button onClick={() => handleSend()} className="text-blue-600 hover:text-blue-700">
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <p>{t('chat.disclaimer')}</p>
                {user && (
                  <p className="flex items-center gap-1">
                    <History className="h-3 w-3" />
                    {language === 'zh' ? '已登录' : 'Logged in'}
                  </p>
                )}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}