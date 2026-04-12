const PptxGenJS = require('pptxgenjs');

// 创建演示文稿
const pptx = new PptxGenJS();

// 📝 配色方案 - Ocean Gradient（专业、信任、稳定）
const colors = {
  primary: '065A82',      // 深海蓝
  secondary: '1C7293',    // 青色
  accent: '02C39A',       // 薄荷绿
  dark: '21295C',         // 深色背景
  light: 'F2F2F2',        // 浅色背景
  white: 'FFFFFF',
  text: '2C3E50',         // 正文颜色
  textLight: 'FFFFFF'     // 浅色文字
};

// 📝 全局设置
pptx.author = 'Lawbor Team';
pptx.title = 'Lawbor - 劳动者权益守护平台';
pptx.subject = '项目技术方案与功能介绍';
pptx.company = 'Lawbor';

// ===== 幻灯片 1：封面 =====
let slide1 = pptx.addSlide();
slide1.background = { color: colors.dark };

// Logo图标 - 双手托举样式
slide1.addText('🤝', {
  x: 0,
  y: 0.8,
  w: '100%',
  h: 0.8,
  fontSize: 48,
  align: 'center'
});

// 标题
slide1.addText('Lawbor', {
  x: 0.5,
  y: 1.8,
  w: '100%',
  h: 1.2,
  fontSize: 72,
  fontFace: 'Georgia',
  color: colors.white,
  bold: true,
  align: 'center'
});

// 副标题
slide1.addText('劳动者权益守护平台', {
  x: 0.5,
  y: 3.0,
  w: '100%',
  h: 0.6,
  fontSize: 28,
  fontFace: 'Arial',
  color: colors.accent,
  align: 'center'
});

// 标语
slide1.addText('重塑新锐劳动者权益，让每一位职场新人都能懂法、用法、维权', {
  x: 1,
  y: 4.0,
  w: '100%',
  h: 0.5,
  fontSize: 16,
  fontFace: 'Arial',
  color: colors.white,
  align: 'center',
  transparency: 30
});

// 底部信息
slide1.addText('技术方案与功能介绍 | 2026', {
  x: 0.5,
  y: 5.2,
  w: '100%',
  h: 0.3,
  fontSize: 12,
  fontFace: 'Arial',
  color: colors.white,
  align: 'center',
  transparency: 50
});

// ===== 幻灯片 2：品牌故事 =====
let slide2 = pptx.addSlide();
slide2.background = { color: colors.white };

slide2.addText('品牌故事：Lawbor 命名巧思', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 36,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

// Logo展示区
slide2.addShape(pptx.ShapeType.rect, {
  x: 0.5,
  y: 1.2,
  w: 3.5,
  h: 3.5,
  fill: { color: colors.dark },
  rectRadius: 0.2
});

slide2.addText('Lawbor', {
  x: 0.5,
  y: 1.8,
  w: 3.5,
  h: 0.8,
  fontSize: 36,
  fontFace: 'Georgia',
  color: colors.white,
  bold: true,
  align: 'center'
});

slide2.addText('🤝', {
  x: 0.5,
  y: 2.7,
  w: 3.5,
  h: 1.0,
  fontSize: 64,
  align: 'center'
});

slide2.addText('劳友记', {
  x: 0.5,
  y: 3.7,
  w: 3.5,
  h: 0.5,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.accent,
  align: 'center'
});

// 命名巧思三个维度
const brandStories = [
  { num: '01', title: 'Labor Law 化用', desc: 'Lawbor = Labor（劳动）+ Law（法律）\n巧妙融合劳动法核心，传递专业与温暖' },
  { num: '02', title: '好伙计的谐音', desc: 'Lawbor 听起来像"老伙计"\n我们是值得信赖的职场伙伴，陪伴成长' },
  { num: '03', title: '双手托举的Logo', desc: 'Logo中的"w"设计成双手样式\n象征"劳友记"——我们一起用手托举\n每一位即将步入职场的小伙伴' }
];

brandStories.forEach((story, i) => {
  const yPos = 1.2 + i * 1.2;
  
  // 编号圆圈
  slide2.addShape(pptx.ShapeType.ellipse, {
    x: 4.5,
    y: yPos,
    w: 0.6,
    h: 0.6,
    fill: { color: colors.accent }
  });
  
  slide2.addText(story.num, {
    x: 4.5,
    y: yPos + 0.1,
    w: 0.6,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Georgia',
    color: colors.white,
    bold: true,
    align: 'center'
  });
  
  // 标题
  slide2.addText(story.title, {
    x: 5.3,
    y: yPos,
    w: 4.5,
    h: 0.5,
    fontSize: 20,
    fontFace: 'Arial',
    color: colors.primary,
    bold: true
  });
  
  // 描述
  slide2.addText(story.desc, {
    x: 5.3,
    y: yPos + 0.55,
    w: 4.5,
    h: 0.6,
    fontSize: 13,
    fontFace: 'Arial',
    color: '666666'
  });
});

// 品牌理念
slide2.addShape(pptx.ShapeType.rect, {
  x: 0.5,
  y: 4.8,
  w: 9.5,
  h: 0.8,
  fill: { color: colors.light },
  line: { color: colors.accent, width: 2 },
  rectRadius: 0.1
});

slide2.addText('💡 品牌理念：We 劳友记，用手托举每一位职场新人，让懂法、用法、维权不再困难', {
  x: 0.7,
  y: 4.95,
  w: 9.1,
  h: 0.5,
  fontSize: 14,
  fontFace: 'Arial',
  color: colors.text,
  align: 'center'
});

// ===== 幻灯片 3：项目背景 =====
let slide3 = pptx.addSlide();
slide3.background = { color: colors.white };

slide3.addText('项目背景', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

const painPoints = [
  { title: '合同陷阱频发', desc: '试用期过长、薪资模糊、违约金不公', icon: '⚠️' },
  { title: '法律知识薄弱', desc: '劳动者对自身权益了解不足', icon: '📚' },
  { title: '维权成本高昂', desc: '律师费用高、流程复杂、周期长', icon: '💰' },
  { title: '政策信息分散', desc: '各地补贴政策难以查找和匹配', icon: '🔍' }
];

painPoints.forEach((point, i) => {
  const yPos = 1.2 + i * 1.1;
  
  slide3.addShape(pptx.ShapeType.ellipse, {
    x: 0.8,
    y: yPos,
    w: 0.8,
    h: 0.8,
    fill: { color: colors.secondary }
  });
  
  slide3.addText(point.icon, {
    x: 0.8,
    y: yPos + 0.15,
    w: 0.8,
    h: 0.5,
    fontSize: 24,
    align: 'center'
  });
  
  slide3.addText(point.title, {
    x: 1.8,
    y: yPos,
    w: 3,
    h: 0.4,
    fontSize: 20,
    fontFace: 'Arial',
    color: colors.text,
    bold: true
  });
  
  slide3.addText(point.desc, {
    x: 1.8,
    y: yPos + 0.45,
    w: 4,
    h: 0.3,
    fontSize: 14,
    fontFace: 'Arial',
    color: '666666'
  });
});

slide3.addShape(pptx.ShapeType.rect, {
  x: 6.5,
  y: 1.2,
  w: 3,
  h: 3.8,
  fill: { color: colors.light },
  line: { color: colors.secondary, width: 2 }
});

slide3.addText('市场数据', {
  x: 6.7,
  y: 1.4,
  w: 2.6,
  h: 0.4,
  fontSize: 18,
  fontFace: 'Arial',
  color: colors.primary,
  bold: true
});

const stats = [
  { num: '70%', label: '职场新人不懂劳动法' },
  { num: '60%', label: '合同存在风险条款' },
  { num: '85%', label: '不知道如何维权' }
];

stats.forEach((stat, i) => {
  slide3.addText(stat.num, {
    x: 6.7,
    y: 2.0 + i * 1.0,
    w: 2.6,
    h: 0.5,
    fontSize: 32,
    fontFace: 'Georgia',
    color: colors.accent,
    bold: true
  });
  
  slide3.addText(stat.label, {
    x: 6.7,
    y: 2.5 + i * 1.0,
    w: 2.6,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: '666666'
  });
});

// ===== 幻灯片 4：核心功能 =====
let slide4 = pptx.addSlide();
slide4.background = { color: colors.white };

slide4.addText('核心功能模块', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

const features = [
  { title: '合同天眼', desc: 'AI逐字扫描合同，识别试用期、薪资、社保等陷阱', icon: '📄' },
  { title: '职场法眼', desc: '劳动法知识卡片，常见问题一查便知', icon: '👁️' },
  { title: '补贴雷达', desc: '一键匹配城市政策，租房、人才、就业补贴', icon: '📡' },
  { title: '维权冲锋队', desc: '劳动仲裁全程陪跑，写文书、算赔偿', icon: '⚖️' },
  { title: '薪资清算师', desc: '税前税后、加班费、补偿金计算', icon: '💰' },
  { title: 'AI法律搭子', desc: '24小时在线法律问答助手', icon: '🤖' }
];

features.forEach((feature, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  const xPos = 0.5 + col * 3.2;
  const yPos = 1.2 + row * 2.0;
  
  slide4.addShape(pptx.ShapeType.rect, {
    x: xPos,
    y: yPos,
    w: 3.0,
    h: 1.8,
    fill: { color: colors.light },
    line: { color: colors.secondary, width: 1 },
    rectRadius: 0.1
  });
  
  slide4.addShape(pptx.ShapeType.ellipse, {
    x: xPos + 0.2,
    y: yPos + 0.2,
    w: 0.6,
    h: 0.6,
    fill: { color: colors.accent }
  });
  
  slide4.addText(feature.icon, {
    x: xPos + 0.2,
    y: yPos + 0.25,
    w: 0.6,
    h: 0.5,
    fontSize: 20,
    align: 'center'
  });
  
  slide4.addText(feature.title, {
    x: xPos + 0.9,
    y: yPos + 0.3,
    w: 2.0,
    h: 0.4,
    fontSize: 18,
    fontFace: 'Arial',
    color: colors.text,
    bold: true
  });
  
  slide4.addText(feature.desc, {
    x: xPos + 0.2,
    y: yPos + 0.9,
    w: 2.6,
    h: 0.7,
    fontSize: 12,
    fontFace: 'Arial',
    color: '666666'
  });
});

// ===== 幻灯片 5：技术架构 =====
let slide5 = pptx.addSlide();
slide5.background = { color: colors.white };

slide5.addText('技术架构', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

slide5.addText('前端技术栈', {
  x: 0.5,
  y: 1.1,
  w: 4.5,
  h: 0.4,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.secondary,
  bold: true
});

const frontendTech = [
  'React 19 + TypeScript',
  'Vite 构建工具',
  'Tailwind CSS',
  'Ant Design UI组件',
  'Framer Motion动画',
  'React Router路由'
];

frontendTech.forEach((tech, i) => {
  slide5.addText('• ' + tech, {
    x: 0.7,
    y: 1.6 + i * 0.35,
    w: 4,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    color: colors.text
  });
});

slide5.addText('后端服务', {
  x: 5.5,
  y: 1.1,
  w: 4.5,
  h: 0.4,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.secondary,
  bold: true
});

const backendTech = [
  'Express.js服务器',
  'WebSocket实时通信',
  'Supabase用户认证',
  'PostgreSQL数据库',
  'Row Level Security',
  'Vercel部署'
];

backendTech.forEach((tech, i) => {
  slide5.addText('• ' + tech, {
    x: 5.7,
    y: 1.6 + i * 0.35,
    w: 4,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    color: colors.text
  });
});

slide5.addShape(pptx.ShapeType.rect, {
  x: 0.5,
  y: 4.2,
  w: 9.0,
  h: 0.8,
  fill: { color: colors.light },
  line: { color: colors.accent, width: 2 }
});

slide5.addText('AI服务层：DeepSeek API + Gemini API + 企查查MCP', {
  x: 0.7,
  y: 4.35,
  w: 8.6,
  h: 0.5,
  fontSize: 16,
  fontFace: 'Arial',
  color: colors.primary,
  bold: true,
  align: 'center'
});

// ===== 幻灯片 6：AI能力 =====
let slide6 = pptx.addSlide();
slide6.background = { color: colors.white };

slide6.addText('AI 能力集成', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

slide6.addShape(pptx.ShapeType.rect, {
  x: 0.5,
  y: 1.2,
  w: 4.5,
  h: 2.0,
  fill: { color: colors.light },
  line: { color: colors.secondary, width: 2 },
  rectRadius: 0.1
});

slide6.addText('DeepSeek API', {
  x: 0.7,
  y: 1.4,
  w: 4.1,
  h: 0.5,
  fontSize: 22,
  fontFace: 'Arial',
  color: colors.primary,
  bold: true
});

slide6.addText('• 法律咨询对话\n• 合同条款分析\n• 知识问答生成\n• 面试模拟对话', {
  x: 0.7,
  y: 2.0,
  w: 4.1,
  h: 1.0,
  fontSize: 14,
  fontFace: 'Arial',
  color: colors.text,
  lineSpacing: 24
});

slide6.addShape(pptx.ShapeType.rect, {
  x: 5.5,
  y: 1.2,
  w: 4.5,
  h: 2.0,
  fill: { color: colors.light },
  line: { color: colors.accent, width: 2 },
  rectRadius: 0.1
});

slide6.addText('Gemini API', {
  x: 5.7,
  y: 1.4,
  w: 4.1,
  h: 0.5,
  fontSize: 22,
  fontFace: 'Arial',
  color: colors.primary,
  bold: true
});

slide6.addText('• 简历智能分析\n• 多模态内容理解\n• 备用AI服务\n• 高性能推理', {
  x: 5.7,
  y: 2.0,
  w: 4.1,
  h: 1.0,
  fontSize: 14,
  fontFace: 'Arial',
  color: colors.text,
  lineSpacing: 24
});

slide6.addShape(pptx.ShapeType.rect, {
  x: 0.5,
  y: 3.5,
  w: 9.5,
  h: 1.5,
  fill: { color: 'E8F4F8' },
  line: { color: colors.primary, width: 2 },
  rectRadius: 0.1
});

slide6.addText('企查查 MCP 服务', {
  x: 0.7,
  y: 3.7,
  w: 9.1,
  h: 0.5,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.primary,
  bold: true
});

slide6.addText('企业风险查询：劳动纠纷记录、司法风险、经营异常、行政处罚、严重违法失信', {
  x: 0.7,
  y: 4.3,
  w: 9.1,
  h: 0.5,
  fontSize: 14,
  fontFace: 'Arial',
  color: colors.text
});

// ===== 幻灯片 7：用户体验 =====
let slide7 = pptx.addSlide();
slide7.background = { color: colors.white };

slide7.addText('用户体验设计', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

const uxFeatures = [
  { icon: '🌐', title: '中英双语', desc: '完整国际化支持' },
  { icon: '💾', title: '数据持久化', desc: '对话历史、审查记录' },
  { icon: '📱', title: '响应式设计', desc: '多设备完美适配' }
];

uxFeatures.forEach((feature, i) => {
  const xPos = 0.5 + i * 3.2;
  
  slide7.addShape(pptx.ShapeType.rect, {
    x: xPos,
    y: 1.2,
    w: 3.0,
    h: 2.0,
    fill: { color: colors.light },
    rectRadius: 0.1
  });
  
  slide7.addText(feature.icon, {
    x: xPos,
    y: 1.4,
    w: 3.0,
    h: 0.6,
    fontSize: 32,
    align: 'center'
  });
  
  slide7.addText(feature.title, {
    x: xPos + 0.2,
    y: 2.0,
    w: 2.6,
    h: 0.4,
    fontSize: 18,
    fontFace: 'Arial',
    color: colors.primary,
    bold: true,
    align: 'center'
  });
  
  slide7.addText(feature.desc, {
    x: xPos + 0.2,
    y: 2.5,
    w: 2.6,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: '666666',
    align: 'center'
  });
});

slide7.addText('核心页面展示', {
  x: 0.5,
  y: 3.5,
  w: '100%',
  h: 0.5,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.secondary,
  bold: true
});

const pages = ['首页导航', '合同审查', '模拟面试', '税务计算', '知识卡片', '仲裁指南'];
pages.forEach((page, i) => {
  slide7.addShape(pptx.ShapeType.rect, {
    x: 0.5 + i * 1.6,
    y: 4.1,
    w: 1.5,
    h: 0.6,
    fill: { color: i === 0 ? colors.accent : colors.light },
    line: { color: colors.secondary, width: 1 },
    rectRadius: 0.05
  });
  
  slide7.addText(page, {
    x: 0.5 + i * 1.6,
    y: 4.2,
    w: 1.5,
    h: 0.4,
    fontSize: 11,
    fontFace: 'Arial',
    color: i === 0 ? colors.white : colors.text,
    align: 'center'
  });
});

// ===== 幻灯片 8：技术亮点 =====
let slide8 = pptx.addSlide();
slide8.background = { color: colors.white };

slide8.addText('技术亮点', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

const highlights = [
  {
    title: '智能合同审查',
    desc: 'PDF/DOCX文件解析，AI逐条风险识别，支持企业风险查询',
    color: colors.secondary
  },
  {
    title: 'AI面试模拟',
    desc: 'Web Speech API语音识别，动态性格调节，实时语音反馈',
    color: colors.accent
  },
  {
    title: '企查查集成',
    desc: 'MCP协议对接企业风险数据，劳动纠纷、司法风险全覆盖',
    color: colors.primary
  },
  {
    title: '数据安全',
    desc: 'Supabase RLS权限控制，用户数据隔离，安全合规',
    color: '065A82'
  }
];

highlights.forEach((item, i) => {
  const row = Math.floor(i / 2);
  const col = i % 2;
  const xPos = 0.5 + col * 4.9;
  const yPos = 1.2 + row * 2.0;
  
  slide8.addShape(pptx.ShapeType.rect, {
    x: xPos,
    y: yPos,
    w: 4.7,
    h: 1.8,
    fill: { color: colors.light },
    line: { color: item.color, width: 3 },
    rectRadius: 0.1
  });
  
  slide8.addShape(pptx.ShapeType.rect, {
    x: xPos,
    y: yPos,
    w: 0.15,
    h: 1.8,
    fill: { color: item.color }
  });
  
  slide8.addText(item.title, {
    x: xPos + 0.3,
    y: yPos + 0.2,
    w: 4.2,
    h: 0.5,
    fontSize: 20,
    fontFace: 'Arial',
    color: colors.text,
    bold: true
  });
  
  slide8.addText(item.desc, {
    x: xPos + 0.3,
    y: yPos + 0.8,
    w: 4.2,
    h: 0.8,
    fontSize: 13,
    fontFace: 'Arial',
    color: '666666'
  });
});

// ===== 幻灯片 9：部署与运维 =====
let slide9 = pptx.addSlide();
slide9.background = { color: colors.white };

slide9.addText('部署与运维', {
  x: 0.5,
  y: 0.3,
  w: '100%',
  h: 0.7,
  fontSize: 40,
  fontFace: 'Georgia',
  color: colors.primary,
  bold: true
});

slide9.addText('部署架构', {
  x: 0.5,
  y: 1.2,
  w: '100%',
  h: 0.5,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.secondary,
  bold: true
});

const deploySteps = [
  { step: '1', title: '前端部署', desc: 'Vercel边缘网络' },
  { step: '2', title: 'API服务', desc: 'Serverless Functions' },
  { step: '3', title: '数据库', desc: 'Supabase托管' },
  { step: '4', title: 'AI服务', desc: 'API调用' }
];

deploySteps.forEach((item, i) => {
  const xPos = 0.5 + i * 2.4;
  
  slide9.addShape(pptx.ShapeType.ellipse, {
    x: xPos + 0.3,
    y: 1.8,
    w: 0.7,
    h: 0.7,
    fill: { color: colors.accent }
  });
  
  slide9.addText(item.step, {
    x: xPos + 0.3,
    y: 1.9,
    w: 0.7,
    h: 0.5,
    fontSize: 24,
    fontFace: 'Georgia',
    color: colors.white,
    bold: true,
    align: 'center'
  });
  
  slide9.addText(item.title, {
    x: xPos,
    y: 2.7,
    w: 2.2,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: colors.text,
    bold: true,
    align: 'center'
  });
  
  slide9.addText(item.desc, {
    x: xPos,
    y: 3.2,
    w: 2.2,
    h: 0.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: '666666',
    align: 'center'
  });
});

slide9.addText('运维特性', {
  x: 0.5,
  y: 4.0,
  w: '100%',
  h: 0.4,
  fontSize: 20,
  fontFace: 'Arial',
  color: colors.secondary,
  bold: true
});

const opsFeatures = ['自动HTTPS', '全球CDN', '实时日志', '一键回滚', '性能监控'];

opsFeatures.forEach((feature, i) => {
  slide9.addShape(pptx.ShapeType.rect, {
    x: 0.5 + i * 1.9,
    y: 4.5,
    w: 1.8,
    h: 0.5,
    fill: { color: colors.light },
    line: { color: colors.secondary, width: 1 },
    rectRadius: 0.05
  });
  
  slide9.addText(feature, {
    x: 0.5 + i * 1.9,
    y: 4.6,
    w: 1.8,
    h: 0.3,
    fontSize: 11,
    fontFace: 'Arial',
    color: colors.text,
    align: 'center'
  });
});

// ===== 幻灯片 10：结尾 =====
let slide10 = pptx.addSlide();
slide10.background = { color: colors.dark };

slide10.addText('🤝', {
  x: 0,
  y: 0.8,
  w: '100%',
  h: 0.8,
  fontSize: 56,
  align: 'center'
});

slide10.addText('Lawbor', {
  x: 0.5,
  y: 1.8,
  w: '100%',
  h: 1.0,
  fontSize: 60,
  fontFace: 'Georgia',
  color: colors.white,
  bold: true,
  align: 'center'
});

slide10.addText('劳友记 · 用手托举每一位职场新人', {
  x: 1,
  y: 2.9,
  w: '100%',
  h: 0.6,
  fontSize: 22,
  fontFace: 'Arial',
  color: colors.accent,
  align: 'center'
});

slide10.addText('让每一位职场新人都能懂法、用法、维权', {
  x: 1,
  y: 3.7,
  w: '100%',
  h: 0.5,
  fontSize: 18,
  fontFace: 'Arial',
  color: colors.white,
  align: 'center',
  transparency: 30
});

slide10.addText('🌐 lawbor.com | 📧 contact@lawbor.com', {
  x: 1,
  y: 4.8,
  w: '100%',
  h: 0.4,
  fontSize: 14,
  fontFace: 'Arial',
  color: colors.white,
  align: 'center',
  transparency: 50
});

// 保存文件
pptx.writeFile('/Users/macie/Documents/VibeCoding/lawbor/docs/Lawbor-Project-Presentation.pptx')
  .then(() => {
    console.log('✅ PPT created successfully with brand story!');
  })
  .catch(err => {
    console.error('Error creating PPT:', err);
  });