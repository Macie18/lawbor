import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, PhoneOff, User, ShieldCheck, AlertCircle, ArrowRight, Settings2, Camera, CameraOff, Loader2, Activity, Volume2, VolumeX, FileText, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSpeechDictation } from '../../hooks/useSpeechDictation';
import { useAiSpeakLevel } from '../../hooks/useAiSpeakLevel';
import { cancelBrowserSpeech, ensureVoicesLoaded, isBrowserTtsSupported, speakWithBrowser } from '../../utils/browserTts';
import { llmService, type LLMMessage } from '../../services/llmService';
import { InterviewFloatingOrb } from '../../components/InterviewFloatingOrb';
import { ResumeClinic } from '../../components/ResumeClinic';
import type { ResumeAnalysis } from '../../services/resumeAnalysisService';
import { generateResumePrompt } from '../../services/resumeAnalysisService';

interface InterviewReport {
  score: number;
  /** 面试表现分析，固定 3 条 */
  performanceInsights: string[];
  /** 高情商建议，固定 3 条 */
  suggestions: string[];
  radar: {
    logic: number;
    emotion: number;
    professionalism: number;
    resilience: number;
  };
  transcript: { role: 'user' | 'ai'; text: string }[];
  observations: string[];
}

function tpl(t: (key: string) => string, key: string, vars: Record<string, string | number>): string {
  let s = t(key);
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

function speechErrorMessage(t: (key: string) => string, code: string): string {
  const k = `interview.speech.${code}`;
  const msg = t(k);
  if (msg === k) return tpl(t, 'interview.speech.unknown', { code });
  return msg;
}

function toLLMMessages(transcript: { role: 'user' | 'ai'; text: string }[]): LLMMessage[] {
  return transcript.map((t) => ({
    role: t.role === 'user' ? 'user' : 'assistant',
    content: t.text,
  }));
}

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, max);
}

function padToThree(items: string[], fillers: string[], padChar: string): string[] {
  const out = [...items];
  let i = 0;
  while (out.length < 3 && i < fillers.length) {
    if (!out.includes(fillers[i])) out.push(fillers[i]);
    i++;
  }
  while (out.length < 3) out.push(padChar);
  return out.slice(0, 3);
}

/** 英文报告页：若模型仍返回含较多中文的句子，用英文兜底替换该条，避免界面语言不一致 */
function isPrimarilyChineseText(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  const cjk = (t.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return cjk >= 4 || cjk / t.length > 0.12;
}

function ensureEnglishReportStrings(
  items: string[],
  englishFallbacks: string[],
): string[] {
  return items.map((line, i) =>
    isPrimarilyChineseText(line) ? englishFallbacks[i] ?? englishFallbacks[0] ?? line : line,
  );
}

function parseReportPayload(
  raw: string,
  transcript: { role: 'user' | 'ai'; text: string }[],
  t: (key: string) => string,
  locale: 'zh' | 'en',
): InterviewReport {
  const userMessagesCount = transcript.filter((x) => x.role === 'user').length;
  const totalLength = transcript.reduce((sum, x) => sum + x.text.length, 0);
  const padChar = t('interview.report.dash');

  const fallbackInsights = [
    tpl(t, 'interview.report.fallbackInsight1', { rounds: userMessagesCount, chars: totalLength }),
    t('interview.report.fallbackInsight2'),
    t('interview.report.fallbackInsight3'),
  ];
  const fallbackSuggestions = [
    t('interview.report.fallbackSuggestion1'),
    t('interview.report.fallbackSuggestion2'),
    t('interview.report.fallbackSuggestion3'),
  ];

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    data = {};
  }

  const legacyStrengths = asStringArray(data.strengths, 3);
  const legacyWeaknesses = asStringArray(data.weaknesses, 3);
  const legacyMerged = [...legacyStrengths, ...legacyWeaknesses];

  let insights = asStringArray(data.performanceInsights, 5);
  if (insights.length < 3) {
    const alt = asStringArray(data.performance_analysis, 5);
    if (alt.length) insights = [...insights, ...alt];
  }
  if (insights.length < 3 && legacyMerged.length) {
    insights = [...insights, ...legacyMerged];
  }
  insights = padToThree(insights, fallbackInsights, padChar);

  let suggestions = asStringArray(data.suggestions, 5);
  if (data.eq_suggestions) suggestions = [...suggestions, ...asStringArray(data.eq_suggestions, 5)];
  suggestions = padToThree(suggestions, fallbackSuggestions, padChar);

  if (locale === 'en') {
    insights = ensureEnglishReportStrings(insights, fallbackInsights);
    suggestions = ensureEnglishReportStrings(suggestions, fallbackSuggestions);
  }

  const radarRaw = data.radar as Record<string, unknown> | undefined;
  const num = (k: string, d: number) => {
    const x = radarRaw?.[k];
    const n = typeof x === 'number' ? x : typeof x === 'string' ? parseFloat(x) : NaN;
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
    return d;
  };

  const radar = {
    logic: num('logic', 60),
    emotion: num('emotion', 58),
    professionalism: num('professionalism', 60),
    resilience: num('resilience', 58),
  };

  const scoreRaw = data.score;
  let score =
    typeof scoreRaw === 'number'
      ? scoreRaw
      : typeof scoreRaw === 'string'
        ? parseFloat(scoreRaw)
        : NaN;
  if (!Number.isFinite(score)) score = 60;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    performanceInsights: insights,
    suggestions,
    radar,
    transcript,
    observations: [
      tpl(t, 'interview.report.obsTurns', { n: userMessagesCount }),
      tpl(t, 'interview.report.obsChars', { n: totalLength }),
    ],
  };
}

export default function Interview() {
  const { t, language } = useTranslation();
  const speechLang = language === 'zh' ? 'zh-CN' : 'en-US';

  const [step, setStep] = useState<'setup' | 'call' | 'report'>('setup');
  const [temperament, setTemperament] = useState(50);
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const targetJobTitleRef = useRef('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [ttsOn, setTtsOn] = useState(true);
  const [orbVoiceActive, setOrbVoiceActive] = useState(false);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const voiceSessionActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isThinkingRef = useRef(false);
  
  // 简历相关状态
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const resumeAnalysisRef = useRef<ResumeAnalysis | null>(null);
  const resumeTextRef = useRef<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const transcriptRef = useRef<{ role: 'user' | 'ai'; text: string }[]>([]);
  const speechRef = useRef<ReturnType<typeof useSpeechDictation> | null>(null);
  const handleSendMessageRef = useRef<(text: string) => Promise<void>>(async () => {});

  // 📝 网络状态检测 - Web Speech API 需要网络连接
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  // 简历分析完成回调
  const handleResumeAnalysisComplete = useCallback((analysis: ResumeAnalysis, text: string) => {
    setResumeAnalysis(analysis);
    setResumeText(text);
    resumeAnalysisRef.current = analysis;
    resumeTextRef.current = text;
  }, []);

  /** 连续对话开启且未静音时，才向本页传入麦克风音频（硬件轨道关闭 + 停止识别，浏览器侧无法再拾取本轮流上的声音） */
  useEffect(() => {
    if (step !== 'call' || !streamRef.current) return;
    const allowMic = voiceSessionActive && !isMuted;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = allowMic;
    });
  }, [step, voiceSessionActive, isMuted]);

  const speech = useSpeechDictation({
    onCommit: (text) => {
      if (!text.trim()) return;
      if (!voiceSessionActiveRef.current || isMutedRef.current) return;
      setCurrentInput(text);
      void handleSendMessageRef.current(text);
    },
    onResult: (text) => {
      if (!voiceSessionActiveRef.current || isMutedRef.current) return;
      setCurrentInput(text);
    },
    onError: (code) => {
      console.error('Speech recognition error:', code);
      setError(speechErrorMessage(t, code));
    },
    silenceMs: 2000,
    lang: speechLang,
  });

  speechRef.current = speech;

  const orbEnvelope = useAiSpeakLevel(orbVoiceActive);
  const orbVoiceLevel = !orbVoiceActive
    ? 0
    : Math.min(
        1,
        orbEnvelope * 0.9 + (aiVolume > 12 ? Math.min(1, aiVolume / 130) * 0.18 : 0),
      );

  const scheduleResumeListening = useCallback(() => {
    if (!voiceSessionActiveRef.current || isMutedRef.current) return;
    window.setTimeout(() => {
      if (!voiceSessionActiveRef.current || isMutedRef.current || isThinkingRef.current) return;
      speechRef.current?.start();
    }, 380);
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    transcriptRef.current.push({ role: 'user', text });
    setCurrentInput('');
    setIsThinking(true);

    try {
      const prior: LLMMessage[] = transcriptRef.current
        .slice(0, -1)
        .map(t => ({
          role: t.role === 'user' ? 'user' : 'assistant',
          content: t.text,
        }));

      const aiResponse = await llmService.generateResponse(
        [...prior, { role: 'user', content: text }],
        {
          temperature: temperament,
          role: 'hr',
          scenario: 'law_campus',
          locale: language,
          targetJobTitle: targetJobTitleRef.current.trim() || undefined,
          resumePrompt: resumeAnalysisRef.current
            ? generateResumePrompt(
                resumeAnalysisRef.current,
                language,
                resumeTextRef.current,
              )
            : undefined,
        },
      );

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      transcriptRef.current.push({ role: 'ai', text: aiResponse });

      if (ttsOn && isBrowserTtsSupported()) {
        setOrbVoiceActive(true);
        try {
          await speakWithBrowser(aiResponse, {
            lang: speechLang,
            voiceGender: 'male',
            onStart: () => setAiVolume(100),
            onEnd: () => {
              setAiVolume(0);
              setOrbVoiceActive(false);
            },
            onError: () => {
              setAiVolume(0);
              setOrbVoiceActive(false);
            },
          });
        } catch {
          setAiVolume(0);
          setOrbVoiceActive(false);
        }
      } else {
        setOrbVoiceActive(true);
        window.setTimeout(
          () => setOrbVoiceActive(false),
          Math.min(12000, 900 + aiResponse.length * 48),
        );
      }

      scheduleResumeListening();
    } catch (error) {
      console.error('[API] Response error:', error);
      const msg = error instanceof Error ? error.message : t('interview.error.retry');
      setError(tpl(t, 'interview.error.replyFailed', { msg }));
    } finally {
      setIsThinking(false);
    }
  }, [temperament, ttsOn, scheduleResumeListening, t, speechLang, language]);

  handleSendMessageRef.current = handleSendMessage;

  const startInterview = async () => {
    setIsConnecting(true);
    setStep('call');
    setError(null);
    transcriptRef.current = [];
    setMessages([]);
    setCurrentInput('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: { width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      setupAudioAnalyser(stream);
      setIsConnecting(false);

      voiceSessionActiveRef.current = true;
      setVoiceSessionActive(true);
      window.setTimeout(() => {
        if (voiceSessionActiveRef.current && speechRef.current?.supported) {
          speechRef.current.start();
        }
      }, 650);
    } catch (err) {
      console.error('Media access error:', err);
      setError(err instanceof Error ? err.message : t('interview.error.mediaDenied'));
      setIsConnecting(false);
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg);
      }
      if (step === 'call') {
        animationRef.current = requestAnimationFrame(updateVolume);
      }
    };
    updateVolume();
  };

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  };

  const toggleMicMuted = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        speechRef.current?.cancel();
      } else if (voiceSessionActiveRef.current) {
        window.setTimeout(() => {
          if (
            voiceSessionActiveRef.current &&
            !isMutedRef.current &&
            !isThinkingRef.current
          ) {
            speechRef.current?.start();
          }
        }, 280);
      }
      return next;
    });
  }, []);

  const toggleVoiceConversation = async () => {
    if (voiceSessionActiveRef.current) {
      voiceSessionActiveRef.current = false;
      setVoiceSessionActive(false);
      speech.cancel();
      setError(null);
      return;
    }

    if (!speech.supported) {
      setError(t('interview.error.browserNoSpeech'));
      return;
    }

    if (isThinking) {
      setError(t('interview.error.waitForAi'));
      return;
    }

    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      setError(t('interview.error.micDenied'));
      return;
    }

    voiceSessionActiveRef.current = true;
    setVoiceSessionActive(true);
    setIsMuted(false);
    setError(null);
    if (!speech.listening) {
      speech.start();
    }
  };

  const endCall = async () => {
    voiceSessionActiveRef.current = false;
    setVoiceSessionActive(false);
    setOrbVoiceActive(false);
    speech.cancel();
    cancelBrowserSpeech();
    setIsThinking(false);
    setAiVolume(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setStep('report');
    generateReport();
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    const transcript = [...transcriptRef.current];

    try {
      const messages = toLLMMessages(transcript);
      const raw = await llmService.generateReport(messages, language);
      setReport(parseReportPayload(raw, transcript, t, language));
    } catch (e) {
      console.error('[Interview] generateReport', e);
      setReport(parseReportPayload('{}', transcript, t, language));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    return () => {
      voiceSessionActiveRef.current = false;
      setOrbVoiceActive(false);
      speech.cancel();
      cancelBrowserSpeech();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    void ensureVoicesLoaded();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">{t('interview.title')}</h2>
        <p className="text-slate-500">{t('interview.subtitle')}</p>
      </header>

      {step === 'setup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 📝 网络状态警告 - Web Speech API 依赖网络 */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4"
            >
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-rose-700">{t('interview.setup.offlineTitle')}</span>
                <span className="text-rose-600 ml-1">{t('interview.setup.offlineDesc')}</span>
              </div>
            </motion.div>
          )}
          
          
          {/* 简历诊所区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('resume.title')}</h3>
                <p className="text-sm text-slate-500">{t('resume.subtitle')}</p>
              </div>
            </div>

            <ResumeClinic
              onAnalysisComplete={handleResumeAnalysisComplete}
              compact={false}
            />

            {resumeAnalysis && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                {t('resume.enableInterview')}
              </div>
            )}
          </motion.div>

          {/* 应聘岗位：与简历一并注入面试官上下文 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('interview.setup.targetJobTitle')}</h3>
                <p className="text-sm text-slate-500">{t('interview.setup.targetJobDesc')}</p>
              </div>
            </div>
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => {
                const v = e.target.value;
                setTargetJobTitle(v);
                targetJobTitleRef.current = v;
              }}
              placeholder={t('interview.setup.targetJobPlaceholder')}
              maxLength={120}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </motion.div>

          {/* 面试官性格设置区域 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Settings2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('interview.setup.personalityTitle')}</h3>
                <p className="text-sm text-slate-500">{t('interview.setup.personalityDesc')}</p>
              </div>
            </div>

          <div className="mb-12 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-emerald-600">{t('interview.setup.warmLabel')}</span>
                <span className="text-rose-600">{t('interview.setup.pressureLabel')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={temperament}
                onChange={(e) => setTemperament(parseInt(e.target.value))}
                className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-violet-600"
              />
              <div className="text-center text-3xl font-black text-slate-900">{temperament}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h4 className="mb-2 font-bold text-slate-700">{t('interview.setup.styleHeading')}</h4>
              <p className="text-sm text-slate-500">
                {temperament < 30
                  ? t('interview.setup.styleLow')
                  : temperament < 70
                    ? t('interview.setup.styleMid')
                    : t('interview.setup.styleHigh')}
              </p>
            </div>
          </div>
          </motion.div>

          {/* 开始面试按钮 */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={startInterview}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            {t('interview.start')}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      )}

      {step === 'call' && (
        <div className="relative h-[700px] w-full overflow-hidden rounded-[40px] bg-slate-950 shadow-2xl">
          <AnimatePresence>
            {isConnecting && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white"
              >
                <div className="relative mb-8">
                  <div className="h-24 w-24 animate-ping rounded-full bg-violet-600/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-violet-600 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-black tracking-widest">{t('interview.call.connecting')}</h3>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 top-8 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-rose-500/90 px-6 py-3 text-white shadow-lg"
            >
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <div className="relative flex h-full w-full items-center justify-center bg-slate-900">
            <div className="flex w-full max-w-lg flex-col items-center justify-center py-8">
              <InterviewFloatingOrb voiceLevel={orbVoiceLevel} listeningDim={speech.listening} />
            </div>

            <div className="absolute bottom-32 text-center">
              <h3 className="text-xl font-bold text-white">{t('interview.call.interviewerLabel')}</h3>
              <p className="text-slate-400">
                {isThinking
                  ? t('interview.call.statusThinking')
                  : !voiceSessionActive
                    ? t('interview.call.statusPaused')
                    : speech.listening
                      ? t('interview.call.statusListening')
                      : t('interview.call.statusPreparingListen')}
              </p>
            </div>

            <div className="absolute bottom-32 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl bg-violet-600/60 p-6 text-center text-xl font-medium text-white backdrop-blur-xl border border-white/10"
                  >
                    <Loader2 className="inline h-5 w-5 animate-spin mr-2" />
                    {t('interview.call.preparingReply')}
                  </motion.div>
                )}

                {!isThinking && speech.listening && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl bg-blue-600/60 p-6 text-center text-xl font-medium text-white backdrop-blur-xl border border-white/10"
                  >
                    {speech.liveLine || t('interview.call.listenPlaceholder')}
                  </motion.div>
                )}

                {!isThinking && !speech.listening && messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-3xl bg-black/60 p-6 text-center text-xl font-medium text-white backdrop-blur-xl border border-white/10"
                  >
                    {messages[messages.length - 1].text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute right-8 top-8 h-48 w-64 overflow-hidden rounded-3xl border-2 border-white/20 bg-slate-800 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn("h-full w-full object-cover", isVideoOff && "hidden")}
            />
            {isVideoOff && (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
                <User className="h-12 w-12" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 h-1.5 bg-violet-500 transition-all duration-75" style={{ width: `${Math.min(100, volume * 2)}%` }} />
          </div>

          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full bg-white/10 p-4 backdrop-blur-2xl border border-white/10">
            <button
              type="button"
              onClick={() => void toggleVoiceConversation()}
              disabled={(isThinking && !voiceSessionActive) || isConnecting}
              title={
                voiceSessionActive ? t('interview.voice.titlePause') : t('interview.voice.titleStart')
              }
              className={cn(
                'flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-full px-6 text-sm font-semibold transition-all',
                voiceSessionActive
                  ? speech.listening
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40 animate-pulse'
                    : 'bg-blue-600/90 text-white hover:bg-blue-600'
                  : 'bg-white/15 text-white hover:bg-white/25',
                isThinking && !voiceSessionActive && 'opacity-50 cursor-not-allowed',
              )}
            >
              {voiceSessionActive ? (
                <>
                  {speech.listening ? (
                    <Activity className="h-5 w-5 shrink-0" />
                  ) : (
                    <Mic className="h-5 w-5 shrink-0" />
                  )}
                  <span className="text-left leading-tight">
                    {speech.listening
                      ? t('interview.voice.listeningTapPause')
                      : t('interview.voice.preparingTapPause')}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 shrink-0" />
                  <span>{t('interview.voice.session')}</span>
                </>
              )}
            </button>

            <div className="h-10 w-px bg-white/20" />

            <button
              type="button"
              onClick={toggleMicMuted}
              title={isMuted ? t('interview.mic.unmuteTitle') : t('interview.mic.muteTitle')}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                isMuted ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                isVideoOff ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isVideoOff ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            </button>

            <button
              onClick={() => {
                if (ttsOn) {
                  cancelBrowserSpeech();
                  setAiVolume(0);
                }
                setTtsOn(!ttsOn);
              }}
              disabled={!isBrowserTtsSupported()}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                ttsOn ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
              )}
              title={
                isBrowserTtsSupported()
                  ? ttsOn
                    ? t('interview.tts.offTitle')
                    : t('interview.tts.onTitle')
                  : t('interview.tts.unsupported')
              }
            >
              {ttsOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>

            <div className="h-10 w-px bg-white/20" />

            <button
              onClick={endCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-2xl shadow-rose-900/50 transition-all hover:bg-rose-700 hover:scale-110 active:scale-95"
            >
              <PhoneOff className="h-8 w-8" />
            </button>
          </div>

          <div className="absolute left-8 top-8 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-white">
                {t('interview.status.ready')}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">{t('interview.status.secure')}</span>
            </div>
          </div>
        </div>
      )}

      {step === 'report' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {isGeneratingReport ? (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-[40px] bg-white shadow-xl">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
              <h3 className="text-xl font-bold">{t('interview.report.generatingTitle')}</h3>
              <p className="text-slate-500">{t('interview.report.generatingSub')}</p>
            </div>
          ) : report && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl">
                  <h3 className="mb-6 text-2xl font-bold">{t('interview.report.performanceTitle')}</h3>
                  <ul className="space-y-4">
                    {report.performanceInsights.map((line, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl">
                  <h3 className="mb-6 text-2xl font-bold">{t('interview.report.suggestionsTitle')}</h3>
                  <div className="space-y-4">
                    {report.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                          {i + 1}
                        </div>
                        <p className="text-slate-600">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[40px] border border-slate-200 bg-white p-8 text-center shadow-xl">
                  <div className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                    {t('interview.report.scoreLabel')}
                  </div>
                  <div className="text-7xl font-black text-blue-600">{report.score}</div>
                  <div className="mt-4 text-sm font-medium text-slate-500">
                    {t('interview.report.scoreMax')}
                  </div>
                </div>

                <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl">
                  <h3 className="mb-6 font-bold">{t('interview.report.radarTitle')}</h3>
                  <div className="space-y-4">
                    {(Object.entries(report.radar) as [keyof InterviewReport['radar'], number][]).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>{t(`interview.radar.${key}`)}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            className="h-full bg-blue-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep('setup')}
                  className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800"
                >
                  {t('interview.report.restart')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}