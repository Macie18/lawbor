/**
 * 税务计算报告 PDF 生成服务
 * 
 * 功能：将五大税务计算模块的内容导出为专业 PDF 报告
 * 使用 html2pdf.js，原生支持中文
 * 
 * 注意：由于 Tailwind CSS v4 使用 oklch 颜色格式，html2pdf.js 不支持
 * 解决方案：临时禁用 Tailwind 样式表，生成完成后恢复
 */

import html2pdf from 'html2pdf.js';
import type { 
  MonthlyTaxResult, 
  BonusTaxResult, 
  SpecialDeduction,
  OtherIncome,
  AnnualSettlementResult
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
  
  // 年度明细（每月）
  annualResults?: MonthlyTaxResult[];
  
  // ✅ 新增：其他收入
  otherIncome?: OtherIncome;
  
  // ✅ 新增：其他收入预扣税额
  otherIncomeTax?: {
    laborTax: number;
    royaltyTax: number;
    franchiseTax: number;
    totalTax: number;
  };
  
  // ✅ 新增：年度汇算清缴结果
  settlementResult?: AnnualSettlementResult;
  
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

/**
 * 生成税务计算报告 PDF
 */
export function generateTaxReportPdf(data: TaxReportData): void {
  const { language } = data;
  const isZh = language === 'zh';
  const cityName = CITY_NAMES[data.selectedCity]?.[language] || data.selectedCity;
  
  const annualGross = data.salary * 12;
  const annualSocial = data.monthlyResult.socialInsurance * 12;
  const annualTax = data.monthlyResult.cumulativeTax;
  const annualNet = data.monthlyResult.netIncome * 12;
  
  // 推荐方案
  const recommendedSeparate = data.bonusResults.separate.tax <= data.bonusResults.combined.tax;
  const savedAmount = Math.abs(data.bonusResults.separate.tax - data.bonusResults.combined.tax);
  
  // 构建 HTML 内容
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
      <!-- 标题 -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #0f172a; margin: 0;">
          ${isZh ? '税务计算报告' : 'Tax Calculation Report'}
        </h1>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px;">
          ${isZh ? `生成时间：${new Date().toLocaleDateString('zh-CN')}` : `Generated: ${new Date().toLocaleDateString('en-US')}`}
        </p>
      </div>
      
      <!-- 1. 月度工资计算 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '一、月度工资计算' : '1. Monthly Salary Calculation'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '税前月薪' : 'Gross Salary'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.salary)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '所在城市' : 'City'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${cityName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '五险一金(个人)' : 'Social Insurance (Personal)'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.monthlyResult.socialInsurance)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '专项附加扣除' : 'Special Deductions'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.monthlyResult.specialDeduction)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '应纳税所得额' : 'Taxable Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.monthlyResult.taxableIncome)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '适用税率' : 'Tax Rate'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${(data.monthlyResult.taxRate * 100).toFixed(0)}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '应缴个税' : 'Tax Payable'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.monthlyResult.monthlyTax)}</td>
          </tr>
          <tr style="background: #f0f9ff;">
            <td style="padding: 10px 15px; color: #475569; font-weight: bold;">${isZh ? '税后实得' : 'Net Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: bold; color: #3b82f6; font-size: 16px;">${formatMoney(data.monthlyResult.netIncome)}</td>
          </tr>
        </table>
      </div>
      
      <!-- 2. 年终奖计算 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '二、年终奖计算' : '2. Annual Bonus Calculation'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年终奖金额' : 'Bonus Amount'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.bonus)}</td>
          </tr>
        </table>
        
        <!-- 对比表格 -->
        <table style="width: 100%; border-collapse: collapse; background: white; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 10px 15px; text-align: left; font-weight: 600; color: #334155;">${isZh ? '计税方式' : 'Method'}</th>
              <th style="padding: 10px 15px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '应缴税额' : 'Tax'}</th>
              <th style="padding: 10px 15px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '税后奖金' : 'Net Bonus'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 15px; color: #475569;">${isZh ? '单独计税' : 'Separate'}</td>
              <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.bonusResults.separate.tax)}</td>
              <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.bonusResults.separate.netBonus)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 15px; color: #475569;">${isZh ? '合并计税' : 'Combined'}</td>
              <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.bonusResults.combined.tax)}</td>
              <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.bonusResults.combined.netBonus)}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- 推荐 -->
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 15px; margin-top: 10px; color: #16a34a; font-weight: 600;">
          ✓ ${isZh 
            ? `推荐：${recommendedSeparate ? '单独计税' : '合并计税'}，可节省 ${formatMoney(savedAmount)}` 
            : `Recommended: ${recommendedSeparate ? 'Separate' : 'Combined'}, saves ${formatMoney(savedAmount)}`}
        </div>
        
        ${data.bonusResults.trap ? `
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 15px; margin-top: 10px; color: #d97706;">
          ⚠ ${data.bonusResults.trap}
        </div>
        ` : ''}
      </div>
      
      <!-- 3. 五险一金明细 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '三、五险一金明细' : '3. Social Insurance Details'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '缴费基数' : 'Contribution Base'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.socialResult.base)}</td>
          </tr>
        </table>
        
        <!-- 个人缴纳 -->
        <div style="padding: 10px 15px; background: #f8fafc; font-weight: bold; color: #334155;">
          ${isZh ? '个人缴纳：' : 'Personal:'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '养老保险(8%)' : 'Pension (8%)'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.personal.pension)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '医疗保险(2%)' : 'Medical (2%)'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.personal.medical)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '失业保险(0.5%)' : 'Unemployment (0.5%)'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.personal.unemployment)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '住房公积金' : 'Housing Fund'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.personal.fund)}</td>
          </tr>
          <tr style="background: #f0f9ff;">
            <td style="padding: 8px 15px 8px 30px; color: #334155; font-weight: bold;">${isZh ? '个人缴纳合计' : 'Personal Total'}</td>
            <td style="padding: 8px 15px; text-align: right; font-weight: bold; color: #3b82f6;">${formatMoney(data.socialResult.totalPersonal)}</td>
          </tr>
        </table>
        
        <!-- 公司缴纳 -->
        <div style="padding: 10px 15px; background: #f8fafc; font-weight: bold; color: #334155;">
          ${isZh ? '公司缴纳：' : 'Company:'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '养老保险' : 'Pension'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.company.pension)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '医疗保险' : 'Medical'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.company.medical)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '失业保险' : 'Unemployment'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.company.unemployment)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '工伤保险' : 'Injury'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.company.injury)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 15px 8px 30px; color: #475569;">${isZh ? '住房公积金' : 'Housing Fund'}</td>
            <td style="padding: 8px 15px; text-align: right;">${formatMoney(data.socialResult.company.fund)}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 8px 15px 8px 30px; color: #334155; font-weight: bold;">${isZh ? '公司缴纳合计' : 'Company Total'}</td>
            <td style="padding: 8px 15px; text-align: right; font-weight: bold;">${formatMoney(data.socialResult.totalCompany)}</td>
          </tr>
        </table>
      </div>
      
      <!-- 4. 税后反推计算 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '四、税后反推计算' : '4. Reverse Calculation'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '期望税后收入' : 'Target Net Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.targetNet)}</td>
          </tr>
          <tr style="background: #f0f9ff;">
            <td style="padding: 10px 15px; color: #475569; font-weight: bold;">${isZh ? '所需税前收入' : 'Required Gross'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: bold; color: #3b82f6; font-size: 16px;">${formatMoney(data.reverseResult)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '差额(税费+社保)' : 'Gap (Tax + Social)'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.reverseResult - data.targetNet)}</td>
          </tr>
        </table>
      </div>
      
      <!-- ✅ 新增：其他收入来源 -->
      ${data.otherIncome && (data.otherIncome.laborIncome > 0 || data.otherIncome.royaltyIncome > 0 || data.otherIncome.franchiseIncome > 0) ? `
      <div style="margin-bottom: 25px;">
        <div style="background: #10b981; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '五、其他收入来源' : '5. Other Income Sources'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          ${data.otherIncome.laborIncome > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '劳务报酬' : 'Labor Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.otherIncome.laborIncome)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; font-size: 13px;">${isZh ? '预扣税额' : 'Prepaid Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; color: #dc2626; font-weight: 500;">${formatMoney(data.otherIncomeTax?.laborTax || 0)}</td>
          </tr>
          ` : ''}
          
          ${data.otherIncome.royaltyIncome > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '稿酬收入' : 'Royalty Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.otherIncome.royaltyIncome)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; font-size: 13px;">${isZh ? '预扣税额' : 'Prepaid Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; color: #dc2626; font-weight: 500;">${formatMoney(data.otherIncomeTax?.royaltyTax || 0)}</td>
          </tr>
          ` : ''}
          
          ${data.otherIncome.franchiseIncome > 0 ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '特许权使用费' : 'Franchise Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.otherIncome.franchiseIncome)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
            <td style="padding: 10px 15px; color: #64748b; font-size: 13px;">${isZh ? '预扣税额' : 'Prepaid Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; color: #dc2626; font-weight: 500;">${formatMoney(data.otherIncomeTax?.franchiseTax || 0)}</td>
          </tr>
          ` : ''}
          
          <tr style="background: #f0fdf4;">
            <td style="padding: 10px 15px; color: #334155; font-weight: bold;">${isZh ? '预扣税额合计' : 'Total Prepaid Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: bold; color: #dc2626; font-size: 16px;">${formatMoney(data.otherIncomeTax?.totalTax || 0)}</td>
          </tr>
        </table>
      </div>
      ` : ''}
      
      <!-- 5. 年度汇算估算 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${data.settlementResult ? (isZh ? '六、年度汇算估算' : '6. Annual Settlement Estimate') : (isZh ? '五、年度汇算估算' : '5. Annual Settlement Estimate')}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年度税前总收入' : 'Annual Gross'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(annualGross)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年度五险一金' : 'Annual Social Insurance'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(annualSocial)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年度专项扣除' : 'Annual Special Deductions'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.monthlyResult.specialDeduction * 12)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年度应缴个税' : 'Annual Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(annualTax)}</td>
          </tr>
          <tr style="background: #f0f9ff;">
            <td style="padding: 10px 15px; color: #475569; font-weight: bold;">${isZh ? '年度税后实得' : 'Annual Net Income'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: bold; color: #3b82f6; font-size: 16px;">${formatMoney(annualNet)}</td>
          </tr>
        </table>
        
        <!-- 每月明细表格 -->
        ${data.annualResults && data.annualResults.length > 0 ? `
        <div style="margin-top: 15px;">
          <div style="padding: 10px 15px; background: #f8fafc; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0;">
            ${isZh ? '每月税额明细' : 'Monthly Tax Breakdown'}
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 6px 8px; text-align: center; font-weight: 600; color: #334155;">${isZh ? '月份' : 'Month'}</th>
                <th style="padding: 6px 8px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '应税所得' : 'Taxable'}</th>
                <th style="padding: 6px 8px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '本月个税' : 'Tax'}</th>
                <th style="padding: 6px 8px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '累计个税' : 'Cumulative'}</th>
                <th style="padding: 6px 8px; text-align: right; font-weight: 600; color: #334155;">${isZh ? '税后收入' : 'Net'}</th>
              </tr>
            </thead>
            <tbody>
              ${data.annualResults.map((r, i) => `
                <tr style="border-bottom: 1px solid #f1f5f9; ${i % 2 === 1 ? 'background: #fafafa;' : ''}">
                  <td style="padding: 5px 8px; text-align: center; font-weight: 500;">${r.month}</td>
                  <td style="padding: 5px 8px; text-align: right; color: #475569;">${formatMoney(r.taxableIncome)}</td>
                  <td style="padding: 5px 8px; text-align: right; color: #dc2626; font-weight: 500;">${formatMoney(r.monthlyTax)}</td>
                  <td style="padding: 5px 8px; text-align: right; color: #475569;">${formatMoney(r.cumulativeTax)}</td>
                  <td style="padding: 5px 8px; text-align: right; color: #2563eb; font-weight: 600;">${formatMoney(r.netIncome)}</td>
                </tr>
              `).join('')}
              <tr style="background: #eff6ff; font-weight: bold;">
                <td style="padding: 6px 8px; text-align: center; color: #1e40af;">${isZh ? '合计' : 'Total'}</td>
                <td style="padding: 6px 8px; text-align: right; color: #475569;">-</td>
                <td style="padding: 6px 8px; text-align: right; color: #dc2626;">${formatMoney(data.annualResults.reduce((s, r) => s + r.monthlyTax, 0))}</td>
                <td style="padding: 6px 8px; text-align: right; color: #475569;">-</td>
                <td style="padding: 6px 8px; text-align: right; color: #2563eb;">${formatMoney(data.annualResults.reduce((s, r) => s + r.netIncome, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
      
      <!-- ✅ 新增：年度汇算清缴详细结果 -->
      ${data.settlementResult ? `
      <div style="margin-bottom: 25px;">
        <div style="background: #8b5cf6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '七、年度汇算清缴详细结果' : '7. Annual Settlement Details'}
        </div>
        
        <!-- 总收入概览 -->
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="background: #f5f3ff; border-bottom: 2px solid #8b5cf6;">
            <td style="padding: 12px 15px; color: #4c1d95; font-weight: bold; font-size: 15px;">${isZh ? '年度总收入' : 'Annual Total Income'}</td>
            <td style="padding: 12px 15px; text-align: right; font-weight: bold; color: #7c3aed; font-size: 20px;">${formatMoney(data.settlementResult.totalIncome)}</td>
          </tr>
        </table>
        
        <!-- 应税所得明细 -->
        <div style="padding: 10px 15px; background: #fafafa; font-weight: bold; color: #334155; border-top: 1px solid #e2e8f0;">
          ${isZh ? '应税所得明细：' : 'Taxable Income Breakdown:'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '工资薪金应税所得' : 'Salary Taxable'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.salaryTaxable)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年终奖应税所得' : 'Bonus Taxable'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.bonusTaxable)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '其他收入应税所得' : 'Other Income Taxable'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.otherIncomeTaxable)}</td>
          </tr>
        </table>
        
        <!-- 扣除项明细 -->
        <div style="padding: 10px 15px; background: #fafafa; font-weight: bold; color: #334155; border-top: 1px solid #e2e8f0;">
          ${isZh ? '扣除项明细：' : 'Deductions Breakdown:'}
        </div>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '社保公积金扣除' : 'Social Insurance'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.socialInsurance)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '专项附加扣除' : 'Special Deductions'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.annualDeduction)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '起征点(60000元)' : 'Threshold (¥60,000)'}</td>
            <td style="padding: 10px 15px; text-align: right;">${formatMoney(data.settlementResult.threshold)}</td>
          </tr>
        </table>
        
        <!-- 应纳税所得额 -->
        <div style="padding: 10px 15px; background: #fef3c7; border-top: 2px solid #f59e0b;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #92400e; font-weight: bold; font-size: 14px;">${isZh ? '年度应税所得' : 'Annual Taxable Income'}</span>
            <span style="color: #d97706; font-weight: bold; font-size: 18px;">${formatMoney(data.settlementResult.taxableIncome)}</span>
          </div>
          <div style="margin-top: 5px; font-size: 12px; color: #854d0e;">
            ${isZh ? `适用税率：${(data.settlementResult.taxRate * 100).toFixed(0)}%` : `Tax Rate: ${(data.settlementResult.taxRate * 100).toFixed(0)}%`}
          </div>
        </div>
        
        <!-- 应补/应退税额 -->
        <table style="width: 100%; border-collapse: collapse; background: white; margin-top: 10px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '年度应纳税额' : 'Annual Tax Payable'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500; color: #dc2626;">${formatMoney(data.settlementResult.annualTax)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 15px; color: #475569;">${isZh ? '已预缴税额' : 'Prepaid Tax'}</td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 500;">${formatMoney(data.settlementResult.prepaidTax)}</td>
          </tr>
          <tr style="background: ${data.settlementResult.refundOrPay >= 0 ? '#fef2f2' : '#f0fdf4'};">
            <td style="padding: 12px 15px; color: ${data.settlementResult.refundOrPay >= 0 ? '#991b1b' : '#166534'}; font-weight: bold; font-size: 15px;">
              ${data.settlementResult.refundOrPay >= 0 
                ? (isZh ? '应补税额' : 'Tax to Pay') 
                : (isZh ? '应退税额' : 'Tax Refund')}
            </td>
            <td style="padding: 12px 15px; text-align: right; font-weight: bold; color: ${data.settlementResult.refundOrPay >= 0 ? '#dc2626' : '#16a34a'}; font-size: 18px;">
              ¥${Math.abs(data.settlementResult.refundOrPay).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </td>
          </tr>
        </table>
        
        <!-- 提示 -->
        <div style="background: ${data.settlementResult.refundOrPay >= 0 ? '#fef3c7' : '#d1fae5'}; border-left: 4px solid ${data.settlementResult.refundOrPay >= 0 ? '#f59e0b' : '#10b981'}; padding: 10px 15px; margin-top: 10px; color: ${data.settlementResult.refundOrPay >= 0 ? '#92400e' : '#065f46'}; font-size: 13px;">
          ${data.settlementResult.refundOrPay >= 0 
            ? (isZh ? '💡 提示：请在汇算清缴期限内补缴税款,以免产生滞纳金。' : '💡 Note: Please pay the tax within the deadline to avoid late fees.')
            : (isZh ? '💡 提示：退税申请提交后,税务部门审核通过即可退回多缴税款。' : '💡 Note: After submitting the refund application, the tax authority will review and refund the overpaid tax.')}
        </div>
      </div>
      ` : ''}
      
      <!-- 免责声明 -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px;">
        <div style="font-weight: bold; color: #92400e; margin-bottom: 5px;">
          ${isZh ? '免责声明' : 'Disclaimer'}
        </div>
        <div style="font-size: 12px; color: #854d0e; line-height: 1.6;">
          ${isZh 
            ? '本报告仅供参考，实际税费请以税务机关核定为准。计算结果基于当前输入参数，实际情况可能因政策调整、个人情况差异而有所不同。' 
            : 'This report is for reference only. Actual taxes should be based on tax authority determination. Results are based on current inputs and may vary due to policy changes or personal circumstances.'}
        </div>
      </div>
      
      <!-- 页脚 -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
        ${isZh ? 'Lawbor 税务计算器' : 'Lawbor Tax Calculator'}
      </div>
    </div>
  `;
  
  // PDF 配置 - 使用 iframe 隔离样式，禁用 foreignObject 避免 oklch 问题
  const opt = {
    margin: 10,
    filename: isZh 
      ? `税务计算报告_${new Date().toISOString().split('T')[0]}.pdf`
      : `Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      // 使用 foreignObjectRendering 可能更稳定
      foreignObjectRendering: false,
      // 在克隆时彻底清理样式
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        // 移除所有外部样式表，只保留内联样式
        const styleLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
        styleLinks.forEach(link => link.remove());
        
        const styleTags = clonedDoc.querySelectorAll('style:not(:first-child)');
        styleTags.forEach(tag => tag.remove());
        
        // 添加一个覆盖样式来防止 oklch 渗透
        const overrideStyle = clonedDoc.createElement('style');
        overrideStyle.textContent = `
          * {
            background-color: transparent !important;
            border-color: #e2e8f0 !important;
          }
        `;
        clonedDoc.head.appendChild(overrideStyle);
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  // 创建 iframe 来完全隔离样式
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '800px';
  iframe.style.height = '2000px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);
  
  // 在 iframe 中写入内容（不继承父页面样式）
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    console.error('无法创建 iframe 文档');
    return;
  }
  
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #ffffff; }
      </style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `);
  iframeDoc.close();
  
  // 临时禁用父页面的 Tailwind 样式表（包含 oklch 颜色）
  const tailwindStyles = document.querySelectorAll('style[data-tailwind], style[id*="tailwind"], link[href*="tailwind"]');
  const disabledStyles: Array<{ el: HTMLStyleElement | HTMLLinkElement; wasDisabled: boolean }> = [];
  
  tailwindStyles.forEach((el) => {
    const styleEl = el as HTMLStyleElement | HTMLLinkElement;
    disabledStyles.push({ el: styleEl, wasDisabled: styleEl.disabled });
    styleEl.disabled = true;
  });
  
  // 同时临时移除所有 style 标签（可能包含 Tailwind 生成的样式）
  const allStyles = document.querySelectorAll('style');
  const removedStyles: Array<{ el: HTMLStyleElement; parent: Element | null; nextSibling: Node | null }> = [];
  
  allStyles.forEach((style) => {
    // 只移除可能包含 oklch 的样式
    if (style.textContent && style.textContent.includes('oklch')) {
      removedStyles.push({
        el: style,
        parent: style.parentElement,
        nextSibling: style.nextSibling
      });
      style.remove();
    }
  });
  
  // 等待 iframe 渲染完成
  setTimeout(() => {
    const iframeBody = iframeDoc.body;
    
    html2pdf()
      .set(opt)
      .from(iframeBody)
      .save()
      .then(() => {
        // 清理 iframe
        document.body.removeChild(iframe);
        
        // 恢复被禁用的样式表
        disabledStyles.forEach(({ el, wasDisabled }) => {
          el.disabled = wasDisabled;
        });
        
        // 恢复被移除的样式标签
        removedStyles.forEach(({ el, parent, nextSibling }) => {
          if (parent) {
            if (nextSibling) {
              parent.insertBefore(el, nextSibling);
            } else {
              parent.appendChild(el);
            }
          }
        });
      })
      .catch((err: Error) => {
        console.error('PDF生成失败:', err);
        
        // 清理
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        
        // 恢复样式
        disabledStyles.forEach(({ el, wasDisabled }) => {
          el.disabled = wasDisabled;
        });
        
        removedStyles.forEach(({ el, parent, nextSibling }) => {
          if (parent) {
            if (nextSibling) {
              parent.insertBefore(el, nextSibling);
            } else {
              parent.appendChild(el);
            }
          }
        });
      });
  }, 200);
}