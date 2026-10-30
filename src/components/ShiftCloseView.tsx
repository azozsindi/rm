import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  LockKeyhole, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wallet, 
  CreditCard, 
  Sparkles, 
  History,
  Calendar,
  Sun,
  Moon,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { ShiftType, ShiftCloseRecord } from '../types';
import { 
  formatSaudiDate, 
  formatSaudiTime, 
  getShiftShortName, 
  getShiftNameInArabic,
  formatFriendlyArabicDateTime
} from '../utils/time';

export const ShiftCloseView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    activeShift, 
    saudiTimeNow, 
    closeShift,
    metrics 
  } = useAccounting();

  const todayStr = formatSaudiDate(saudiTimeNow);

  // Selected shift to close: Normalize to 'morning' or 'evening'
  const initialTarget: ShiftType = (activeShift === 'morning' || activeShift === 'hakim') ? 'morning' : 'evening';
  const [targetShift, setTargetShift] = useState<ShiftType>(initialTarget);
  const [shiftDate, setShiftDate] = useState<string>(todayStr);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  const [closeResult, setCloseResult] = useState<{ success: boolean; record?: ShiftCloseRecord; error?: string } | null>(null);

  const isTargetMorning = targetShift === 'morning' || targetShift === 'hakim';

  // Check if target shift for this date is already closed (matching new & legacy values)
  const existingClosure = state.shiftClosures.find(c => {
    const isClosureMorning = c.shift === 'morning' || c.shift === 'hakim';
    const matchesShift = isTargetMorning ? isClosureMorning : (!isClosureMorning);
    return matchesShift && c.shiftDate === shiftDate && c.isClosed;
  });

  // Calculate live shift numbers for target shift and date
  const targetShiftSales = state.sales.filter(s => {
    if (s.status !== 'completed' || s.saudiFormattedDate !== shiftDate) return false;
    const isSaleMorning = s.shift === 'morning' || s.shift === 'hakim';
    return isTargetMorning ? isSaleMorning : (!isSaleMorning);
  });

  let shiftCashReceipts = 0;
  let shiftNetworkSales = 0;
  let shiftPaidWashes = 0;
  let shiftFreeWashes = 0;
  let shiftExtrasRevenue = 0;
  let shiftTotalSales = 0;

  for (const s of targetShiftSales) {
    shiftCashReceipts += s.cashAmount;
    shiftNetworkSales += s.networkAmount;
    shiftExtrasRevenue += s.extraServicesTotal;
    shiftTotalSales += s.totalAmount;
    if (s.isFreeWash) {
      shiftFreeWashes++;
    } else {
      shiftPaidWashes++;
    }
  }

  // Shift cash expenses for that date
  const shiftCashExpenses = state.expenses
    .filter(e => e.status === 'paid' && e.paymentMethod === 'cash' && e.date === shiftDate)
    .reduce((sum, e) => sum + e.amount, 0);

  // Shift cash withdrawals & deposits
  let shiftCashWithdrawals = 0;
  let shiftCashDeposits = 0;
  for (const m of state.drawerMovements) {
    const isMovementMorning = m.shift === 'morning' || m.shift === 'hakim';
    const matchesShift = isTargetMorning ? isMovementMorning : (!isMovementMorning);
    if (matchesShift && m.saudiTime.startsWith(shiftDate)) {
      if (m.type === 'withdrawal') shiftCashWithdrawals += m.amount;
      if (m.type === 'deposit') shiftCashDeposits += m.amount;
    }
  }

  // Expected cash for this shift
  const computedExpectedCash = state.openingBalance + shiftCashReceipts - shiftCashExpenses - shiftCashWithdrawals + shiftCashDeposits;

  // Live difference with entered actual cash
  const parsedActualCash = parseFloat(actualCashInput);
  const liveDiff = isNaN(parsedActualCash) ? 0 : (parsedActualCash - computedExpectedCash);

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedActualCash) || parsedActualCash < 0) {
      setCloseResult({ success: false, error: 'الرجاء إدخال النقد الفعلي بالصندوق بشكل صحيح.' });
      return;
    }

    const res = closeShift({
      shift: targetShift,
      shiftDate,
      actualCash: parsedActualCash,
      notes: closeNotes.trim() || undefined,
    });

    setCloseResult(res);
    if (res.success) {
      setActualCashInput('');
      setCloseNotes('');
    }
  };

  const isActiveShiftMorning = activeShift === 'morning' || activeShift === 'hakim';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full pb-8">
      
      {/* 1. Header Banner - Sleek, Compact, High-Tech */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <LockKeyhole className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              إغلاق ومطابقة الشفت
            </h1>
            <span className="text-[11px] bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              جرد الصندوق اليومي
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مطابقة النقد الفعلي بالدرج مع الرصيد المحاسبي المعتمد لمغسلة RM STAR CAR WASH
          </p>
        </div>

        {/* Current Active Shift Live Indicator */}
        <div className="bg-slate-950/80 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-inner">
          <Clock className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-slate-300">
            الشفت التلقائي الآن:
          </span>
          {isActiveShiftMorning ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              شفت الصباح
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-lg border border-sky-500/30">
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              شفت المساء
            </span>
          )}
        </div>
      </div>

      {/* 2. Modern Shift Selector & Date Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Modern Segmented Shift Tabs */}
        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
            اختر الشفت المراد إغلاقه ومطابقته:
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
            {/* Morning Shift Tab */}
            <button
              type="button"
              onClick={() => {
                setTargetShift('morning');
                setCloseResult(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                isTargetMorning
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sun className={`w-4 h-4 ${isTargetMorning ? 'text-amber-400' : 'text-slate-500'}`} />
              <div className="text-right sm:text-center">
                <span className="block leading-tight font-black">شفت الصباح</span>
                <span className="text-[10px] opacity-75 font-normal block leading-tight">12:00 ص – 12:00 م</span>
              </div>
            </button>

            {/* Evening Shift Tab */}
            <button
              type="button"
              onClick={() => {
                setTargetShift('evening');
                setCloseResult(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                !isTargetMorning
                  ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/20 border border-sky-500/50 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Moon className={`w-4 h-4 ${!isTargetMorning ? 'text-sky-400' : 'text-slate-500'}`} />
              <div className="text-right sm:text-center">
                <span className="block leading-tight font-black">شفت المساء</span>
                <span className="text-[10px] opacity-75 font-normal block leading-tight">12:00 م – 12:00 ص</span>
              </div>
            </button>
          </div>
        </div>

        {/* Shift Date Picker */}
        <div className="shrink-0 w-full md:w-auto">
          <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
            تاريخ الشفت:
          </label>
          <div className="relative">
            <input
              type="date"
              value={shiftDate}
              onChange={e => {
                setShiftDate(e.target.value);
                setCloseResult(null);
              }}
              className="w-full md:w-auto bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

      </div>

      {/* 3. Shift Status View (Already Closed vs Open For Settlement) */}
      {existingClosure ? (
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  تم إغلاق {existingClosure.shiftName} لتاريخ ({existingClosure.shiftDate}) مسبقاً
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  تم الاعتماد والمطابقة بواسطة: <strong className="text-white">{existingClosure.closedBy}</strong> · في <span className="font-mono text-emerald-300">{formatFriendlyArabicDateTime(existingClosure.closedAt)}</span>
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1 rounded-full">
              معتمد ومغلق نهائياً
            </span>
          </div>

          {/* 4 Financial Highlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center sm:text-right">
              <span className="text-[11px] text-slate-400 block mb-1">النقد المتوقع:</span>
              <span className="text-base sm:text-lg font-black font-mono-numbers text-white block">
                {existingClosure.expectedCash.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center sm:text-right">
              <span className="text-[11px] text-slate-400 block mb-1">النقد الفعلي المسجل:</span>
              <span className="text-base sm:text-lg font-black font-mono-numbers text-sky-400 block">
                {existingClosure.actualCash.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center sm:text-right">
              <span className="text-[11px] text-slate-400 block mb-1">فرق المطابقة:</span>
              <span className={`text-base sm:text-lg font-black font-mono-numbers block ${
                existingClosure.difference === 0 
                  ? 'text-emerald-400' 
                  : existingClosure.difference > 0 
                  ? 'text-blue-400' 
                  : 'text-rose-400'
              }`}>
                {existingClosure.difference > 0 ? '+' : ''}{existingClosure.difference.toFixed(2)} <span className="text-[10px]">ر.س</span>
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center sm:text-right">
              <span className="text-[11px] text-slate-400 block mb-1">مبيعات الشبكة (مدى):</span>
              <span className="text-base sm:text-lg font-black font-mono-numbers text-blue-300 block">
                {existingClosure.networkSales.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>حماية مالية: يمنع النظام تكرار إغلاق نفس الشفت لنفس التاريخ منعاً لتكرار القيود أو تضارب الأرصدة.</span>
          </p>
        </div>
      ) : (
        /* Open Shift: Stats Summary & Settlement Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Shift Calculated Operations (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    ملخص عمليات {getShiftNameInArabic(targetShift)} لتاريخ ({shiftDate})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    البيانات محسوبة آلياً من واقع العمليات المسجلة خلال هذا الشفت
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                  {targetShiftSales.length} فاتورة
                </span>
              </div>

              {/* 6 Responsive Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">مقبوضات الكاش:</span>
                  <span className="text-base sm:text-xl font-black text-emerald-400 font-mono-numbers block">
                    {shiftCashReceipts.toLocaleString()} <span className="text-[10px]">ر.س</span>
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">مبيعات الشبكة (مدى):</span>
                  <span className="text-base sm:text-xl font-black text-blue-400 font-mono-numbers block">
                    {shiftNetworkSales.toLocaleString()} <span className="text-[10px]">ر.س</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">خارج نقد الصندوق</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">إجمالي المبيعات:</span>
                  <span className="text-base sm:text-xl font-black text-white font-mono-numbers block">
                    {shiftTotalSales.toLocaleString()} <span className="text-[10px] text-amber-400">ر.س</span>
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">الغسلات المنفذة:</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono-numbers block">
                    {shiftPaidWashes} مدفوعة · {shiftFreeWashes} مجانية
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">إيراد الخدمات الإضافية:</span>
                  <span className="text-xs sm:text-sm font-bold text-sky-400 font-mono-numbers block">
                    {shiftExtrasRevenue.toLocaleString()} ر.س
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">مصروفات وسحوبات كاش:</span>
                  <span className="text-xs sm:text-sm font-bold text-rose-400 font-mono-numbers block">
                    {(shiftCashExpenses + shiftCashWithdrawals).toLocaleString()} ر.س
                  </span>
                </div>

              </div>

              {/* Expected Cash in Drawer Highlight Box */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-950 to-sky-950/40 p-4 rounded-xl border border-sky-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner">
                <div>
                  <span className="text-xs text-sky-200 block font-semibold">
                    النقد المحاسبي المتوقع وجوده في الدرج:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono-numbers block mt-0.5">
                    {computedExpectedCash.toLocaleString()} <span className="text-sm font-normal">ريال سعودي</span>
                  </span>
                </div>
                <div className="text-right sm:text-left text-xs text-slate-400 font-mono-numbers space-y-0.5">
                  <div>الافتتاحي: {state.openingBalance} ر.س</div>
                  <div className="text-emerald-400">+ مقبوضات: {shiftCashReceipts} ر.س</div>
                  <div className="text-rose-400">- سحوبات ومصروفات: {shiftCashExpenses + shiftCashWithdrawals} ر.س</div>
                </div>
              </div>

            </div>
          </div>

          {/* Actual Cash Input & Close Shift Form (1 col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-sky-400" />
                <span>مطابقة النقد الفعلي وإغلاق الشفت</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                يقوم الكاشير أو المدير بعدّ النقد الفعلي في الصندوق
              </p>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">
                  النقد الفعلي المحصي في الدرج (ر.س) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="أدخل المبلغ بعد عدّ النقد بالدرج..."
                  value={actualCashInput}
                  onChange={e => setActualCashInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white font-mono-numbers text-center focus:outline-none focus:border-sky-500 shadow-inner"
                  required
                />
              </div>

              {/* Instant Real-Time Difference Pill */}
              {!isNaN(parsedActualCash) && actualCashInput.trim() !== '' && (
                <div className={`p-3 rounded-xl border text-xs transition-all ${
                  liveDiff === 0
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : liveDiff > 0
                    ? 'bg-blue-950/50 border-blue-500/50 text-blue-300'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                }`}>
                  <div className="flex justify-between items-center font-bold">
                    <span>نتيجة المطابقة:</span>
                    <span className="font-mono-numbers text-sm">
                      {liveDiff === 0
                        ? 'مطابق 100% (0 ر.س)'
                        : liveDiff > 0
                        ? `فائض نقد: +${liveDiff.toFixed(2)} ر.س`
                        : `عجز نقد: ${liveDiff.toFixed(2)} ر.س`}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  ملاحظات الإغلاق والتسليم
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول الشفت، تسليم العهدة، تبرير أي فرق إن وجد..."
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {closeResult && !closeResult.success && (
                <div className="p-3 bg-rose-950/70 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{closeResult.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all min-h-[48px]"
              >
                اعتماد إغلاق الشفت والمطابقة
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 4. Shift Closures Log - Responsive Card view on Mobile & Clean Table on Desktop */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <span>سجل تقارير إغلاقات الشفتات السابقة</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {state.shiftClosures.length} إغلاق محفوظ
          </span>
        </div>

        {/* Mobile View: Cards Layout */}
        <div className="block sm:hidden divide-y divide-slate-800/80 p-3 space-y-3">
          {state.shiftClosures.length > 0 ? (
            state.shiftClosures.map(rec => (
              <div key={rec.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">
                    {rec.shiftName}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {rec.shiftDate}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  وقت الإغلاق: <span className="font-mono text-slate-300">{formatFriendlyArabicDateTime(rec.closedAt)}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">المبيعات</span>
                    <span className="font-mono-numbers font-bold text-white">{rec.totalSalesRevenue.toFixed(0)} ر.س</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">الفعلي</span>
                    <span className="font-mono-numbers font-bold text-sky-400">{rec.actualCash.toFixed(0)} ر.س</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">الفرق</span>
                    <span className={`font-mono-numbers font-bold ${
                      rec.difference === 0 ? 'text-slate-300' : rec.difference > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {rec.difference > 0 ? '+' : ''}{rec.difference.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>المسؤول: {rec.closedBy}</span>
                  <span>الشبكة: {rec.networkSales.toFixed(0)} ر.س</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              لم يتم تسجيل أي إغلاق شفت حتى الآن.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">الشفت</th>
                <th className="p-3.5">تاريخ الشفت</th>
                <th className="p-3.5">وقت الإغلاق</th>
                <th className="p-3.5 text-center">المبيعات الإجمالية</th>
                <th className="p-3.5 text-center">النقد المتوقع</th>
                <th className="p-3.5 text-center">النقد الفعلي</th>
                <th className="p-3.5 text-center">الفرق (عجز/فائض)</th>
                <th className="p-3.5 text-center">مبيعات الشبكة</th>
                <th className="p-3.5 text-center">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {state.shiftClosures.length > 0 ? (
                state.shiftClosures.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {rec.shiftName}
                    </td>
                    <td className="p-3.5 font-mono-numbers text-slate-300 whitespace-nowrap">
                      {rec.shiftDate}
                    </td>
                    <td className="p-3.5 font-mono-numbers text-slate-400 whitespace-nowrap">
                      {formatFriendlyArabicDateTime(rec.closedAt)}
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-white font-bold whitespace-nowrap">
                      {rec.totalSalesRevenue.toFixed(2)} ر.س
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-slate-300 whitespace-nowrap">
                      {rec.expectedCash.toFixed(2)} ر.س
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sky-400 font-bold whitespace-nowrap">
                      {rec.actualCash.toFixed(2)} ر.س
                    </td>
                    <td className={`p-3.5 text-center font-mono-numbers font-black whitespace-nowrap ${
                      rec.difference === 0 ? 'text-slate-300' : rec.difference > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {rec.difference > 0 ? '+' : ''}{rec.difference.toFixed(2)} ر.س
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-blue-300 whitespace-nowrap">
                      {rec.networkSales.toFixed(2)} ر.س
                    </td>
                    <td className="p-3.5 text-center text-slate-400 whitespace-nowrap">
                      {rec.closedBy}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لم يتم تسجيل أي إغلاق شفت حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
