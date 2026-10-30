import React, { useState } from 'react';
import { SaleTransaction } from '../types';
import { Printer, X, Download, Share2, FileText, Check, Loader2, MessageCircle } from 'lucide-react';
import { getShiftShortName } from '../utils/time';
import { downloadReceiptPDF, shareOrSendPdfReceipt, directWhatsAppWithPdf } from '../utils/pdfReceipt';
import { openWhatsAppReceipt } from '../utils/whatsapp';

interface ReceiptModalProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(sale.customerPhone || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectWhatsApp = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage(null);
      await directWhatsAppWithPdf(sale, phoneNumber);
      setPdfSuccessMessage('تم فتح واتساب مباشرة لمشاركة الفاتورة مع العميل!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to open WhatsApp:', err);
      openWhatsAppReceipt(sale, phoneNumber);
      setPdfSuccessMessage('تم فتح واتساب مباشرة مع العميل!');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage(null);
      await downloadReceiptPDF(sale);
      setPdfSuccessMessage('تم تحميل إيصال الفاتورة بصيغة PDF بنجاح!');
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPdfSuccessMessage('تعذر توليد ملف الـ PDF، يرجى استخدام زر الطباعة.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage(null);
      const res = await shareOrSendPdfReceipt(sale, phoneNumber);
      if (res.mode === 'web_share') {
        setPdfSuccessMessage('تم فتح نافذة المشاركة بالجوال لإرسال ملف PDF!');
      } else {
        setPdfSuccessMessage('تم فتح محادثة واتساب العميل مباشرة وتجهيز ملف PDF!');
      }
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to share PDF:', err);
      openWhatsAppReceipt(sale, phoneNumber);
      setPdfSuccessMessage('تم فتح محادثة واتساب لإرسال الفاتورة للعميل!');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 shadow-2xl relative text-slate-100 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 no-print min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Title */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">
              إيصال الفاتورة الإلكتروني
            </h3>
            <span className="text-[10px] text-slate-400 font-mono-numbers">
              {sale.serialNumber} · جاهز كملف PDF
            </span>
          </div>
        </div>

        {/* Printable Receipt Paper Container (Target for PDF Canvas Capture) */}
        <div id="receipt-print-area" className="bg-white text-slate-900 p-4 sm:p-5 rounded-xl space-y-3 font-mono text-xs shadow-inner">
          
          {/* Header with Authentic RM STAR Logo */}
          <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
            <div className="flex justify-center mb-1">
              <img 
                src="/assets/aistudio/d75f30e4-2e7f-48d8-a862-445d465f253d_IMG-7131_646dea62.webp" 
                alt="RM STAR CAR WASH" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="font-black text-base sm:text-lg tracking-wider text-slate-950 font-sans">
              RM STAR CAR WASH
            </div>
            <div className="text-[11px] text-slate-600 font-sans font-semibold">
              مغسلة سيارات آر إم ستار
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              فاتورة ضريبية نقدية مبسطة
            </div>
          </div>

          {/* Meta Info */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span className="text-slate-500">رقم الفاتورة:</span>
              <span className="font-bold font-mono-numbers">{sale.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الوقت:</span>
              <span className="font-mono-numbers">{sale.saudiFormattedDate} {sale.saudiFormattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الشفت:</span>
              <span>{getShiftShortName(sale.shift)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">الكاشير:</span>
              <span>{sale.cashierName}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-500">جوال العميل:</span>
                <span className="font-mono-numbers">{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between text-slate-500 font-sans font-semibold">
              <span>البيان</span>
              <span>المبلغ</span>
            </div>

            {/* Wash Service */}
            <div className="flex justify-between font-sans">
              <span className="font-bold text-slate-900">
                {sale.washServiceName} {sale.isFreeWash && '(ولاء مجاني)'}
              </span>
              <span className="font-mono-numbers font-bold">
                {sale.isFreeWash ? '0.00 ر.س' : `${sale.originalWashPrice.toFixed(2)} ر.س`}
              </span>
            </div>

            {/* Extra Services if any */}
            {sale.extraServices && sale.extraServices.map((extra, idx) => (
              <div key={idx} className="flex justify-between text-[11px] text-slate-700 pl-2">
                <span>+ {extra.name}</span>
                <span className="font-mono-numbers">{extra.price.toFixed(2)} ر.س</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-0.5">
            {sale.extraServicesTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>إجمالي الإضافات:</span>
                <span className="font-mono-numbers">{sale.extraServicesTotal.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-950 pt-1 border-t border-slate-200">
              <span>المجموع النهائي:</span>
              <span className="font-mono-numbers text-base font-black">
                {sale.totalAmount.toFixed(2)} ر.س
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
              <span>طريقة السداد:</span>
              <span className="font-bold text-slate-900">
                {sale.paymentMethod === 'free' 
                  ? 'غسلة مجانية معتمدة' 
                  : sale.paymentMethod === 'cash' 
                  ? 'نقداً (كاش)' 
                  : 'شبكة / مدى'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
            {sale.isFreeWash ? (
              <p className="text-purple-700 font-bold">
                ★ تم استهلاك الغسلة المجانية المستحقة بنجاح ★
              </p>
            ) : (
              <p>نظام الولاء: 4 غسلات مدفوعة والخامسة مجانية</p>
            )}
            <p className="mt-0.5 text-slate-400">شكراً لاختياركم RM STAR CAR WASH</p>
          </div>

        </div>

        {/* Customer Phone for Direct WhatsApp Share */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5 no-print">
          <div className="flex items-center justify-between">
            <label htmlFor="modal-phone-input" className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>جوال العميل للمشاركة الفورية عبر واتساب:</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              دايركت
            </span>
          </div>
          <input
            id="modal-phone-input"
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder="05xxxxxxx (أدخل الرقم للمشاركة مباشرة)"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 font-mono-numbers text-left focus:outline-none transition-colors"
          />
        </div>

        {/* Feedback notification after generating PDF */}
        {pdfSuccessMessage && (
          <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {/* Primary Actions */}
        <div className="space-y-2 no-print pt-1">
          {/* 1. Direct WhatsApp Share Button */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDirectWhatsApp}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all min-h-[46px] disabled:opacity-50 active:scale-[0.99]"
            title="مشاركة الفاتورة دايركت عبر واتساب للعميل"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>مشاركة دايركت عبر واتساب 💬</span>
          </button>

          {/* 2. PDF Download & Native Device Share */}
          <div className="grid grid-cols-2 gap-2">
            {/* Download PDF Button */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 transition-all min-h-[42px] disabled:opacity-50"
              title="تنزيل الإيصال كملف PDF رسمي على جهازك"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>تحميل إيصال PDF</span>
            </button>

            {/* Share PDF to WhatsApp / Device */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSharePdf}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500/50 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all min-h-[42px] disabled:opacity-50"
              title="مشاركة ملف PDF مباشرة عبر تطبيقات الجوال"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>مشاركة ملف PDF</span>
            </button>
          </div>

          {/* 3. Thermal Print & Close */}
          <div className="grid grid-cols-2 gap-2">
            {/* Thermal Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[38px]"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>طباعة حرارية</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl font-bold text-xs border border-slate-700 transition-all min-h-[38px]"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
