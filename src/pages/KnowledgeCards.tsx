import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Bookmark, Share2, HelpCircle, Sparkles, MessageCircle } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { useAIChat } from '../contexts/AIChatContext';

const categories = {
  zh: ['全部', '劳动合同', '工资福利', '工作时间', '社会保险', '劳动争议'],
  en: ['All', 'Labor Contract', 'Salary \u0026 Benefits', 'Working Hours', 'Social Insurance', 'Labor Dispute']
};

const expertCards = {
  zh: [
    { id: 'e1', category: '劳动合同', title: '试用期最长多久？', content: '劳动合同期限三个月以上不满一年的，试用期不得超过一个月；劳动合同期限一年以上不满三年的，试用期不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。', tags: ['试用期', '合同期限'] },
    { id: 'e2', category: '工资福利', title: '加班费如何计算？', content: '平日加班：不低于工资的150%；休息日加班（不能补休）：不低于工资的200%；法定节假日加班：不低于工资的300%。', tags: ['加班费', '工资计算'] },
    { id: 'e3', category: '工作时间', title: '年休假有多少天？', content: '累计工作满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。', tags: ['年休假', '福利'] },
    { id: 'e4', category: '社会保险', title: '五险一金包含哪些？', content: '五险：养老保险、医疗保险、失业保险、工伤保险、生育保险。一金：住房公积金。', tags: ['社保', '公积金'] },
    { id: 'e5', category: '劳动争议', title: '申请仲裁有时效吗？', content: '劳动争议申请仲裁的时效期间为一年。仲裁时效期间从当事人知道或者应当知道其权利被侵害之日起计算。', tags: ['仲裁', '时效'] },
    { id: 'e6', category: '劳动合同', title: '什么是无固定期限合同？', content: '指用人单位与劳动者约定无确定终止时间的劳动合同。劳动者在单位连续工作满十年的，应当订立无固定期限劳动合同。', tags: ['合同类型', '无固定期限'] },
  ],
  en: [
    { id: 'e1', category: 'Labor Contract', title: 'How long is the maximum probation period?', content: 'If the labor contract term is more than three months but less than one year, the probation period shall not exceed one month; if the term is more than one year but less than three years, the probation period shall not exceed two months; for fixed-term contracts of more than three years and open-ended contracts, the probation period shall not exceed six months.', tags: ['Probation', 'Contract Term'] },
    { id: 'e2', category: 'Salary \u0026 Benefits', title: 'How is overtime pay calculated?', content: 'Weekday overtime: not less than 150% of salary; Weekend overtime (if no compensatory time off): not less than 200% of salary; Statutory holiday overtime: not less than 300% of salary.', tags: ['Overtime Pay', 'Salary Calculation'] },
    { id: 'e3', category: 'Working Hours', title: 'How many days of annual leave?', content: 'Cumulative work of 1-10 years: 5 days; 10-20 years: 10 days; more than 20 years: 15 days.', tags: ['Annual Leave', 'Benefits'] },
    { id: 'e4', category: 'Social Insurance', title: 'What does "Five Insurances and One Fund" include?', content: 'Five Insurances: Pension, Medical, Unemployment, Work Injury, Maternity. One Fund: Housing Provident Fund.', tags: ['Social Security', 'Provident Fund'] },
    { id: 'e5', category: 'Labor Dispute', title: 'Is there a time limit for arbitration?', content: 'The limitation period for applying for labor dispute arbitration is one year, starting from the date the party knows or should have known that their rights were infringed.', tags: ['Arbitration', 'Limitation'] },
    { id: 'e6', category: 'Labor Contract', title: 'What is an open-ended contract?', content: 'It refers to a labor contract where the employer and employee agree on no fixed termination date. If an employee has worked continuously for ten years, an open-ended contract should be signed.', tags: ['Contract Type', 'Open-ended'] },
  ]
};

const flashcards = {
  zh: [
    { id: 1, category: '社会保险', question: "什么是五险一金", answer: "五险一金是职场法定保障：五险指养老、医疗、失业、工伤、生育保险；一金是住房公积金，由单位和个人按规定共同缴费。" },
    { id: 2, category: '工资福利', question: "HR说的总包一般包括什么？", answer: "指年度税前总收入，常规包含基本工资、绩效奖金、年终奖 / 十三薪、各类固定补贴；部分企业会将签约奖、人才补贴、折合福利计入，不含公司承担的社保公积金部分。" },
    { id: 3, category: '工资福利', question: "HR说的「十三薪」是什么意思？", answer: "年底多发 1 个月基本工资，大多年底随年终奖发放。" },
    { id: 4, category: '劳动争议', question: "经济补偿金 N、N+1 是什么意思？", answer: "N 按工作年限算，每满 1 年给 1 个月工资；N+1 是额外多给 1 个月代通知金，多用于公司合法裁员未提前 30 天通知的情况。" },
    { id: 5, category: '劳动合同', question: "竞业限制是什么？", answer: "离职后一段时间内不能去竞品公司上班、泄露公司机密，公司要按月给补偿，没给补偿员工可不受限制。" },
    { id: 6, category: '劳动合同', question: "没签劳动合同怎么办？", answer: "入职超 1 个月不满 1 年没签合同，公司要给双倍工资，满 1 年没签，直接视为签订无固定期限劳动合同。" },
    { id: 7, category: '社会保险', question: "社保可以自愿不交、折现发工资吗？", answer: "不可以，缴纳社保是法律强制义务，私下约定不交社保、现金补贴均无效，还涉嫌违法。" },
    { id: 8, category: '劳动合同', question: "什么是试用期？", answer: "是劳动合同中约定的，用人单位与劳动者相互考察的期限，合同期限不同试用期上限不同，同一单位与同一劳动者只能约定一次试用期。" },
    { id: 9, category: '劳动合同', question: "什么是无固定期限劳动合同？", answer: "指用人单位与劳动者约定无确定终止时间的劳动合同，并非「铁饭碗」，出现法定解除情形时，用人单位仍可依法解除。" },
    { id: 10, category: '劳动合同', question: "什么是服务期？", answer: "用人单位为劳动者提供专项培训费用、进行专业技术培训的，可以与劳动者约定服务期；劳动者违反服务期约定的，需按约定向用人单位支付违约金。" },
    { id: 11, category: '劳动争议', question: "主动辞职能拿补偿金吗？", answer: "一般不能，只有公司拖欠工资、不交社保等违法情况，员工被迫离职，才能主张经济补偿金。" },
    { id: 12, category: '劳动合同', question: "试用期能随便辞退员工吗？", answer: "不能，试用期辞退也要有合法理由、证明员工不符合录用条件，不能无理由开除，且辞退流程要合规。" },
    { id: 13, category: '工资福利', question: "试用期薪资有规定吗？", answer: "有，试用期工资不得低于转正工资的 80%，同时不能低于当地最低工资标准。" },
    { id: 14, category: '工资福利', question: "加班工资怎么算？", answer: "工作日加班按 1.5 倍工资，休息日加班无补休按 2 倍工资，法定节假日加班必须给 3 倍工资。" },
    { id: 15, category: '工资福利', question: "年终奖公司能随意不发吗？", answer: "若无合同、制度约定，年终奖属于企业福利可灵活调整；写进合同或规章制度里，就必须按约定发放。" },
    { id: 16, category: '工资福利', question: "最低工资包含加班费、补贴吗？", answer: "不包含，最低工资是剔除加班费、餐补、交通补贴、高温补贴等之外，到手的基础劳动报酬。" },
    { id: 17, category: '工作时间', question: "什么是医疗期？", answer: "指劳动者因患病或非因工负伤停止工作治病休息，用人单位不得解除劳动合同的时限，期限根据本人实际工作年限和在本单位工作年限确定，为 3-24 个月。" },
    { id: 18, category: '工作时间', question: "什么是带薪年休假？", answer: "是劳动者连续工作满 1 年以上，依法享有的带薪假期；工作满 1 年不满 10 年休 5 天，满 10 年不满 20 年休 10 天，满 20 年休 15 天，法定节假日、休息日不计入年休假假期。" },
    { id: 19, category: '劳动合同', question: "什么是劳务派遣？", answer: "指劳务派遣单位与劳动者签订协议，将劳动者派往用工单位工作，薪酬由用工单位给到派遣单位，再由派遣单位发放给劳动者的用工形式。" },
    { id: 20, category: '劳动合同', question: "严重违反用人单位规章制度包括什么？", answer: "劳动者违反公司合法合规、经民主程序制定并公示的规章制度，且情节达到严重程度的行为，用人单位据此辞退员工无需支付经济补偿。" },
    { id: 21, category: '劳动合同', question: "试用期内公司可以随便辞退我，是真的吗？", answer: "不是。试用期辞退必须有合法理由，且能举证证明你不符合录用条件，无理由辞退属于违法解除，需支付 2N 赔偿金。" },
    { id: 22, category: '劳动争议', question: "只要是我主动提离职，就一定拿不到经济补偿，对吗？", answer: "不对。如果是因公司拖欠工资、未依法缴纳社保、未按合同约定提供劳动保护等违法情形，你被迫提出离职的，仍有权要求公司支付经济补偿金。" },
    { id: 23, category: '社会保险', question: "我自愿和公司签不交社保、折现发工资的协议，是合法有效的吗？", answer: "无效。缴纳社保是用人单位和劳动者的法定义务，不能通过双方约定免除，该协议不受法律保护，公司仍需补缴社保，劳动者也无法据此主张额外补偿。" },
    { id: 24, category: '工资福利', question: "年终奖是公司福利，想不发就可以不发，对吗？", answer: "不对。如果劳动合同、公司规章制度里明确约定了年终奖的发放规则、金额，且你符合发放条件，公司必须按约定发放，不能随意克扣或不发。" },
    { id: 25, category: '社会保险', question: "试用期公司可以不给我缴社保，对吗？", answer: "不对。试用期包含在劳动合同期限内，只要建立了劳动关系，用人单位就必须依法为劳动者缴纳社保，不缴属于违法行为。" },
    { id: 26, category: '工资福利', question: "我签了自愿加班协议，公司就不用给我发加班费了，是真的吗？", answer: "不是。是否属于加班，核心看是否是公司安排、是否超出法定工作时长，自愿加班协议不能免除公司支付加班费的法定义务，超出法定时长的公司安排加班，必须依法支付加班费。" },
    { id: 27, category: '劳动合同', question: "不管什么情况，我离职都必须提前 30 天书面通知公司，对吗？", answer: "不对。试用期内离职只需提前 3 天通知；公司存在暴力胁迫劳动、违章指挥危及人身安全等违法情形的，你可以立即解除劳动合同，无需提前通知。" },
    { id: 28, category: '劳动合同', question: "我签了竞业限制协议就必须遵守，对吗？", answer: "不对。竞业限制的生效前提是公司按月支付经济补偿，若公司连续 3 个月未支付，你有权要求解除竞业限制协议，无需再遵守相关约定。" },
    { id: 29, category: '劳动合同', question: "公司规定旷工 3 天就算自动离职，我旷工 3 天就和公司没关系了，对吗？", answer: "不对。中国法律没有「自动离职」的概念，就算你旷工，也需要公司依法作出解除劳动合同的决定并送达给你，劳动关系才会终止，否则仍存在劳动关系。" },
    { id: 30, category: '劳动合同', question: "劳动合同只有公司手里有一份，我没有，这份合同就无效，对吗？", answer: "不对。劳动合同只要双方签字盖章、内容不违反法律强制性规定，就是有效的；公司未将劳动合同文本交付给你，属于违法行为，你可以向劳动监察部门投诉，但不影响合同本身的效力。" },
    { id: 31, category: '劳动合同', question: "作为公司员工，我必须听公司安排，公司可以随便给我调岗降薪，对吗？", answer: "不对。调岗降薪属于劳动合同内容的重大变更，必须经双方协商一致，签订书面变更协议；公司单方强制调岗降薪，你有权拒绝，还可据此主张被迫离职，要求经济补偿。" },
    { id: 32, category: '工资福利', question: "法定节假日加班，公司给我安排补休，就不用给 3 倍加班费了，对吗？", answer: "不对。休息日加班可以优先安排补休，不支付 2 倍加班费；但法定节假日加班，必须支付不低于 300% 的工资报酬，不能用补休替代。" },
    { id: 33, category: '劳动合同', question: "我和公司签了劳务合同，就不受劳动法保护了，对吗？", answer: "不对。是否受劳动法保护，核心看是否构成事实劳动关系，而非合同名称；哪怕签的是劳务合同，只要符合劳动关系的认定标准（单位管理、固定薪酬、岗位属于公司业务组成），仍受劳动法保护。" },
    { id: 34, category: '工资福利', question: "工资以现金形式发放，就不用交个人所得税了，对吗？", answer: "不对。无论工资以现金还是银行转账形式发放，只要达到个税起征点，都必须依法缴纳个人所得税，公司有代扣代缴义务，不缴属于偷税漏税的违法行为。" },
    { id: 35, category: '劳动争议', question: "公司拖欠工资，我最直接的维权方式是什么？", answer: "先保留好劳动合同、工资流水、考勤记录、拖欠工资的沟通记录，可直接向当地劳动监察大队投诉，也可直接申请劳动仲裁维权。" },
    { id: 36, category: '劳动争议', question: "公司安排加班，我该怎么留存有效证据？", answer: "需留存公司安排加班的书面通知、办公系统加班审批记录、考勤打卡记录、加班时的工作沟通记录、工作成果交付记录，避免仅个人自行打卡的孤证。" },
    { id: 37, category: '劳动争议', question: "被公司无理由口头辞退，我该怎么应对？", answer: "不要主动签离职申请、自愿离职协议，要求公司出具书面的解除劳动合同通知书，同时留存好辞退的沟通录音、聊天记录，凭这些证据申请劳动仲裁，主张违法解除赔偿金。" },
    { id: 38, category: '劳动争议', question: "想以公司违法为由被迫离职，正确的操作是什么？", answer: "先固定好公司违法的相关证据，通过书面形式（EMS、公司官方邮箱）向公司发送《被迫解除劳动合同通知书》，写明解除理由，送达后即可离职，随后可申请劳动仲裁主张经济补偿金。" },
    { id: 39, category: '劳动争议', question: "申请劳动仲裁，我需要提前准备哪些材料？", answer: "核心材料包括：劳动仲裁申请书、本人身份证复印件、公司工商信息、劳动合同、工资流水、考勤记录、相关沟通记录等能证明你的主张的证据材料。" },
    { id: 40, category: '劳动争议', question: "公司不给我签劳动合同，我该怎么维权？", answer: "先留存好工牌、考勤记录、工资流水、工作沟通记录等能证明事实劳动关系的证据，入职超 1 个月不满 1 年未签合同的，可申请劳动仲裁，主张公司支付未签劳动合同的双倍工资差额。" },
    { id: 41, category: '社会保险', question: "社保断缴了，我该怎么补救？", answer: "因公司原因断缴的，可要求公司补缴，公司不配合的，向社保经办机构投诉；因个人原因断缴的，本地户籍可到社保局以灵活就业身份补缴，外地户籍可通过新入职单位补缴，断缴不影响社保累计缴费年限。" },
    { id: 42, category: '劳动争议', question: "公司强制要求我加班，我该怎么应对？", answer: "先拒绝超出法定时长的强制加班，留存好公司强制加班的通知、沟通记录；若公司因此克扣工资、辞退你，可直接向劳动监察部门投诉，或申请劳动仲裁维权。" },
    { id: 43, category: '工资福利', question: "拿到工资条，我重点要核对哪些内容？", answer: "重点核对：基本工资、绩效奖金、加班费是否足额发放；社保公积金个人缴纳部分、个税扣除是否符合规定；缺勤扣款是否合理，确认无误后再签字留存。" },
    { id: 44, category: '劳动合同', question: "离职交接时，我需要注意哪些关键事项？", answer: "务必做好工作交接清单，列明交接内容、交接时间，由交接人、监交人签字确认，自己留存一份；要求公司出具离职证明，结清工资、加班费、经济补偿等所有款项，确认社保公积金停缴时间。" },
    { id: 45, category: '劳动合同', question: "公司约定了竞业限制，但一直不给我发补偿，我该怎么办？", answer: "先留存好竞业限制协议、离职后你遵守约定的相关证据，若公司连续 3 个月未支付补偿，可书面通知公司解除竞业限制协议，同时可申请劳动仲裁，要求公司补发拖欠的竞业限制补偿。" },
    { id: 46, category: '劳动合同', question: "公司单方面给我调岗降薪，我该怎么应对？", answer: "第一时间通过书面形式向公司提出异议，拒绝不合理的调岗降薪，不要到新岗位报到履职，留存好调岗降薪的通知、沟通记录；若公司强制执行，可申请劳动仲裁，要求恢复原岗位原薪酬，或主张被迫离职的经济补偿。" },
    { id: 47, category: '劳动合同', question: "外国人在中国就业，必须满足哪些前提才受劳动法保护？", answer: "必须依法取得《外国人工作许可证》和工作类居留许可，与在中国境内注册的用人单位签订劳动合同，未取得两证私自就业的，属于非法就业，不受中国劳动法保护。" },
    { id: 48, category: '劳动争议', question: "发生劳动纠纷，我有哪些免费的维权咨询渠道？", answer: "可拨打全国统一劳动保障咨询投诉热线 12333，也可到当地人社局劳动监察窗口、总工会法律援助中心咨询，符合条件的还可申请免费的法律援助。" },
    { id: 49, category: '劳动争议', question: "公司不发年终奖，我该怎么维权？", answer: "先留存好劳动合同、公司规章制度里关于年终奖的约定、过往年终奖发放记录、你符合发放条件的相关证据，先和公司协商，协商不成的，可申请劳动仲裁主张足额发放。" },
    { id: 50, category: '劳动争议', question: "公司单方面通知我待岗、只发最低工资，我该怎么办？", answer: "只有公司因经营问题停工停产、或与你协商一致这两种情况，才能合法安排待岗，无正当理由单方强制待岗属于违法行为。拒绝单方待岗，正常出勤留证；公司克扣工资的，可投诉或仲裁要工资差额 / 经济补偿。" }
  ],
  en: [
    { id: 1, category: 'Social Insurance', question: "What is 'Five Insurances and One Fund'?", answer: "It's the statutory workplace protection in China: Five Insurances include Pension, Medical, Unemployment, Work Injury, and Maternity; One Fund is the Housing Provident Fund, co-paid by the employer and employee." },
    { id: 2, category: 'Salary \u0026 Benefits', question: "What does 'Total Package' usually include?", answer: "It refers to the annual pre-tax total income, typically including base salary, performance bonus, year-end bonus/13th month pay, and various fixed allowances. Some companies include signing bonuses and talent subsidies, but exclude employer-paid social security." },
    { id: 3, category: 'Salary \u0026 Benefits', question: "What is '13th Month Pay'?", answer: "An extra month of base salary paid at the end of the year, usually along with the year-end bonus." },
    { id: 4, category: 'Labor Dispute', question: "What do 'N' and 'N+1' mean in severance pay?", answer: "'N' is based on years of service (1 month's salary per year). 'N+1' adds an extra month of pay in lieu of notice, often used when a company lays off employees without 30 days' prior notice." },
    { id: 5, category: 'Labor Contract', question: "What is a Non-compete Restriction?", answer: "A restriction from working for competitors or leaking secrets for a period after leaving. The company must pay monthly compensation; if not paid, the employee is not restricted." },
    { id: 6, category: 'Labor Contract', question: "What if no labor contract is signed?", answer: "If no contract is signed after 1 month but before 1 year of employment, the company must pay double salary. After 1 year, an open-ended contract is deemed signed." },
    { id: 7, category: 'Social Insurance', question: "Can I opt out of social security for cash?", answer: "No. Paying social security is a mandatory legal obligation. Private agreements to opt out or substitute with cash are invalid and illegal." },
    { id: 8, category: 'Labor Contract', question: "What is a Probation Period?", answer: "A period for mutual assessment agreed upon in the contract. The maximum length depends on the contract term. It can only be agreed upon once between the same employer and employee." },
    { id: 9, category: 'Labor Contract', question: "What is an Open-ended Labor Contract?", answer: "A contract with no fixed termination date. It's not a 'guaranteed job'; the employer can still terminate it under statutory conditions." },
    { id: 10, category: 'Labor Contract', question: "What is a Service Period?", answer: "If an employer provides specialized training expenses, they can agree on a service period. If the employee violates it, they must pay liquidated damages as agreed." },
    { id: 11, category: 'Labor Dispute', question: "Can I get severance if I resign voluntarily?", answer: "Generally no. Severance is only applicable if the employee is forced to resign due to company violations like wage arrears or non-payment of social security." },
    { id: 12, category: 'Labor Contract', question: "Can I be dismissed at will during probation?", answer: "No. Dismissal during probation requires legal grounds, such as proof that the employee does not meet hiring criteria, and must follow proper procedures." },
    { id: 13, category: 'Salary \u0026 Benefits', question: "Are there rules for probation salary?", answer: "Yes. Probation salary must not be lower than 80% of the regular salary and must not be lower than the local minimum wage." },
    { id: 14, category: 'Salary \u0026 Benefits', question: "How is overtime pay calculated?", answer: "1.5x for weekdays, 2x for weekends (if no compensatory time off), and 3x for statutory holidays." },
    { id: 15, category: 'Salary \u0026 Benefits', question: "Can a company skip the year-end bonus?", answer: "If not agreed in the contract or rules, it's a flexible benefit. If written in the contract or rules, it must be paid as agreed." },
    { id: 16, category: 'Salary \u0026 Benefits', question: "Does minimum wage include overtime/allowances?", answer: "No. Minimum wage is the base pay excluding overtime, meal/transport/heat allowances, etc." },
    { id: 17, category: 'Working Hours', question: "What is a Medical Period?", answer: "The period during which an employer cannot terminate a contract while an employee is resting due to illness or non-work injury. It ranges from 3-24 months based on total and company service years." },
    { id: 18, category: 'Working Hours', question: "What is Paid Annual Leave?", answer: "Paid leave for employees working continuously for over 1 year. 5 days for 1-10 years, 10 days for 10-20 years, and 15 days for over 20 years. Holidays/weekends are not counted." },
    { id: 19, category: 'Labor Contract', question: "What is Labor Dispatch?", answer: "A form of employment where a dispatch agency signs a contract with the employee and sends them to work for a user entity. The user entity pays the agency, which then pays the employee." },
    { id: 20, category: 'Labor Contract', question: "What counts as 'serious violation of rules'?", answer: "Violating legal, democratic, and publicized company rules to a serious degree. Employers can dismiss employees for this without severance." },
    { id: 21, category: 'Labor Contract', question: "Is it true that the company can fire me at will during probation?", answer: "No. Dismissal requires legal grounds and proof of unfitness. At-will dismissal is illegal and requires 2N compensation." },
    { id: 22, category: 'Labor Dispute', question: "If I resign, I definitely won't get severance, right?", answer: "Wrong. If you are forced to resign due to company violations (e.g., wage arrears, no social security), you still have the right to claim severance." },
    { id: 23, category: 'Social Insurance', question: "Is an agreement to skip social security for cash valid?", answer: "Invalid. Social security is a legal obligation that cannot be waived by agreement. The company must still pay, and the employee cannot claim extra compensation based on it." },
    { id: 24, category: 'Salary \u0026 Benefits', question: "Is the year-end bonus just a benefit the company can skip?", answer: "Not necessarily. If the contract or rules define clear rules and you meet them, the company must pay and cannot deduct it arbitrarily." },
    { id: 25, category: 'Social Insurance', question: "Can the company skip social security during probation?", answer: "No. Probation is part of the contract term. Once a labor relationship is established, social security must be paid by law." },
    { id: 26, category: 'Salary \u0026 Benefits', question: "If I sign a voluntary overtime agreement, does the company skip overtime pay?", answer: "No. Overtime is determined by company arrangement and legal hours. Voluntary agreements cannot waive the legal duty to pay for company-arranged overtime." },
    { id: 27, category: 'Labor Contract', question: "Must I always give 30 days' notice to resign?", answer: "No. During probation, only 3 days' notice is needed. In cases of violence or safety risks by the company, you can resign immediately without notice." },
    { id: 28, category: 'Labor Contract', question: "Must I always follow a signed non-compete?", answer: "No. It's only valid if the company pays monthly compensation. If not paid for 3 consecutive months, you can request to terminate the agreement." },
    { id: 29, category: 'Labor Contract', question: "If I'm absent for 3 days, is it 'automatic resignation'?", answer: "No. Chinese law has no 'automatic resignation'. Even if absent, the company must legally decide and serve a termination notice for the relationship to end." },
    { id: 30, category: 'Labor Contract', question: "If only the company has the contract copy, is it invalid?", answer: "No. It's valid if signed/sealed and legal. However, not giving you a copy is a violation; you can complain to labor authorities, but the contract remains effective." },
    { id: 31, category: 'Labor Contract', question: "Can the company change my role/pay at will?", answer: "No. These are major changes requiring mutual written agreement. You can refuse forced changes and claim forced resignation with severance." },
    { id: 32, category: 'Salary \u0026 Benefits', question: "Can the company give compensatory time off instead of 3x holiday pay?", answer: "No. Weekend overtime can be compensated with time off, but statutory holiday overtime must be paid at 300% and cannot be replaced by time off." },
    { id: 33, category: 'Labor Contract', question: "If I sign a service contract, am I not protected by labor law?", answer: "Wrong. Protection depends on the actual labor relationship (management, fixed pay, core business), not the contract name. If it meets labor criteria, labor law applies." },
    { id: 34, category: 'Salary \u0026 Benefits', question: "If paid in cash, do I skip income tax?", answer: "No. Regardless of payment method, income above the threshold must be taxed. The company has a duty to withhold tax; non-payment is tax evasion." },
    { id: 35, category: 'Labor Dispute', question: "What's the most direct way to act on wage arrears?", answer: "Keep your contract, pay stubs, attendance, and communication records. Complain to the labor inspection team or apply for labor arbitration." },
    { id: 36, category: 'Labor Dispute', question: "How do I preserve evidence of overtime?", answer: "Keep written notices, system approvals, clock-in records, work communications, and delivery records. Avoid relying solely on personal clock-ins." },
    { id: 37, category: 'Labor Dispute', question: "How to handle an oral dismissal without reason?", answer: "Don't sign a resignation letter. Demand a written termination notice. Save recordings/chats of the dismissal and apply for arbitration for illegal termination pay." },
    { id: 38, category: 'Labor Dispute', question: "How to correctly claim forced resignation due to company violation?", answer: "Fix evidence of the violation. Send a 'Forced Resignation Notice' via EMS/official email stating reasons. Leave after delivery and apply for arbitration for severance." },
    { id: 39, category: 'Labor Dispute', question: "What materials are needed for labor arbitration?", answer: "Application form, ID copy, company info, labor contract, pay stubs, attendance records, and communication records supporting your claim." },
    { id: 40, category: 'Labor Dispute', question: "How to act if the company won't sign a contract?", answer: "Keep your work ID, attendance, pay stubs, and communications. If working over 1 month but under 1 year without a contract, claim double salary via arbitration." },
    { id: 41, category: 'Social Insurance', question: "What to do if social security payments are interrupted?", answer: "If due to the company, demand they pay or complain to authorities. If personal, locals can pay as flexible workers; non-locals can pay via a new employer." },
    { id: 42, category: 'Labor Dispute', question: "How to handle forced overtime?", answer: "Refuse forced overtime exceeding legal limits. Keep notices/chats. If pay is deducted or you are fired, complain to labor inspection or apply for arbitration." },
    { id: 43, category: 'Salary \u0026 Benefits', question: "What to check on my pay stub?", answer: "Check if base pay, bonuses, and overtime are correct. Verify social security/tax deductions and ensure any absence deductions are reasonable before signing." },
    { id: 44, category: 'Labor Contract', question: "What to note during handover when leaving?", answer: "Make a handover list signed by the recipient and supervisor. Get a resignation certificate. Ensure all wages/severance are settled and check social security stop date." },
    { id: 45, category: 'Labor Contract', question: "What if the company won't pay non-compete compensation?", answer: "Keep the agreement and proof of your compliance. If not paid for 3 consecutive months, notify the company to terminate the agreement and claim arrears via arbitration." },
    { id: 46, category: 'Labor Contract', question: "How to handle forced role/pay changes?", answer: "Submit a written objection immediately. Don't report to the new role. Keep notices/chats. If forced, apply for arbitration to restore the role or claim forced resignation severance." },
    { id: 47, category: 'Labor Contract', question: "What are the rules for foreigners working in China?", answer: "Must have a 'Foreigner's Work Permit' and residence permit. Must sign a contract with a China-registered entity. Working without permits is illegal and not protected by labor law." },
    { id: 48, category: 'Labor Dispute', question: "Are there free legal aid channels for labor disputes?", answer: "Call 12333, visit labor inspection windows, or contact the trade union's legal aid center. Eligible workers can get free legal aid." },
    { id: 49, category: 'Labor Dispute', question: "How to act if the company skips the year-end bonus?", answer: "Keep the contract/rules regarding the bonus and proof you meet conditions. Negotiate first; if failed, apply for arbitration to claim the full amount." },
    { id: 50, category: 'Labor Dispute', question: "What if the company puts me on standby with minimum wage?", answer: "Only legal if due to business suspension or mutual agreement. Forced standby is illegal. Refuse and report for work with proof. Claim wage difference or severance if pay is cut." }
  ]
};

export default function KnowledgeCards() {
  const { t, language } = useTranslation();
  const { setIsOpen, setInitialMessage } = useAIChat();
  const [activeTab, setActiveTab] = useState<'expert' | 'qa'>('expert');
  const [activeCategory, setActiveCategory] = useState(t('knowledge.all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [pinnedCards, setPinnedCards] = useState<Record<string, boolean>>({});

  const currentCategories = categories[language];

  // Sync activeCategory when language changes
  useEffect(() => {
    setActiveCategory(t('knowledge.all'));
  }, [language, t]);

  const filteredExpertCards = useMemo(() => {
    const filtered = expertCards[language].filter(card => {
      const matchesCategory = activeCategory === t('knowledge.all') || card.category === activeCategory;
      const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || card.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    // 置顶的卡片排最前面
    return filtered.sort((a, b) => {
      const aPinned = pinnedCards[a.id] ? 1 : 0;
      const bPinned = pinnedCards[b.id] ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [language, activeCategory, searchQuery, t, pinnedCards]);

  const filteredFlashcards = useMemo(() => {
    const filtered = flashcards[language].filter(card => {
      const matchesCategory = activeCategory === t('knowledge.all') || card.category === activeCategory;
      const matchesSearch = card.question.toLowerCase().includes(searchQuery.toLowerCase()) || card.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    // 置顶的卡片排最前面
    return filtered.sort((a, b) => {
      const aPinned = pinnedCards[`qa-${a.id}`] ? 1 : 0;
      const bPinned = pinnedCards[`qa-${b.id}`] ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [language, activeCategory, searchQuery, t, pinnedCards]);

  const toggleFlip = (id: number) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePin = (id: string) => {
    setPinnedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 点击卡片咨询AI助手
  const handleCardConsult = (question: string) => {
    const message = language === 'zh' 
      ? `我想了解更多关于"${question}"的知识`
      : `I want to learn more about "${question}"`;
    setInitialMessage(message);
    setIsOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* AI助手引导提示 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-bold text-slate-900">
              {language === 'zh' ? '💡 AI助手随时待命' : '💡 AI Assistant Ready to Help'}
            </h3>
            <p className="text-sm text-slate-600">
              {language === 'zh'
                ? '点击任意卡片可咨询AI助手深入了解该话题,获取专业法律建议'
                : 'Click any card to consult AI Assistant for in-depth insights and professional legal advice'}
            </p>
          </div>
        </div>
      </motion.div>

      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">{t('knowledge.title')}</h2>
        <p className="text-slate-500">{t('knowledge.desc')}</p>
      </header>

      {/* Tab Switcher */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('expert')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'expert' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {t('knowledge.expertTab')}
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'qa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            {t('knowledge.qaTab')}
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {currentCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('knowledge.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'expert' ? (
          <motion.div
            key="expert-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredExpertCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {card.category}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePin(card.id)}
                      className={`transition-colors ${pinnedCards[card.id] ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}
                    >
                      <Bookmark className={`h-4 w-4 ${pinnedCards[card.id] ? 'fill-current' : ''}`} />
                    </button>
                    <button className="text-slate-300 hover:text-blue-600">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mb-3 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                  {card.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                  {card.content}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map(tag => (
                      <span key={tag} className="text-xs text-slate-400">#{tag}</span>
                    ))}
                  </div>
                  {/* AI咨询按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardConsult(card.title);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 opacity-0 transition-all hover:bg-blue-100 group-hover:opacity-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {language === 'zh' ? '咨询AI' : 'Ask AI'}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="qa-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {filteredFlashcards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => toggleFlip(card.id)}
                className="perspective-1000 cursor-pointer h-48"
              >
                <div className={`relative h-full w-full transition-all duration-500 preserve-3d ${flippedCards[card.id] ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Q{card.id}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(`qa-${card.id}`);
                          }}
                          className={`transition-colors ${pinnedCards[`qa-${card.id}`] ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}
                        >
                          <Bookmark className={`h-3 w-3 ${pinnedCards[`qa-${card.id}`] ? 'fill-current' : ''}`} />
                        </button>
                        <Sparkles className="h-3 w-3 text-blue-400" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold leading-snug text-slate-900">
                      {card.question}
                    </h4>
                    <div className="absolute bottom-4 right-4 text-[10px] font-medium text-blue-500">
                      {t('knowledge.revealAnswer')}
                    </div>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 rotate-y-180 backface-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{t('knowledge.answerLabel')}</span>
                    </div>
                    <p className="text-xs leading-relaxed overflow-y-auto max-h-[90px] scrollbar-hide">
                      {card.answer}
                    </p>
                    {/* AI咨询按钮 */}
                    <div className="absolute bottom-4 left-5 right-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardConsult(card.question);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/30"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {language === 'zh' ? '深入咨询AI' : 'Ask AI More'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {((activeTab === 'expert' && filteredExpertCards.length === 0) || (activeTab === 'qa' && filteredFlashcards.length === 0)) && (
        <div className="flex flex-col items-center py-20 text-center">
          <BookOpen className="mb-4 h-16 w-16 text-slate-200" />
          <h3 className="mb-2 font-bold text-slate-400">{t('knowledge.noResult')}</h3>
          <p className="text-sm text-slate-400">{t('knowledge.noResultDesc')}</p>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}