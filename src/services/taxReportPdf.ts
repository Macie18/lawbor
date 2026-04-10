/**
 * 税务计算报告 PDF 生成服务
 * 
 * 功能：将五大税务计算模块的内容导出为专业 PDF 报告
 * 使用 html2pdf.js，原生支持中文
 */

import html2pdf from 'html2pdf.js';
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
      
      <!-- 5. 年度汇算估算 -->
      <div style="margin-bottom: 25px;">
        <div style="background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; font-weight: bold;">
          ${isZh ? '五、年度汇算估算' : '5. Annual Settlement Estimate'}
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
      </div>
      
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
  
  // PDF 配置
  const opt = {
    margin: 10,
    filename: isZh 
      ? `税务计算报告_${new Date().toISOString().split('T')[0]}.pdf`
      : `Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };
  
  // 生成 PDF
  html2pdf().set(opt).from(htmlContent).save();
}