export type UserIdentity = 'job_seeker' | 'employee' | 'resigned';

export interface IdentityConfig {
  id: UserIdentity;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const IDENTITIES: IdentityConfig[] = [
  {
    id: 'job_seeker',
    title: '求职者',
    description: '合同风险识别、薪酬真实性判断、企业背景调查',
    icon: 'Search',
    color: 'bg-blue-500',
  },
  {
    id: 'employee',
    title: '在职人员',
    description: '税务优化、福利待遇咨询、维权指导',
    icon: 'Briefcase',
    color: 'bg-green-500',
  },
  {
    id: 'resigned',
    title: '离职人员',
    description: '离职补偿计算、仲裁指导、后续保障',
    icon: 'LogOut',
    color: 'bg-orange-500',
  },
];
