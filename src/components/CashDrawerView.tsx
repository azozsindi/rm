import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Minus, 
  Scale, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  Edit3,
  X
} from 'lucide-react';
import { getShiftShortName } from '../utils/time';

export const CashDrawerView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    metrics, 
    recordDrawerDepositWithdrawal, 
    updateOpeningBalance 
  } = useAccounting();

  const isManager = currentUser.role === 'manager';

  // Deposit/Withdrawal modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustType, setAdjustType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Opening balance edit modal
  const [showOpeningModal, setShowOpeningModal] = useState<boolean>(false);
  const [newOpeningBalance, setNewOpeningBalance] = useState<string>(String(state.openingBalance));
  const [openingNotes, setOpeningNotes] = useState<string>('');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0 || !adjustNotes.trim()) return;

    recordDrawerDepositWithdrawal(adjustType, amt, adjustNotes.trim());
    setAdjustAmount('');
    setAdjustNotes('');
    setShowAdjustModal(false);
  };

  const handleOpeningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(newOpeningBalance);
    if (isNaN(bal) || bal < 0) return;

    updateOpeningBalance(bal, openingNotes.trim() || 'تعديل معتمد من المدير');
    setShowOpeningModal(false);
  };

  // Compute total cash receipts, cash expenses, cash withdrawals, cash deposits
  let totalCashReceipts = 0;
  let totalCashExpenses = 0;
  let totalWithdrawals = 0;
  let totalDeposits = 0;

  for (const m of state.drawerMovements) {
    if (m.type === 'cash_sale') totalCashReceipts += m.amount;
    if (m.type === 'cash_expense') totalCashExpenses += m.amount;
    if (m.type === 'withdrawal') totalWithdrawals += m.amount;
    if (m.type === 'deposit') totalDeposits += m.amount;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              الصندوق والمطابقة النقدية
            </h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              حسابات النقد الفعلي
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة حركة النقد بالدرج وفق المعادلة المحاسبية المعتمدة ومطابقة العجز والفائض
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {isManager && (
            <button
              onClick={() => setShowOpeningModal(true)}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[40px] whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>تعديل الرصيد الافتتاحي</span>
            </button>
          )}

          <button
            onClick={() => {
              setAdjustType('deposit');
              setShowAdjustModal(true);
            }}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[40px] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إيداع نقدي</span>
          </button>

          <button
            onClick={() => {
              setAdjustType('withdrawal');
              setShowAdjustModal(true);
            }}
            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[40px] whitespace-nowrap"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>سحب نقدي</span>
          </button>
        </div>
      </div>

      {/* Main Drawer Equation Breakdown Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>معادلة احتساب النقد المتوقع بالصندوق</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              النقد المتوقع = الرصيد الافتتاحي + المقبوضات النقدية − المصروفات النقدية − السحوبات النقدية + الإيداعات النقدية
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] sm:text-xs text-slate-400 block">النقد المتوقع الآن بالصندوق:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono-numbers">
              {metrics.expectedCashInDrawer.toLocaleString()} <span className="text-xs sm:text-sm font-normal">ر.س</span>
            </span>
          </div>
        </div>

        {/* 5 Equation Terms */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-slate-950/70 border border-slate-800 p-2.5 sm:p-3 rounded-xl">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">1. الرصيد الافتتاحي:</span>
            <span className="font-bold text-white font-mono-numbers text-sm sm:text-base">
              {state.openingBalance.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2.5 sm:p-3 rounded-xl">
            <span className="text-[10px] sm:text-[11px] text-emerald-400 block">(+) 2. المقبوضات النقدية:</span>
            <span className="font-bold text-emerald-400 font-mono-numbers text-sm sm:text-base">
              +{totalCashReceipts.toLocaleString()} <span className="text-[10px]">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-rose-400 block">(-) 3. المصروفات النقدية:</span>
            <span className="font-bold text-rose-400 font-mono-numbers text-base">
              -{totalCashExpenses.toLocaleString()} <span className="text-[10px]">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-rose-400 block">(-) 4. السحوبات النقدية:</span>
            <span className="font-bold text-rose-400 font-mono-numbers text-base">
              -{totalWithdrawals.toLocaleString()} <span className="text-[10px]">ر.س</span>
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-emerald-400 block">(+) 5. الإيداعات النقدية:</span>
            <span className="font-bold text-emerald-400 font-mono-numbers text-base">
              +{totalDeposits.toLocaleString()} <span className="text-[10px]">ر.س</span>
            </span>
          </div>
        </div>

        {/* Network isolation reminder */}
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-300">
            <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>فصل مبيعات الشبكة ومدى:</strong> إجمالي مبيعات الشبكة ({metrics.totalNetworkSales.toLocaleString()} ر.س) مودعة في الحساب البنكي مباشرة ولن تدخل نهائياً في نقد الصندوق.
            </span>
          </div>
        </div>
      </div>

      {/* Adjust Drawer Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdjustSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {adjustType === 'deposit' ? (
                  <Plus className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Minus className="w-4 h-4 text-rose-400" />
                )}
                <span>{adjustType === 'deposit' ? 'إيداع نقدي في الصندوق' : 'سحب نقدي من الصندوق'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">نوع العملية *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('deposit')}
                    className={`py-2 rounded-lg font-bold border ${
                      adjustType === 'deposit'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    إيداع نقدي (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('withdrawal')}
                    className={`py-2 rounded-lg font-bold border ${
                      adjustType === 'withdrawal'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    سحب نقدي (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">المبلغ (ر.س) *</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="مثال: 500"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-numbers text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">سبب السحب / الإيداع (البيان الموثق) *</label>
                <input
                  type="text"
                  placeholder="مثال: توريد نقدية للبنك، تغذية الصندوق بخردا، عهدة إضافية..."
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm ${
                  adjustType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                تأكيد وتسجيل الحركة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Opening Balance Modal */}
      {showOpeningModal && isManager && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleOpeningSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>تعديل الرصيد الافتتاحي للصندوق</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOpeningModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الرصيد الافتتاحي الجديد (ر.س) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={newOpeningBalance}
                  onChange={e => setNewOpeningBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-numbers text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">بيان التعديل / ملاحظات المدير *</label>
                <input
                  type="text"
                  placeholder="سبب تعديل الرصيد الافتتاحي..."
                  value={openingNotes}
                  onChange={e => setOpeningNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowOpeningModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
              >
                اعتماد الرصيد الافتتاحي
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full Drawer Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>سجل الحركات النقدية الكامل للصندوق (Cash Ledger)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {state.drawerMovements.length} حركة مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">نوع الحركة</th>
                <th className="p-3.5">البيان والتفاصيل</th>
                <th className="p-3.5">الشفت</th>
                <th className="p-3.5 text-center">المبلغ</th>
                <th className="p-3.5 text-center">الرصيد التراكمي</th>
                <th className="p-3.5 text-center">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {state.drawerMovements.slice().reverse().map(move => {
                const isIncoming = move.direction === 'in';

                return (
                  <tr key={move.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono-numbers text-slate-400 whitespace-nowrap">
                      {move.saudiTime}
                    </td>
                    <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                      {move.typeLabel}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {move.notes}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {getShiftShortName(move.shift)}
                    </td>
                    <td className={`p-3.5 text-center font-mono-numbers font-black text-sm whitespace-nowrap ${
                      isIncoming ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isIncoming ? '+' : '-'}{move.amount.toFixed(2)} <span className="text-[10px] font-normal">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers font-bold text-white whitespace-nowrap">
                      {move.runningBalance.toFixed(2)} <span className="text-[10px] text-slate-400">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center text-slate-400 whitespace-nowrap">
                      {move.performedBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
