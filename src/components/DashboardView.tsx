import React from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  TrendingUp, 
  CircleDollarSign, 
  CreditCard, 
  Gift, 
  Sparkles, 
  Receipt, 
  Users, 
  Wallet, 
  Scale, 
  Clock, 
  ArrowUpRight,
  AlertTriangle,
  PieChart,
  Sun,
  Moon
} from 'lucide-react';
import { TabKey } from './Navigation';
import { formatSaudiDate } from '../utils/time';

interface DashboardViewProps {
  onNavigate: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { metrics, state, saudiTimeNow } = useAccounting();

  const todayStr = formatSaudiDate(saudiTimeNow);

  // Morning Shift Specifics today (12:00 ص - 12:00 م)
  const morningSalesToday = state.sales.filter(s => 
    s.status === 'completed' && (s.shift === 'morning' || s.shift === 'hakim') && s.saudiFormattedDate === todayStr
  );
  const morningTotalToday = morningSalesToday.reduce((sum, s) => sum + s.totalAmount, 0);
  const morningCashToday = morningSalesToday.reduce((sum, s) => sum + s.cashAmount, 0);
  const morningNetworkToday = morningSalesToday.reduce((sum, s) => sum + s.networkAmount, 0);
  const morningPaidWashes = morningSalesToday.filter(s => !s.isFreeWash).length;
  const morningFreeWashes = morningSalesToday.filter(s => s.isFreeWash).length;

  // Evening Shift Specifics today (12:00 م - 12:00 ص)
  const eveningSalesToday = state.sales.filter(s => 
    s.status === 'completed' && (s.shift === 'evening' || s.shift === 'bandar') && s.saudiFormattedDate === todayStr
  );
  const eveningTotalToday = eveningSalesToday.reduce((sum, s) => sum + s.totalAmount, 0);
  const eveningCashToday = eveningSalesToday.reduce((sum, s) => sum + s.cashAmount, 0);
  const eveningNetworkToday = eveningSalesToday.reduce((sum, s) => sum + s.networkAmount, 0);
  const eveningPaidWashes = eveningSalesToday.filter(s => !s.isFreeWash).length;
  const eveningFreeWashes = eveningSalesToday.filter(s => s.isFreeWash).length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* Top Welcome & Quick Actions - Mobile Friendly */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-2xl font-black text-white">
                لوحة التحكم والمؤشرات المالية
              </h1>
              <span className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                بيانات فعلية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إحصائيات حية لتاريخ اليوم: {todayStr}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={() => onNavigate('cashier')}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all min-h-[44px]"
            >
              <CircleDollarSign className="w-4 h-4" />
              <span>تسجيل غسيل</span>
            </button>
            <button
              onClick={() => onNavigate('shift-close')}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-slate-700 transition-all min-h-[44px]"
            >
              <Clock className="w-4 h-4" />
              <span>إغلاق الشفت</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>مبيعات اليوم</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono-numbers">
            {metrics.todaySales.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal text-amber-400">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] sm:text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
            <span>الشهر:</span>
            <span className="font-bold text-slate-200 font-mono-numbers">{metrics.monthSales.toLocaleString()} ر.س</span>
          </div>
        </div>

        {/* 2. Cash vs Network Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>كاش / شبكة</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-white font-mono-numbers">
            {metrics.totalCashSales} <span className="text-slate-500 font-normal">/</span> {metrics.totalNetworkSales}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 truncate">
            {metrics.totalCashSales} كاش · {metrics.totalNetworkSales} شبكة
          </div>
        </div>

        {/* 3. Washes Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>الغسلات المنفذة</span>
            <Gift className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono-numbers">
            {metrics.totalWashesCount}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
            <span className="text-emerald-400 font-semibold">{metrics.paidWashesCount} مدفوع</span>
            <span className="text-amber-400 font-semibold">{metrics.freeWashesCount} مجان</span>
          </div>
        </div>

        {/* 4. Extra Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>إضافات اختيارية</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono-numbers">
            {metrics.extraServicesRevenue.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal text-amber-400">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 truncate">
            مستقلة عن الغسيل
          </div>
        </div>

        {/* 5. Expected Cash in Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>نقد الصندوق المتوقع</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono-numbers">
            {metrics.expectedCashInDrawer.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 truncate">
            وفق معادلة الصندوق
          </div>
        </div>

        {/* 6. Discrepancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>فرق المطابقة</span>
            <Scale className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className={`text-lg sm:text-2xl font-black font-mono-numbers ${
            metrics.totalCashDiscrepancy === 0 ? 'text-slate-200' : metrics.totalCashDiscrepancy > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {metrics.totalCashDiscrepancy > 0 ? '+' : ''}{metrics.totalCashDiscrepancy.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 truncate">
            {metrics.totalCashDiscrepancy === 0 ? 'مطابق تماماً' : 'فروقات إغلاق'}
          </div>
        </div>

        {/* 7. Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>المصروفات</span>
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-300 font-mono-numbers">
            {metrics.paidExpensesTotal.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal text-slate-400">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] text-amber-400 border-t border-slate-800/80 pt-1.5 truncate">
            مستحق: {metrics.accruedExpensesTotal} ر.س
          </div>
        </div>

        {/* 8. Salaries */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium mb-1">
            <span>الرواتب</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-blue-300 font-mono-numbers">
            {metrics.paidSalariesTotal.toLocaleString()} <span className="text-[10px] sm:text-sm font-normal text-slate-400">ر.س</span>
          </div>
          <div className="mt-1.5 text-[10px] text-amber-400 border-t border-slate-800/80 pt-1.5 truncate">
            متبقي: {metrics.accruedSalariesTotal} ر.س
          </div>
        </div>

      </div>

      {/* Row 3: Independent Shift Reports (Mobile: stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Morning Shift Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Sun className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                شفت الصباح
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded font-mono">
              12:00 ص – 12:00 م
            </span>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-3 gap-1.5 sm:gap-2">
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">مبيعات اليوم</span>
              <span className="text-sm sm:text-base font-black text-white font-mono-numbers">
                {morningTotalToday.toLocaleString()} <span className="text-[10px] text-amber-400">ر.س</span>
              </span>
            </div>
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">كاش / شبكة</span>
              <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                {morningCashToday} / {morningNetworkToday}
              </span>
            </div>
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">غسلات اليوم</span>
              <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                {morningPaidWashes} مدفوع · {morningFreeWashes} مجان
              </span>
            </div>
          </div>
        </div>

        {/* Evening Shift Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                شفت المساء
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded font-mono">
              12:00 م – 12:00 ص
            </span>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-3 gap-1.5 sm:gap-2">
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">مبيعات اليوم</span>
              <span className="text-sm sm:text-base font-black text-white font-mono-numbers">
                {eveningTotalToday.toLocaleString()} <span className="text-[10px] text-sky-400">ر.س</span>
              </span>
            </div>
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">كاش / شبكة</span>
              <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                {eveningCashToday} / {eveningNetworkToday}
              </span>
            </div>
            <div className="bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">غسلات اليوم</span>
              <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                {eveningPaidWashes} مدفوع · {eveningFreeWashes} مجان
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: P&L Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-amber-400" />
            <span>ملخص الأرباح والخسائر الشامل</span>
          </h2>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            <span>التفاصيل</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">(+) الإيرادات:</span>
            <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono-numbers">
              {metrics.netProfitDetailed.grossRevenue.toLocaleString()} ر.س
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">(-) المصروفات:</span>
            <span className="text-sm sm:text-lg font-black text-rose-400 font-mono-numbers">
              {metrics.netProfitDetailed.paidExpenses.toLocaleString()} ر.س
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">(-) الرواتب:</span>
            <span className="text-sm sm:text-lg font-black text-rose-400 font-mono-numbers">
              {metrics.netProfitDetailed.paidSalaries.toLocaleString()} ر.س
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            metrics.netProfitDetailed.netCashProfit >= 0 ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-rose-950/30 border-rose-500/40'
          }`}>
            <span className="text-[10px] text-slate-300 block">(=) صافي الربح:</span>
            <span className={`text-base sm:text-xl font-black font-mono-numbers ${
              metrics.netProfitDetailed.netCashProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {metrics.netProfitDetailed.netCashProfit.toLocaleString()} ر.س
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
