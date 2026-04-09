import { useState } from 'react';
import { Card, Select, Button, Typography, Space, Tooltip, message } from 'antd';
import { FileWordOutlined, DownloadOutlined, InfoCircleOutlined, AuditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';
import { useTranslation } from '../../contexts/TranslationContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 文档映射 - 内部 key 保持不变，显示名称使用翻译
export const DOCUMENT_KEYS = [
  'general',
  'salary',
  'overtime',
  'compensation',
  'injury',
  'relation',
  'social_security',
  'non_compete',
  'multiple'
] as const;

export const DOCUMENT_FILES: Record<string, { file: string; originalName: string }> = {
  'general': {
    file: 'template_general.docx',
    originalName: '劳动仲裁申请书（通用版）最全-含证据清单、申请仲裁材料清单、注意事项.docx'
  },
  'salary': {
    file: 'template_salary.docx',
    originalName: '劳动仲裁申请书模板（追索拖欠工资）.docx'
  },
  'overtime': {
    file: 'template_overtime.docx',
    originalName: '劳动仲裁申请书（追索加班费）.docx'
  },
  'compensation': {
    file: 'template_compensation.docx',
    originalName: '劳动仲裁申请书（离职补偿）.docx'
  },
  'injury': {
    file: 'template_injury.docx',
    originalName: '劳动仲裁申请书（工伤认定）.docx'
  },
  'relation': {
    file: 'template_relation.docx',
    originalName: '劳动人事争议仲裁申请书.docx'
  },
  'social_security': {
    file: 'template_social_security.docx',
    originalName: '未缴纳社保劳动仲裁申请书范本.docx'
  },
  'non_compete': {
    file: 'template_non_compete.docx',
    originalName: '劳动仲裁答辩书（竞业限制争议—劳动者通用填空模板）.docx'
  },
  'multiple': {
    file: 'template_multiple.docx',
    originalName: '劳动仲裁申请书模板（确认劳动关系、拖欠薪资、经济补偿金、加班工资、加发赔偿金）.docx'
  }
};

export default function Arbitration() {
  const { t } = useTranslation();
  const [selectedCase, setSelectedCase] = useState<string | undefined>(undefined);

  const handleDownload = () => {
    if (!selectedCase) {
      message.warning(t('arbitration.selectFirst'));
      return;
    }

    const docInfo = DOCUMENT_FILES[selectedCase];
    const caseName = t(`arbitration.case.${selectedCase}`);
    message.loading(`${t('arbitration.downloading')}: ${caseName}...`, 1);
    
    // 直接指向 public/templates 下的文件路径
    const fileUrl = `/templates/${docInfo.file}`;
  
    // 创建隐藏的 a 标签进行下载
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = docInfo.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 流程步骤数据
  const flowSteps = [
    { step: '1', key: 'step1' },
    { step: '2', key: 'step2' },
    { step: '3', key: 'step3' },
    { step: '4', key: 'step4' },
    { step: '5', key: 'step5' }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 标题区域 */}
      <header className="mb-8">
        <Title level={2} className="flex items-center gap-3">
          <AuditOutlined className="text-blue-600" />
          {t('arbitration.engineTitle')}
        </Title>
        <Paragraph className="text-slate-500 text-lg">
          {t('arbitration.engineDesc')}
        </Paragraph>
      </header>

      {/* 左右两栏布局 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左栏：文书下载 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card 
            className="rounded-3xl border-slate-200 shadow-xl shadow-slate-100 h-full"
            title={
              <Space>
                <FileWordOutlined className="text-blue-600" />
                <span className="font-bold">{t('arbitration.downloadCenter')}</span>
              </Space>
            }
          >
            <div className="flex flex-col gap-6">
              {/* 案由选择 */}
              <div className="space-y-2">
                <Text strong className="block text-slate-700">{t('arbitration.selectCase')}</Text>
                <Select
                  placeholder={t('arbitration.selectPlaceholder')}
                  className="w-full"
                  size="large"
                  onChange={(value) => setSelectedCase(value)}
                  value={selectedCase}
                >
                  {DOCUMENT_KEYS.map((key) => (
                    <Option key={key} value={key}>{t(`arbitration.case.${key}`)}</Option>
                  ))}
                </Select>
              </div>

              {/* 下载按钮 */}
              <div>
                <Tooltip title={!selectedCase ? t('arbitration.selectFirst') : ""}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!selectedCase}
                    className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-blue-100 w-full"
                  >
                    {t('arbitration.downloadButton')}
                  </Button>
                </Tooltip>
              </div>

              {/* 填写提示 */}
              <div className="rounded-2xl bg-blue-50 p-5 border border-blue-100">
                <div className="mb-3 flex items-center gap-2 font-bold text-blue-900">
                  <InfoCircleOutlined />
                  {t('arbitration.hintTitle')}
                </div>
                <Paragraph className="mb-0 text-sm text-blue-700 leading-relaxed space-y-2">
                  <div>
                    <Text strong className="text-blue-900">1. {t('arbitration.hint1')}</Text>
                    {t('arbitration.hint1Desc')}
                  </div>
                  <div>
                    <Text strong className="text-blue-900">2. {t('arbitration.hint2')}</Text>
                    {t('arbitration.hint2Desc')}
                  </div>
                  <div>
                    <Text strong className="text-blue-900">3. {t('arbitration.hint3')}</Text>
                    {t('arbitration.hint3Desc')}
                  </div>
                  <div>
                    <Text strong className="text-blue-900">4. {t('arbitration.hint4')}</Text>
                    {t('arbitration.hint4Desc')}
                  </div>
                  <div>
                    <Text strong className="text-blue-900">5. {t('arbitration.hint5')}</Text>
                    {t('arbitration.hint5Desc')}
                  </div>
                </Paragraph>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 右栏：仲裁流程示意图 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card 
            className="rounded-3xl border-slate-200 shadow-xl shadow-slate-100 h-full"
            title={
              <Space>
                <AuditOutlined className="text-green-600" />
                <span className="font-bold">{t('arbitration.flowTitle')}</span>
              </Space>
            }
          >
            <div className="space-y-4">
              {flowSteps.map((step, index) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  {/* 步骤圆圈 */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {step.step}
                  </div>
                  
                  {/* 步骤内容 */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Text strong className="text-slate-800 text-base">
                        {t(`arbitration.flow.${step.key}`)}
                      </Text>
                      <Text type="secondary" className="text-sm">
                        {t(`arbitration.flow.${step.key}Title`)}
                      </Text>
                    </div>
                    <Text className="text-slate-500 text-sm">
                      {t(`arbitration.flow.${step.key}Desc`)}
                    </Text>
                  </div>

                  {/* 连接线（最后一个不显示） */}
                  {index < flowSteps.length - 1 && (
                    <div className="absolute left-6 mt-12 w-0.5 h-4 bg-blue-200" />
                  )}
                </motion.div>
              ))}

              {/* 重要提示 */}
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <CheckCircleOutlined className="text-amber-600 mt-0.5" />
                  <div>
                    <Text strong className="block text-amber-800 mb-1">
                      {t('arbitration.warningTitle')}
                    </Text>
                    <Text className="text-amber-700 text-sm">
                      {t('arbitration.warningDesc')}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 底部提示卡片 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
          <Title level={5}>{t('arbitration.submitTip')}</Title>
          <Text className="text-slate-500 text-sm">
            {t('arbitration.submitTipDesc')}
          </Text>
        </Card>
        <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
          <Title level={5}>{t('arbitration.evidenceTip')}</Title>
          <Text className="text-slate-500 text-sm">
            {t('arbitration.evidenceTipDesc')}
          </Text>
        </Card>
      </div>
    </div>
  );
}