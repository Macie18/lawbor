
export interface SpecialDeduction {
  // 子女教育（每个子女2000元/月，3岁以上至博士毕业）
  childrenEducation: number;
  
  // 3岁以下婴幼儿照护（每个子女2000元/月）
  infantCare: number;
  
  // 继续教育类型：学历/职业资格
  continuingEducationType: 'none' | 'academic' | 'professional';
  // 学历继续教育月数（最长48个月）
  continuingEducationMonths: number;
  // ✅ 新增：职业资格取得证书月份（1-12），仅当选择职业资格时有效
  professionalCertMonth?: number;
  
  // 大病医疗年度扣除（最高80000元）
  seriousIllness: number;
  
  // 住房贷款利息（1000元/月，最长240个月）
  housingLoanEnabled: boolean;
  housingLoanMonths: number;
  
  // 住房租金（800-1500元/月，与房贷互斥）
  housingRent: number;
  
  // 赡养老人类型
  elderlyType: 'only' | 'non-only' | 'none';
  // 非独生子女分摊金额（最高1500元/月）
  elderlyShareAmount: number;
}

export interface MonthlyTaxResult {
  month: number;
  grossIncome: number;
  socialInsurance: number;
  specialDeduction: number;
  taxableIncome: number;
  taxRate: number;
  quickDeduction: number;
  monthlyTax: number;
  cumulativeTax: number;
  netIncome: number;
}

export interface BonusTaxResult {
  bonus: number;
  method: 'separate' | 'combined';
  monthlyAverage: number;
  taxRate: number;
  quickDeduction: number;
  tax: number;
  netBonus: number;
}

// ✅ 修正：累计预扣预缴税率表（2026年标准）
// 数据来源：《个人所得税专项附加扣除暂行办法》
// 累计预扣预缴应纳税所得额 = 累计收入 - 累计免税收入 - 累计减除费用 - 累计专项扣除 - 累计专项附加扣除
export const CUMULATIVE_TAX_BRACKETS = [
  { upper: 36000, rate: 0.03, quickDed: 0 },        // 不超过36,000元
  { upper: 144000, rate: 0.10, quickDed: 2520 },     // 超过36,000元至144,000元
  { upper: 300000, rate: 0.20, quickDed: 16920 },    // 超过144,000元至300,000元
  { upper: 420000, rate: 0.25, quickDed: 31920 },    // 超过300,000元至420,000元
  { upper: 660000, rate: 0.30, quickDed: 52920 },    // 超过420,000元至660,000元
  { upper: 960000, rate: 0.35, quickDed: 85920 },    // 超过660,000元至960,000元
  { upper: Infinity, rate: 0.45, quickDed: 181920 }, // 超过960,000元
];

export const THRESHOLD = 5000;

/**
 * 根据累计应纳税所得额查找适用税率和速算扣除数
 * 使用累计预扣预缴税率表（2026年标准）
 */
export function getTaxInfo(taxable: number) {
  for (const bracket of CUMULATIVE_TAX_BRACKETS) {
    if (taxable <= bracket.upper) {
      return { rate: bracket.rate, quickDed: bracket.quickDed };
    }
  }
  return { rate: 0.45, quickDed: 181920 };
}

/**
 * 计算月度专项附加扣除总额
 * 参照《个人所得税专项附加扣除暂行办法》
 */
export function calculateMonthlyDeduction(deductions: SpecialDeduction): number {
  let total = 0;
  
  // 1. 子女教育：每个子女2000元/月（3岁以上至博士毕业）
  total += deductions.childrenEducation * 2000;
  
  // 2. 3岁以下婴幼儿照护：每个子女2000元/月
  total += deductions.infantCare * 2000;
  
  // 3. 继续教育
  if (deductions.continuingEducationType === 'academic') {
    // 学历继续教育：400元/月，最长48个月
    const months = Math.min(deductions.continuingEducationMonths || 1, 48);
    total += 400; // 每月固定400元，在有效期内
  } else if (deductions.continuingEducationType === 'professional') {
    // ✅ 修复：职业资格继续教育：3600元/年（取得证书当年）
    // 按剩余月份扣除：如6月取得，则扣除12-6+1=7个月
    const certMonth = deductions.professionalCertMonth || 1;
    const remainingMonths = 13 - certMonth; // 取得证书月份到年底的月数
    const monthlyDeduction = 3600 / 12; // 300元/月
    total += monthlyDeduction * remainingMonths;
  }
  
  // 4. 大病医疗：年度扣除，月度计算时不计入
  // （在年度汇算时扣除，最高80000元）
  
  // 5. 住房贷款利息：1000元/月，最长240个月
  // 与住房租金互斥，只能选择其一
  if (deductions.housingLoanEnabled && deductions.housingRent === 0) {
    total += 1000;
  }
  
  // 6. 住房租金：800-1500元/月（与房贷互斥）
  // 直辖市/省会/计划单列市：1500元
  // 市辖区人口>100万：1100元
  // 市辖区人口≤100万：800元
  if (!deductions.housingLoanEnabled && deductions.housingRent > 0) {
    total += deductions.housingRent;
  }
  
  // 7. 赡养老人
  // 独生子女：3000元/月
  // 非独生子女：最高1500元/月（兄弟姐妹分摊3000元）
  if (deductions.elderlyType === 'only') {
    total += 3000;
  } else if (deductions.elderlyType === 'non-only') {
    // 非独生子女分摊金额，最高1500元
    total += Math.min(deductions.elderlyShareAmount || 1500, 1500);
  }
  
  return total;
}

/**
 * 计算年度专项附加扣除（包含大病医疗）
 */
export function calculateAnnualDeduction(deductions: SpecialDeduction): number {
  const monthlyDeduction = calculateMonthlyDeduction(deductions);
  let annualTotal = monthlyDeduction * 12;
  
  // 加上大病医疗年度扣除（最高80000元）
  if (deductions.seriousIllness > 0) {
    annualTotal += Math.min(deductions.seriousIllness, 80000);
  }
  
  return annualTotal;
}

export function calculateMonthlyTax(
  monthlySalary: number,
  socialInsurance: number,
  specialDeductions: SpecialDeduction,
  month: number = 1,
  cumulativeIncome: number = 0,
  cumulativeSocial: number = 0,
  cumulativeDeduction: number = 0,
  cumulativeTaxPaid: number = 0
): MonthlyTaxResult {
  const monthlyDeduction = calculateMonthlyDeduction(specialDeductions);
  
  const cumIncome = cumulativeIncome + monthlySalary;
  const cumSocial = cumulativeSocial + socialInsurance;
  const cumDeduction = cumulativeDeduction + monthlyDeduction;
  
  let cumTaxable = cumIncome - cumSocial - cumDeduction - THRESHOLD * month;
  cumTaxable = Math.max(0, cumTaxable);
  
  const { rate, quickDed } = getTaxInfo(cumTaxable);
  const cumTax = cumTaxable * rate - quickDed;
  
  let monthlyTax = cumTax - cumulativeTaxPaid;
  monthlyTax = Math.max(0, monthlyTax);
  
  return {
    month,
    grossIncome: monthlySalary,
    socialInsurance,
    specialDeduction: monthlyDeduction,
    taxableIncome: cumTaxable,
    taxRate: rate,
    quickDeduction: quickDed,
    monthlyTax,
    cumulativeTax: cumTax,
    netIncome: monthlySalary - socialInsurance - monthlyTax,
  };
}

export function calculateAnnualTax(
  monthlySalary: number,
  socialInsurance: number,
  specialDeductions: SpecialDeduction
): MonthlyTaxResult[] {
  const results: MonthlyTaxResult[] = [];
  let cumIncome = 0;
  let cumSocial = 0;
  let cumDeduction = 0;
  let cumTax = 0;
  
  for (let m = 1; m <= 12; m++) {
    const res = calculateMonthlyTax(
      monthlySalary,
      socialInsurance,
      specialDeductions,
      m,
      cumIncome,
      cumSocial,
      cumDeduction,
      cumTax
    );
    results.push(res);
    cumIncome += monthlySalary;
    cumSocial += socialInsurance;
    cumDeduction += res.specialDeduction;
    cumTax = res.cumulativeTax;
  }
  return results;
}

export function calculateBonusSeparate(bonus: number): BonusTaxResult {
  const monthlyAvg = bonus / 12;
  const { rate, quickDed } = getTaxInfo(monthlyAvg);
  const tax = bonus * rate - quickDed;
  
  return {
    bonus,
    method: 'separate',
    monthlyAverage: monthlyAvg,
    taxRate: rate,
    quickDeduction: quickDed,
    tax,
    netBonus: bonus - tax,
  };
}

export function calculateBonusCombined(
  bonus: number,
  monthlySalary: number,
  socialInsurance: number,
  specialDeductions: SpecialDeduction
): BonusTaxResult {
  const annualResults = calculateAnnualTax(monthlySalary, socialInsurance, specialDeductions);
  const taxWithoutBonus = annualResults.length > 0 ? annualResults[annualResults.length - 1].cumulativeTax : 0;
  
  // 使用年度扣除计算（含大病医疗）
  const annualDeduction = calculateAnnualDeduction(specialDeductions);
  const monthlyDeduction = calculateMonthlyDeduction(specialDeductions);
  const annualIncome = monthlySalary * 12 + bonus;
  const annualSocial = socialInsurance * 12;
  
  // 年度应税所得 = 年收入 - 年社保 - 年专项附加扣除 - 60000起征点
  let annualTaxable = annualIncome - annualSocial - annualDeduction - THRESHOLD * 12;
  annualTaxable = Math.max(0, annualTaxable);
  
  const { rate, quickDed } = getTaxInfo(annualTaxable);
  const taxWithBonus = annualTaxable * rate - quickDed;
  const bonusTax = taxWithBonus - taxWithoutBonus;
  
  return {
    bonus,
    method: 'combined',
    monthlyAverage: 0,
    taxRate: rate,
    quickDeduction: quickDed,
    tax: bonusTax,
    netBonus: bonus - bonusTax,
  };
}

export function reverseGrossFromNet(
  targetNet: number,
  socialInsurance: number,
  specialDeductions: SpecialDeduction
): number {
  let gross = targetNet + socialInsurance;
  for (let i = 0; i < 100; i++) {
    const res = calculateMonthlyTax(gross, socialInsurance, specialDeductions);
    const diff = targetNet - res.netIncome;
    if (Math.abs(diff) < 0.01) return gross;
    gross += diff / (1 - res.taxRate);
  }
  return gross;
}

// ✅ 新增：省份到基准城市的映射表（34个省级行政区 → 7个基准城市）
export const PROVINCE_TO_CITY: Record<string, string> = {
  // 直辖市（4个）
  'beijing': 'beijing',
  'tianjin': 'beijing',
  'shanghai': 'shanghai',
  'chongqing': 'chengdu',
  
  // 省份 - 华北（3个）
  'hebei': 'beijing',
  'shanxi': 'beijing',
  
  // 省份 - 东北（3个）
  'liaoning': 'beijing',
  'jilin': 'beijing',
  'heilongjiang': 'beijing',
  
  // 省份 - 华东（7个）
  'jiangsu': 'shanghai',
  'zhejiang': 'hangzhou',
  'anhui': 'hangzhou',
  'fujian': 'guangzhou',
  'jiangxi': 'guangzhou',
  'shandong': 'beijing',
  'taiwan': 'default',
  
  // 省份 - 华中（3个）
  'henan': 'beijing',
  'hubei': 'chengdu',
  'hunan': 'guangzhou',
  
  // 省份 - 华南（3个）
  'guangdong': 'guangzhou',
  'hainan': 'guangzhou',
  
  // 省份 - 西南（4个，含重庆已计算）
  'sichuan': 'chengdu',
  'guizhou': 'chengdu',
  'yunnan': 'chengdu',
  
  // 省份 - 西北（5个）
  'shaanxi': 'chengdu',
  'gansu': 'chengdu',
  'qinghai': 'chengdu',
  
  // 自治区（5个）
  'neimenggu': 'beijing',
  'guangxi': 'guangzhou',
  'xizang': 'chengdu',
  'ningxia': 'chengdu',
  'xinjiang': 'chengdu',
  
  // 特别行政区（2个）
  'hongkong': 'shenzhen',
  'macau': 'guangzhou',
};

export const SOCIAL_RATES: Record<string, any> = {
  'beijing': {
    pension: { personal: 0.08, company: 0.16 },
    medical: { personal: 0.02, company: 0.10 },
    unemployment: { personal: 0.005, company: 0.005 },
    injury: { personal: 0, company: 0.004 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.12, company: 0.12 },
    min: 6326,
    max: 33891,
  },
  'shanghai': {
    pension: { personal: 0.08, company: 0.16 },
    medical: { personal: 0.02, company: 0.10 },
    unemployment: { personal: 0.005, company: 0.005 },
    injury: { personal: 0, company: 0.0026 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.07, company: 0.07 },
    min: 7310,
    max: 36549,
  },
  'shenzhen': {
    pension: { personal: 0.08, company: 0.15 },
    medical: { personal: 0.02, company: 0.06 },
    unemployment: { personal: 0.003, company: 0.007 },
    injury: { personal: 0, company: 0.0014 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.05, company: 0.05 },
    min: 2360,
    max: 38863,
  },
  'guangzhou': {
    pension: { personal: 0.08, company: 0.15 },
    medical: { personal: 0.02, company: 0.055 },
    unemployment: { personal: 0.005, company: 0.005 },
    injury: { personal: 0, company: 0.0015 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.05, company: 0.05 },
    min: 2300,
    max: 36072,
  },
  'hangzhou': {
    pension: { personal: 0.08, company: 0.15 },
    medical: { personal: 0.02, company: 0.099 },
    unemployment: { personal: 0.005, company: 0.005 },
    injury: { personal: 0, company: 0.0025 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.12, company: 0.12 },
    min: 3957,
    max: 22311,
  },
  'chengdu': {
    pension: { personal: 0.08, company: 0.16 },
    medical: { personal: 0.02, company: 0.069 },
    unemployment: { personal: 0.004, company: 0.006 },
    injury: { personal: 0, company: 0.0023 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.05, company: 0.05 },
    min: 4071,
    max: 20355,
  },
  'default': {
    pension: { personal: 0.08, company: 0.16 },
    medical: { personal: 0.02, company: 0.08 },
    unemployment: { personal: 0.005, company: 0.005 },
    injury: { personal: 0, company: 0.002 },
    maternity: { personal: 0, company: 0 },
    fund: { personal: 0.12, company: 0.12 },
    min: 0,
    max: 1000000,
  }
};

export function calculateSocialInsurance(salary: number, city: string, customFundRate?: number) {
  const rates = SOCIAL_RATES[city] || SOCIAL_RATES['default'];
  const base = Math.max(rates.min, Math.min(salary, rates.max));
  const fundRate = customFundRate !== undefined ? customFundRate / 100 : rates.fund.personal;
  
  const personal = {
    pension: base * rates.pension.personal,
    medical: base * rates.medical.personal,
    unemployment: base * rates.unemployment.personal,
    fund: base * fundRate,
  };
  
  const company = {
    pension: base * rates.pension.company,
    medical: base * rates.medical.company,
    unemployment: base * rates.unemployment.company,
    injury: base * rates.injury.company,
    maternity: base * rates.maternity.company,
    fund: base * rates.fund.company,
  };
  
  const totalPersonal = Object.values(personal).reduce((a, b) => a + b, 0);
  const totalCompany = Object.values(company).reduce((a, b) => a + b, 0);
  
  return {
    base,
    personal,
    company,
    totalPersonal,
    totalCompany,
  };
}

/**
 * 检测年终奖"多发1元陷阱"
 * 基于累计预扣预缴税率表（2026年标准）
 * 年终奖除以12个月后，查找对应税率档次
 */
export function checkBonusTrap(bonus: number) {
  const traps = [
    // 基于累计预扣税率表的边界值（除以12个月）
    { start: 36000, end: 36000 + 2300, msg: '多发1元，多缴税¥2300+' },
    { start: 144000, end: 144000 + 13000, msg: '多发1元，多缴税¥13000+' },
    { start: 300000, end: 300000 + 13750, msg: '多发1元，多缴税¥13750+' },
    { start: 420000, end: 420000 + 13600, msg: '多发1元，多缴税¥13600+' },
    { start: 660000, end: 660000 + 13000, msg: '多发1元，多缴税¥13000+' },
    { start: 960000, end: 960000 + 12800, msg: '多发1元，多缴税¥12800+' },
  ];
  
  for (const trap of traps) {
    if (bonus > trap.start && bonus < trap.end) {
      return trap.msg;
    }
  }
  return null;
}

// ✅ 新增：其他收入类型接口
export interface OtherIncome {
  laborIncome: number;      // 劳务报酬
  royaltyIncome: number;    // 稿酬
  franchiseIncome: number;  // 特许权使用费
}

// ✅ 新增：劳务报酬预扣计算（按次）
export function calculateLaborTax(income: number): number {
  if (income <= 0) return 0;
  
  // 不超过4000元，减除800元后按20%预扣
  if (income <= 4000) {
    return Math.max(0, (income - 800) * 0.2);
  }
  
  // 超过4000元，减除20%费用后，按20%/30%/40%预扣
  const taxable = income * 0.8;
  
  if (taxable <= 20000) {
    return taxable * 0.2;
  } else if (taxable <= 50000) {
    return taxable * 0.3 - 2000;
  } else {
    return taxable * 0.4 - 7000;
  }
}

// ✅ 新增：稿酬预扣计算（按次）
export function calculateRoyaltyTax(income: number): number {
  if (income <= 0) return 0;
  
  // 不超过4000元，减除800元后，70%计入收入，20%预扣
  if (income <= 4000) {
    return Math.max(0, (income - 800) * 0.7 * 0.2);
  }
  
  // 超过4000元，减除20%费用后，70%计入收入，20%预扣
  return income * 0.8 * 0.7 * 0.2;
}

// ✅ 新增：特许权使用费预扣计算（按次）
export function calculateFranchiseTax(income: number): number {
  if (income <= 0) return 0;
  
  // 不超过4000元，减除800元后按20%预扣
  if (income <= 4000) {
    return Math.max(0, (income - 800) * 0.2);
  }
  
  // 超过4000元，减除20%费用后按20%预扣
  return income * 0.8 * 0.2;
}

// ✅ 新增：计算其他收入的应税所得额（用于年度汇算）
export function calculateOtherIncomeTaxable(otherIncome: OtherIncome): number {
  // 劳务报酬：收入 × (1 - 20%)
  const laborTaxable = otherIncome.laborIncome * 0.8;
  
  // 稿酬：收入 × 70% × (1 - 20%) = 收入 × 56%
  const royaltyTaxable = otherIncome.royaltyIncome * 0.56;
  
  // 特许权使用费：收入 × (1 - 20%)
  const franchiseTaxable = otherIncome.franchiseIncome * 0.8;
  
  return laborTaxable + royaltyTaxable + franchiseTaxable;
}

// ✅ 新增：年度汇算清缴输入接口
export interface AnnualSettlementInput {
  annualSalary: number;           // 年度工资总额（税前）
  annualBonus: number;            // 年终奖（已选择单独计税或合并）
  otherIncome: OtherIncome;       // 其他收入来源
  socialInsurance: number;        // 年度社保个人部分总额
  specialDeductions: SpecialDeduction; // 专项附加扣除
  prepaidTax: number;             // 已预缴税额总额
}

// ✅ 新增：年度汇算清缴结果接口
export interface AnnualSettlementResult {
  totalIncome: number;            // 年度总收入
  salaryTaxable: number;          // 工资应税所得
  bonusTaxable: number;           // 年终奖应税所得（合并计税）
  otherIncomeTaxable: number;     // 其他收入应税所得
  socialInsurance: number;        // 社保扣除
  annualDeduction: number;        // 专项附加扣除
  threshold: number;              // 起征点（60000）
  taxableIncome: number;          // 年度应税所得
  taxRate: number;                // 适用税率
  quickDeduction: number;         // 速算扣除数
  annualTax: number;              // 年度应纳税额
  prepaidTax: number;             // 已预缴税额
  refundOrPay: number;           // 应补/应退税额（正数=补税，负数=退税）
}

// ✅ 新增：年度汇算清缴计算函数
export function calculateAnnualSettlement(
  input: AnnualSettlementInput
): AnnualSettlementResult {
  // 1. 计算工资应税所得（年度工资 - 年度社保）
  const salaryTaxable = Math.max(0, input.annualSalary - input.socialInsurance);
  
  // 2. 年终奖应税所得（合并计税时才计入）
  const bonusTaxable = input.annualBonus;
  
  // 3. 其他收入应税所得
  const otherIncomeTaxable = calculateOtherIncomeTaxable(input.otherIncome);
  
  // 4. 年度总收入
  const totalIncome = input.annualSalary + input.annualBonus + 
    input.otherIncome.laborIncome + 
    input.otherIncome.royaltyIncome + 
    input.otherIncome.franchiseIncome;
  
  // 5. 专项附加扣除（含大病医疗）
  const annualDeduction = calculateAnnualDeduction(input.specialDeductions);
  
  // 6. 起征点（年度60000）
  const threshold = THRESHOLD * 12;
  
  // 7. 年度应税所得 = 工资应税所得 + 年终奖 + 其他收入应税所得 - 专项附加扣除 - 起征点
  const taxableIncome = Math.max(0, 
    salaryTaxable + bonusTaxable + otherIncomeTaxable - annualDeduction - threshold
  );
  
  // 8. 查找适用税率和速算扣除数
  const { rate, quickDed } = getTaxInfo(taxableIncome);
  
  // 9. 年度应纳税额
  const annualTax = taxableIncome * rate - quickDed;
  
  // 10. 应补/应退税额 = 年度应纳税额 - 已预缴税额
  const refundOrPay = annualTax - input.prepaidTax;
  
  return {
    totalIncome,
    salaryTaxable,
    bonusTaxable,
    otherIncomeTaxable,
    socialInsurance: input.socialInsurance,
    annualDeduction,
    threshold,
    taxableIncome,
    taxRate: rate,
    quickDeduction: quickDed,
    annualTax,
    prepaidTax: input.prepaidTax,
    refundOrPay,
  };
}
