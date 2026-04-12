
export interface SpecialDeduction {
  // 子女教育（每个子女2000元/月，3岁以上至博士毕业）
  childrenEducation: number;
  
  // 3岁以下婴幼儿照护（每个子女2000元/月）
  infantCare: number;
  
  // 继续教育类型：学历/职业资格
  continuingEducationType: 'none' | 'academic' | 'professional';
  // 学历继续教育月数（最长48个月）
  continuingEducationMonths: number;
  
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

export const MONTHLY_TAX_BRACKETS = [
  { upper: 3000, rate: 0.03, quickDed: 0 },
  { upper: 12000, rate: 0.10, quickDed: 210 },
  { upper: 25000, rate: 0.20, quickDed: 1410 },
  { upper: 35000, rate: 0.25, quickDed: 2660 },
  { upper: 55000, rate: 0.30, quickDed: 4410 },
  { upper: 80000, rate: 0.35, quickDed: 7160 },
  { upper: Infinity, rate: 0.45, quickDed: 15160 },
];

export const THRESHOLD = 5000;

export function getTaxInfo(taxable: number) {
  for (const bracket of MONTHLY_TAX_BRACKETS) {
    if (taxable <= bracket.upper) {
      return { rate: bracket.rate, quickDed: bracket.quickDed };
    }
  }
  return { rate: 0.45, quickDed: 15160 };
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
    // 职业资格继续教育：3600元/年（取得证书当年）
    // 折算月度：3600/12 = 300元/月
    total += 300;
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

export function checkBonusTrap(bonus: number) {
  const traps = [
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
