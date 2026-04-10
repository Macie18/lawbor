import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useRef } from 'react';

// Logo 图片路径配置
const LOGOS = {
  contract: '/images/合同审查.png',
  knowledgeCard: '/images/知识卡片.png',
  welfareGuide: '/images/福利指南.png',
  arbitration: '/images/劳动仲裁.png',
  salaryCalc: '/images/计算器.png',
  mockInterview: '/images/模拟面试.png',
};

const FeatureSection = ({
  title,
  name,
  description,
  isReversed,
  logo,
  animation
}: {
  title: string;
  name: string;
  description: string;
  isReversed?: boolean;
  logo: string;
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
            {/* 前置小标题 - 灰色小字 */}
            <p className="text-slate-500 text-base font-normal">
              {title}
            </p>
            {/* 主标题带Logo */}
            <h3 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <span>{name}</span>
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

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


// 全局悬浮窗组件
const FloatingButton = () => {
  const navigate = useNavigate(); // 👈 新增这一行：初始化路由跳转钩子

  return (
    <div
      className="fixed top-6 right-6 z-[9999]"
    >
      <button
        onClick={() => navigate('/dashboard')}
        className="rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
        style={{ backgroundColor: "#107191" }}
      >
        进入APP主页
      </button>
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const targetRef = useRef(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // 滚动到功能板块的函数
  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* 全局悬浮窗 */}
      <FloatingButton />


      {/* Hero Section */}
      <section ref={targetRef} className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20 overflow-hidden">
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 999999,
        padding: 5
      }}>
        <img
          src="/images/app-logo.png"
          alt="LOGO"
          style={{ width: '100px', height: 'auto' }}
        />
      </div>
        {/* Notion-style Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,#eff6ff_0%,#ffffff_100%)]" />

        <motion.div
          style={{ opacity, scale }}
          className="text-center max-w-4xl"
        >
          {/* 主标题 - 黑色大号粗体 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 text-6xl font-black tracking-tight text-slate-900 sm:text-8xl"
          >
            守护职场第一步
          </motion.h1>

          {/* 副标题2 - 灰色小号字体 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-slate-500"
          >
            不再做职场小白，用科技消除信息差，重塑新锐劳动者权益
          </motion.p>

          {/* 按钮组 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {/* 主按钮 */}
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-3 rounded-2xl px-10 py-5 text-xl font-bold text-white transition-all hover:shadow-2xl active:scale-95"
              style={{ backgroundColor: '#107191' }}
            >
              立即接入AI助手
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </button>
            {/* 锚点按钮 - 极简样式 */}
            <button
              onClick={scrollToFeatures}
              className="rounded-2xl px-10 py-5 text-xl font-normal text-slate-600 transition-all hover:text-slate-900 active:scale-95"
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
        </div>
      </section>

      {/* Features Section */}
      <div ref={featuresRef} className="relative">

        {/* ✅ 模块1：劳动合同审查 */}
        <FeatureSection
          title="劳动合同审查"
          name="合同天眼 一键扫坑"
          description="担心合同存在对己不利的条款？逐字扫描试用期、薪资、社保、违约金、竞业限制，所有风险当场高亮，帮你充分了解自己的合同情况。"
          logo={LOGOS.contract}
          animation={
            <div className="relative flex flex-col items-center gap-4">
              {/* 第1阶段：合同纸张展开 */}
              <motion.div
                initial={{ scaleY: 0.3, opacity: 0 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="h-48 w-36 rounded-lg bg-white shadow-xl border border-slate-100 p-4 origin-bottom"
              >
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-3/4 bg-slate-100 rounded" />
                  {/* 第2阶段：红色警示标记闪烁 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1, backgroundColor: ["#f1f5f9", "#fee2e2", "#fee2e2", "#f1f5f9"] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.9 }}
                    className="h-2 w-full rounded"
                  />
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded" />
                </div>
              </motion.div>
              {/* 第3阶段：绿色盾牌弹出 */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.4, duration: 0.4 }}
                animate={{ scale: [1, 1.2, 1] }}
                className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg"
              >
                <ShieldCheck className="h-6 w-6" />
              </motion.div>
              {/* 第4阶段：一键通过文字 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.8, duration: 0.3 }}
                className="text-emerald-600 font-bold text-sm"
              >
                一键通过
              </motion.div>
            </div>
          }
        />

        {/* ✅ 模块2：模拟面试 */}
        <FeatureSection
          title="模拟面试"
          name="AI搭子 24小时在线"
          description="想要在面试前进行预演？担心自己的表达不够专业？通过和智能助手视频对话，缓解你的面试焦虑，为获得offer增添筹码。"
          isReversed
          logo={LOGOS.mockInterview}
          animation={
            <div className="space-y-4 w-64">
              {/* 第1阶段：用户气泡浮现 */}
              <motion.div
                initial={{ x: -20, opacity: 0, y: 20 }}
                whileInView={{ x: 0, opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white p-4 rounded-2xl rounded-bl-none shadow-lg border border-slate-100 text-sm text-slate-600"
              >
                面试时如何谈薪资待遇？
              </motion.div>
              {/* 第2阶段：AI气泡浮现 */}
              <motion.div
                initial={{ x: 20, opacity: 0, y: 20 }}
                whileInView={{ x: 0, opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-blue-600 p-4 rounded-2xl rounded-br-none shadow-lg text-sm text-white flex items-start gap-3"
              >
                {/* 第3阶段：AI头像呼吸动效 */}
                <motion.div
                  animate={{ scale: [1, 1.02, 1, 0.98, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0"
                >
                  <Sparkles className="h-3 w-3" />
                </motion.div>
                <div>
                  面试谈薪资时，建议先了解市场行情，再结合自身能力...
                </div>
              </motion.div>
            </div>
          }
        />

        {/* ✅ 模块3：税务薪资计算器 */}
        <FeatureSection
          title="税务薪资计算器"
          name="薪资清算师"
          description="税前税后？加班费？补偿金？个税？别被公司算迷糊！输入数字，一秒出结果，工资明明白白，绝不被套路。"
          logo={LOGOS.salaryCalc}
          animation={
            <div className="grid grid-cols-3 gap-3 p-6 bg-white rounded-3xl shadow-2xl border border-slate-100">
              {/* 第1阶段：按键跳动 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0 }}
                  whileInView={{ y: [-5, 0, -5, 0] }}
                  viewport={{ once: true }}
                  transition={{
                    delay: (i - 1) * 0.03,
                    duration: 0.3,
                  }}
                  className="h-12 w-12 rounded-xl border border-slate-100 flex items-center justify-center font-bold text-slate-900 bg-white"
                >
                  {i}
                </motion.div>
              ))}
              {/* 第2/3阶段：数字滚动和结果高亮 */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.4 }}
                animate={{ backgroundColor: ["#ffffff", "#3b82f6", "#3b82f6"] }}
                className="col-span-3 mt-4 h-12 rounded-xl flex items-center justify-center text-white font-bold"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  ¥ 12,500.00
                </motion.span>
              </motion.div>
            </div>
          }
        />

        {/* ✅ 模块4：知识卡片 */}
        <FeatureSection
          title="知识卡片"
          name="职场法眼 秒懂权益"
          description="劳动法太晦涩？我们把它拆成年轻人看得懂的卡片！试用期、加班、离职、赔偿…… 随手一翻，你就是职场懂法达人。"
          isReversed
          logo={LOGOS.knowledgeCard}
          animation={
            <div className="flex items-center justify-center -space-x-12">
              {/* 第1阶段：卡片散开 */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, opacity: 0, rotate: 0 }}
                  whileInView={{ x: (i - 2) * 30, opacity: 1, rotate: (i - 2) * 10 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0 + (i - 1) * 0.05, duration: 0.5 }}
                  className="h-56 w-40 rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 flex flex-col justify-between"
                >
                  {/* 第2阶段：翻页动效 */}
                  <motion.div
                    className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ delay: 0.5 + (i - 1) * 0.2, duration: 1, repeat: 1 }}
                  >
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </motion.div>
                  {/* 第3阶段：知识点弹出高亮 */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.5 + (i - 1) * 0.1, duration: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-2/3 bg-blue-100 rounded" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          }
        />

        {/* ✅ 模块5：劳动仲裁帮助 */}
        <FeatureSection
          title="劳动仲裁帮助"
          name="维权冲锋队"
          description="被欠薪？被辞退？别怕，我们帮你写文书、算赔偿、理证据、走流程，全程陪跑，让你维权不孤单、不迷茫、不妥协。"
          logo={LOGOS.arbitration}
          animation={
            <div className="relative flex flex-col items-center w-full h-full bg-[#cfe4f6]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-110 w-110 object-contain"
              >
                <source src="/images/劳动仲裁视频2.mp4" type="video/mp4" />
              </video>
            </div>
          }
        />

        {/* ✅ 模块6：福利政策指南 */}
        <FeatureSection
          title="福利政策指南"
          name="应届生补贴雷达"
          description="五险一金、公积金住房贷款、失业金领取、租房补贴、人才补贴、就业扶持、社保减免…… 一键匹配城市政策，手把手教你如何申领！"
          isReversed
          logo={LOGOS.welfareGuide}
          animation={
            <div className="relative flex flex-col items-center w-full h-full bg-[#cfe4f6]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-110 w-110 object-contain"
              >
                <source src="/images/福利政策指南.mp4" type="video/mp4" />
              </video>
            </div>
          }
        />
      </div>

      {/* Mission Statement - 模块8：团队宣言 */}
      <section className="bg-white py-32 sm:py-48">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-5xl"
          >
            {/* 字号50%，楷体，非斜体，字重400，行高1.5 */}
            <h2
              className="text-slate-900 leading-[1.5] font-normal"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                fontFamily: 'KaiTi, STKaiti, serif'
              }}
            >
              「我们和你一样，在初入社会时感到迷茫与无力。开发这个产品的初衷很简单:我们希望科技不只是资本的效率工具,更能成为保护弱者的坚固盾牌。愿你的才华不被剥削,愿你的青春不被辜负。」
            </h2>
          </motion.div>
        </div>
      </section>

      {/* 模块9：生态聚合图 - 环形布局 */}
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
    {/* 👇 只保留图片，无蓝色框，图片更大 */}
    <img
      src="/images/app-logo.png"
      alt="中心图标"
      className="h-28 w-28 object-contain"
    />
  </motion.div>

            {/* Orbiting Elements - 六大功能环形布局 */}
            {[
              { label: "AI问答", logo: LOGOS.mockInterview },
              { label: "薪资计算", logo: LOGOS.salaryCalc },
              { label: "仲裁帮助", logo: LOGOS.arbitration },
              { label: "合同审查", logo: LOGOS.contract },
              { label: "政策匹配", logo: LOGOS.welfareGuide },
              { label: "模拟面试", logo: LOGOS.knowledgeCard },
            ].map((item, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const radius = 130;
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
                  <div className="h-20 w-20 rounded-2xl bg-white shadow-xl border border-slate-50 flex items-center justify-center overflow-hidden">
                    <img src={item.logo} alt={item.label} className="h-12 w-12 object-contain" />
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