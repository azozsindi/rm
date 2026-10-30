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
  DollarSign,
  Sparkles,
  Trash2,
  Layers
} from 'lucide-react';
import { WashService, ExtraServiceItem } from '../types';

export const PriceManagementView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    can,
    addService, 
    updateService, 
    toggleServiceActive,
    deleteService,
    addExtraService,
    updateExtraService,
    toggleExtraServiceActive,
    deleteExtraService
  } = useAccounting();

  const isManager = currentUser.role === 'manager' || can('services.edit_price');
  const canCreate = can('services.create') || isManager;
  const canToggle = can('services.toggle') || isManager;

  // Active Tab: 'wash' (اختر نوع الغسيل) or 'extras' (خدمات إضافية)
  const [activeTab, setActiveTab] = useState<'wash' | 'extras'>('wash');

  // Wash Service Form
  const [showAddWashForm, setShowAddWashForm] = useState<boolean>(false);
  const [newWashName, setNewWashName] = useState<string>('');
  const [newWashPrice, setNewWashPrice] = useState<string>('');
  const [newWashDesc, setNewWashDesc] = useState<string>('');

  // Wash Service Inline Edit
  const [editingWashId, setEditingWashId] = useState<string | null>(null);
  const [editWashName, setEditWashName] = useState<string>('');
  const [editWashPrice, setEditWashPrice] = useState<string>('');
  const [editWashDesc, setEditWashDesc] = useState<string>('');

  // Extra Service Form
  const [showAddExtraForm, setShowAddExtraForm] = useState<boolean>(false);
  const [newExtraName, setNewExtraName] = useState<string>('');
  const [newExtraPrice, setNewExtraPrice] = useState<string>('');
  const [newExtraDesc, setNewExtraDesc] = useState<string>('');

  // Extra Service Inline Edit
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editExtraName, setEditExtraName] = useState<string>('');
  const [editExtraPrice, setEditExtraPrice] = useState<string>('');
  const [editExtraDesc, setEditExtraDesc] = useState<string>('');

  // Deletion confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- Handlers: Wash Services ---
  const handleStartEditWash = (srv: WashService) => {
    if (!isManager) return;
    setEditingWashId(srv.id);
    setEditWashName(srv.name);
    setEditWashPrice(String(srv.price));
    setEditWashDesc(srv.description || '');
  };

  const handleSaveEditWash = (id: string) => {
    const p = parseFloat(editWashPrice);
    if (!editWashName.trim() || isNaN(p) || p < 0) return;
    updateService(id, editWashName.trim(), p, editWashDesc.trim() || undefined);
    setEditingWashId(null);
  };

  const handleCreateWash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const p = parseFloat(newWashPrice);
    if (!newWashName.trim() || isNaN(p) || p < 0) return;
    addService(newWashName.trim(), p, newWashDesc.trim() || undefined);
    setNewWashName('');
    setNewWashPrice('');
    setNewWashDesc('');
    setShowAddWashForm(false);
  };

  // --- Handlers: Extra Services ---
  const handleStartEditExtra = (extra: ExtraServiceItem) => {
    if (!isManager) return;
    setEditingExtraId(extra.id);
    setEditExtraName(extra.name);
    setEditExtraPrice(String(extra.price));
    setEditExtraDesc(extra.description || '');
  };

  const handleSaveEditExtra = (id: string) => {
    const p = parseFloat(editExtraPrice);
    if (!editExtraName.trim() || isNaN(p) || p < 0) return;
    updateExtraService(id, editExtraName.trim(), p, editExtraDesc.trim() || undefined);
    setEditingExtraId(null);
  };

  const handleCreateExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const p = parseFloat(newExtraPrice);
    if (!newExtraName.trim() || isNaN(p) || p < 0) return;
    addExtraService(newExtraName.trim(), p, newExtraDesc.trim() || undefined);
    setNewExtraName('');
    setNewExtraPrice('');
    setNewExtraDesc('');
    setShowAddExtraForm(false);
  };

  const extraServicesList = state.extraServices || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة خدمات وأسعار المغسلة
            </h1>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              صلاحيات المدير
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الكامل بأنواع الغسيل والخدمات الإضافية، وتعديل الأسماء والأسعار وتفعيلها على شاشة الكاشير
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              if (activeTab === 'wash') {
                setShowAddWashForm(true);
              } else {
                setShowAddExtraForm(true);
              }
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'wash' ? 'إضافة نوع غسيل جديد' : 'إضافة خدمة إضافية جديدة'}</span>
          </button>
        )}
      </div>

      {/* Official Clarification Box */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-slate-300">
          <p className="font-bold text-white">
            تحكم المدير في باقات الغسيل والخدمات الإضافية:
          </p>
          <p className="text-slate-400 leading-relaxed">
            يملك المدير العام الصلاحية الحصرية لتحديد وتعديل أسعار <strong>«نوع الغسيل»</strong> و <strong>«الخدمات الإضافية»</strong>. أي تعديل في السعر ينعكس فوريًا في شاشة الكاشير للفواتير الجديدة دون المساس بالفواتير المسجلة مسبقًا في النظام.
          </p>
        </div>
      </div>

      {/* Non-manager warning if cashier */}
      {!isManager && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
          <span>
            أنت مسجل حالياً بصلاحية <strong>الكاشير ({currentUser.name})</strong>. يمكنك الاطلاع فقط، لتعديل أو إضافة الأسعار يرجى التبديل لحساب "المدير العام".
          </span>
        </div>
      )}

      {/* ================= TAB SELECTOR ================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('wash')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'wash'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. باقات وأنواع الغسيل ({state.services.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('extras')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'extras'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. الخدمات الإضافية ({extraServicesList.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: WASH SERVICES (اختر نوع الغسيل) ================= */}
      {activeTab === 'wash' && (
        <div className="space-y-4">
          {/* Add Wash Form */}
          {showAddWashForm && isManager && (
            <form onSubmit={handleCreateWash} className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-400" />
                  <span>إضافة نوع غسيل جديد لقائمة «اختر نوع الغسيل»</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddWashForm(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">اسم نوع الغسيل *</label>
                  <input
                    type="text"
                    placeholder="مثال: غسيل ساطع بالرغوة الوردية"
                    value={newWashName}
                    onChange={e => setNewWashName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
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
                    value={newWashPrice}
                    onChange={e => setNewWashPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono-numbers focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 block mb-1">الوصف والمزايا (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: غسيل خارجي + تكييس دعاسات + معطر"
                    value={newWashDesc}
                    onChange={e => setNewWashDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWashForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ نوع الغسيل
                </button>
              </div>
            </form>
          )}

          {/* Wash Services Table */}
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
                    const isEditing = editingWashId === srv.id;

                    if (isEditing) {
                      return (
                        <tr key={srv.id} className="bg-slate-950/80">
                          <td className="p-3">
                            <input
                              type="text"
                              value={editWashName}
                              onChange={e => setEditWashName(e.target.value)}
                              className="w-full bg-slate-900 border border-sky-500 rounded px-2 py-1 text-xs text-white font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editWashDesc}
                              onChange={e => setEditWashDesc(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={editWashPrice}
                                onChange={e => setEditWashPrice(e.target.value)}
                                className="w-20 bg-slate-900 border border-sky-500 rounded px-2 py-1 text-xs text-white text-center font-mono-numbers font-bold"
                              />
                              <span className="text-slate-400">ر.س</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs text-sky-400 font-semibold">تعديل مباشر</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEditWash(srv.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
                                title="حفظ التعديل"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingWashId(null)}
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
                        <td className="p-3.5 text-center font-mono-numbers text-base font-black text-sky-400">
                          {srv.price.toFixed(2)} <span className="text-xs font-normal">ر.س</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            srv.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {srv.isActive ? 'مفعل بالكاشير' : 'متوقف مؤقتاً'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {isManager ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEditWash(srv)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-sky-400 rounded-lg border border-slate-700 transition-colors"
                                title="تعديل السعر والاسم"
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
                              {deleteConfirmId === srv.id ? (
                                <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-lg border border-rose-500/50">
                                  <button
                                    onClick={() => {
                                      deleteService(srv.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-[10px] text-slate-400 px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(srv.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                                  title="حذف الخدمة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
      )}

      {/* ================= TAB 2: EXTRA SERVICES (خدمات إضافية) ================= */}
      {activeTab === 'extras' && (
        <div className="space-y-4">
          {/* Add Extra Form */}
          {showAddExtraForm && isManager && (
            <form onSubmit={handleCreateExtra} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>إضافة خدمة إضافية جديدة لقائمة «خدمات إضافية»</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddExtraForm(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">اسم الخدمة الإضافية *</label>
                  <input
                    type="text"
                    placeholder="مثال: تعقيم بالنانو سيراميك"
                    value={newExtraName}
                    onChange={e => setNewExtraName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">السعر المعتمد (ر.س) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="مثال: 15"
                    value={newExtraPrice}
                    onChange={e => setNewExtraPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono-numbers focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 block mb-1">الوصف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: تعقيم شامل للمكيف والديكور الداخلي"
                    value={newExtraDesc}
                    onChange={e => setNewExtraDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExtraForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
                >
                  حفظ الخدمة الإضافية
                </button>
              </div>
            </form>
          )}

          {/* Extra Services Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3.5">الخدمة الإضافية</th>
                    <th className="p-3.5">الوصف</th>
                    <th className="p-3.5 text-center">السعر المعتمد</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">إجراءات المدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {extraServicesList.map(extra => {
                    const isEditing = editingExtraId === extra.id;

                    if (isEditing) {
                      return (
                        <tr key={extra.id} className="bg-slate-950/80">
                          <td className="p-3">
                            <input
                              type="text"
                              value={editExtraName}
                              onChange={e => setEditExtraName(e.target.value)}
                              className="w-full bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editExtraDesc}
                              onChange={e => setEditExtraDesc(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={editExtraPrice}
                                onChange={e => setEditExtraPrice(e.target.value)}
                                className="w-20 bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white text-center font-mono-numbers font-bold"
                              />
                              <span className="text-slate-400">ر.س</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs text-amber-400 font-semibold">تعديل مباشر</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEditExtra(extra.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
                                title="حفظ التعديل"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingExtraId(null)}
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
                      <tr key={extra.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-bold text-white text-sm">
                          {extra.name}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {extra.description || '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono-numbers text-base font-black text-amber-400">
                          {extra.price.toFixed(2)} <span className="text-xs font-normal">ر.س</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            extra.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {extra.isActive ? 'مفعل بالكاشير' : 'متوقف مؤقتاً'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {isManager ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEditExtra(extra)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded-lg border border-slate-700 transition-colors"
                                title="تعديل السعر والاسم"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleExtraServiceActive(extra.id)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  extra.isActive 
                                    ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border-slate-700' 
                                    : 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 border-emerald-600/40'
                                }`}
                                title={extra.isActive ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              {deleteConfirmId === extra.id ? (
                                <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-lg border border-rose-500/50">
                                  <button
                                    onClick={() => {
                                      deleteExtraService(extra.id);
                                      setDeleteConfirmId(null);
                                    }}
                                    className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-[10px] text-slate-400 px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(extra.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                                  title="حذف الخدمة الإضافية"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
      )}
    </div>
  );
};
