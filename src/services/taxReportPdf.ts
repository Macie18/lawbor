/**
 * 税务计算报告 PDF 生成服务
 * 
 * 功能：将五大税务计算模块的内容导出为专业 PDF 报告
 * 1. 月度工资计算
 * 2. 年终奖计算
 * 3. 五险一金计算
 * 4. 税后反推计算
 * 5. 年度汇算估算
 */

import { jsPDF } from 'jspdf';
import type { 
  MonthlyTaxResult, 
  BonusTaxResult, 
  SpecialDeduction 
} from '../lib/taxUtils';

// 社保计算结果类型
interface SocialResult {
  base: number;
  personal: {
    pension: number;
    medical: number;
    unemployment: number;
    fund: number;
  };
  company: {
    pension: number;
    medical: number;
    unemployment: number;
    injury: number;
    maternity: number;
    fund: number;
  };
  totalPersonal: number;
  totalCompany: number;
}

// 完整的税务报告数据
export interface TaxReportData {
  // 基本输入
  salary: number;
  bonus: number;
  targetNet: number;
  selectedCity: string;
  customFundRate: number;
  deductions: SpecialDeduction;
  
  // 计算结果
  monthlyResult: MonthlyTaxResult;
  bonusResults: {
    separate: BonusTaxResult;
    combined: BonusTaxResult;
    trap: string | null;
  };
  reverseResult: number;
  socialResult: SocialResult;
  
  // 语言
  language: 'zh' | 'en';
}

// 城市名称映射
const CITY_NAMES: Record<string, { zh: string; en: string }> = {
  beijing: { zh: '北京', en: 'Beijing' },
  shanghai: { zh: '上海', en: 'Shanghai' },
  shenzhen: { zh: '深圳', en: 'Shenzhen' },
  guangzhou: { zh: '广州', en: 'Guangzhou' },
  hangzhou: { zh: '杭州', en: 'Hangzhou' },
  chengdu: { zh: '成都', en: 'Chengdu' },
};

// 格式化金额
function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// 添加章节标题
function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(15, y, 180, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 20, y + 7);
  return y + 15;
}

// 添加数据行
function addDataRow(doc: jsPDF, label: string, value: string, y: number, isHighlight = false): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(label, 20, y);
  
  doc.setFont('helvetica', 'bold');
  if (isHighlight) {
    doc.setTextColor(59, 130, 246); // blue-500
  } else {
    doc.setTextColor(15, 23, 42); // slate-900
  }
  doc.text(value, 150, y, { align: 'right' });
  
  // 分隔线
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, y + 3, 190, y + 3);
  
  return y + 8;
}

// 添加表格
function addTable(doc: jsPDF, headers: string[], rows: string[][], startY: number): number {
  const colWidth = 170 / headers.length;
  const rowHeight = 8;
  
  // 表头
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(20, startY, 170, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  
  headers.forEach((header, i) => {
    doc.text(header, 20 + i * colWidth + 5, startY + 6);
  });
  
  let y = startY + rowHeight;
  
  // 数据行
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  rows.forEach((row, rowIndex) => {
    // 斑马纹背景
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, y, 170, rowHeight, 'F');
    }
    
    row.forEach((cell, i) => {
      doc.text(cell, 20 + i * colWidth + 5, y + 6);
    });
    
    y += rowHeight;
  });
  
  return y + 5;
}

/**
 * 生成税务计算报告 PDF
 */
export function generateTaxReportPdf(data: TaxReportData): void {
  const { language } = data;
  const isZh = language === 'zh';
  
  // 创建 PDF 文档
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // 标题
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(isZh ? '税务计算报告' : 'Tax Calculation Report', 105, 20, { align: 'center' });
  
  // 副标题
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString(isZh ? 'zh-CN' : 'en-US');
  doc.text(isZh ? `生成时间：${dateStr}` : `Generated: ${dateStr}`, 105, 28, { align: 'center' });
  
  let y = 40;
  
  // ==================== 1. 月度工资计算 ====================
  y = addSectionTitle(doc, isZh ? '一、月度工资计算' : '1. Monthly Salary Calculation', y);
  
  const cityName = CITY_NAMES[data.selectedCity]?.[language] || data.selectedCity;
  
  y = addDataRow(doc, isZh ? '税前月薪' : 'Gross Salary', formatMoney(data.salary), y);
  y = addDataRow(doc, isZh ? '所在城市' : 'City', cityName, y);
  y = addDataRow(doc, isZh ? '五险一金(个人)' : 'Social Insurance (Personal)', formatMoney(data.monthlyResult.socialInsurance), y);
  y = addDataRow(doc, isZh ? '专项附加扣除' : 'Special Deductions', formatMoney(data.monthlyResult.specialDeduction), y);
  y = addDataRow(doc, isZh ? '应纳税所得额' : 'Taxable Income', formatMoney(data.monthlyResult.taxableIncome), y);
  y = addDataRow(doc, isZh ? '适用税率' : 'Tax Rate', `${(data.monthlyResult.taxRate * 100).toFixed(0)}%`, y);
  y = addDataRow(doc, isZh ? '应缴个税' : 'Tax Payable', formatMoney(data.monthlyResult.monthlyTax), y);
  y = addDataRow(doc, isZh ? '税后实得' : 'Net Income', formatMoney(data.monthlyResult.netIncome), y, true);
  
  y += 5;
  
  // ==================== 2. 年终奖计算 ====================
  y = addSectionTitle(doc, isZh ? '二、年终奖计算' : '2. Annual Bonus Calculation', y);
  
  y = addDataRow(doc, isZh ? '年终奖金额' : 'Bonus Amount', formatMoney(data.bonus), y);
  
  // 对比表格
  const bonusHeaders = [
    isZh ? '计税方式' : 'Method',
    isZh ? '应缴税额' : 'Tax',
    isZh ? '税后奖金' : 'Net Bonus'
  ];
  const bonusRows = [
    [isZh ? '单独计税' : 'Separate', formatMoney(data.bonusResults.separate.tax), formatMoney(data.bonusResults.separate.netBonus)],
    [isZh ? '合并计税' : 'Combined', formatMoney(data.bonusResults.combined.tax), formatMoney(data.bonusResults.combined.netBonus)],
  ];
  y = addTable(doc, bonusHeaders, bonusRows, y);
  
  // 推荐方案
  const recommendedSeparate = data.bonusResults.separate.tax <= data.bonusResults.combined.tax;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94); // green-500
  doc.text(
    isZh 
      ? `推荐：${recommendedSeparate ? '单独计税' : '合并计税'}，可节省 ${formatMoney(Math.abs(data.bonusResults.separate.tax - data.bonusResults.combined.tax))}`
      : `Recommended: ${recommendedSeparate ? 'Separate' : 'Combined'}, saves ${formatMoney(Math.abs(data.bonusResults.separate.tax - data.bonusResults.combined.tax))}`,
    20, y
  );
  y += 5;
  
  // 年终奖陷阱警告
  if (data.bonusResults.trap) {
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text(`⚠ ${data.bonusResults.trap}`, 20, y + 5);
    y += 10;
  }
  
  y += 5;
  
  // ==================== 3. 五险一金计算 ====================
  y = addSectionTitle(doc, isZh ? '三、五险一金明细' : '3. Social Insurance Details', y);
  
  y = addDataRow(doc, isZh ? '缴费基数' : 'Contribution Base', formatMoney(data.socialResult.base), y);
  
  // 个人缴纳明细
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(isZh ? '个人缴纳：' : 'Personal:', 20, y);
  y += 6;
  
  y = addDataRow(doc, isZh ? '  养老保险(8%)' : '  Pension (8%)', formatMoney(data.socialResult.personal.pension), y);
  y = addDataRow(doc, isZh ? '  医疗保险(2%)' : '  Medical (2%)', formatMoney(data.socialResult.personal.medical), y);
  y = addDataRow(doc, isZh ? '  失业保险(0.5%)' : '  Unemployment (0.5%)', formatMoney(data.socialResult.personal.unemployment), y);
  y = addDataRow(doc, isZh ? '  住房公积金' : '  Housing Fund', formatMoney(data.socialResult.personal.fund), y);
  y = addDataRow(doc, isZh ? '个人缴纳合计' : 'Personal Total', formatMoney(data.socialResult.totalPersonal), y, true);
  
  y += 3;
  
  // 公司缴纳明细
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(isZh ? '公司缴纳：' : 'Company:', 20, y);
  y += 6;
  
  y = addDataRow(doc, isZh ? '  养老保险' : '  Pension', formatMoney(data.socialResult.company.pension), y);
  y = addDataRow(doc, isZh ? '  医疗保险' : '  Medical', formatMoney(data.socialResult.company.medical), y);
  y = addDataRow(doc, isZh ? '  失业保险' : '  Unemployment', formatMoney(data.socialResult.company.unemployment), y);
  y = addDataRow(doc, isZh ? '  工伤保险' : '  Injury', formatMoney(data.socialResult.company.injury), y);
  y = addDataRow(doc, isZh ? '  住房公积金' : '  Housing Fund', formatMoney(data.socialResult.company.fund), y);
  y = addDataRow(doc, isZh ? '公司缴纳合计' : 'Company Total', formatMoney(data.socialResult.totalCompany), y);
  
  y += 5;
  
  // ==================== 4. 税后反推计算 ====================
  y = addSectionTitle(doc, isZh ? '四、税后反推计算' : '4. Reverse Calculation', y);
  
  y = addDataRow(doc, isZh ? '期望税后收入' : 'Target Net Income', formatMoney(data.targetNet), y);
  y = addDataRow(doc, isZh ? '所需税前收入' : 'Required Gross', formatMoney(data.reverseResult), y, true);
  
  const gap = data.reverseResult - data.targetNet;
  y = addDataRow(doc, isZh ? '差额(税费+社保)' : 'Gap (Tax + Social)', formatMoney(gap), y);
  
  y += 5;
  
  // ==================== 5. 年度汇算估算 ====================
  // 检查是否需要新页面
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  
  y = addSectionTitle(doc, isZh ? '五、年度汇算估算' : '5. Annual Settlement Estimate', y);
  
  const annualGross = data.salary * 12;
  const annualSocial = data.monthlyResult.socialInsurance * 12;
  const annualTax = data.monthlyResult.cumulativeTax;
  const annualNet = data.monthlyResult.netIncome * 12;
  
  y = addDataRow(doc, isZh ? '年度税前总收入' : 'Annual Gross', formatMoney(annualGross), y);
  y = addDataRow(doc, isZh ? '年度五险一金' : 'Annual Social Insurance', formatMoney(annualSocial), y);
  y = addDataRow(doc, isZh ? '年度专项扣除' : 'Annual Special Deductions', formatMoney(data.monthlyResult.specialDeduction * 12), y);
  y = addDataRow(doc, isZh ? '年度应缴个税' : 'Annual Tax', formatMoney(annualTax), y);
  y = addDataRow(doc, isZh ? '年度税后实得' : 'Annual Net Income', formatMoney(annualNet), y, true);
  
  y += 10;
  
  // ==================== 免责声明 ====================
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(15, y, 180, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(isZh ? '免责声明' : 'Disclaimer', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // amber-900
  const disclaimer = isZh 
    ? '本报告仅供参考，实际税费请以税务机关核定为准。计算结果基于当前输入参数，实际情况可能因政策调整、个人情况差异而有所不同。'
    : 'This report is for reference only. Actual taxes should be based on tax authority determination. Results are based on current inputs and may vary due to policy changes or personal circumstances.';
  
  // 自动换行
  const lines = doc.splitTextToSize(disclaimer, 170);
  doc.text(lines, 20, y + 12);
  
  // 页脚
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    isZh ? 'Lawbor 税务计算器' : 'Lawbor Tax Calculator',
    105, 285, { align: 'center' }
  );
  
  // 保存 PDF
  const fileName = isZh 
    ? `税务计算报告_${new Date().toISOString().split('T')[0]}.pdf`
    : `Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  
  doc.save(fileName);
}