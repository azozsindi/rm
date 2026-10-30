import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { formatSaudiTime, formatSaudiDate, getShiftShortName } from '../utils/time';
import { Clock, UserCheck, ChevronDown, Check, X, UserCog, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onNavigateToUsers?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToUsers }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    users,
    activeShift, 
    saudiTimeNow,
    metrics,
    can
  } = useAccounting();

  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const activeUsers = users.filter(u => u.isActive);
  const canManageUsers = can('system.users_view');

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-lg no-print w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full max-w-full">
        
        {/* Main Bar: Compact on Mobile (48px-52px), Full on Desktop */}
        <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4 w-full max-w-full overflow-hidden">
          
          {/* Brand Lockup with Real Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-12 sm:w-12 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10 p-0.5 shrink-0 overflow-hidden">
              <img 
                src="/assets/aistudio/d75f30e4-2e7f-48d8-a862-445d465f253d_IMG-7131_646dea62.webp" 
                alt="RM STAR CAR WASH" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="shrink-0 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-xs xs:text-sm sm:text-xl tracking-tight text-white whitespace-nowrap">
                  RM STAR
                </span>
                <span className="hidden sm:inline text-[9px] sm:text-xs bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap">
                  محاسبة وكاشير
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                مغسلة آر إم ستار — الإدارة المالية وشفتات الكاشير والصندوق
              </p>
            </div>
          </div>

          {/* Center Info: Live Clock & Shift Badge (Responsive & spaced with zero crowding) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs shrink min-w-0">
            {/* Clock - Hidden on small mobile (<sm) to prevent any crowding with shift badge and user button */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 px-2 sm:px-3 py-1.5 rounded-xl text-slate-300 font-mono-numbers shrink-0 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-bold text-white text-xs whitespace-nowrap">
                {formatSaudiTime(saudiTimeNow, false)}
              </span>
            </div>

            {/* Active Shift Badge: صباح ومساء (Selector 4) */}
            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold whitespace-nowrap shrink-0 shadow-sm ${
              activeShift === 'morning' || activeShift === 'hakim'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
            }`}>
              <span className="text-xs">{activeShift === 'morning' || activeShift === 'hakim' ? '☀️' : '🌙'}</span>
              <strong className="font-extrabold">
                {activeShift === 'morning' || activeShift === 'hakim' ? 'شفت الصباح' : 'شفت المساء'}
              </strong>
            </div>
          </div>

          {/* User Switcher: Spaced Button with zero crowding (Selector 3) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Desktop user tabs */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <span className="text-xs text-slate-400 px-1.5">المستخدم:</span>
              {activeUsers.map(u => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>

            {/* Quick Manage Users button on desktop if permitted */}
            {canManageUsers && onNavigateToUsers && (
              <button
                onClick={onNavigateToUsers}
                className="hidden xl:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-sky-400 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                title="إدارة وتخصيص المستخدمين والصلاحيات"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>إدارة الصلاحيات</span>
              </button>
            )}

            {/* Mobile / Tablet User Menu Trigger */}
            <button
              onClick={() => setShowUserModal(true)}
              className="lg:hidden flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-sky-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-sky-400 hover:bg-slate-800 min-h-[36px] shrink-0 whitespace-nowrap shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span className="max-w-[70px] sm:max-w-[85px] truncate font-bold text-white">{currentUser.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>

        </div>

        {/* Desktop Snapshot Ticker (Hidden on Mobile to keep mobile interface clean, modern, and compact) */}
        <div className="hidden md:grid md:grid-cols-6 overflow-x-auto gap-2 py-2 text-xs border-t border-slate-800/80 w-full max-w-full">
          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[110px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">مبيعات اليوم:</span>
            <span className="font-bold text-white font-mono-numbers text-xs sm:text-sm">
              {metrics.todaySales.toLocaleString()} <span className="text-[10px] text-sky-400 font-normal">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[110px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">مبيعات الشهر:</span>
            <span className="font-bold text-white font-mono-numbers text-xs sm:text-sm">
              {metrics.monthSales.toLocaleString()} <span className="text-[10px] text-sky-400 font-normal">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[125px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">كاش / شبكة:</span>
            <span className="font-bold text-slate-200 font-mono-numbers text-xs sm:text-sm">
              {metrics.totalCashSales.toLocaleString()} <span className="text-[9px] text-slate-400">نقد</span> / {metrics.totalNetworkSales.toLocaleString()} <span className="text-[9px] text-slate-400">شبكة</span>
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[110px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">عدد الغسلات:</span>
            <span className="font-bold text-white font-mono-numbers text-xs sm:text-sm">
              {metrics.paidWashesCount} مدفوع · {metrics.freeWashesCount} مجان
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[120px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">نقد الصندوق:</span>
            <span className="font-bold text-sky-300 font-mono-numbers text-xs sm:text-sm">
              {metrics.expectedCashInDrawer.toLocaleString()} <span className="text-[10px] text-sky-400 font-normal">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shrink-0 min-w-[110px] sm:min-w-0">
            <span className="text-slate-400 block text-[10px]">صافي الربح:</span>
            <span className={`font-bold font-mono-numbers text-xs sm:text-sm ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.netProfit.toLocaleString()} <span className="text-[10px] font-normal">ر.س</span>
            </span>
          </div>
        </div>

      </div>

      {/* Mobile User Selection Bottom Sheet */}
      {showUserModal && (
        <div className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="fixed inset-0" onClick={() => setShowUserModal(false)} />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-1 mb-2"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  تبديل المستخدم الحالي
                </h3>
                <span className="text-xs text-slate-400">اختر الكاشير أو المدير لبدء العمل باسمه</span>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {activeUsers.map(u => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserModal(false);
                    }}
                    className={`w-full min-h-[50px] p-3.5 rounded-xl flex items-center justify-between border text-right transition-all ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="block text-sm font-bold">{u.name}</span>
                        {u.role === 'manager' && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">مدير</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {u.role === 'manager' 
                          ? 'صلاحيات كاملة للمدير العام' 
                          : `كاشير · ${u.assignedShift === 'morning' || u.assignedShift === 'hakim' ? 'شفت الصباح' : u.assignedShift === 'evening' || u.assignedShift === 'bandar' ? 'شفت المساء' : 'أي شفت'}`}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-5 h-5 text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Link to User Management for Permitted Users */}
            {canManageUsers && onNavigateToUsers && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    onNavigateToUsers();
                  }}
                  className="w-full py-2.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <UserCog className="w-4 h-4" />
                  <span>إدارة المستخدمين والصلاحيات التفصيلية</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
