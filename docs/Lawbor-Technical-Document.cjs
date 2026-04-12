const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, 
        AlignmentType, WidthType, ShadingType, BorderStyle, Header, Footer, PageNumber,
        TableOfContents, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

// 创建文档
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 24 } // 12pt
      }
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '065A82' },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '1C7293' },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '02C39A' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Lawbor 项目技术文档', italics: true, size: 20, color: '666666' })
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '第 ', size: 20 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
              new TextRun({ text: ' 页', size: 20 })
            ]
          })
        ]
      })
    },
    children: [
      // ===== 封面 =====
      new Paragraph({ spacing: { before: 2400 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Lawbor', size: 72, bold: true, font: 'Georgia', color: '065A82' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({ text: '劳动者权益守护平台', size: 36, font: 'Arial', color: '02C39A' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [
          new TextRun({ text: '项目技术文档', size: 28, font: 'Arial', color: '666666' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [
          new TextRun({ text: '重塑新锐劳动者权益，让每一位职场新人都能懂法、用法、维权', size: 22, italics: true, color: '888888' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200 },
        children: [
          new TextRun({ text: '2026年4月', size: 24, color: '666666' })
        ]
      }),
      
      // ===== 分页：目录 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('目录')] }),
      new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }),
      
      // ===== 分页：品牌故事 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('一、品牌故事')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('1.1 命名巧思')] }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Lawbor', bold: true }),
          new TextRun(' 的命名蕴含三重巧思：')
        ]
      }),
      
      new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        spacing: { before: 200 },
        children: [
          new TextRun({ text: 'Labor Law 化用：', bold: true }),
          new TextRun('Lawbor = Labor（劳动）+ Law（法律），巧妙融合劳动法核心，传递专业与温暖。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: [
          new TextRun({ text: '好伙计的谐音：', bold: true }),
          new TextRun('Lawbor 听起来像"老伙计"，象征着我们是值得信赖的职场伙伴，一路陪伴成长。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: [
          new TextRun({ text: '双手托举的Logo：', bold: true }),
          new TextRun('Logo中的"w"设计成双手样式，象征"劳友记"——我们一起用手托举每一位即将步入职场的小伙伴。')
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun('1.2 品牌理念')] }),
      new Paragraph({
        children: [
          new TextRun({ text: 'We 劳友记，用手托举每一位职场新人，让懂法、用法、维权不再困难。', italics: true, color: '02C39A' })
        ]
      }),
      
      // ===== 项目背景 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('二、项目背景')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.1 市场痛点')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '合同陷阱频发：', bold: true }), new TextRun('试用期过长、薪资模糊、违约金不公等问题普遍存在。')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '法律知识薄弱：', bold: true }), new TextRun('70%的职场新人不懂劳动法，对自身权益了解不足。')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '维权成本高昂：', bold: true }), new TextRun('律师费用高、流程复杂、周期长，85%的人不知道如何维权。')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '政策信息分散：', bold: true }), new TextRun('各地补贴政策难以查找和匹配，错过应得权益。')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('2.2 解决方案')] }),
      new Paragraph({
        children: [
          new TextRun('Lawbor 通过 AI 技术为劳动者提供全方位的法律服务，包括合同审查、法律咨询、维权指导等功能，让每一位职场新人都能轻松获得专业法律支持。')
        ]
      }),
      
      // ===== 核心功能 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('三、核心功能模块')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.1 合同天眼')] }),
      new Paragraph({
        children: [
          new TextRun('AI逐字扫描合同，识别试用期、薪资、社保、违约金、竞业限制等陷阱条款，提供风险评估和修改建议。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('支持 PDF、DOCX 文件上传')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('自动提取企业名称，查询企业风险信息')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('三级风险评估：高、中、低风险分类')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.2 职场法眼')] }),
      new Paragraph({
        children: [
          new TextRun('劳动法知识卡片库，涵盖试用期、加班、离职、赔偿等常见问题，一查便知。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('中英文双语支持')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('分类清晰，快速检索')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('收藏功能，个性化学习')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.3 补贴雷达')] }),
      new Paragraph({
        children: [
          new TextRun('一键匹配城市政策，租房补贴、人才补贴、就业扶持等应得权益不错过。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('覆盖上海、北京等主要城市')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('智能推荐，精准匹配')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.4 维权冲锋队')] }),
      new Paragraph({
        children: [
          new TextRun('劳动仲裁全程陪跑，帮忙写文书、算赔偿、理证据、走流程。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('仲裁流程可视化指引')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('文书模板自动生成')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('赔偿金额智能计算')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.5 薪资清算师')] }),
      new Paragraph({
        children: [
          new TextRun('税前税后、加班费、补偿金、个税计算，工资明明白白。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('个人所得税专项附加扣除支持')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('五险一金计算')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('数据持久化存储')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.6 AI法律搭子')] }),
      new Paragraph({
        children: [
          new TextRun('24小时在线法律问答助手，随时随地解答职场法律问题。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('基于 DeepSeek API')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('上下文记忆，连续对话')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('专业法律知识库')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('3.7 AI面试模拟')] }),
      new Paragraph({
        children: [
          new TextRun('模拟真实面试场景，提供语音识别、实时反馈、面试报告。')
        ]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('Web Speech API 语音识别')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('动态性格调节（温度值）')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('简历智能分析（Gemini API）')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('面试报告自动生成')]
      }),
      
      // ===== 技术架构 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('四、技术架构')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.1 前端技术栈')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '框架：', bold: true }), new TextRun('React 19 + TypeScript')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '构建工具：', bold: true }), new TextRun('Vite 6.2')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '样式：', bold: true }), new TextRun('Tailwind CSS 4 + Ant Design 6')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '动画：', bold: true }), new TextRun('Framer Motion')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '路由：', bold: true }), new TextRun('React Router DOM 7')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '图表：', bold: true }), new TextRun('Recharts')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.2 后端服务')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '服务器：', bold: true }), new TextRun('Express.js')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '实时通信：', bold: true }), new TextRun('WebSocket')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '用户认证：', bold: true }), new TextRun('Supabase Auth')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '数据库：', bold: true }), new TextRun('PostgreSQL（Supabase托管）')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '安全：', bold: true }), new TextRun('Row Level Security (RLS)')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.3 AI服务层')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: 'DeepSeek API：', bold: true }), new TextRun('法律咨询、合同审查、面试对话')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: 'Gemini API：', bold: true }), new TextRun('简历分析、多模态理解')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '企查查 MCP：', bold: true }), new TextRun('企业风险数据查询')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('4.4 部署架构')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '前端部署：', bold: true }), new TextRun('Vercel 边缘网络')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: 'API服务：', bold: true }), new TextRun('Vercel Serverless Functions')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: '数据库：', bold: true }), new TextRun('Supabase 托管 PostgreSQL')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text: 'CDN：', bold: true }), new TextRun('Vercel 全球 CDN')]
      }),
      
      // ===== 技术亮点 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('五、技术亮点')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.1 智能合同审查')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('PDF/DOCX 文件解析：使用 pdf.js 和 mammoth.js')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('AI 逐条风险识别：基于 DeepSeek API')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('企业风险查询：企查查 MCP 协议集成')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('正则表达式提取企业名称：处理多种合同格式')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.2 AI面试模拟')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('Web Speech API 语音识别：浏览器原生支持')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('动态性格调节：温度值 0-100，模拟不同面试官风格')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('简历智能分析：Gemini API 解析简历内容')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('面试报告生成：包含评分、能力维度、改进建议')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.3 企查查集成')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('MCP 协议对接：标准化企业数据接口')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('劳动纠纷记录：案件详情、当事人信息')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('司法风险查询：裁判文书、执行信息')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('中文字段兼容：前后端字段名自动映射')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('5.4 数据安全')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('Supabase RLS：Row Level Security 行级权限控制')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('用户数据隔离：每个用户只能访问自己的数据')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('HTTPS 加密传输：全站 SSL 证书')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('环境变量保护：敏感信息不提交 Git')]
      }),
      
      // ===== 用户体验 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('六、用户体验设计')] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('6.1 国际化支持')] }),
      new Paragraph({
        children: [
          new TextRun('完整的中英文双语支持，所有页面均已适配国际化，使用 TranslationContext 统一管理语言切换。')
        ]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('6.2 数据持久化')] }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('对话历史：AI 对话记录永久保存')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('审查记录：合同审查结果可追溯')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('计算记录：税务计算历史查看')]
      }),
      new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun('知识卡片收藏：个性化学习路径')]
      }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('6.3 响应式设计')] }),
      new Paragraph({
        children: [
          new TextRun('基于 Tailwind CSS 的响应式设计，完美适配桌面端、平板和移动设备。')
        ]
      }),
      
      // ===== 结尾 =====
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('七、总结')] }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Lawbor（劳友记）', bold: true }),
          new TextRun(' 是一款专为职场新人设计的劳动法智能助手。我们以"用手托举每一位职场新人"为品牌理念，通过 AI 技术提供合同审查、法律咨询、维权指导、面试模拟等全方位服务。')
        ]
      }),
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun('技术栈采用 React 19 + TypeScript + Vite 构建，集成 DeepSeek、Gemini、企查查等多个 AI 服务，部署在 Vercel 边缘网络，为用户提供快速、稳定、安全的法律服务体验。')
        ]
      }),
      new Paragraph({
        spacing: { before: 200 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Lawbor · 劳友记 · 用手托举每一位职场新人', italics: true, color: '02C39A', size: 26 })
        ]
      })
    ]
  }]
});

// 保存文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/macie/Documents/VibeCoding/lawbor/docs/Lawbor-Technical-Document.docx', buffer);
  console.log('✅ Word document created successfully!');
}).catch(err => {
  console.error('Error creating document:', err);
});