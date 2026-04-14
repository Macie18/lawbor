import { useAuth } from '../contexts/AuthContext';
import { useTaxCalculations } from '../hooks/useTaxCalculations';
import { History, Trash2, Save, FileDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Info, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  ArrowLeftRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useTranslation } from '../contexts/TranslationContext';
import { 
  calculateMonthlyTax, 
  calculateBonusSeparate, 
  calculateBonusCombined, 
  reverseGrossFromNet, 
  calculateSocialInsurance,
  checkBonusTrap,
  calculateMonthlyDeduction,
  calculateAnnualDeduction,
  calculateAnnualTax,
  calculateLaborTax,
  calculateRoyaltyTax,
  calculateFranchiseTax,
  calculateOtherIncomeTaxable,
  calculateAnnualSettlement,
  SpecialDeduction,
  MonthlyTaxResult,
  BonusTaxResult,
  OtherIncome,
  AnnualSettlementInput,
  AnnualSettlementResult,
  SOCIAL_RATES,
  PROVINCE_TO_CITY
} from '../lib/taxUtils';
import { getAllProvinces } from '../data/chinaRegions';
import { cn } from '../lib/utils';
import { generateTaxReportPdf, type TaxReportData } from '../services/taxReportPdf';

type TaxTab = 'monthly' | 'bonus' | 'reverse' | 'social' | 'annual' | 'settlement';

export default function TaxCalculator() {
  const { t, language } = useTranslation();
    // ✅ 新增：用户认证和计算记录状态
  const { user } = useAuth();
  const { calculations, saveCalculation, deleteCalculation } = useTaxCalculations();
  const [activeTab, setActiveTab] = useState<TaxTab>('monthly');
  
  // Input States
  const [salary, setSalary] = useState<number>(15000);
  const [bonus, setBonus] = useState<number>(30000);
  const [targetNet, setTargetNet] = useState<number>(10000);
  const [selectedCity, setSelectedCity] = useState<string>('beijing');
  const [customFundRate, setCustomFundRate] = useState<number>(12);
  
  // Special Deductions State - 完整的专项扣除项
  const [deductions, setDeductions] = useState<SpecialDeduction>({
    childrenEducation: 0,        // 子女教育（2000元/孩/月）
    infantCare: 0,               // 3岁以下婴幼儿照护（2000元/孩/月）
    continuingEducationType: 'none',  // 继续教育类型
    continuingEducationMonths: 0,     // 学历继续教育月数
    professionalCertMonth: 1,         // ✅ 新增：职业资格取得证书月份
    seriousIllness: 0,           // 大病医疗年度扣除
    housingLoanEnabled: false,    // 是否有住房贷款
    housingLoanMonths: 0,        // 房贷月数
    housingRent: 0,              // 住房租金
    elderlyType: 'none',         // 赡养老人类型
    elderlyShareAmount: 1500,    // 非独生子女分摊金额
  });

  // ✅ 新增：其他收入状态
  const [otherIncome, setOtherIncome] = useState<OtherIncome>({
    laborIncome: 0,
    royaltyIncome: 0,
    franchiseIncome: 0,
  });

  // ✅ 新增：年度汇算输入状态
  const [settlementInput, setSettlementInput] = useState<AnnualSettlementInput>({
    annualSalary: 180000,
    annualBonus: 30000,
    otherIncome: { laborIncome: 0, royaltyIncome: 0, franchiseIncome: 0 },
    socialInsurance: 30000,
    specialDeductions: deductions,
    prepaidTax: 15000,
  });

  // PDF导出状态
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ✅ 新增：省份到基准城市的映射函数
  const getBaseCity = (provinceId: string): string => {
    return PROVINCE_TO_CITY[provinceId] || 'default';
  };

  // Results
  const monthlyResult = useMemo(() => {
    const cityKey = getBaseCity(selectedCity);
    const social = calculateSocialInsurance(salary, cityKey, customFundRate);
    return calculateMonthlyTax(salary, social.totalPersonal, deductions);
  }, [salary, selectedCity, customFundRate, deductions]);

  const bonusResults = useMemo(() => {
    const cityKey = getBaseCity(selectedCity);
    const social = calculateSocialInsurance(salary, cityKey, customFundRate);
    const separate = calculateBonusSeparate(bonus);
    const combined = calculateBonusCombined(bonus, salary, social.totalPersonal, deductions);
    const trap = checkBonusTrap(bonus);
    return { separate, combined, trap };
  }, [bonus, salary, selectedCity, customFundRate, deductions]);

  const reverseResult = useMemo(() => {
    const cityKey = getBaseCity(selectedCity);
    const social = calculateSocialInsurance(targetNet, cityKey, customFundRate);
    // Rough estimate for social insurance based on target net
    return reverseGrossFromNet(targetNet, social.totalPersonal, deductions);
  }, [targetNet, selectedCity, customFundRate, deductions]);

  const socialResult = useMemo(() => {
    const cityKey = getBaseCity(selectedCity);
    return calculateSocialInsurance(salary, cityKey, customFundRate);
  }, [salary, selectedCity, customFundRate]);

  // 年度计算结果（每月明细）
  const annualResults = useMemo(() => {
    const cityKey = getBaseCity(selectedCity);
    const social = calculateSocialInsurance(salary, cityKey, customFundRate);
    return calculateAnnualTax(salary, social.totalPersonal, deductions);
  }, [salary, selectedCity, customFundRate, deductions]);

  // ✅ 新增：其他收入预扣税额计算
  const otherIncomeTax = useMemo(() => {
    return {
      laborTax: calculateLaborTax(otherIncome.laborIncome),
      royaltyTax: calculateRoyaltyTax(otherIncome.royaltyIncome),
      franchiseTax: calculateFranchiseTax(otherIncome.franchiseIncome),
      totalTax: calculateLaborTax(otherIncome.laborIncome) + 
                calculateRoyaltyTax(otherIncome.royaltyIncome) + 
                calculateFranchiseTax(otherIncome.franchiseIncome),
    };
  }, [otherIncome]);

  // ✅ 新增：年度汇算清缴结果
  const settlementResult = useMemo(() => {
    return calculateAnnualSettlement(settlementInput);
  }, [settlementInput]);

  const chartData = useMemo(() => {
    return [
      { name: t('tax.result.netIncome'), value: monthlyResult.netIncome, color: '#3b82f6' },
      { name: t('tax.result.socialPersonal'), value: monthlyResult.socialInsurance, color: '#10b981' },
      { name: t('tax.result.monthlyTax'), value: monthlyResult.monthlyTax, color: '#ef4444' },
      { name: t('tax.deductions'), value: monthlyResult.specialDeduction, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [monthlyResult, t]);

  const tabs: { id: TaxTab; label: string; icon: any }[] = [
    { id: 'monthly', label: t('tax.tabs.monthly'), icon: Calculator },
    { id: 'bonus', label: t('tax.tabs.bonus'), icon: Coins },
    { id: 'social', label: t('tax.tabs.social'), icon: ShieldCheck },
    { id: 'reverse', label: t('tax.tabs.reverse'), icon: ArrowLeftRight },
    { id: 'annual', label: t('tax.tabs.annual'), icon: TrendingUp },
    { id: 'settlement', label: t('tax.tabs.settlement'), icon: TrendingUp },
  ];

  // ✅ 新增：保存计算结果的方法
  const handleSaveCalculation = async () => {
    if (!user) return;
    
    const result = activeTab === 'monthly' ? monthlyResult :
                   activeTab === 'bonus' ? bonusResults.separate :
                   activeTab === 'social' ? socialResult :
                   activeTab === 'reverse' ? { netIncome: reverseResult, monthlyTax: 0 } :
                   monthlyResult;
    
    const incomeType = activeTab === 'monthly' ? '月薪计算' :
                       activeTab === 'bonus' ? '年终奖计算' :
                       activeTab === 'social' ? '社保计算' :
                       activeTab === 'reverse' ? '反推税前' :
                       '年度估算';
    
    await saveCalculation(
      incomeType,
      activeTab === 'reverse' ? reverseResult : salary,
      activeTab === 'monthly' || activeTab === 'annual' ? monthlyResult.monthlyTax : 
        activeTab === 'bonus' ? bonusResults.separate.tax : 0,
      activeTab === 'reverse' ? targetNet : 
        activeTab === 'monthly' ? monthlyResult.netIncome :
        activeTab === 'bonus' ? bonusResults.separate.netBonus :
        activeTab === 'social' ? socialResult.totalPersonal : reverseResult,
      monthlyResult.specialDeduction
    );
  };

  // ✅ 新增：导出完整PDF报告
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const reportData: TaxReportData = {
        salary,
        bonus,
        targetNet,
        selectedCity,
        customFundRate,
        deductions,
        monthlyResult,
        bonusResults,
        reverseResult,
        socialResult,
        annualResults, // 添加年度明细
        otherIncome, // ✅ 新增：其他收入
        otherIncomeTax, // ✅ 新增：其他收入预扣税额
        settlementResult, // ✅ 新增：年度汇算清缴结果
        language,
      };
      generateTaxReportPdf(reportData);
    } catch (error) {
      console.error('PDF导出失败:', error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-slate-900">{t('tax.title')}</h2>
          <p className="text-slate-500">{t('tax.desc')}</p>
        </div>
        
        {/* 操作按钮组 */}
        <div className="flex flex-col gap-2">
          {/* 导出PDF按钮 */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all",
              isExportingPdf
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20"
            )}
          >
            {isExportingPdf ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('tax.exporting')}
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                {t('tax.exportPdf')}
              </>
            )}
          </button>
          
          {/* ✅ 保存记录按钮（仅登录用户显示） */}
          {user && (
            <button
              onClick={handleSaveCalculation}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              <Save className="h-4 w-4" />
              {t('tax.saveRecord')}
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-8 flex overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">{t('tax.waiting')}</h3>
            
            <div className="space-y-4">
              {/* Common Inputs */}
              {(activeTab === 'monthly' || activeTab === 'social' || activeTab === 'bonus' || activeTab === 'annual') && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('tax.input.gross')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'bonus' && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('tax.input.bonus')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                      type="number"
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'reverse' && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('tax.input.targetNet')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                      type="number"
                      value={targetNet}
                      onChange={(e) => setTargetNet(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Social Security Config */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('tax.input.city')}</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {getAllProvinces().map(province => (
                      <option key={province.id} value={province.id}>
                        {language === 'zh' ? province.name : province.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{t('tax.input.fundRate')}</label>
                  <input
                    type="number"
                    value={customFundRate}
                    onChange={(e) => setCustomFundRate(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Special Deductions - 专项附加扣除 */}
              {(activeTab === 'monthly' || activeTab === 'bonus' || activeTab === 'annual' || activeTab === 'reverse') && (
                <div className="pt-4 border-t">
                  <h4 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">{t('tax.deductions')}</h4>
                  <div className="space-y-4">
                    {/* 子女教育 & 婴幼儿照护 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.children')}</label>
                        <p className="mb-2 text-[10px] text-slate-400">2000元/孩/月</p>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={deductions.childrenEducation}
                          onChange={(e) => setDeductions(prev => ({ ...prev, childrenEducation: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.infant')}</label>
                        <p className="mb-2 text-[10px] text-slate-400">2000元/孩/月</p>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={deductions.infantCare}
                          onChange={(e) => setDeductions(prev => ({ ...prev, infantCare: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* 继续教育 - 支持学历和职业资格 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.continuingEducation')}</label>
                      <select
                        value={deductions.continuingEducationType}
                        onChange={(e) => setDeductions(prev => ({ 
                          ...prev, 
                          continuingEducationType: e.target.value as 'none' | 'academic' | 'professional',
                          continuingEducationMonths: e.target.value === 'academic' ? 12 : 0
                        }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="none">{t('tax.deduction.none')}</option>
                        <option value="academic">{t('tax.deduction.academicEducation')} (400元/月)</option>
                        <option value="professional">{t('tax.deduction.professionalEducation')} (3600元/年)</option>
                      </select>
                      {deductions.continuingEducationType === 'academic' && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] text-slate-500">{t('tax.deduction.educationMonths')} (最长48月)</label>
                          <input
                            type="number"
                            min="1"
                            max="48"
                            value={deductions.continuingEducationMonths}
                            onChange={(e) => setDeductions(prev => ({ 
                              ...prev, 
                              continuingEducationMonths: Math.min(Number(e.target.value), 48) 
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                      {/* ✅ 新增：职业资格月份选择 */}
                      {deductions.continuingEducationType === 'professional' && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] text-slate-500">
                            {t('tax.deduction.certMonth')} ({t('tax.deduction.certMonthHint')})
                          </label>
                          <select
                            value={deductions.professionalCertMonth || 1}
                            onChange={(e) => setDeductions(prev => ({ 
                              ...prev, 
                              professionalCertMonth: Number(e.target.value) 
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>
                                {month}{language === 'zh' ? '月' : ''} ({t('tax.deduction.remainingMonths')}{language === 'zh' ? `${13 - month}个月` : `${13 - month} months`})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* 大病医疗 - 年度扣除 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.seriousIllness')}</label>
                      <p className="mb-2 text-[10px] text-slate-400">{t('tax.deduction.illnessHint')} (最高80000元/年)</p>
                      <input
                        type="number"
                        min="0"
                        max="80000"
                        value={deductions.seriousIllness}
                        onChange={(e) => setDeductions(prev => ({ 
                          ...prev, 
                          seriousIllness: Math.min(Number(e.target.value), 80000) 
                        }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    {/* 住房贷款利息 & 住房租金（互斥） */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.housing')}</label>
                      <p className="mb-2 text-[10px] text-amber-600">{t('tax.deduction.housingHint')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeductions(prev => ({ 
                            ...prev, 
                            housingLoanEnabled: true, 
                            housingRent: 0 
                          }))}
                          className={cn(
                            "rounded-xl border py-3 text-xs font-bold transition-all",
                            deductions.housingLoanEnabled
                              ? "border-blue-500 bg-blue-50 text-blue-600" 
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                          )}
                        >
                          {t('tax.deduction.loan')} (1000元/月)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeductions(prev => ({ 
                            ...prev, 
                            housingLoanEnabled: false, 
housingRent: 1500 
                          }))}
                          className={cn(
                            "rounded-xl border py-3 text-xs font-bold transition-all",
                            !deductions.housingLoanEnabled && deductions.housingRent > 0
                              ? "border-blue-500 bg-blue-50 text-blue-600" 
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                          )}
                        >
                          {t('tax.deduction.rent')}
                        </button>
                      </div>
                      {/* 房贷月数 */}
                      {deductions.housingLoanEnabled && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] text-slate-500">{t('tax.deduction.loanMonths')} (最长240月)</label>
                          <input
                            type="number"
                            min="1"
                            max="240"
                            value={deductions.housingLoanMonths}
                            onChange={(e) => setDeductions(prev => ({ 
                              ...prev, 
                              housingLoanMonths: Math.min(Number(e.target.value), 240) 
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                      {/* 房租金额 */}
                      {!deductions.housingLoanEnabled && (
                        <select
                          value={deductions.housingRent}
                          onChange={(e) => setDeductions(prev => ({ ...prev, housingRent: Number(e.target.value) }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="0">{t('tax.deduction.none')}</option>
                          <option value="1500">1500元 (直辖市/省会)</option>
                          <option value="1100">1100元 (人口&gt;100万)</option>
                          <option value="800">800元 (人口≤100万)</option>
                        </select>
                      )}
                    </div>
                    
                    {/* 赡养老人 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.deduction.elderlySupport')}</label>
                      <p className="mb-2 text-[10px] text-slate-400">{t('tax.deduction.elderlyHint')}</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'none', label: t('tax.deduction.none'), amount: 0 },
                          { value: 'only', label: t('tax.deduction.onlyChild'), amount: 3000 },
                          { value: 'non-only', label: t('tax.deduction.nonOnlyChild'), amount: 1500 }
                        ].map(({ value, label, amount }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDeductions(prev => ({ 
                              ...prev, 
                              elderlyType: value as 'none' | 'only' | 'non-only',
                              elderlyShareAmount: value === 'non-only' ? 1500 : 0
                            }))}
                            className={cn(
                              "flex-1 rounded-xl border py-2 text-[10px] font-bold transition-all",
                              deductions.elderlyType === value 
                                ? "border-blue-500 bg-blue-50 text-blue-600" 
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            )}
                          >
                            {label}<br/>
                            <span className="text-slate-400 font-normal">{amount > 0 ? `${amount}元/月` : ''}</span>
                          </button>
                        ))}
                      </div>
                      {/* 非独生子女分摊金额 */}
                      {deductions.elderlyType === 'non-only' && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[10px] text-slate-500">{t('tax.deduction.elderlyShare')} (最高1500元/月)</label>
                          <input
                            type="number"
                            min="0"
                            max="1500"
                            step="100"
                            value={deductions.elderlyShareAmount}
                            onChange={(e) => setDeductions(prev => ({ 
                              ...prev, 
                              elderlyShareAmount: Math.min(Number(e.target.value), 1500) 
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 扣除汇总显示 */}
                    <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">{t('tax.deduction.monthlyTotal')}</span>
                        <span className="font-bold text-blue-600">¥{calculateMonthlyDeduction(deductions).toLocaleString()}</span>
                      </div>
                      {deductions.seriousIllness > 0 && (
                        <div className="flex justify-between items-center text-xs mt-1 text-slate-500">
                          <span>{t('tax.deduction.annualTotal')}</span>
                          <span>¥{calculateAnnualDeduction(deductions).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* ✅ 新增：其他收入输入区域（月度计算） */}
                    {(activeTab === 'monthly' || activeTab === 'annual') && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {t('tax.otherIncome.title')}
                        </h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] text-slate-600">{t('tax.otherIncome.labor')}</label>
                              <input
                                type="number"
                                min="0"
                                value={otherIncome.laborIncome}
                                onChange={(e) => setOtherIncome(prev => ({ ...prev, laborIncome: Number(e.target.value) }))}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                              />
                              {otherIncome.laborIncome > 0 && (
                                <p className="mt-1 text-[9px] text-rose-500">
                                  {t('tax.otherIncome.prepaidTax')}: ¥{otherIncomeTax.laborTax.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] text-slate-600">{t('tax.otherIncome.royalty')}</label>
                              <input
                                type="number"
                                min="0"
                                value={otherIncome.royaltyIncome}
                                onChange={(e) => setOtherIncome(prev => ({ ...prev, royaltyIncome: Number(e.target.value) }))}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                              />
                              {otherIncome.royaltyIncome > 0 && (
                                <p className="mt-1 text-[9px] text-rose-500">
                                  {t('tax.otherIncome.prepaidTax')}: ¥{otherIncomeTax.royaltyTax.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] text-slate-600">{t('tax.otherIncome.franchise')}</label>
                              <input
                                type="number"
                                min="0"
                                value={otherIncome.franchiseIncome}
                                onChange={(e) => setOtherIncome(prev => ({ ...prev, franchiseIncome: Number(e.target.value) }))}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                              />
                              {otherIncome.franchiseIncome > 0 && (
                                <p className="mt-1 text-[9px] text-rose-500">
                                  {t('tax.otherIncome.prepaidTax')}: ¥{otherIncomeTax.franchiseTax.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {otherIncomeTax.totalTax > 0 && (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-600">{t('tax.otherIncome.totalPrepaid')}</span>
                                <span className="font-bold text-amber-600">¥{otherIncomeTax.totalTax.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ 新增：年度汇算清缴输入区域 */}
              {activeTab === 'settlement' && (
                <div className="pt-4 border-t">
                  <h4 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {t('tax.settlement.title')}
                  </h4>
                  <div className="space-y-4">
                    {/* 年度工资总额 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.settlement.annualSalary')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          value={settlementInput.annualSalary}
                          onChange={(e) => setSettlementInput(prev => ({ ...prev, annualSalary: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 年终奖 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.settlement.bonusCombined')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          value={settlementInput.annualBonus}
                          onChange={(e) => setSettlementInput(prev => ({ ...prev, annualBonus: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 其他收入 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.settlement.otherIncome')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="mb-1 text-[10px] text-slate-400">{t('tax.otherIncome.labor')}</p>
                          <input
                            type="number"
                            value={settlementInput.otherIncome.laborIncome}
                            onChange={(e) => setSettlementInput(prev => ({
                              ...prev,
                              otherIncome: { ...prev.otherIncome, laborIncome: Number(e.target.value) }
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] text-slate-400">{t('tax.otherIncome.royalty')}</p>
                          <input
                            type="number"
                            value={settlementInput.otherIncome.royaltyIncome}
                            onChange={(e) => setSettlementInput(prev => ({
                              ...prev,
                              otherIncome: { ...prev.otherIncome, royaltyIncome: Number(e.target.value) }
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] text-slate-400">{t('tax.otherIncome.franchise')}</p>
                          <input
                            type="number"
                            value={settlementInput.otherIncome.franchiseIncome}
                            onChange={(e) => setSettlementInput(prev => ({
                              ...prev,
                              otherIncome: { ...prev.otherIncome, franchiseIncome: Number(e.target.value) }
                            }))}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 年度社保 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.settlement.socialInsurance')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          value={settlementInput.socialInsurance}
                          onChange={(e) => setSettlementInput(prev => ({ ...prev, socialInsurance: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 已预缴税额 */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">{t('tax.settlement.prepaidTax')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          value={settlementInput.prepaidTax}
                          onChange={(e) => setSettlementInput(prev => ({ ...prev, prepaidTax: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-4 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setSettlementInput(prev => ({ ...prev, specialDeductions: deductions }))}
                      className="w-full mt-2 rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      {t('tax.settlement.applyDeductions')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Result Summary Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm overflow-hidden">
                {activeTab === 'monthly' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <p className="mb-1 text-sm font-medium text-slate-500">{t('tax.result.netIncome')}</p>
                      <h3 className="text-5xl font-black text-blue-600">¥{monthlyResult.netIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('tax.result.monthlyTax')}</p>
                        <p className="text-lg font-black text-rose-500">¥{monthlyResult.monthlyTax.toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('tax.rate')}</p>
                        <p className="text-lg font-black text-slate-700">{(monthlyResult.taxRate * 100).toFixed(0)}%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('tax.insuranceAmount')}</p>
                        <p className="text-lg font-black text-slate-700">¥{monthlyResult.socialInsurance.toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('tax.deductions')}</p>
                        <p className="text-lg font-black text-slate-700">¥{monthlyResult.specialDeduction.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `¥${value.toLocaleString()}`}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 每月明细列表 */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700">{t('tax.monthlyBreakdown.title')}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-slate-600">{t('tax.monthlyBreakdown.month')}</th>
                              <th className="px-4 py-2 text-right font-medium text-slate-600">{t('tax.monthlyBreakdown.taxable')}</th>
                              <th className="px-4 py-2 text-right font-medium text-slate-600">{t('tax.monthlyBreakdown.tax')}</th>
                              <th className="px-4 py-2 text-right font-medium text-slate-600">{t('tax.monthlyBreakdown.cumulative')}</th>
                              <th className="px-4 py-2 text-right font-medium text-slate-600">{t('tax.monthlyBreakdown.net')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {annualResults.map((result) => (
                              <tr key={result.month} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-700">{result.month}{language === 'zh' ? '月' : ''}</td>
                                <td className="px-4 py-2 text-right text-slate-600">¥{result.taxableIncome.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-medium text-rose-500">¥{result.monthlyTax.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right text-slate-600">¥{result.cumulativeTax.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right font-bold text-blue-600">¥{result.netIncome.toLocaleString()}</td>
                              </tr>
                            ))}
                            {/* 合计行 */}
                            <tr className="bg-blue-50 font-bold">
                              <td className="px-4 py-3 text-slate-700">{t('tax.monthlyBreakdown.annualTotal')}</td>
                              <td className="px-4 py-3 text-right text-slate-600">-</td>
                              <td className="px-4 py-3 text-right text-rose-500">¥{annualResults.reduce((sum, r) => sum + r.monthlyTax, 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-slate-600">-</td>
                              <td className="px-4 py-3 text-right text-blue-600">¥{annualResults.reduce((sum, r) => sum + r.netIncome, 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'bonus' && (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex-1 rounded-3xl border-2 border-blue-100 bg-blue-50/30 p-6 text-center relative overflow-hidden">
                        {bonusResults.separate.tax <= bonusResults.combined.tax && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            {t('tax.result.recommendation')}
                          </div>
                        )}
                        <p className="mb-2 text-sm font-bold text-blue-600">{t('tax.result.bonusSeparate')}</p>
                        <h4 className="text-3xl font-black text-slate-900">¥{bonusResults.separate.netBonus.toLocaleString()}</h4>
                        <p className="mt-2 text-xs text-slate-500">{t('tax.result.monthlyTax')}: ¥{bonusResults.separate.tax.toLocaleString()}</p>
                      </div>
                      <div className="flex-1 rounded-3xl border-2 border-slate-100 bg-slate-50/30 p-6 text-center relative overflow-hidden">
                        {bonusResults.combined.tax < bonusResults.separate.tax && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            {t('tax.result.recommendation')}
                          </div>
                        )}
                        <p className="mb-2 text-sm font-bold text-slate-500">{t('tax.result.bonusCombined')}</p>
                        <h4 className="text-3xl font-black text-slate-900">¥{bonusResults.combined.netBonus.toLocaleString()}</h4>
                        <p className="mt-2 text-xs text-slate-500">{t('tax.result.monthlyTax')}: ¥{bonusResults.combined.tax.toLocaleString()}</p>
                      </div>
                    </div>

                    {bonusResults.trap && (
                      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
                        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                          <p className="font-bold">{t('tax.result.trapWarning')}</p>
                          <p>{bonusResults.trap}</p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl bg-blue-600 p-6 text-white text-center">
                      <p className="text-sm font-medium opacity-80">{t('tax.result.savings')}</p>
                      <h4 className="text-4xl font-black">¥{Math.abs(bonusResults.separate.tax - bonusResults.combined.tax).toLocaleString()}</h4>
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="mb-1 text-sm font-medium text-slate-500">{t('tax.result.socialPersonal')}</p>
                        <h3 className="text-4xl font-black text-emerald-600">¥{socialResult.totalPersonal.toLocaleString()}</h3>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-sm font-medium text-slate-500">{t('tax.result.socialCompany')}</p>
                        <h3 className="text-4xl font-black text-slate-400">¥{socialResult.totalCompany.toLocaleString()}</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.social.pension')}</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.pension.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{t('tax.social.company')}: ¥{socialResult.company.pension.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.social.medical')}</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.medical.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{t('tax.social.company')}: ¥{socialResult.company.medical.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.social.fund')}</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.fund.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{t('tax.social.company')}: ¥{socialResult.company.fund.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reverse' && (
                  <div className="space-y-8 py-10 text-center">
                    <p className="mb-1 text-sm font-medium text-slate-500">{t('tax.input.gross')}</p>
                    <h3 className="text-6xl font-black text-blue-600">¥{reverseResult.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                    <div className="mx-auto max-w-xs p-4 rounded-2xl bg-blue-50 text-blue-800 text-sm">
                      <p>{t('tax.reverse.hint')
                        .replace('{{targetNet}}', targetNet.toLocaleString())
                        .replace('{{gross}}', reverseResult.toLocaleString(undefined, { maximumFractionDigits: 0 }))}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'annual' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <p className="mb-1 text-sm font-medium text-slate-500">{t('tax.annual.estimatedNet')}</p>
                      <h3 className="text-5xl font-black text-blue-600">¥{(monthlyResult.netIncome * 12).toLocaleString()}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.annual.gross')}</span>
                        <span className="text-sm font-black text-slate-900">¥{(salary * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.annual.social')}</span>
                        <span className="text-sm font-black text-slate-900">¥{(monthlyResult.socialInsurance * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.deductions')}</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{calculateAnnualDeduction(deductions).toLocaleString()}</p>
                          {deductions.seriousIllness > 0 && (
                            <p className="text-[10px] text-slate-400">含大病医疗 {deductions.seriousIllness.toLocaleString()}元</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">{t('tax.annual.tax')}</span>
                        <span className="text-sm font-black text-rose-500">¥{(monthlyResult.cumulativeTax).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                      <Info className="h-5 w-5 shrink-0" />
                      <p>{t('tax.disclaimer')}</p>
                    </div>
                  </div>
                )}

{/* ✅ 新增：年度汇算清缴结果展示 */}
                {activeTab === 'settlement' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <p className="mb-1 text-sm font-medium text-slate-500">
                        {t('tax.settlement.totalIncome')}
                      </p>
                      <h3 className="text-5xl font-black text-slate-900">
                        ¥{settlementResult.totalIncome.toLocaleString()}
                      </h3>
                    </div>

                    {/* 明细列表 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.salaryTaxable')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.salaryTaxable.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.bonusTaxable')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.bonusTaxable.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.otherIncomeTaxable')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.otherIncomeTaxable.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.socialDeduction')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.socialInsurance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.specialDeduction')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.annualDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.settlement.threshold')}</span>
                        <span className="font-bold text-slate-900">¥{settlementResult.threshold.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 text-sm border border-amber-200">
                        <span className="font-medium text-amber-800">{t('tax.settlement.annualTaxable')}</span>
                        <span className="font-bold text-amber-900">¥{settlementResult.taxableIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                        <span className="font-medium text-slate-600">{t('tax.rate')}</span>
                        <span className="font-bold text-slate-900">{(settlementResult.taxRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* 年度应纳税额 */}
                    <div className="rounded-2xl bg-rose-50 p-6 border border-rose-200">
                      <div className="text-center">
                        <p className="mb-1 text-sm font-medium text-rose-600">{t('tax.settlement.annualTax')}</p>
                        <h4 className="text-4xl font-black text-rose-600">¥{settlementResult.annualTax.toLocaleString()}</h4>
                      </div>
                    </div>

                    {/* 已预缴和应补/应退 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-100 p-4 text-center">
                        <p className="mb-1 text-xs font-medium text-slate-500">{t('tax.settlement.prepaidTax')}</p>
                        <h4 className="text-2xl font-black text-slate-700">¥{settlementResult.prepaidTax.toLocaleString()}</h4>
                      </div>
                      <div className={cn(
                        "rounded-2xl p-4 text-center",
                        settlementResult.refundOrPay >= 0 
                          ? "bg-red-50 border-2 border-red-200" 
                          : "bg-green-50 border-2 border-green-200"
                      )}>
                        <p className="mb-1 text-xs font-medium text-slate-500">
                          {settlementResult.refundOrPay >= 0 
                            ? t('tax.settlement.taxToPay')
                            : t('tax.settlement.taxRefund')
                          }
                        </p>
                        <h4 className={cn(
                          "text-2xl font-black",
                          settlementResult.refundOrPay >= 0 ? "text-red-600" : "text-green-600"
                        )}>
                          ¥{Math.abs(settlementResult.refundOrPay).toLocaleString()}
                        </h4>
                      </div>
                    </div>

                    {/* 提示 */}
                    <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                      <Info className="h-5 w-5 shrink-0" />
                      <p>
                        {settlementResult.refundOrPay >= 0
                          ? t('tax.settlement.payHint')
                          : t('tax.settlement.refundHint')
           }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optimization Advice Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900">{t('tax.result.optimization')}</h4>
                </div>
                <div className="space-y-3">
                  {monthlyResult.taxRate > 0.1 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      <p>{t('tax.optimization.rateHint').replace('{{rate}}', (monthlyResult.taxRate * 100).toFixed(0))}</p>
                    </div>
                  )}
                  {activeTab === 'bonus' && bonusResults.trap && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 text-sm text-amber-800">
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                      <p>{t('tax.optimization.trapHint')}</p>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <p>{t('tax.optimization.annualHint')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ✅ 新增：历史计算记录列表（仅登录用户显示） */}
      {user && calculations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            {t('tax.history.title')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calculations.map(calc => (
              <div key={calc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{calc.income_type}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-600">
                        {t('tax.history.gross')}: ¥{calc.gross_income.toLocaleString()}
                      </p>
                      <p className="text-gray-600">
                        {t('tax.history.deductions')}: ¥{calc.deductions.toLocaleString()}
                      </p>
                      <p className="text-orange-600 font-medium">
                        {t('tax.history.tax')}: ¥{calc.tax_amount.toLocaleString()}
                      </p>
                      <p className="text-green-600 font-bold">
                        {t('tax.history.netIncome')}: ¥{calc.net_income.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCalculation(calc.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={t('tax.history.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(calc.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

