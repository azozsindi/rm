import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Users, 
  Plus, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  History, 
  X, 
  DollarSign 
} from 'lucide-react';
import { EmployeeSalary } from '../types';
import { formatSaudiDate } from '../utils/time';

export const SalariesView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    recordSalaryPayment, 
    addEmployee, 
    metrics, 
    saudiTimeNow 
  } = useAccounting();

  const isManager = currentUser.role === 'manager';

  // Payment Modal state
  const [selectedEmp, setSelectedEmp] = useState<EmployeeSalary | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);

  // Add Employee Modal state
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newEmpJob, setNewEmpJob] = useState<string>('');
  const [newEmpSalary, setNewEmpSalary] = useState<string>('');
  const [newEmpMonth, setNewEmpMonth] = useState<string>(formatSaudiDate(saudiTimeNow).substring(0, 7));

  // Payment history view modal
  const [viewHistoryEmp, setViewHistoryEmp] = useState<EmployeeSalary | null>(null);

  const handleOpenPaymentModal = (emp: EmployeeSalary) => {
    if (!isManager) return;
    setSelectedEmp(emp);
    setPayAmount(String(emp.remainingAmount)); // Default to paying full remaining amount
    setPayMethod('cash');
    setPayNotes(`سداد دفعة راتب شهر ${emp.month}`);
    setPayError(null);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError('الرجاء إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }

    const res = recordSalaryPayment(selectedEmp.id, amt, payMethod, payNotes.trim() || undefined);
    if (res.success) {
      setSelectedEmp(null);
      setPayAmount('');
      setPayNotes('');
      setPayError(null);
    } else {
      setPayError(res.error || 'حدث خطأ أثناء صرف الراتب.');
    }
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sal = parseFloat(newEmpSalary);
    if (!newEmpName.trim() || !newEmpJob.trim() || isNaN(sal) || sal <= 0) return;

    addEmployee(newEmpName.trim(), newEmpJob.trim(), sal, newEmpMonth);
    setNewEmpName('');
    setNewEmpJob('');
    setNewEmpSalary('');
    setShowAddEmpModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة الرواتب الشهرية للعاملين
            </h1>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
              رواتب ثابتة دون عمولة
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            وفق سياسة المغسلة: العمال يتقاضون رواتب شهرية ثابتة بدون عمولات على كل سيارة
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد لجدول الرواتب</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">إجمالي الرواتب المستحقة (الالتزام الشهري):</span>
          <span className="text-2xl font-black text-white font-mono-numbers">
            {metrics.totalSalariesObligation.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">مجموع الرواتب الشهرية الثابتة لطاقم العمل</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">الرواتب المسددة فعلياً:</span>
          <span className="text-2xl font-black text-emerald-400 font-mono-numbers">
            {metrics.paidSalariesTotal.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">المصروف نقداً أو تحويلاً بنكياً</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">المتبقي المستحق من الرواتب:</span>
          <span className="text-2xl font-black text-amber-400 font-mono-numbers">
            {metrics.accruedSalariesTotal.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">التزامات رواتب لم يتم سدادها بعد</p>
        </div>
      </div>

      {/* Non-manager note */}
      {!isManager && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
          <span>
            سداد وتسجيل الرواتب متاح بصلاحية <strong>المدير العام</strong> فقط.
          </span>
        </div>
      )}

      {/* Salaries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>كشف مسير رواتب موظفي المغسلة</span>
          </h3>
          <span className="text-xs text-slate-400">
            {state.salaries.length} موظف مسجل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">اسم الموظف</th>
                <th className="p-3.5">المسمى الوظيفي</th>
                <th className="p-3.5 text-center">شهر الاستحقاق</th>
                <th className="p-3.5 text-center">الراتب الأساسي</th>
                <th className="p-3.5 text-center">الخصومات</th>
                <th className="p-3.5 text-center">المبلغ المدفوع</th>
                <th className="p-3.5 text-center">صافي المستحق</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">سجل الدفعات</th>
                <th className="p-3.5 text-center">إجراء الصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {state.salaries.map(emp => {
                const isFullyPaid = emp.status === 'fully_paid';
                const isPartial = emp.status === 'partially_paid';
                const dedTotal = emp.deductionsTotal || 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-white text-sm">
                      {emp.employeeName}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {emp.jobTitle}
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-slate-300">
                      {emp.month}
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sm font-bold text-white">
                      {emp.monthlySalary.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sm font-bold text-rose-400">
                      {dedTotal > 0 ? (
                        <span>−{dedTotal.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span></span>
                      ) : (
                        <span className="text-slate-600 font-normal">0 ر.س</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sm font-bold text-emerald-400">
                      {emp.totalPaid.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sm font-bold text-amber-400">
                      {emp.remainingAmount.toLocaleString()} <span className="text-[10px] text-slate-400">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isFullyPaid
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isPartial
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isFullyPaid ? 'مسدد بالكامل' : isPartial ? 'مسدد جزئياً' : 'مستحق بالكامل'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {emp.payments.length > 0 ? (
                        <button
                          onClick={() => setViewHistoryEmp(emp)}
                          className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>{emp.payments.length} دفعات</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">لا توجد</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {isManager && emp.remainingAmount > 0 ? (
                        <button
                          onClick={() => handleOpenPaymentModal(emp)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                        >
                          صرف دفعة / سداد
                        </button>
                      ) : emp.remainingAmount === 0 ? (
                        <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مكتمل</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">للمدير فقط</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Payment Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitPayment} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  صرف راتب / دفعة مالية
                </h3>
                <p className="text-xs text-slate-400">
                  للموظف: <strong className="text-white">{selectedEmp.employeeName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">الراتب الشهري الثابت:</span>
                <span className="font-bold text-white font-mono-numbers">{selectedEmp.monthlySalary} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المسدد سابقاً:</span>
                <span className="font-bold text-emerald-400 font-mono-numbers">{selectedEmp.totalPaid} ر.س</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-1">
                <span className="text-slate-300 font-semibold">المتبقي المستحق الأقصى:</span>
                <span className="font-black text-amber-400 font-mono-numbers text-sm">{selectedEmp.remainingAmount} ر.س</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">مبلغ الدفعة المراد صرفها الآن (ر.س) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={selectedEmp.remainingAmount}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-numbers text-sm focus:outline-none focus:border-amber-500"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  يمكنك سداد الراتب كاملاً أو تسجيل دفعات جزئية دون تكرار
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">طريقة السداد *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 ${
                      payMethod === 'cash'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>نقداً من الصندوق</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank_transfer')}
                    className={`py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 ${
                      payMethod === 'bank_transfer'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>تحويل بنكي</span>
                  </button>
                </div>
                {payMethod === 'cash' && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    * سيتم خصم هذا المبلغ فورياً من النقد الموجود في الصندوق
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-300 block mb-1">ملاحظات / رقم الحوالة</label>
                <input
                  type="text"
                  placeholder="ملاحظات توثيقية إضافية..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {payError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{payError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 rounded-xl shadow-md shadow-sky-500/25 transition-all"
              >
                اعتماد وصرف الدفعة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && isManager && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddEmployeeSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>إضافة موظف جديد لجدول الرواتب</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم الموظف *</label>
                <input
                  type="text"
                  placeholder="الاسم الكامل للموظف"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">المسمى الوظيفي *</label>
                <input
                  type="text"
                  placeholder="مثال: عامل غسيل، فني تلميع، كاشير..."
                  value={newEmpJob}
                  onChange={e => setNewEmpJob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">الراتب الشهري الثابت (ر.س) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="مثال: 3000"
                  value={newEmpSalary}
                  onChange={e => setNewEmpSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-numbers text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">شهر الاستحقاق *</label>
                <input
                  type="month"
                  value={newEmpMonth}
                  onChange={e => setNewEmpMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
              >
                حفظ الموظف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment History Modal */}
      {viewHistoryEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  سجل دفعات الراتب: {viewHistoryEmp.employeeName}
                </h3>
                <p className="text-xs text-slate-400">
                  شهر الاستحقاق: {viewHistoryEmp.month} | الراتب: {viewHistoryEmp.monthlySalary} ر.س
                </p>
              </div>
              <button
                onClick={() => setViewHistoryEmp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {viewHistoryEmp.payments.map((p, idx) => (
                <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">
                      دفعة #{idx + 1}: {p.amount.toLocaleString()} ر.س
                    </div>
                    <div className="text-[11px] text-slate-400">
                      التاريخ: {p.date} · طريقة الدفع: {p.paymentMethod === 'cash' ? 'كاش من الصندوق' : 'تحويل بنكي'}
                    </div>
                    {p.notes && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        البيان: {p.notes} (بواسطة: {p.loggedBy})
                      </div>
                    )}
                  </div>
                  <span className="text-emerald-400 font-bold font-mono-numbers">
                    +{p.amount} ر.س
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setViewHistoryEmp(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
