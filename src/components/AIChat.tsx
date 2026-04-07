import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, ShieldCheck, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { useTranslation } from '../contexts/TranslationContext';
import { llmService, LLMMessage } from '../services/llmService';

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

export default function AIChat() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'model', text: t('chat.welcome') }]);
  }, [language]);

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
          role: m.role as 'user' | 'assistant',
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 transition-transform hover:scale-110 active:scale-95"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

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
                      <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
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
              <p className="mt-2 text-center text-[10px] text-slate-400">
                {t('chat.disclaimer')}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}