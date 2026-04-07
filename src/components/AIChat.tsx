import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Paperclip, ShieldCheck, Loader2, MapPin, ExternalLink, Star } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { useTranslation } from '../contexts/TranslationContext';

const genAI = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  cards?: Array<{
    title: string;
    uri: string;
    rating?: number;
    address?: string;
  }>;
  isLocationRequest?: boolean;
}

export default function AIChat() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'model', text: t('chat.welcome') }]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setMessages(prev => [...prev, { role: 'model', text: t('chat.locationError') }]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(newLocation);
        setMessages(prev => [
          ...prev, 
          { role: 'system', text: language === 'zh' ? '已获取位置权限' : 'Location permission granted' }
        ]);
        // After getting location, we could automatically re-trigger the search
        // but for simplicity, we'll let the user ask again or just use it for the next message
      },
      (error) => {
        console.error('Location Error:', error);
        setMessages(prev => [...prev, { role: 'model', text: t('chat.locationError') }]);
      }
    );
  };

  const handleSend = async (overrideInput?: string) => {
    const userMessage = overrideInput || input.trim();
    if (!userMessage && !overrideInput) return;
    if (loading) return;

    if (!overrideInput) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    // Detect intent for nearby legal institutions
    const locationKeywords = ['附近', '法律援助', '法院', '律所', '机构', 'nearby', 'legal aid', 'court', 'law firm', 'institution'];
    const hasLocationIntent = locationKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    if (hasLocationIntent && !location) {
      setLoading(false);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: t('chat.locationRequest'),
        isLocationRequest: true 
      }]);
      return;
    }

    try {
      const model = 'gemini-3-flash-preview';
      const systemPrompt = language === 'zh' 
        ? "你是一个专业的中国劳动法律助手，名叫 Lawbor。请基于中国劳动法提供专业、准确、客观的建议。如果用户想找附近的法律机构，请使用 Google Maps 工具。如果问题涉及法律程序，请提醒用户咨询专业律师。"
        : "You are a professional Chinese labor law assistant named Lawbor. Please provide professional, accurate, and objective advice based on Chinese labor law. If the user wants to find nearby legal institutions, use the Google Maps tool. If the question involves legal procedures, please remind the user to consult a professional lawyer.";
      
      const config: any = {
        tools: hasLocationIntent ? [{ googleMaps: {} }] : [],
      };

      if (hasLocationIntent && location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        };
      }

      const result = await genAI.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt} 用户问题：${userMessage}` }] },
        ],
        config
      });

      const responseText = result.text || (language === 'zh' ? '抱歉，我暂时无法回答这个问题。' : 'Sorry, I cannot answer this question at the moment.');
      
      // Extract grounding chunks for cards
      const cards: Message['cards'] = [];
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.maps) {
            cards.push({
              title: chunk.maps.title,
              uri: chunk.maps.uri,
              address: chunk.maps.address,
              rating: chunk.maps.rating
            });
          }
        });
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText, cards: cards.length > 0 ? cards : undefined }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMsg = language === 'zh' ? '抱歉，连接助手时出现错误，请稍后再试。' : 'Sorry, an error occurred while connecting to the assistant. Please try again later.';
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

                      {msg.isLocationRequest && (
                        <button
                          onClick={requestLocation}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                        >
                          <MapPin className="h-3 w-3" />
                          {t('chat.locationAllow')}
                        </button>
                      )}

                      {msg.cards && (
                        <div className="mt-4 grid gap-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('chat.nearbyResults')}
                          </p>
                          {msg.cards.map((card, idx) => (
                            <a
                              key={idx}
                              href={card.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-400 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                                  {card.title}
                                </h4>
                                <ExternalLink className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-600" />
                              </div>
                              {card.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                  <span className="text-[10px] font-medium text-slate-500">{card.rating}</span>
                                </div>
                              )}
                              {card.address && (
                                <p className="text-[10px] text-slate-400 line-clamp-2">
                                  {card.address}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
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
