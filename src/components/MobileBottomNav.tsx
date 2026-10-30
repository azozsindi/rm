import React, { useState } from 'react';
import { 
  CircleDollarSign, 
  LayoutDashboard, 
  Wallet, 
  LockKeyhole, 
  Menu, 
  X, 
  Tag, 
  Receipt, 
  Users, 
  BarChart3, 
  History,
  ShieldCheck,
  Scissors
} from 'lucide-react';
import { TabKey } from './Navigation';
import { useAccounting } from '../store/AccountingContext';

interface MobileBottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { currentUser, can } = useAccounting();
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  const handleSelectTab = (tab: TabKey) => {
    onTabChange(tab);
    setShowMoreMenu(false);
  };

  const moreItems: { key: TabKey; label: string; icon: React.ReactNode; requiredPermission?: import('../types').PermissionKey }[] = [
    { key: 'users', label: 'إدارة المستخدمين والصلاحيات', icon: <Users className="w-5 h-5 text-indigo-400" />, requiredPermission: 'system.users_view' },
    { key: 'expenses', label: 'المصروفات التشغيلية', icon: <Receipt className="w-5 h-5 text-rose-400" />, requiredPermission: 'drawer.view' },
    { key: 'reports', label: 'التقارير المالية والأرباح', icon: <BarChart3 className="w-5 h-5 text-amber-400" />, requiredPermission: 'reports.daily' },
    { key: 'deductions', label: 'خصومات الموظفين', icon: <Scissors className="w-5 h-5 text-rose-400" />, requiredPermission: 'salaries.deductions_view' },
    { key: 'salaries', label: 'الرواتب الشهرية للموظفين', icon: <Users className="w-5 h-5 text-emerald-400" />, requiredPermission: 'salaries.view' },
    { key: 'pricing', label: 'إدارة الأسعار والخدمات', icon: <Tag className="w-5 h-5 text-blue-400" />, requiredPermission: 'services.view' },
    { key: 'ledger', label: 'سجل التدقيق والرقابة', icon: <History className="w-5 h-5 text-purple-400" />, requiredPermission: 'system.audit_view' },
  ];

  const visibleMoreItems = moreItems.filter(item => !item.requiredPermission || can(item.requiredPermission));
  const isMoreActive = visibleMoreItems.some(item => item.key === activeTab);

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Visible only on Mobile & Tablet: < md) */}
      <nav aria-label="شريط التنقل السفلي للجوال" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800/90 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),10px)] shadow-2xl no-print w-full">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto w-full gap-1">
          
          {/* 1. Cashier (Primary Thumb Action) */}
          <button
            type="button"
            onClick={() => handleSelectTab('cashier')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] sm:min-h-[48px] rounded-xl transition-all relative ${
              activeTab === 'cashier' ? 'text-sky-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${
              activeTab === 'cashier' ? 'bg-sky-500/20 text-sky-400 scale-110 shadow-sm shadow-sky-500/20' : ''
            }`}>
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 leading-normal font-bold">الكاشير</span>
          </button>

          {/* 2. Dashboard */}
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] sm:min-h-[48px] rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-sky-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${
              activeTab === 'dashboard' ? 'bg-sky-500/20 text-sky-400 scale-110 shadow-sm shadow-sky-500/20' : ''
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 leading-normal font-bold">الرئيسية</span>
          </button>

          {/* 3. Cash Drawer */}
          <button
            type="button"
            onClick={() => handleSelectTab('drawer')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] sm:min-h-[48px] rounded-xl transition-all ${
              activeTab === 'drawer' ? 'text-sky-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${
              activeTab === 'drawer' ? 'bg-sky-500/20 text-sky-400 scale-110 shadow-sm shadow-sky-500/20' : ''
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 leading-normal font-bold">الصندوق</span>
          </button>

          {/* 4. Shift Close */}
          <button
            type="button"
            onClick={() => handleSelectTab('shift-close')}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] sm:min-h-[48px] rounded-xl transition-all ${
              activeTab === 'shift-close' ? 'text-sky-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${
              activeTab === 'shift-close' ? 'bg-sky-500/20 text-sky-400 scale-110 shadow-sm shadow-sky-500/20' : ''
            }`}>
              <LockKeyhole className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 leading-normal font-bold">الشفت</span>
          </button>

          {/* 5. More Menu */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center py-1 min-h-[44px] sm:min-h-[48px] rounded-xl transition-all relative ${
              isMoreActive || showMoreMenu ? 'text-sky-400 font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-transform ${
              isMoreActive || showMoreMenu ? 'bg-sky-500/20 text-sky-400 scale-110 shadow-sm shadow-sky-500/20' : ''
            }`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 leading-normal font-bold">المزيد</span>
            {isMoreActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute top-1.5 left-1/2 -translate-x-1/2"></span>
            )}
          </button>

        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-2"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  أقسام النظام وإدارة المغسلة
                </h3>
                <p className="text-xs text-slate-400">
                  المستخدم الحالي: <strong className="text-sky-400">{currentUser.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Permitted Pages */}
            <div className="space-y-2">
              {visibleMoreItems.map(item => {
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectTab(item.key)}
                    className={`w-full min-h-[52px] px-4 py-3 rounded-2xl flex items-center justify-between border transition-all text-right ${
                      isActive
                        ? 'bg-sky-500/10 border-sky-500/50 text-white shadow-sm shadow-sky-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                        {item.icon}
                      </div>
                      <div>
                        <span className="font-bold text-sm block">{item.label}</span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                        الحالي
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إغلاق القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
