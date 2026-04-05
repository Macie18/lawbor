import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  PieChart as PieChartIcon, 
  Info, 
  AlertCircle, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  ArrowLeftRight,
  Download,
  Share2
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
  SpecialDeduction,
  MonthlyTaxResult,
  BonusTaxResult,
  SOCIAL_RATES
} from '../lib/taxUtils';
import { cn } from '../lib/utils';

type TaxTab = 'monthly' | 'bonus' | 'reverse' | 'social' | 'annual';

export default function TaxCalculator() {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<TaxTab>('monthly');
  
  // Input States
  const [salary, setSalary] = useState<number>(15000);
  const [bonus, setBonus] = useState<number>(30000);
  const [targetNet, setTargetNet] = useState<number>(10000);
  const [selectedCity, setSelectedCity] = useState<string>('beijing');
  const [customFundRate, setCustomFundRate] = useState<number>(12);
  
  // Special Deductions State
  const [deductions, setDeductions] = useState<SpecialDeduction>({
    childrenEducation: 0,
    infantCare: 0,
    continuingEducation: 0,
    seriousIllness: 0,
    housingLoan: 0,
    housingRent: 0,
    elderlySupport: 0,
    elderlyType: 'none'
  });

  // Results
  const monthlyResult = useMemo(() => {
    const social = calculateSocialInsurance(salary, selectedCity, customFundRate);
    return calculateMonthlyTax(salary, social.totalPersonal, deductions);
  }, [salary, selectedCity, customFundRate, deductions]);

  const bonusResults = useMemo(() => {
    const social = calculateSocialInsurance(salary, selectedCity, customFundRate);
    const separate = calculateBonusSeparate(bonus);
    const combined = calculateBonusCombined(bonus, salary, social.totalPersonal, deductions);
    const trap = checkBonusTrap(bonus);
    return { separate, combined, trap };
  }, [bonus, salary, selectedCity, customFundRate, deductions]);

  const reverseResult = useMemo(() => {
    const social = calculateSocialInsurance(targetNet, selectedCity, customFundRate);
    // Rough estimate for social insurance based on target net
    return reverseGrossFromNet(targetNet, social.totalPersonal, deductions);
  }, [targetNet, selectedCity, customFundRate, deductions]);

  const socialResult = useMemo(() => {
    return calculateSocialInsurance(salary, selectedCity, customFundRate);
  }, [salary, selectedCity, customFundRate]);

  const chartData = useMemo(() => {
    return [
      { name: t('tax.result.netIncome'), value: monthlyResult.netIncome, color: '#3b82f6' },
      { name: t('tax.result.socialPersonal'), value: monthlyResult.socialInsurance, color: '#10b981' },
      { name: t('tax.result.monthlyTax'), value: monthlyResult.monthlyTax, color: '#ef4444' },
      { name: t('tax.deduction.elderly'), value: monthlyResult.specialDeduction, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [monthlyResult, t]);

  const tabs: { id: TaxTab; label: string; icon: any }[] = [
    { id: 'monthly', label: t('tax.tabs.monthly'), icon: Calculator },
    { id: 'bonus', label: t('tax.tabs.bonus'), icon: Coins },
    { id: 'social', label: t('tax.tabs.social'), icon: ShieldCheck },
    { id: 'reverse', label: t('tax.tabs.reverse'), icon: ArrowLeftRight },
    { id: 'annual', label: t('tax.tabs.annual'), icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">{t('tax.title')}</h2>
        <p className="text-slate-500">{t('tax.desc')}</p>
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
                    {Object.keys(SOCIAL_RATES).map(city => (
                      <option key={city} value={city}>{t(`tax.city.${city}`)}</option>
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

              {/* Special Deductions */}
              {(activeTab === 'monthly' || activeTab === 'bonus' || activeTab === 'annual' || activeTab === 'reverse') && (
                <div className="pt-4 border-t">
                  <h4 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wider">{t('tax.deductions')}</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold text-slate-600">{t('tax.deduction.children')}</label>
                        <input
                          type="number"
                          value={deductions.childrenEducation}
                          onChange={(e) => setDeductions(prev => ({ ...prev, childrenEducation: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold text-slate-600">{t('tax.deduction.infant')}</label>
                        <input
                          type="number"
                          value={deductions.infantCare}
                          onChange={(e) => setDeductions(prev => ({ ...prev, infantCare: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edu"
                          checked={!!deductions.continuingEducation}
                          onChange={(e) => setDeductions(prev => ({ ...prev, continuingEducation: e.target.checked ? 1 : 0 }))}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <label htmlFor="edu" className="text-xs font-bold text-slate-600">{t('tax.deduction.education')}</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="loan"
                          checked={!!deductions.housingLoan}
                          onChange={(e) => setDeductions(prev => ({ ...prev, housingLoan: e.target.checked ? 1 : 0 }))}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <label htmlFor="loan" className="text-xs font-bold text-slate-600">{t('tax.deduction.loan')}</label>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">{t('tax.deduction.rent')}</label>
                      <select
                        value={deductions.housingRent}
                        onChange={(e) => setDeductions(prev => ({ ...prev, housingRent: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="0">{t('tax.deduction.none')}</option>
                        <option value="1500">1500 (Tier 1 City)</option>
                        <option value="1100">1100 (Tier 2 City)</option>
                        <option value="800">800 (Tier 3 City)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">{t('tax.deduction.elderlyType')}</label>
                      <div className="flex gap-2">
                        {(['none', 'only', 'non-only'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setDeductions(prev => ({ ...prev, elderlyType: type }))}
                            className={cn(
                              "flex-1 rounded-xl border py-2 text-[10px] font-bold transition-all",
                              deductions.elderlyType === type 
                                ? "border-blue-500 bg-blue-50 text-blue-600" 
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            )}
                          >
                            {t(`tax.deduction.${type === 'only' ? 'onlyChild' : type === 'non-only' ? 'nonOnlyChild' : 'none'}`)}
                          </button>
                        ))}
                      </div>
                    </div>
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
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                  <button className="text-slate-300 hover:text-blue-600 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

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
                        <span className="text-sm font-bold text-slate-600">Pension</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.pension.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Company: ¥{socialResult.company.pension.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">Medical</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.medical.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Company: ¥{socialResult.company.medical.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">Provident Fund</span>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">¥{socialResult.personal.fund.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Company: ¥{socialResult.company.fund.toLocaleString()}</p>
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
                      <p>To get a net income of <b>¥{targetNet.toLocaleString()}</b>, your gross salary should be approximately <b>¥{reverseResult.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'annual' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <p className="mb-1 text-sm font-medium text-slate-500">Estimated Annual Net Income</p>
                      <h3 className="text-5xl font-black text-blue-600">¥{(monthlyResult.netIncome * 12).toLocaleString()}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">Annual Gross</span>
                        <span className="text-sm font-black text-slate-900">¥{(salary * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">Annual Social Security</span>
                        <span className="text-sm font-black text-slate-900">¥{(monthlyResult.socialInsurance * 12).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600">Annual Tax</span>
                        <span className="text-sm font-black text-rose-500">¥{(monthlyResult.cumulativeTax).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                      <Info className="h-5 w-5 shrink-0" />
                      <p>{t('tax.disclaimer')}</p>
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
                      <p>Your tax rate is { (monthlyResult.taxRate * 100).toFixed(0) }%. Consider maximizing special deductions to lower your taxable income.</p>
                    </div>
                  )}
                  {activeTab === 'bonus' && bonusResults.trap && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 text-sm text-amber-800">
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                      <p>Adjust your bonus amount slightly to avoid the "Tax Trap" where a small increase in gross bonus leads to a large decrease in net bonus.</p>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm text-slate-600">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <p>Annual tax reconciliation (March-June) may result in a tax refund if you have unused deductions or multiple income sources.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
