import React, { useState, useEffect } from 'react';
import { AccountingProvider, useAccounting } from './store/AccountingContext';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { CashierView } from './components/CashierView';
import { PriceManagementView } from './components/PriceManagementView';
import { ExpensesView } from './components/ExpensesView';
import { CashDrawerView } from './components/CashDrawerView';
import { SalariesView } from './components/SalariesView';
import { DeductionsView } from './components/DeductionsView';
import { ReportsView } from './components/ReportsView';
import { ShiftCloseView } from './components/ShiftCloseView';
import { AuditLedgerView } from './components/AuditLedgerView';
import { UserManagementView } from './components/UserManagementView';
import { ShieldCheck, Sparkles, X } from 'lucide-react';

function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabKey>('cashier'); // Cashier first on mobile for swift operation!
  const [isAdminPortalBanner, setIsAdminPortalBanner] = useState<boolean>(false);
  const { users, currentUser, setCurrentUser } = useAccounting();

  // Detect URL parameters on mount (?portal=admin, ?portal=cashier, ?user=username)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    const userParam = params.get('user');

    if (portal === 'admin') {
      setIsAdminPortalBanner(true);
      setActiveTab('users'); // Open administration & users management directly for admin
    } else if (portal === 'cashier') {
      setActiveTab('cashier');
    }

    if (userParam && users.length > 0) {
      const cleanUser = userParam.trim().toLowerCase();
      const matched = users.find(u => 
        u.username.toLowerCase() === cleanUser || 
        (u.email && u.email.toLowerCase() === cleanUser)
      );
      if (matched && matched.isActive) {
        setCurrentUser(matched);
      }
    }
  }, [users, setCurrentUser]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden w-full max-w-full">
      
      {/* Admin Dedicated Portal Banner */}
      {isAdminPortalBanner && (
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 border-b border-sky-500/40 px-2.5 sm:px-3 py-2 text-xs flex items-center justify-between no-print shadow-lg w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full px-1 min-w-0">
            <span className="w-5 h-5 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <div className="flex-1 min-w-0 text-sky-200 text-[11px] sm:text-xs">
              <strong className="font-black text-white ml-1">بوابة الإدارة:</strong>
              <span className="truncate inline-block max-w-[200px] xs:max-w-none align-bottom sm:align-baseline">تم تفعيل جلسة بوابة الإدارة والتحكم لمغسلة RM STAR CAR WASH.</span>
            </div>
            <button
              onClick={() => setIsAdminPortalBanner(false)}
              className="mr-auto text-slate-400 hover:text-white p-1 min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header onNavigateToUsers={() => setActiveTab('users')} />

      {/* Desktop Navigation Tabs (Hidden on mobile) */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area (With bottom padding on mobile to clear the bottom nav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8 overflow-x-hidden">
        {activeTab === 'cashier' && <CashierView />}
        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === 'pricing' && <PriceManagementView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'drawer' && <CashDrawerView />}
        {activeTab === 'salaries' && <SalariesView />}
        {activeTab === 'deductions' && <DeductionsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'shift-close' && <ShiftCloseView />}
        {activeTab === 'ledger' && <AuditLedgerView />}
        {activeTab === 'users' && <UserManagementView />}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Visible only on mobile/tablet) */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Footer (Hidden on small mobile screens to keep view clean, visible on md+) */}
      <footer className="hidden md:block bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sky-400">RM STAR CAR WASH</span>
            <span>·</span>
            <span>النظام المحاسبي المالي المتكامل وإدارة الكاشير والشفتات والموظفين</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            المملكة العربية السعودية · توقيت الرياض (UTC+3) · متوافق 100% مع الجوال
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AccountingProvider>
      <AppLayout />
    </AccountingProvider>
  );
}
