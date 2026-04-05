import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  MapPin, 
  Scale, 
  Calculator, 
  MessageSquare, 
  Play, 
  ArrowRight,
  Sparkles,
  Heart
} from 'lucide-react';
import { useRef } from 'react';

const FeatureSection = ({ 
  title, 
  name, 
  description, 
  isReversed, 
  icon: Icon,
  animation
}: { 
  title: string; 
  name: string; 
  description: string; 
  isReversed?: boolean;
  icon: any;
  animation: React.ReactNode;
}) => {
  return (
    <section className="py-24 sm:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className={`flex flex-col items-center gap-16 lg:flex-row ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-600">
              <Icon className="h-4 w-4" />
              <span>{title}</span>
            </div>
            <h3 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {name}
            </h3>
            <p className="text-xl leading-relaxed text-slate-500 max-w-xl">
              {description}
            </p>
          </motion.div>

          {/* Media Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex-1 w-full"
          >
            <div className="aspect-[16/10] w-full rounded-[2.5rem] bg-slate-100 shadow-2xl shadow-slate-200 flex items-center justify-center overflow-hidden group">
              {/* Placeholder for Video/Image */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100" />
              
              {/* Animation Layer */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {animation}
              </div>

              {/* Play Overlay */}
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110">
                  <Play className="h-8 w-8 fill-slate-900 text-slate-900 ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section ref={targetRef} className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Notion-style Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,#eff6ff_0%,#ffffff_100%)]" />
        
        <motion.div 
          style={{ opacity, scale }}
          className="text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-2 text-sm font-bold text-blue-600 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>2026 届毕业生职场守护计划</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8 text-6xl font-black tracking-tight text-slate-900 sm:text-8xl"
          >
            守护职场第一步，<br />
            <span className="bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              重塑新锐劳动者权益
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-slate-500 sm:text-2xl"
          >
            不再做职场小白。你的全天候 AI 法律智囊，用科技消除信息差，让每一份合同都透明，每一次劳动都获得应有尊重。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-xl font-bold text-white transition-all hover:bg-slate-800 hover:shadow-2xl active:scale-95"
            >
              立即接入 AI 助手
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              className="rounded-2xl border-2 border-slate-200 bg-white px-10 py-5 text-xl font-bold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              了解我们的使命
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Elements for Hero */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[10%] top-[20%] h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center"
          >
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[15%] top-[30%] h-12 w-12 rounded-xl bg-white shadow-lg flex items-center justify-center"
          >
            <Calculator className="h-6 w-6 text-indigo-600" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <div className="relative">
        <FeatureSection 
          title="劳动合同审查"
          name="合同天眼・一键扫坑"
          description="别让一份烂合同毁了你第一份工作！AI 逐字扫描试用期、薪资、社保、违约金、竞业限制，所有陷阱当场高亮，给你最硬的签约底气。"
          icon={FileText}
          animation={
            <div className="relative flex flex-col items-center gap-4">
              <motion.div 
                initial={{ rotateX: 45, y: 50, opacity: 0 }}
                whileInView={{ rotateX: 0, y: 0, opacity: 1 }}
                className="h-48 w-36 rounded-lg bg-white shadow-xl border border-slate-100 p-4"
              >
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-3/4 bg-slate-100 rounded" />
                  <motion.div 
                    animate={{ backgroundColor: ["#f1f5f9", "#fee2e2", "#f1f5f9"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-2 w-full rounded" 
                  />
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <motion.div 
                    animate={{ backgroundColor: ["#f1f5f9", "#dcfce7", "#f1f5f9"] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="h-2 w-1/2 rounded" 
                  />
                </div>
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"
              >
                <ShieldCheck className="h-6 w-6" />
              </motion.div>
            </div>
          }
        />

        <FeatureSection 
          title="知识卡片"
          name="职场法眼・秒懂权益"
          description="劳动法太晦涩？我们把它拆成年轻人看得懂的卡片！试用期、加班、离职、赔偿…… 随手一翻，你就是职场懂法达人。"
          isReversed
          icon={CreditCard}
          animation={
            <div className="flex items-center justify-center -space-x-12">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: 100, opacity: 0, rotate: 10 }}
                  whileInView={{ x: 0, opacity: 1, rotate: (i - 2) * 10 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-56 w-40 rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 flex flex-col justify-between"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-2/3 bg-blue-100 rounded" />
                  </div>
                </motion.div>
              ))}
            </div>
          }
        />

        <FeatureSection 
          title="福利政策指南"
          name="应届生补贴雷达"
          description="你应得的钱，一分都不能少！租房补贴、人才补贴、就业扶持、社保减免…… 一键匹配城市政策，手把手教你领到爽。"
          icon={MapPin}
          animation={
            <div className="relative">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="h-40 w-40 rounded-3xl bg-white shadow-2xl flex items-center justify-center text-6xl"
              >
                🎁
              </motion.div>
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-20, -150],
                    x: [0, (i - 3) * 40],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.4,
                    ease: "easeOut"
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
                >
                  {i % 2 === 0 ? '💰' : '✨'}
                </motion.div>
              ))}
            </div>
          }
        />

        <FeatureSection 
          title="劳动仲裁帮助"
          name="维权冲锋队・全程陪跑"
          description="被欠薪？被辞退？被侵权？别怕！我们帮你写文书、算赔偿、理证据、走流程，让你维权不孤单、不迷茫、不妥协。"
          isReversed
          icon={Scale}
          animation={
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-48 w-48 rounded-full border-4 border-slate-100 flex items-center justify-center"
              >
                <Scale className="h-24 w-24 text-slate-900" />
              </motion.div>
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="absolute -bottom-4 bg-white px-6 py-2 rounded-full shadow-xl border border-slate-100 text-sm font-bold text-slate-900"
              >
                法律守护中
              </motion.div>
            </div>
          }
        />

        <FeatureSection 
          title="税务薪资计算器"
          name="薪资清算师・算清每一分"
          description="税前税后？加班费？补偿金？个税？别被公司算迷糊！输入数字，一秒出结果，工资明明白白，绝不被套路。"
          icon={Calculator}
          animation={
            <div className="grid grid-cols-3 gap-3 p-6 bg-white rounded-3xl shadow-2xl border border-slate-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    backgroundColor: i === 5 ? ["#ffffff", "#3b82f6", "#ffffff"] : "#ffffff",
                    color: i === 5 ? ["#0f172a", "#ffffff", "#0f172a"] : "#0f172a"
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="h-12 w-12 rounded-xl border border-slate-100 flex items-center justify-center font-bold"
                >
                  {i}
                </motion.div>
              ))}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="col-span-3 mt-4 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold"
              >
                ¥ 12,500.00
              </motion.div>
            </div>
          }
        />

        <FeatureSection 
          title="智能助手问答"
          name="AI 法律搭子・24 小时在线"
          description="有问题随时问！不用查法条、不用找律师，你的随身职场法务，随叫随到，有问必答，靠谱又安心。"
          isReversed
          icon={MessageSquare}
          animation={
            <div className="space-y-4 w-64">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="bg-white p-4 rounded-2xl rounded-bl-none shadow-lg border border-slate-100 text-sm text-slate-600"
              >
                试用期被辞退有补偿吗？
              </motion.div>
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-600 p-4 rounded-2xl rounded-br-none shadow-lg text-sm text-white flex items-start gap-3"
              >
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div>
                  根据《劳动合同法》，试用期内用人单位需证明你不符合录用条件...
                </div>
              </motion.div>
            </div>
          }
        />
      </div>

      {/* Mission Statement */}
      <section className="bg-slate-50 py-32 sm:py-48">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-5xl"
          >
            <Heart className="mx-auto mb-12 h-16 w-16 text-blue-600 opacity-20" />
            <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-6xl italic">
              「我们曾和你一样，在初入社会时感到迷茫与无力。开发这个产品的初衷很简单：我们希望科技不只是资本的效率工具，更能成为保护弱者的坚固盾牌。愿你的才华不被剥削，愿你的青春不被辜负。」
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Ecosystem Map */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-24 text-4xl font-black text-slate-900 sm:text-6xl">
            一切能力，汇聚于此
          </h2>
          
          <div className="relative h-[600px] w-full flex items-center justify-center">
            {/* Central AI Icon */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0px rgba(37, 99, 235, 0.1)",
                  "0 0 0 40px rgba(37, 99, 235, 0)",
                  "0 0 0 0px rgba(37, 99, 235, 0.1)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="z-10 h-40 w-40 rounded-[40px] bg-white shadow-2xl flex items-center justify-center border border-blue-50"
            >
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Orbiting Elements */}
            {[
              { icon: FileText, label: "合同审查", color: "text-blue-600" },
              { icon: CreditCard, label: "知识卡片", color: "text-indigo-600" },
              { icon: MapPin, label: "补贴雷达", color: "text-emerald-600" },
              { icon: Scale, label: "仲裁帮助", color: "text-rose-600" },
              { icon: Calculator, label: "薪资计算", color: "text-amber-600" },
              { icon: MessageSquare, label: "AI 问答", color: "text-violet-600" },
            ].map((item, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const radius = 250;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={i}
                  animate={{ 
                    x: [x - 10, x + 10, x - 10],
                    y: [y - 10, y + 10, y - 10]
                  }}
                  transition={{ 
                    duration: 4 + i, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute flex flex-col items-center gap-3"
                  style={{ left: `calc(50% + ${x}px - 40px)`, top: `calc(50% + ${y}px - 40px)` }}
                >
                  <div className="h-20 w-20 rounded-2xl bg-white shadow-xl border border-slate-50 flex items-center justify-center">
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">{item.label}</span>
                </motion.div>
              );
            })}

            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 h-full w-full -z-10 opacity-10">
              <circle cx="50%" cy="50%" r="250" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" />
            </svg>
          </div>

          <p className="mt-24 text-xl text-slate-500 max-w-2xl mx-auto">
            无需在不同软件间跳转，所有法律赋能，尽在你的掌控之中。
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#2563eb_0%,transparent_70%)]" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="mb-12 text-5xl font-black tracking-tight sm:text-7xl">
            准备好开启你的职场第一步了吗？
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-2xl bg-white px-12 py-6 text-2xl font-black text-slate-900 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            免费开始使用
          </button>
        </div>
      </section>

      <footer className="border-t py-12 text-center text-slate-400">
        <div className="container mx-auto px-6">
          <p className="text-sm">© 2026 Lawbor. 守护职场第一步。</p>
        </div>
      </footer>
    </div>
  );
}

