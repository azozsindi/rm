import React, { useState, useMemo } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  TrendingUp, 
  CreditCard, 
  Gift, 
  Sparkles, 
  Receipt, 
  Users, 
  Scale, 
  Calendar,
  PieChart,
  CheckCircle2
} from 'lucide-react';
import { ShiftType, PaymentMethod } from '../types';
import { formatSaudiDate, formatSaudiTime, getShiftShortName } from '../utils/time';

export const ReportsView: React.FC = () => {
  const { state, currentUser, metrics, saudiTimeNow } = useAccounting();

  const todayStr = formatSaudiDate(saudiTimeNow);
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  // Filters
  const [datePreset, setDatePreset] = useState<'today' | 'this_month' | 'this_year' | 'custom' | 'all'>('this_month');
  const [startDate, setStartDate] = useState<string>(`${currentMonthStr}-01`);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [filterShift, setFilterShift] = useState<string>('all'); // all, morning, evening
  const [filterPayment, setFilterPayment] = useState<string>('all'); // all, cash, network, free
  const [filterService, setFilterService] = useState<string>('all');

  // Handle date preset changes
  const handleDatePresetChange = (preset: 'today' | 'this_month' | 'this_year' | 'custom' | 'all') => {
    setDatePreset(preset);
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      setStartDate(`${currentMonthStr}-01`);
      setEndDate(todayStr);
    } else if (preset === 'this_year') {
      setStartDate(`${currentYearStr}-01-01`);
      setEndDate(todayStr);
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return state.sales.filter(s => {
      if (s.status !== 'completed') return false;

      // Date filter
      if (datePreset !== 'all') {
        if (s.saudiFormattedDate < startDate || s.saudiFormattedDate > endDate) {
          return false;
        }
      }

      // Shift filter (supports both new 'morning'/'evening' and legacy 'hakim'/'bandar')
      if (filterShift !== 'all') {
        const isMorningFilter = filterShift === 'morning' || filterShift === 'hakim';
        const isSaleMorning = s.shift === 'morning' || s.shift === 'hakim';
        if (isMorningFilter ? !isSaleMorning : isSaleMorning) {
          return false;
        }
      }

      // Payment filter
      if (filterPayment !== 'all' && s.paymentMethod !== filterPayment) {
        return false;
      }

      // Service filter
      if (filterService !== 'all' && s.washServiceId !== filterService) {
        return false;
      }

      return true;
    });
  }, [state.sales, datePreset, startDate, endDate, filterShift, filterPayment, filterService]);

  // Aggregate metrics for filtered sales
  const reportTotals = useMemo(() => {
    let grossSales = 0;
    let cashSales = 0;
    let networkSales = 0;
    let paidWashes = 0;
    let freeWashes = 0;
    let extraServicesRevenue = 0;

    for (const s of filteredSales) {
      grossSales += s.totalAmount;
      cashSales += s.cashAmount;
      networkSales += s.networkAmount;
      extraServicesRevenue += s.extraServicesTotal;
      if (s.isFreeWash) {
        freeWashes++;
      } else {
        paidWashes++;
      }
    }

    // Filtered expenses in same date range
    const filteredExpenses = state.expenses.filter(e => {
      if (datePreset === 'all') return true;
      return e.date >= startDate && e.date <= endDate;
    });

    const paidExpenses = filteredExpenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const accruedExpenses = filteredExpenses
      .filter(e => e.status === 'accrued')
      .reduce((sum, e) => sum + e.amount, 0);

    // Paid salaries in date range
    let paidSalaries = 0;
    for (const emp of state.salaries) {
      for (const p of emp.payments) {
        if (datePreset === 'all' || (p.date >= startDate && p.date <= endDate)) {
          paidSalaries += p.amount;
        }
      }
    }

    // Net profit on cash basis
    const netCashProfit = grossSales - paidExpenses - paidSalaries;
    // Net profit on accrual basis
    const netAccrualProfit = grossSales - (paidExpenses + accruedExpenses) - paidSalaries;

    return {
      grossSales,
      cashSales,
      networkSales,
      paidWashes,
      freeWashes,
      totalWashes: paidWashes + freeWashes,
      extraServicesRevenue,
      paidExpenses,
      accruedExpenses,
      paidSalaries,
      netCashProfit,
      netAccrualProfit,
      totalExpensesPaidAndAccrued: paidExpenses + accruedExpenses,
    };
  }, [filteredSales, state.expenses, state.salaries, datePreset, startDate, endDate]);

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'رقم الفاتورة',
      'التاريخ',
      'الوقت',
      'الشفت',
      'نوع الغسيل',
      'سعر الغسيل الأصلي (ر.س)',
      'غسلة مجانية',
      'إجمالي الخدمات الإضافية (ر.س)',
      'إجمالي الفاتورة (ر.س)',
      'طريقة الدفع',
      'مبلغ الكاش',
      'مبلغ الشبكة',
      'الكاشير',
      'الملاحظات'
    ];

    const rows = filteredSales.map(s => [
      s.serialNumber,
      s.saudiFormattedDate,
      s.saudiFormattedTime,
      getShiftShortName(s.shift),
      `"${s.washServiceName}"`,
      s.originalWashPrice,
      s.isFreeWash ? 'نعم (مجاني)' : 'لا',
      s.extraServicesTotal,
      s.totalAmount,
      s.paymentMethod === 'free' ? 'مجاني' : s.paymentMethod === 'cash' ? 'كاش' : 'شبكة',
      s.cashAmount,
      s.networkAmount,
      `"${s.cashierName}"`,
      `"${s.notes || ''}"`
    ]);

    // Summary footer row for CSV
    const summaryRow = [
      'المجموع الإجمالي',
      '',
      '',
      '',
      `"${filteredSales.length} عملية"`,
      '',
      '',
      reportTotals.extraServicesRevenue,
      reportTotals.grossSales,
      '',
      reportTotals.cashSales,
      reportTotals.networkSales,
      '',
      ''
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RM_STAR_CAR_WASH_REPORT_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Action Bar (hidden when printing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-white">
              التقارير المالية والأرباح والخسائر
            </h1>
            <span className="text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              تقارير معتمدة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            كشوفات مالية يومية وشهرية، وتقارير مستقلة للشفتات مع طباعة فورية للإجمالي
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير كاملاً مع الإجمالي</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon (hidden when printing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white whitespace-nowrap">تصفية التقرير:</span>
            </div>
            <div className="flex gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full xs:w-auto">
              {[
                { id: 'today', label: 'اليوم' },
                { id: 'this_month', label: 'هذا الشهر' },
                { id: 'this_year', label: 'هذا العام' },
                { id: 'all', label: 'الكل' },
                { id: 'custom', label: 'مخصص' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handleDatePresetChange(p.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors min-h-[36px] whitespace-nowrap shrink-0 ${
                    datePreset === p.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg text-xs"
              />
              <span className="text-slate-400">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        {/* Secondary filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">الشفت:</label>
            <select
              value={filterShift}
              onChange={e => setFilterShift(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300"
            >
              <option value="all">كافة الشفتات (الصباح والمساء)</option>
              <option value="morning">☀️ شفت الصباح (12:00 ص – 12:00 م)</option>
              <option value="evening">🌙 شفت المساء (12:00 م – 12:00 ص)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">طريقة الدفع:</label>
            <select
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300"
            >
              <option value="all">كافة طرق الدفع</option>
              <option value="cash">كاش فقط</option>
              <option value="network">شبكة فقط</option>
              <option value="free">غسلات مجانية فقط</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">نوع الغسيل:</label>
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300"
            >
              <option value="all">كافة أنواع الغسيل</option>
              {state.services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE REPORT CONTAINER (Specially styled for Print & Screen) */}
      {/* ============================================================== */}
      <div id="report-printable-area" className="printable-report bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-800 print-border-dark pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg">
                RM
              </div>
              <div>
                <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">
                  RM STAR CAR WASH
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  مغسلة سيارات آر إم ستار — الإدارة المالية
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-0.5">
            <div><strong>تقرير المبيعات والعمليات المالية والأرباح</strong></div>
            <div>
              الفترة: <span className="font-mono-numbers font-bold">
                {datePreset === 'all' ? 'كامل المدة المسجلة' : `${startDate} إلى ${endDate}`}
              </span>
            </div>
            <div>
              الشفت: <strong>{filterShift === 'all' ? 'كافة الشفتات' : getShiftShortName(filterShift as any)}</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              تاريخ الطباعة: {formatSaudiDate(saudiTimeNow)} {formatSaudiTime(saudiTimeNow, false)} | المشغل: {currentUser.name}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRAND TOTALS PROMINENT SUMMARY BOX (ALWAYS VISIBLE ON PRINT) */}
        {/* ========================================================= */}
        <div className="border-2 border-amber-500/70 print-border-dark rounded-2xl p-4 sm:p-5 print-bg-gray space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400 no-print" />
              <span>المجموع الإجمالي الشامل للمبيعات والتحصيل</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-400">
              {reportTotals.totalWashes} غسلة مسجلة
            </span>
          </div>

          {/* 3 Main Grand Totals Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-right">
            
            {/* 1. Grand Gross Sales Total */}
            <div className="bg-slate-950 print-bg-gray p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-bold mb-1">
                الإجمالي العام للمبيعات المحصلة:
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers block">
                {reportTotals.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold">ريال سعودي (شامل الغسيل والإضافات)</span>
            </div>

            {/* 2. Cash Total */}
            <div className="bg-slate-950 print-bg-gray p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-bold mb-1">
                إجمالي مقبوضات الكاش (بالصندوق):
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers block">
                {reportTotals.cashSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold">ريال سعودي</span>
            </div>

            {/* 3. Network / Mada Total */}
            <div className="bg-slate-950 print-bg-gray p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-bold mb-1">
                إجمالي مبيعات الشبكة (مدى/بنك):
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono-numbers block">
                {reportTotals.networkSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold">ريال سعودي (خارج نقد الصندوق)</span>
            </div>

          </div>

          {/* Secondary Totals Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="bg-slate-950/60 print-bg-gray p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">الغسلات المدفوعة:</span>
              <span className="font-black text-white font-mono-numbers text-sm">{reportTotals.paidWashes} سيارة</span>
            </div>

            <div className="bg-slate-950/60 print-bg-gray p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">الغسلات المجانية (ولاء):</span>
              <span className="font-black text-purple-400 font-mono-numbers text-sm">{reportTotals.freeWashes} سيارة</span>
            </div>

            <div className="bg-slate-950/60 print-bg-gray p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">إيراد الخدمات الإضافية:</span>
              <span className="font-black text-amber-400 font-mono-numbers text-sm">{reportTotals.extraServicesRevenue.toFixed(2)} ر.س</span>
            </div>

            <div className="bg-slate-950/60 print-bg-gray p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">صافي الربح النقدي:</span>
              <span className={`font-black font-mono-numbers text-sm ${reportTotals.netCashProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {reportTotals.netCashProfit.toFixed(2)} ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Profit & Loss Statement (P&L) */}
        <div className="bg-slate-950/80 print-bg-gray border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="font-black text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <PieChart className="w-4 h-4 text-amber-400 no-print" />
            <span>ملخص الأرباح والخسائر الشامل (P&L Summary)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="font-bold text-slate-200">(+) إجمالي الإيرادات الفعلية (المبيعات):</span>
              <span className="font-black font-mono-numbers text-emerald-400 text-sm">
                +{reportTotals.grossSales.toFixed(2)} ر.س
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-300">(-) المصروفات التشغيلية المدفوعة:</span>
              <span className="font-bold font-mono-numbers text-rose-400 text-sm">
                -{reportTotals.paidExpenses.toFixed(2)} ر.س
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-300">(-) الرواتب المدفوعة فعلياً:</span>
              <span className="font-bold font-mono-numbers text-rose-400 text-sm">
                -{reportTotals.paidSalaries.toFixed(2)} ر.س
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-700 bg-slate-900/80 print-bg-gray px-3 rounded-xl font-bold">
              <span className="text-white text-sm font-black">(=) صافي الربح النقدي النهائي:</span>
              <span className={`text-base sm:text-xl font-black font-mono-numbers ${
                reportTotals.netCashProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {reportTotals.netCashProfit >= 0 ? '+' : ''}{reportTotals.netCashProfit.toFixed(2)} ر.س
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SALES TRANSACTIONS TABLE WITH PROMINENT SUMMARY TFOOT */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-black text-white text-xs sm:text-sm">
              جدول تفاصيل العمليات ({filteredSales.length} فاتورة):
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              الإجمالي: {reportTotals.grossSales.toFixed(2)} ر.س
            </span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[740px] text-right text-xs">
              <thead className="bg-slate-950 text-slate-300 font-black border-b-2 border-slate-800 print-border-dark">
                <tr>
                  <th className="p-2.5">رقم الفاتورة</th>
                  <th className="p-2.5">التاريخ والوقت</th>
                  <th className="p-2.5">الشفت</th>
                  <th className="p-2.5">نوع الغسيل</th>
                  <th className="p-2.5 text-center">إضافات</th>
                  <th className="p-2.5 text-center">طريقة الدفع</th>
                  <th className="p-2.5 text-center">كاش</th>
                  <th className="p-2.5 text-center">شبكة</th>
                  <th className="p-2.5 text-center font-black">إجمالي الفاتورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/20">
                    <td className="p-2 font-mono font-bold text-slate-200">{s.serialNumber}</td>
                    <td className="p-2 font-mono-numbers text-slate-400 whitespace-nowrap">{s.saudiFormattedDate} {s.saudiFormattedTime}</td>
                    <td className="p-2 text-slate-300">{getShiftShortName(s.shift)}</td>
                    <td className="p-2 font-bold text-white">
                      {s.washServiceName} {s.isFreeWash && <span className="text-purple-400 font-normal">(مجاني)</span>}
                    </td>
                    <td className="p-2 text-center font-mono-numbers text-amber-400">
                      {s.extraServicesTotal > 0 ? `${s.extraServicesTotal.toFixed(2)}` : '0.00'}
                    </td>
                    <td className="p-2 text-center text-slate-300">
                      {s.paymentMethod === 'free' ? 'مجاني' : s.paymentMethod === 'cash' ? 'كاش' : 'شبكة'}
                    </td>
                    <td className="p-2 text-center font-mono-numbers text-emerald-400 font-semibold">
                      {s.cashAmount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center font-mono-numbers text-blue-400 font-semibold">
                      {s.networkAmount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center font-mono-numbers font-black text-white">
                      {s.totalAmount.toFixed(2)} ر.س
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      لا توجد مبيعات مسجلة في النطاق المحدد.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* MANDATORY PROMINENT TOTALS ROW (FOOTER) */}
              <tfoot className="bg-slate-950 font-black border-t-2 border-amber-500/80 print-border-dark text-slate-100">
                <tr className="text-sm">
                  <td colSpan={4} className="p-3 font-black text-amber-400 text-sm">
                    المجموع الإجمالي العام لكافة الفواتير ({filteredSales.length} عملية):
                  </td>
                  <td className="p-3 text-center font-mono-numbers font-black text-amber-400">
                    {reportTotals.extraServicesRevenue.toFixed(2)} ر.س
                  </td>
                  <td className="p-3 text-center text-slate-400 text-xs">
                    —
                  </td>
                  <td className="p-3 text-center font-mono-numbers font-black text-emerald-400">
                    {reportTotals.cashSales.toFixed(2)} ر.س
                  </td>
                  <td className="p-3 text-center font-mono-numbers font-black text-blue-400">
                    {reportTotals.networkSales.toFixed(2)} ر.س
                  </td>
                  <td className="p-3 text-center font-mono-numbers text-base font-black text-amber-400 bg-amber-500/10 border border-amber-500/30">
                    {reportTotals.grossSales.toFixed(2)} ر.س
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Signatures & Certification Area (Printed cleanly) */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800 text-xs text-center text-slate-400">
          <div>
            <div className="border-b border-dashed border-slate-500 pb-8 mb-2"></div>
            <span>توقيع مسؤول الكاشير / الشفت</span>
          </div>
          <div>
            <div className="border-b border-dashed border-slate-500 pb-8 mb-2"></div>
            <span>توقيع واعتماد المدير العام لـ RM STAR</span>
          </div>
        </div>

      </div>

    </div>
  );
};
