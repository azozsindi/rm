import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Tag, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Power, 
  AlertCircle, 
  ShieldCheck, 
  Info,
  DollarSign
} from 'lucide-react';
import { WashService } from '../types';

export const PriceManagementView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    addService, 
    updateService, 
    toggleServiceActive 
  } = useAccounting();

  const isManager = currentUser.role === 'manager';

  // Add service modal/form
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');

  // Edit service state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  const handleStartEdit = (srv: WashService) => {
    if (!isManager) return;
    setEditingServiceId(srv.id);
    setEditName(srv.name);
    setEditPrice(String(srv.price));
    setEditDesc(srv.description || '');
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
  };

  const handleSaveEdit = (id: string) => {
    const p = parseFloat(editPrice);
    if (!editName.trim() || isNaN(p) || p < 0) return;
    updateService(id, editName.trim(), p, editDesc.trim() || undefined);
    setEditingServiceId(null);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    const p = parseFloat(newServicePrice);
    if (!newServiceName.trim() || isNaN(p) || p < 0) return;
    addService(newServiceName.trim(), p, newServiceDesc.trim() || undefined);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDesc('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة خدمات وأسعار الغسيل
            </h1>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              صلاحيات المدير
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إضافة أنواع الغسيل وتحديث الأسعار المعتمدة لفرع RM STAR وإيقاف الخدمات مؤقتًا
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة نوع غسيل جديد</span>
          </button>
        )}
      </div>

      {/* Official Clarification Box regarding RM STAR verified prices */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-slate-300">
          <p className="font-bold text-white">
            ملاحظة إدارية بشأن أسعار مغسلة RM STAR:
          </p>
          <p className="text-slate-400 leading-relaxed">
            وفقاً لسياسة النظام المالي الصارمة، لم يتم العثور على قائمة أسعار منشورة علناً وموثوقة لخدمات مغسلة RM STAR، لذا تم ترك قائمة الأسعار جاهزة للإدخال والتعديل اليدوي المباشر بواسطة المدير العام حسب تسعيرة الفرع الفعلية، دون اختراع أو فرض أي أسعار غير رسمية.
          </p>
          <p className="text-emerald-400 font-semibold pt-1">
            ✓ ضمان النزاهة المحاسبية: تعديل أي سعر حالي لن يغيّر السعر المسجل في الفواتير والعمليات السابقة؛ حيث يحتفظ النظام بالسعر الأصلي لكل عملية في وقت حدوثها.
          </p>
        </div>
      </div>

      {/* Non-manager warning if cashier */}
      {!isManager && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
          <span>
            أنت مسجل حالياً بصلاحية <strong>الكاشير ({currentUser.name})</strong>. يمكنك الاطلاع على قائمة الأسعار فقط. لتعديل أو إضافة الأسعار، يرجى التبديل لحساب "المدير العام" من أعلى الشاشة.
          </span>
        </div>
      )}

      {/* Add New Service Modal/Form */}
      {showAddForm && isManager && (
        <form onSubmit={handleCreateService} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>إضافة نوع غسيل جديد لقائمة الأسعار</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">اسم نوع الغسيل / الخدمة *</label>
              <input
                type="text"
                placeholder="مثال: غسيل ساطع بالرغوة الوردية"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">السعر المعتمد (ر.س) *</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="مثال: 45"
                value={newServicePrice}
                onChange={e => setNewServicePrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono-numbers placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-300 block mb-1">وصف الخدمة ومميزاتها (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: تنظيف وتجفيف آلي مع تلميع الإطارات وتعطير المقصورة"
                value={newServiceDesc}
                onChange={e => setNewServiceDesc(e.target.value)}
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
              حفظ الخدمة في قائمة الأسعار
            </button>
          </div>
        </form>
      )}

      {/* Services Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3.5">نوع الغسيل</th>
                <th className="p-3.5">الوصف</th>
                <th className="p-3.5 text-center">السعر المعتمد</th>
                <th className="p-3.5 text-center">الحالة</th>
                <th className="p-3.5 text-center">إجراءات المدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {state.services.map(srv => {
                const isEditing = editingServiceId === srv.id;

                if (isEditing) {
                  return (
                    <tr key={srv.id} className="bg-slate-950/80">
                      <td className="p-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-20 bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white text-center font-mono-numbers"
                          />
                          <span className="text-slate-400">ر.س</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-xs text-slate-400">جاري التعديل</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(srv.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                            title="حفظ التعديل"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                            title="إلغاء التعديل"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-white text-sm">
                      {srv.name}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {srv.description || '—'}
                    </td>
                    <td className="p-3.5 text-center font-mono-numbers text-base font-black text-amber-400">
                      {srv.price.toFixed(2)} <span className="text-xs font-normal">ر.س</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        srv.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {srv.isActive ? 'مفعل ومتاح بالكاشير' : 'متوقف مؤقتاً'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {isManager ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStartEdit(srv)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded-lg border border-slate-700 transition-colors"
                            title="تعديل السعر والبيانات"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleServiceActive(srv.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              srv.isActive 
                                ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border-slate-700' 
                                : 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border-emerald-600/40'
                            }`}
                            title={srv.isActive ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">للمدير فقط</span>
                      )}
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
