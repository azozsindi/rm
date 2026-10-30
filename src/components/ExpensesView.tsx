import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Receipt, 
  Plus, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Banknote, 
  CreditCard, 
  Building2,
  X
} from 'lucide-react';
import { ExpenseCategory } from '../types';
import { formatSaudiDate } from '../utils/time';

export const ExpensesView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    recordExpense, 
    payAccruedExpense,
    metrics,
    saudiTimeNow 
  } = useAccounting();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, paid, accrued

  // Add form fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('cleaning_materials');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(formatSaudiDate(saudiTimeNow));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'network' | 'bank_transfer'>('cash');
  const [status, setStatus] = useState<'paid' | 'accrued'>('paid');
  const [notes, setNotes] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  // Preview receipt modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachmentData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    recordExpense({
      title: title.trim(),
      category,
      amount: parsedAmount,
      date,
      paymentMethod,
      status,
      notes: notes.trim() || undefined,
      attachmentName,
      attachmentData,
    });

    // Reset form
    setTitle('');
    setAmount('');
    setNotes('');
    setAttachmentData(undefined);
    setAttachmentName(undefined);
    setShowAddForm(false);
  };

  // Filtered list
  const filteredExpenses = state.expenses.filter(exp => {
    if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
    if (filterStatus !== 'all' && exp.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة المصروفات التشغيلية
            </h1>
            <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono">
              الصرف والالتزامات
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل الإيجار، الكهرباء، الماء، مواد التنظيف، الصيانة، والتمييز بين المدفوع والمستحق
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">المصروفات المدفوعة فعلياً:</span>
          <span className="text-2xl font-black text-rose-400 font-mono-numbers">
            {metrics.paidExpensesTotal.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">تؤثر مباشرة على الأرباح والصندوق</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">المصروفات المستحقة (غير المدفوعة):</span>
          <span className="text-2xl font-black text-amber-400 font-mono-numbers">
            {metrics.accruedExpensesTotal.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">التزامات مسجلة بانتظار السداد</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">إجمالي التكاليف والمصروفات:</span>
          <span className="text-2xl font-black text-slate-200 font-mono-numbers">
            {metrics.totalExpenses.toLocaleString()} <span className="text-xs text-slate-400">ر.س</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">المدفوع + المستحق</p>
        </div>
      </div>

      {/* Add Expense Modal/Form */}
      {showAddForm && (
        <form onSubmit={handleCreateExpense} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>تسجيل مصروف جديد</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 block mb-1">اسم المصروف / البيان *</label>
              <input
                type="text"
                placeholder="مثال: شراء صابون ملمع وشامبو غسيل، فاتورة كهرباء شهر أكتوبر..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">التصنيف *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cleaning_materials">مواد تنظيف ومواد غسيل</option>
                <option value="electricity">كهرباء</option>
                <option value="water">ماء</option>
                <option value="rent">إيجار</option>
                <option value="maintenance">صيانة دورية ومعدات</option>
                <option value="salaries">رواتب وأجور</option>
                <option value="other">مصروفات أخرى</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">المبلغ (ر.س) *</label>
              <input
                type="number"
                step="any"
                min="0.1"
                placeholder="مثال: 350"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono-numbers placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">تاريخ المصروف *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">حالة المصروف *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    status === 'paid'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  مدفوع
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('accrued')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    status === 'accrued'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  مستحق غير مدفوع
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">طريقة الدفع *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cash">كاش (نقدي من الصندوق)</option>
                <option value="network">شبكة / بطاقة</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
              {status === 'paid' && paymentMethod === 'cash' && (
                <span className="text-[11px] text-amber-400 mt-1 block">
                  * سيتم خصم هذا المبلغ فورياً من النقد الموجود بالصندوق
                </span>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 block mb-1">إرفاق صورة الفاتورة / الإيصال (اختياري)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 file:ml-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
              {attachmentName && (
                <span className="text-[11px] text-emerald-400 block mt-1">
                  ✓ تم إرفاق الملف: {attachmentName}
                </span>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs text-slate-300 block mb-1">ملاحظات إضافية</label>
              <input
                type="text"
                placeholder="رقم الفاتورة الضريبية، اسم المورّد، شروط السداد..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
            >
              حفظ المصروف
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-300 font-semibold">تصفية المصروفات:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs w-full xs:w-auto">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="flex-1 xs:flex-none bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 min-h-[38px]"
          >
            <option value="all">جميع الحالات (مدفوع ومستحق)</option>
            <option value="paid">المدفوعة فقط</option>
            <option value="accrued">المستحقة غير المدفوعة فقط</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 xs:flex-none bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 min-h-[38px]"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="cleaning_materials">مواد تنظيف</option>
            <option value="electricity">كهرباء</option>
            <option value="water">ماء</option>
            <option value="rent">إيجار</option>
            <option value="maintenance">صيانة</option>
            <option value="salaries">رواتب</option>
            <option value="other">أخرى</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">الرقم</th>
                <th className="p-3.5">اسم المصروف</th>
                <th className="p-3.5">التصنيف</th>
                <th className="p-3.5 text-center">المبلغ</th>
                <th className="p-3.5 text-center">التاريخ</th>
                <th className="p-3.5 text-center">طريقة الدفع</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">المرفق</th>
                <th className="p-3.5 text-center">المسؤول</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">
                      {exp.serialNumber}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      <div>{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400 font-normal">{exp.notes}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {exp.categoryLabel}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-sm font-black text-rose-400">
                      {exp.amount.toFixed(2)} <span className="text-[10px] font-normal">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-slate-300">
                      {exp.date}
                    </td>
                    <td className="p-3.5 text-center text-slate-300">
                      {exp.paymentMethod === 'cash' ? 'كاش (الصندوق)' : exp.paymentMethod === 'network' ? 'شبكة' : 'تحويل بنكي'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        exp.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {exp.status === 'paid' ? 'مدفوع' : 'مستحق'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {exp.attachmentData ? (
                        <button
                          onClick={() => setPreviewImage(exp.attachmentData!)}
                          className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold"
                          title="عرض الفاتورة المرفقة"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center text-slate-400">
                      {exp.loggedBy}
                    </td>
                    <td className="p-3.5 text-center">
                      {exp.status === 'accrued' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => payAccruedExpense(exp.id, 'cash')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap"
                            title="سداد نقداً من الصندوق"
                          >
                            سداد كاش
                          </button>
                          <button
                            onClick={() => payAccruedExpense(exp.id, 'bank_transfer')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap"
                            title="سداد عبر تحويل بنكي"
                          >
                            سداد بنكي
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    لا توجد مصروفات مسجلة تطابق التصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachment Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>معاينة الفاتورة / الإيصال المرفق</span>
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              <img
                src={previewImage}
                alt="المرفق"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
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
