import React, { useState } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Check, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Gift, 
  Clock, 
  Printer, 
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  Edit3,
  X,
  Layers,
  Power,
  MessageCircle
} from 'lucide-react';
import { formatSaudiDate, formatSaudiTime, getShiftShortName } from '../utils/time';
import { PaymentMethod, SaleTransaction } from '../types';
import { ReceiptModal } from './ReceiptModal';
import { openWhatsAppReceipt } from '../utils/whatsapp';

export const CashierView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    activeShift, 
    saudiTimeNow, 
    recordSale,
    addService,
    updateService,
    toggleServiceActive,
    addExtraService,
    updateExtraService,
    toggleExtraServiceActive,
    deleteExtraService
  } = useAccounting();

  const isManager = currentUser.role === 'manager' || currentUser.roleId === 'super_admin' || currentUser.roleId === 'manager';
  const activeServices = state.services.filter(s => s.isActive);
  const activeExtraServices = (state.extraServices || []).filter(e => e.isActive);

  // Optional customer mobile for WhatsApp receipt
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Manager Quick Modals state
  const [showWashManagerModal, setShowWashManagerModal] = useState<boolean>(false);
  const [showExtrasManagerModal, setShowExtrasManagerModal] = useState<boolean>(false);

  // Inline edit states inside manager modals
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [modalEditName, setModalEditName] = useState<string>('');
  const [modalEditPrice, setModalEditPrice] = useState<string>('');
  const [modalNewName, setModalNewName] = useState<string>('');
  const [modalNewPrice, setModalNewPrice] = useState<string>('');

  // 1. Selected wash service (starts empty '' so the total is 0.00 SAR on new bill)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // 2. Extra services dynamic list
  interface ExtraInput {
    id: string;
    name: string;
    price: string;
  }
  const [extraServices, setExtraServices] = useState<ExtraInput[]>([]);
  const [selectedExtraDropdown, setSelectedExtraDropdown] = useState<string>('');
  const [showExtraForm, setShowExtraForm] = useState<boolean>(false);
  const [customExtraName, setCustomExtraName] = useState<string>('');
  const [customExtraPrice, setCustomExtraPrice] = useState<string>('');

  // 3. Payment method: cash | network | free
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [extrasPaymentMethod, setExtrasPaymentMethod] = useState<'cash' | 'network'>('cash');

  // 4. Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<{ serial: string; amount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFreeConfirmation, setShowFreeConfirmation] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Reset entire bill to 0.00 SAR (ready for new car)
  const resetBillToZero = () => {
    setSelectedServiceId('');
    setExtraServices([]);
    setSelectedExtraDropdown('');
    setPaymentMethod('cash');
    setShowFreeConfirmation(false);
    setShowExtraForm(false);
    setCustomExtraName('');
    setCustomExtraPrice('');
    setCustomerPhone('');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculations
  const selectedService = state.services.find(s => s.id === selectedServiceId);
  const washOriginalPrice = selectedService ? selectedService.price : 0;
  const washEffectivePrice = paymentMethod === 'free' ? 0 : washOriginalPrice;

  const extraServicesTotal = extraServices.reduce((sum, item) => {
    const p = parseFloat(item.price);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  const grandTotal = washEffectivePrice + extraServicesTotal;

  // Quick add extra service
  const handleAddPresetExtra = (name: string, price: string) => {
    setExtraServices(prev => [
      ...prev,
      { id: `ex-${Date.now()}-${Math.random()}`, name, price }
    ]);
  };

  const handleAddCustomExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(customExtraPrice);
    if (!customExtraName.trim() || isNaN(p) || p <= 0) return;

    setExtraServices(prev => [
      ...prev,
      { id: `ex-${Date.now()}`, name: customExtraName.trim(), price: customExtraPrice.trim() }
    ]);
    setCustomExtraName('');
    setCustomExtraPrice('');
    setShowExtraForm(false);
  };

  const handleRemoveExtra = (id: string) => {
    setExtraServices(prev => prev.filter(e => e.id !== id));
  };

  // Execute Sale
  const executeSubmission = () => {
    if (!selectedServiceId) {
      setErrorMessage('الرجاء اختيار نوع الغسيل أولاً.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formattedExtras = extraServices.map(e => ({
      name: e.name.trim(),
      price: parseFloat(e.price) || 0,
    }));

    const result = recordSale({
      washServiceId: selectedServiceId,
      extraServices: formattedExtras,
      paymentMethod,
      extrasPaymentMethod: paymentMethod === 'free' && extraServicesTotal > 0 ? extrasPaymentMethod : undefined,
      customerPhone: customerPhone.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.sale) {
      setLastCompletedSale(result.sale);
      setSuccessToast({ serial: result.sale.serialNumber, amount: result.sale.totalAmount });
      
      // RESET IMMEDIATELY BACK TO ZERO (NEW BILL STATE) AS REQUESTED!
      resetBillToZero();

      // Auto clear success toast after 6s
      setTimeout(() => {
        setSuccessToast(null);
      }, 6000);
    } else {
      setErrorMessage(result.error || 'حدث خطأ أثناء حفظ العملية.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedServiceId) {
      setErrorMessage('الرجاء الضغط على نوع الغسيل المطلوب أولاً.');
      return;
    }

    if (paymentMethod === 'free') {
      setShowFreeConfirmation(true);
      return;
    }

    executeSubmission();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4 w-full max-w-full overflow-x-hidden">

      {/* Success Notification Banner after saving */}
      {successToast && (
        <div className="bg-emerald-950/95 border-2 border-emerald-500 rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-lg">
                ✓
              </div>
              <div>
                <span className="font-black text-white text-sm sm:text-base block">
                  تم تسجيل الفاتورة بنجاح: {successToast.serial}
                </span>
                <span className="text-xs text-emerald-300 font-mono-numbers">
                  المبلغ: {successToast.amount.toFixed(2)} ر.س · تم التصفير وجاهز لسيارة جديدة (0 ر.س)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastCompletedSale && (
                <>
                  <button
                    type="button"
                    onClick={() => openWhatsAppReceipt(lastCompletedSale, customerPhone)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md whitespace-nowrap min-h-[40px]"
                    title="إرسال الفاتورة عبر واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>واتساب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md whitespace-nowrap min-h-[40px]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                className="text-emerald-400 hover:text-white p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Bar: New Bill Indicator & Reset Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${selectedServiceId ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          <span className="font-bold text-white">
            {selectedServiceId ? 'فاتورة قيد الإدخال' : 'فاتورة جديدة جاهزة (0 ر.س)'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden xs:inline">{currentUser.name} ({getShiftShortName(activeShift)})</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedServiceId && (
            <button
              type="button"
              onClick={resetBillToZero}
              className="text-slate-400 hover:text-rose-400 font-bold flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors"
              title="تصفير الفاتورة والبدء من جديد"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-slate-400 font-mono-numbers text-[11px]">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{formatSaudiTime(saudiTimeNow, false)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        
        {/* ================= STEP 1: WASH SELECTION (DROPDOWN) ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="wash-service-select" className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm shadow-sky-500/30">
                1
              </span>
              <span>اختر نوع الغسيل:</span>
            </label>
            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setModalEditId(null);
                    setModalNewName('');
                    setModalNewPrice('');
                    setShowWashManagerModal(true);
                  }}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 bg-slate-950 border border-sky-500/40 hover:border-sky-400 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                  title="تعديل أنواع وأسعار الغسيل (صلاحيات المدير)"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>تعديل الأسعار</span>
                </button>
              )}
              {selectedService ? (
                <span className="text-xs font-black text-sky-400 font-mono-numbers bg-sky-950/80 border border-sky-500/40 px-3 py-1 rounded-xl shadow-sm">
                  السعر: {selectedService.price} ر.س
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-semibold">
                  * اختر من القائمة
                </span>
              )}
            </div>
          </div>

          {/* Wash Service Select Dropdown */}
          <div className="relative">
            <select
              id="wash-service-select"
              dir="rtl"
              value={selectedServiceId}
              onChange={e => {
                setSelectedServiceId(e.target.value);
                setErrorMessage(null);
              }}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              className={`w-full bg-slate-950 border-2 rounded-xl pr-4 pl-10 py-3.5 text-xs sm:text-sm font-bold text-white focus:outline-none transition-all shadow-inner cursor-pointer min-h-[50px] ${
                selectedServiceId 
                  ? 'border-sky-500 bg-sky-950/30 text-sky-200 ring-1 ring-sky-500/30' 
                  : 'border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                اختر نوع الغسيل
              </option>
              {activeServices.map(srv => (
                <option key={srv.id} value={srv.id} className="bg-slate-900 text-white py-2">
                  {srv.name} — ({srv.price} ر.س)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3.5 text-sky-400">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ================= STEP 2: PAYMENT METHOD ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5">
          <label className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm shadow-sky-500/30">
              2
            </span>
            <span>طريقة الدفع:</span>
          </label>

          <div className="grid grid-cols-3 gap-1.5 xs:gap-2">
            {/* CASH */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-1.5 xs:p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all min-h-[68px] sm:min-h-[76px] ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/50'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className={`w-4 h-4 xs:w-5 xs:h-5 mb-1 ${paymentMethod === 'cash' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-[10px] xs:text-xs sm:text-sm font-extrabold block leading-tight">كاش (نقداً)</span>
            </button>

            {/* NETWORK */}
            <button
              type="button"
              onClick={() => setPaymentMethod('network')}
              className={`p-1.5 xs:p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all min-h-[68px] sm:min-h-[76px] ${
                paymentMethod === 'network'
                  ? 'bg-blue-950/70 border-blue-500 text-white shadow-lg ring-2 ring-blue-500/50'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className={`w-4 h-4 xs:w-5 xs:h-5 mb-1 ${paymentMethod === 'network' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-[10px] xs:text-xs sm:text-sm font-extrabold block leading-tight">شبكة (مدى)</span>
            </button>

            {/* FREE */}
            <button
              type="button"
              onClick={() => setPaymentMethod('free')}
              className={`p-1.5 xs:p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all min-h-[68px] sm:min-h-[76px] ${
                paymentMethod === 'free'
                  ? 'bg-purple-950/70 border-purple-500 text-white shadow-lg ring-2 ring-purple-500/50'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Gift className={`w-4 h-4 xs:w-5 xs:h-5 mb-1 ${paymentMethod === 'free' ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="text-[10px] xs:text-xs sm:text-sm font-extrabold block leading-tight">غسلة مجانية</span>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-purple-300 font-semibold leading-tight">(ولاء: 0 ر.س)</span>
            </button>
          </div>

          {/* If Free Wash with Extra Services */}
          {paymentMethod === 'free' && extraServicesTotal > 0 && (
            <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-3 text-xs space-y-2">
              <span className="text-purple-200 font-bold block text-xs">
                الغسيل مجاني (0 ر.س)، كيف سيدفع العميل الخدمات الإضافية ({extraServicesTotal} ر.س)؟
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExtrasPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-lg border font-bold text-xs ${
                    extrasPaymentMethod === 'cash' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  كاش في الصندوق
                </button>
                <button
                  type="button"
                  onClick={() => setExtrasPaymentMethod('network')}
                  className={`py-2 px-3 rounded-lg border font-bold text-xs ${
                    extrasPaymentMethod === 'network' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  شبكة (مدى)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= STEP 3: OPTIONAL EXTRA SERVICES (DROPDOWN) ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="extra-services-select" className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm shadow-amber-500/30">
                3
              </span>
              <span>خدمات إضافية:</span>
            </label>

            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setModalEditId(null);
                    setModalNewName('');
                    setModalNewPrice('');
                    setShowExtrasManagerModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-slate-950 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                  title="تعديل الخدمات الإضافية والأسعار (صلاحيات المدير)"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>تعديل الخدمات</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowExtraForm(!showExtraForm)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg min-h-[34px] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showExtraForm ? 'إلغاء' : '+ يدوي'}</span>
              </button>
            </div>
          </div>

          {/* Extra Services Dropdown Selector */}
          <div className="relative">
            <select
              id="extra-services-select"
              dir="rtl"
              value={selectedExtraDropdown}
              onChange={e => {
                const val = e.target.value;
                if (!val) return;
                if (val === 'custom') {
                  setShowExtraForm(true);
                } else {
                  const item = activeExtraServices.find(p => p.id === val);
                  if (item) {
                    handleAddPresetExtra(item.name, String(item.price));
                  }
                }
                setSelectedExtraDropdown('');
              }}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              className="w-full bg-slate-950 border-2 border-slate-700 hover:border-amber-500/50 rounded-xl pr-4 pl-10 py-3 text-xs sm:text-sm font-bold text-slate-200 focus:outline-none focus:border-amber-500 transition-all shadow-inner cursor-pointer min-h-[46px]"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                اختار الخدمة
              </option>
              {activeExtraServices.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white py-1.5">
                  {p.name} - {p.price} ر.س
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-amber-300 font-bold">
                + كتابة خدمة يدوية
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3.5 text-amber-400">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

          {/* Manual Extra Form */}
          {showExtraForm && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 space-y-2 pt-2 animate-in fade-in">
              <span className="text-xs font-semibold text-slate-300 block">
                كتابة اسم وسعر الخدمة يدويًا:
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="اسم الخدمة الإضافية..."
                  value={customExtraName}
                  onChange={e => setCustomExtraName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[40px]"
                />
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <div className="flex items-center gap-1 flex-1 sm:flex-none">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="السعر"
                      value={customExtraPrice}
                      onChange={e => setCustomExtraPrice(e.target.value)}
                      className="w-full sm:w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono-numbers text-center focus:outline-none focus:border-amber-500 min-h-[40px]"
                    />
                    <span className="text-xs text-slate-400 shrink-0">ر.س</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomExtra}
                    className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs min-h-[40px] whitespace-nowrap transition-all"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Added Extras List Chips */}
          {extraServices.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 block">
                الخدمات الإضافية المضافة للفاتورة ({extraServices.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {extraServices.map(ex => (
                  <div key={ex.id} className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs shadow-sm">
                    <span className="font-bold text-white">+ {ex.name}</span>
                    <span className="font-mono-numbers font-black text-amber-400">{ex.price} ر.س</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(ex.id)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="حذف الخدمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500 text-rose-200 p-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= OPTIONAL: CUSTOMER PHONE FOR WHATSAPP RECEIPT ================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="customer-phone-input" className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>إرسال الفاتورة عبر واتساب (اختياري):</span>
            </label>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
              اختياري
            </span>
          </div>

          <input
            id="customer-phone-input"
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder="05xxxxxxx (اختياري - يمكنك تركه فارغاً)"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 font-mono-numbers text-left focus:outline-none transition-colors"
          />
        </div>

        {/* ================= GRAND TOTAL & ACTION BUTTON ================= */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border-2 border-sky-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-sky-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">
                الإجمالي:
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-3xl sm:text-4xl font-black font-mono-numbers ${grandTotal > 0 ? 'text-sky-400' : 'text-slate-400'}`}>
                  {grandTotal.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-300">ريال</span>
              </div>
            </div>

            <div className="text-left text-xs text-slate-300">
              <span className="text-slate-400 text-[11px] block">طريقة التحصيل:</span>
              <span className="font-extrabold text-sm text-white">
                {paymentMethod === 'free' ? 'غسلة مجانية (0 ر.س)' : paymentMethod === 'cash' ? 'كاش (الصندوق)' : 'شبكة (مدى)'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-black text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2 min-h-[56px] text-center ${
              isSubmitting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : !selectedServiceId
                ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                : paymentMethod === 'free'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 active:scale-[0.99]'
                : 'bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 shadow-sky-500/30 active:scale-[0.99]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-center font-black">
              {isSubmitting 
                ? 'جاري الحفظ...' 
                : `الإجمالي: ${grandTotal.toFixed(2)} ر.س`}
            </span>
          </button>
        </div>

      </form>

      {/* Free Wash Confirmation Modal */}
      {showFreeConfirmation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  تأكيد الغسلة المجانية
                </h3>
                <p className="text-xs text-slate-400">
                  نظام الولاء: الغسلة الخامسة مجانية
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p>• قيمة الغسيل: <strong>0 ر.س</strong> (تسجل بالعدد دون إيراد مدفوع).</p>
              {extraServicesTotal > 0 && (
                <p className="text-amber-400 font-bold">
                  • سيتم تحصيل {extraServicesTotal} ر.س للخدمات الإضافية بطريقة ({extrasPaymentMethod === 'cash' ? 'كاش' : 'شبكة'}).
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowFreeConfirmation(false)}
                className="py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl min-h-[44px]"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className="py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl min-h-[44px]"
              >
                تأكيد واعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceipt && lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* ================= MANAGER QUICK EDIT MODAL: WASH SERVICES ================= */}
      {showWashManagerModal && isManager && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-sky-500/50 rounded-2xl p-4 sm:p-5 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-base">تعديل باقات وأنواع الغسيل</h3>
                  <span className="text-[10px] text-sky-400 font-mono">صلاحية المدير العام</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWashManagerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Wash Form */}
            <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/30 space-y-2">
              <span className="text-xs font-bold text-white block">+ إضافة نوع غسيل جديد سريعًا:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="اسم نوع الغسيل..."
                  value={modalNewName}
                  onChange={e => setModalNewName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 min-h-[38px]"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="السعر (ر.س)"
                    value={modalNewPrice}
                    onChange={e => setModalNewPrice(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono-numbers text-center focus:outline-none focus:border-sky-500 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const p = parseFloat(modalNewPrice);
                      if (!modalNewName.trim() || isNaN(p) || p < 0) return;
                      addService(modalNewName.trim(), p);
                      setModalNewName('');
                      setModalNewPrice('');
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[38px]"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>

            {/* Wash Services List */}
            <div className="space-y-2 divide-y divide-slate-800/80">
              {state.services.map(srv => {
                const isEditing = modalEditId === srv.id;

                if (isEditing) {
                  return (
                    <div key={srv.id} className="pt-2 bg-slate-950/70 p-2.5 rounded-xl border border-sky-500/40 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={modalEditName}
                          onChange={e => setModalEditName(e.target.value)}
                          className="flex-1 bg-slate-900 border border-sky-500 rounded px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={modalEditPrice}
                            onChange={e => setModalEditPrice(e.target.value)}
                            className="w-20 bg-slate-900 border border-sky-500 rounded px-2 py-1.5 text-xs text-white text-center font-mono-numbers font-bold"
                          />
                          <span className="text-xs text-slate-400">ر.س</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const p = parseFloat(modalEditPrice);
                            if (!modalEditName.trim() || isNaN(p) || p < 0) return;
                            updateService(srv.id, modalEditName.trim(), p, srv.description);
                            setModalEditId(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalEditId(null)}
                          className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={srv.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${srv.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      <span className="text-xs font-bold text-white truncate">{srv.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono-numbers font-black text-sky-400">
                        {srv.price.toFixed(2)} ر.س
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalEditId(srv.id);
                          setModalEditName(srv.name);
                          setModalEditPrice(String(srv.price));
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 rounded-md border border-slate-700"
                        title="تعديل السعر والاسم"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleServiceActive(srv.id)}
                        className={`p-1 rounded-md border ${
                          srv.isActive 
                            ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                        title={srv.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWashManagerModal(false)}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANAGER QUICK EDIT MODAL: EXTRA SERVICES ================= */}
      {showExtrasManagerModal && isManager && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 sm:p-5 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm sm:text-base">تعديل الخدمات الإضافية</h3>
                  <span className="text-[10px] text-amber-400 font-mono">صلاحية المدير العام</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtrasManagerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Extra Form */}
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
              <span className="text-xs font-bold text-white block">+ إضافة خدمة إضافية جديدة سريعًا:</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="اسم الخدمة الإضافية..."
                  value={modalNewName}
                  onChange={e => setModalNewName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[38px]"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="السعر (ر.س)"
                    value={modalNewPrice}
                    onChange={e => setModalNewPrice(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono-numbers text-center focus:outline-none focus:border-amber-500 min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const p = parseFloat(modalNewPrice);
                      if (!modalNewName.trim() || isNaN(p) || p < 0) return;
                      addExtraService(modalNewName.trim(), p);
                      setModalNewName('');
                      setModalNewPrice('');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[38px]"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>

            {/* Extra Services List */}
            <div className="space-y-2 divide-y divide-slate-800/80">
              {(state.extraServices || []).map(extra => {
                const isEditing = modalEditId === extra.id;

                if (isEditing) {
                  return (
                    <div key={extra.id} className="pt-2 bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/40 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={modalEditName}
                          onChange={e => setModalEditName(e.target.value)}
                          className="flex-1 bg-slate-900 border border-amber-500 rounded px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={modalEditPrice}
                            onChange={e => setModalEditPrice(e.target.value)}
                            className="w-20 bg-slate-900 border border-amber-500 rounded px-2 py-1.5 text-xs text-white text-center font-mono-numbers font-bold"
                          />
                          <span className="text-xs text-slate-400">ر.س</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const p = parseFloat(modalEditPrice);
                            if (!modalEditName.trim() || isNaN(p) || p < 0) return;
                            updateExtraService(extra.id, modalEditName.trim(), p, extra.description);
                            setModalEditId(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalEditId(null)}
                          className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={extra.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${extra.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                      <span className="text-xs font-bold text-white truncate">{extra.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono-numbers font-black text-amber-400">
                        {extra.price.toFixed(2)} ر.س
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalEditId(extra.id);
                          setModalEditName(extra.name);
                          setModalEditPrice(String(extra.price));
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-md border border-slate-700"
                        title="تعديل السعر والاسم"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExtraServiceActive(extra.id)}
                        className={`p-1 rounded-md border ${
                          extra.isActive 
                            ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                        title={extra.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExtraService(extra.id)}
                        className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-md border border-slate-700"
                        title="حذف الخدمة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExtrasManagerModal(false)}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
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
