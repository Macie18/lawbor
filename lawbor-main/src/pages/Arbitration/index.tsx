import { useState } from 'react';
import { Card, Select, Button, Typography, Space, Tooltip, message } from 'antd';
import { FileWordOutlined, DownloadOutlined, InfoCircleOutlined, AuditOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const DOCUMENT_MAPPING = {
  'general': {
    name: '通用版申请书',
    file: 'template_general.docx',
    originalName: '劳动仲裁申请书（通用版）最全-含证据清单、申请仲裁材料清单、注意事项.docx'
  },
  'salary': {
    name: '追索拖欠工资',
    file: 'template_salary.docx',
    originalName: '劳动仲裁申请书模板（追索拖欠工资）.docx'
  },
  'overtime': {
    name: '追索加班费',
    file: 'template_overtime.docx',
    originalName: '劳动仲裁申请书（追索加班费）.docx'
  },
  'compensation': {
    name: '离职经济补偿',
    file: 'template_compensation.docx',
    originalName: '劳动仲裁申请书（离职补偿）.docx'
  },
  'injury': {
    name: '工伤认定赔偿',
    file: 'template_injury.docx',
    originalName: '劳动仲裁申请书（工伤认定）.docx'
  },
  'relation': {
    name: '确认劳动关系',
    file: 'template_relation.docx',
    originalName: '劳动人事争议仲裁申请书.docx'
  },
  'social_security': {
    name: '未缴纳社保',
    file: 'template_social_security.docx',
    originalName: '未缴纳社保劳动仲裁申请书范本.docx'
  },
  'non_compete': {
    name: '竞业限制争议',
    file: 'template_non_compete.docx',
    originalName: '劳动仲裁答辩书（竞业限制争议—劳动者通用填空模板）.docx'
  },
  'multiple': {
    name: '综合多项诉求',
    file: 'template_multiple.docx',
    originalName: '劳动仲裁申请书模板（确认劳动关系、拖欠薪资、经济补偿金、加班工资、加发赔偿金）.docx'
  }
};

export default function Arbitration() {
  const [selectedCase, setSelectedCase] = useState<string | undefined>(undefined);

  const handleDownload = () => {
    if (!selectedCase) {
      message.warning('请先选择案由');
      return;
    }

    const docInfo = DOCUMENT_MAPPING[selectedCase as keyof typeof DOCUMENT_MAPPING];
    message.loading(`正在准备下载：${docInfo.name}...`, 1);
    
    // 修复方法：直接指向 public/templates 下的文件路径
    // 注意：在打包后的环境下，路径不需要包含 "public"
    const fileUrl = `/templates/${docInfo.file}`;
  
    // 创建一个隐藏的 a 标签进行下载，这样可以自定义下载后的文件名
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = docInfo.originalName; // 使用原始中文文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-12">
        <Title level={2} className="flex items-center gap-3">
          <AuditOutlined className="text-blue-600" />
          精准文书下载引擎
        </Title>
        <Paragraph className="text-slate-500 text-lg">
          为您提供专业的劳动仲裁文书模板。请根据您的具体争议案由选择对应的文书，下载后根据网页提示填写相关信息。
        </Paragraph>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card 
          className="rounded-3xl border-slate-200 shadow-xl shadow-slate-100"
          title={
            <Space>
              <FileWordOutlined className="text-blue-600" />
              <span className="font-bold">文书下载中心</span>
            </Space>
          }
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Text strong className="block text-slate-700">选择您的仲裁事由（案由）</Text>
              <Select
                placeholder="请选择争议类型"
                className="w-full"
                size="large"
                onChange={(value) => setSelectedCase(value)}
                value={selectedCase}
              >
                {Object.entries(DOCUMENT_MAPPING).map(([key, value]) => (
                  <Option key={key} value={key}>{value.name}</Option>
                ))}
              </Select>
            </div>

            <div className="shrink-0">
              <Tooltip title={!selectedCase ? "请先选择案由" : ""}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  disabled={!selectedCase}
                  className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-blue-100"
                >
                  下载该文书模板
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-blue-50 p-6 border border-blue-100">
            <div className="mb-3 flex items-center gap-2 font-bold text-blue-900">
              <InfoCircleOutlined />
              文书填写及使用提示（请仔细阅读）
            </div>
            <Paragraph className="mb-0 text-sm text-blue-700 leading-relaxed">
              1. <Text strong className="text-blue-900">格式说明：</Text>下载后的文书为标准 .docx 格式，建议使用 Microsoft Word 或 WPS 打开编辑，以确保排版不乱。<br />
              2. <Text strong className="text-blue-900">填写提示：</Text>文书中包含大量 <Text underline className="text-blue-900">【括号及下划线提示内容】</Text>，请务必根据您的实际情况（如姓名、入职时间、月薪等）进行替换或删除，不要直接保留提示文字。<br />
              3. <Text strong className="text-blue-900">证据清单：</Text>模板中的证据清单仅供参考，请根据您手头掌握的实际证据（如劳动合同、工资条、社保记录、钉钉打卡记录等）进行增减。<br />
              4. <Text strong className="text-blue-900">份数要求：</Text>劳动仲裁通常需要准备一式三份申请书（仲裁委留存、被申请人留存、申请人留存），建议您在打印前仔细核对被申请人的工商登记信息。<br />
              5. <Text strong className="text-blue-900">专业核对：</Text>建议在提交仲裁前，咨询专业法律人士对文书内容进行最终核对，确保诉求清晰、证据充分。
            </Paragraph>
          </div>
        </Card>
      </motion.div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
          <Title level={5}>提交建议</Title>
          <Text className="text-slate-500 text-sm">
            劳动仲裁通常需要准备一式三份申请书，建议您在打印前仔细核对被申请人的工商登记信息。
          </Text>
        </Card>
        <Card className="rounded-2xl border-slate-100 bg-slate-50/50">
          <Title level={5}>证据准备</Title>
          <Text className="text-slate-500 text-sm">
            除了申请书，证据的完整性是胜诉的关键。请确保存储好工资单、打卡记录及相关聊天截图。
          </Text>
        </Card>
      </div>
    </div>
  );
}
