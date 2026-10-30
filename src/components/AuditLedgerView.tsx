import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  History, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Printer, 
  RotateCcw, 
  Edit3, 
  Ban, 
  Download, 
  Upload, 
  Search,
  X,
  CheckCircle2
} from 'lucide-react';
import { ShiftType, SaleTransaction } from '../types';
import { getShiftShortName } from '../utils/time';
import { ReceiptModal } from './ReceiptModal';

export const AuditLedgerView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    reassignSaleShift, 
    cancelSale, 
    exportDatabaseJSON, 
    importDatabaseJSON,
    resetToInitial
  } = useAccounting();

  const isManager = currentUser.role === 'manager';

  const [activeTab, setActiveTab] = useState<'sales' | 'audit' | 'backup'>('sales');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Shift Reassignment Modal
  const [reassignSaleId, setReassignSaleId] = useState<string | null>(null);
  const [targetNewShift, setTargetNewShift] = useState<ShiftType>('bandar');
  const [reassignReason, setReassignReason] = useState<string>('');
  const [reassignError, setReassignError] = useState<string | null>(null);

  // Cancel Sale Modal
  const [cancelSaleId, setCancelSaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Receipt Modal
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<SaleTransaction | null>(null);

  // Backup file upload feedback
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleOpenReassignModal = (sale: SaleTransaction) => {
    if (!isManager) return;
    setReassignSaleId(sale.id);
    const isSaleMorning = sale.shift === 'morning' || sale.shift === 'hakim';
    setTargetNewShift(isSaleMorning ? 'evening' : 'morning');
    setReassignReason('');
    setReassignError(null);
  };

  const handleExecuteReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignSaleId) return;

    const res = reassignSaleShift(reassignSaleId, targetNewShift, reassignReason.trim());
    if (res.success) {
      setReassignSaleId(null);
      setReassignReason('');
      setReassignError(null);
    } else {
      setReassignError(res.error || 'حدث خطأ أثناء تعديل الشفت.');
    }
  };

  const handleOpenCancelModal = (sale: SaleTransaction) => {
    if (!isManager) return;
    setCancelSaleId(sale.id);
    setCancelReason('');
    setCancelError(null);
  };

  const handleExecuteCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSaleId) return;

    const res = cancelSale(cancelSaleId, cancelReason.trim());
    if (res.success) {
      setCancelSaleId(null);
      setCancelReason('');
      setCancelError(null);
    } else {
      setCancelError(res.error || 'حدث خطأ أثناء إلغاء العملية.');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RM_STAR_CAR_WASH_BACKUP_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const success = importDatabaseJSON(reader.result);
        if (success) {
          setImportStatus('تمت استعادة قاعدة البيانات والنسخة الاحتياطية بنجاح!');
        } else {
          setImportStatus('فشل استيراد الملف، تأكد من صحة تنسيق JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Filter sales
  const filteredSales = state.sales.filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.serialNumber.toLowerCase().includes(term) ||
      s.washServiceName.toLowerCase().includes(term) ||
      s.cashierName.toLowerCase().includes(term) ||
      (s.notes && s.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              سجل العمليات والتدقيق المحاسبي (Audit & Ledger)
            </h1>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              توثيق صارم وغير قابل للتلاعب
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة كافة العمليات المالية، تصحيح الشفتات بأسباب معتمدة، وتتبع سجل التعديلات
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs overflow-x-auto max-w-full w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'sales'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            سجل المبيعات ({state.sales.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            سجل التدقيق ({state.auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            النسخ الاحتياطي
          </button>
        </div>
      </div>

      {/* Tab 1: Sales Ledger with Shift Correction & Cancellation */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة (مثل RM-2026-0001) أو نوع الغسيل أو الكاشير..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white text-xs">
                مسح
              </button>
            )}
          </div>

          {/* Sales Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">الوقت والتاريخ</th>
                    <th className="p-3.5">الشفت</th>
                    <th className="p-3.5">نوع الغسيل</th>
                    <th className="p-3.5 text-center">إضافات</th>
                    <th className="p-3.5 text-center">الإجمالي</th>
                    <th className="p-3.5 text-center">طريقة الدفع</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">الكاشير</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSales.map(sale => {
                    const isCancelled = sale.status === 'cancelled';

                    return (
                      <tr key={sale.id} className={`hover:bg-slate-800/30 transition-colors ${isCancelled ? 'opacity-50 line-through bg-rose-950/10' : ''}`}>
                        <td className="p-3.5 font-mono text-slate-200 font-bold whitespace-nowrap">
                          {sale.serialNumber}
                        </td>
                        <td className="p-3.5 font-mono-numbers text-slate-400 whitespace-nowrap">
                          {sale.saudiFormattedDate} {sale.saudiFormattedTime}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            sale.shift === 'morning' || sale.shift === 'hakim'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-600/30' 
                              : 'bg-sky-950/60 text-sky-400 border border-sky-600/30'
                          }`}>
                            {getShiftShortName(sale.shift)}
                          </span>
                          {sale.shiftReassignedReason && (
                            <span className="block text-[10px] text-amber-400 mt-0.5" title={`تم تصحيح الشفت: ${sale.shiftReassignedReason}`}>
                              (مصحح: {sale.shiftReassignedReason})
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          <div>{sale.washServiceName}</div>
                          {sale.isFreeWash && (
                            <span className="text-purple-400 text-[10px] block">غسلة مجانية (ولاء)</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono-numbers text-amber-400 whitespace-nowrap">
                          {sale.extraServicesTotal > 0 ? `${sale.extraServicesTotal.toFixed(2)} ر.س` : '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono-numbers text-sm font-black text-white whitespace-nowrap">
                          {sale.totalAmount.toFixed(2)} <span className="text-[10px] font-normal">ر.س</span>
                        </td>
                        <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                          {sale.paymentMethod === 'free' ? 'مجاني' : sale.paymentMethod === 'cash' ? 'كاش' : 'شبكة'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isCancelled
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {isCancelled ? 'ملغاة' : 'ناجحة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-400 whitespace-nowrap">
                          {sale.cashierName}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Re-print receipt */}
                            <button
                              onClick={() => setSelectedReceiptSale(sale)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                              title="معاينة وطباعة الفاتورة"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Manager Actions: Reassign Shift / Cancel */}
                            {isManager && !isCancelled && (
                              <>
                                <button
                                  onClick={() => handleOpenReassignModal(sale)}
                                  className="p-1.5 bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-blue-300 rounded-lg border border-slate-700"
                                  title="تصحيح الشفت مع تدوين السبب"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenCancelModal(sale)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700"
                                  title="إلغاء العملية مع تدوين السبب وعكس الصندوق"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        لا توجد عمليات مبيعات مسجلة تطابق البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>سجل التدقيق والامتثال المحاسبي (Audit Log)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {state.auditLogs.length} حركة تدقيق موثقة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">الوقت والتاريخ</th>
                  <th className="p-3.5">نوع الإجراء</th>
                  <th className="p-3.5">تفاصيل الإجراء والملاحظات</th>
                  <th className="p-3.5 text-center">المسؤول</th>
                  <th className="p-3.5 text-center">التصنيف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {state.auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono-numbers text-slate-400 whitespace-nowrap">
                      {log.saudiTime}
                    </td>
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {log.details}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-amber-400 whitespace-nowrap">
                      {log.performedBy}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-400">
                        {log.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permanent Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">
              النسخ الاحتياطي وحفظ البيانات الدائم
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              يتم حفظ جميع العمليات تلقائياً على المتصفح بشكل دائم، ويمكنك أيضاً تصدير نسخة احتياطية مشفرة بملف JSON أو استعادتها في أي وقت.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">تصدير نسخة احتياطية كاملة</h4>
                  <p className="text-xs text-slate-400">تحميل كافة المبيعات والشفتات والمصروفات والرواتب</p>
                </div>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                تنزيل ملف النسخة الاحتياطية (JSON)
              </button>
            </div>

            {/* Import */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">استعادة نسخة سابقة</h4>
                  <p className="text-xs text-slate-400">رفع ملف نسخة سابقة لاستعادة كامل البيانات</p>
                </div>
              </div>
              <label className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 text-center rounded-lg text-xs font-bold cursor-pointer transition-all border border-slate-700">
                <span>اختر ملف النسخة الاحتياطية (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
              {importStatus && (
                <p className="text-xs text-center text-amber-400 font-bold">{importStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reassign Shift Modal */}
      {reassignSaleId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteReassign} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>تصحيح شفت العملية</span>
              </h3>
              <button
                type="button"
                onClick={() => setReassignSaleId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الشفت الجديد المراد التحويل إليه *</label>
                <select
                  value={targetNewShift}
                  onChange={e => setTargetNewShift(e.target.value as ShiftType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="morning">☀️ شفت الصباح (12:00 ص – 12:00 م)</option>
                  <option value="evening">🌙 شفت المساء (12:00 م – 12:00 ص)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">سبب التعديل والتصحيح (إلزامي وموثق في التدقيق) *</label>
                <textarea
                  rows={3}
                  placeholder="اكتب سبب تصحيح الشفت (مثل: خطأ في وقت الإدخال، تأخر تسجيل، تصحيح إداري...)"
                  value={reassignReason}
                  onChange={e => setReassignReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {reassignError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reassignError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReassignSaleId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm"
              >
                حفظ التصحيح وتوثيق السبب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Sale Modal */}
      {cancelSaleId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteCancel} className="bg-slate-900 border border-rose-500 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-rose-400 text-base flex items-center gap-2">
                <Ban className="w-4 h-4" />
                <span>إلغاء العملية المالية وعكس أثر الصندوق</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelSaleId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              وفقاً لقواعد النزاهة المحاسبية، لا يتم حذف العملية نهائياً من قاعدة البيانات، بل يتم وسمها كملغاة مع عكس أي حركة نقدية في الصندوق وتوثيق السبب واسم المدير في سجل التدقيق.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">سبب الإلغاء (إلزامي وموثق) *</label>
                <textarea
                  rows={3}
                  placeholder="اكتب سبب إلغاء الفاتورة (مثل: تراجع العميل، خطأ كاشير في المبلغ، تسوية خاصة...)"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCancelSaleId(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                تراجع
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm"
              >
                تأكيد الإلغاء وتوثيق السبب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Receipt Modal for any sale */}
      {selectedReceiptSale && (
        <ReceiptModal
          sale={selectedReceiptSale}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}

    </div>
  );
};
