import React from 'react';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  Tag, 
  Receipt, 
  Wallet, 
  Users, 
  BarChart3, 
  LockKeyhole, 
  History,
  Scissors
} from 'lucide-react';
import { useAccounting } from '../store/AccountingContext';

export type TabKey = 
  | 'dashboard'
  | 'cashier'
  | 'pricing'
  | 'expenses'
  | 'drawer'
  | 'salaries'
  | 'deductions'
  | 'reports'
  | 'shift-close'
  | 'ledger'
  | 'users';

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { can } = useAccounting();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; requiredPermission?: import('../types').PermissionKey }[] = [
    { key: 'cashier', label: 'شاشة الكاشير', icon: <CircleDollarSign className="w-4 h-4" />, requiredPermission: 'sales.view' },
    { key: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'drawer', label: 'الصندوق والمطابقة', icon: <Wallet className="w-4 h-4" />, requiredPermission: 'drawer.view' },
    { key: 'shift-close', label: 'إغلاق الشفت', icon: <LockKeyhole className="w-4 h-4" />, requiredPermission: 'shifts.view' },
    { key: 'expenses', label: 'المصروفات', icon: <Receipt className="w-4 h-4" />, requiredPermission: 'drawer.view' },
    { key: 'reports', label: 'التقارير المالية', icon: <BarChart3 className="w-4 h-4" />, requiredPermission: 'reports.daily' },
    { key: 'users', label: 'المستخدمين والصلاحيات', icon: <Users className="w-4 h-4" />, requiredPermission: 'system.users_view' },
    { key: 'salaries', label: 'الرواتب الشهرية', icon: <Users className="w-4 h-4" />, requiredPermission: 'salaries.view' },
    { key: 'deductions', label: 'خصومات الموظفين', icon: <Scissors className="w-4 h-4" />, requiredPermission: 'salaries.deductions_view' },
    { key: 'pricing', label: 'إدارة الأسعار', icon: <Tag className="w-4 h-4" />, requiredPermission: 'services.view' },
    { key: 'ledger', label: 'سجل التدقيق', icon: <History className="w-4 h-4" />, requiredPermission: 'system.audit_view' },
  ];

  return (
    <nav className="hidden md:block bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 space-x-reverse overflow-x-auto py-2 scrollbar-none">
          {tabs.map(tab => {
            const hasAccess = !tab.requiredPermission || can(tab.requiredPermission);
            if (!hasAccess) return null; // strictly do not render unauthorized tabs

            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500 text-slate-950 shadow-md shadow-sky-500/25 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
