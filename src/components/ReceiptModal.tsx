import React from 'react';
import { SaleTransaction } from '../types';
import { Printer, X, Sparkles, Gift } from 'lucide-react';
import { getShiftShortName } from '../utils/time';

interface ReceiptModalProps {
  sale: SaleTransaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl relative text-slate-100 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 no-print min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Paper Container */}
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
            <div className="font-black text-base sm:text-lg tracking-wider text-slate-950">
              RM STAR CAR WASH
            </div>
            <div className="text-[11px] text-slate-600 font-sans font-semibold">
              مغسلة سيارات آر إم ستار
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              فاتورة نقدية مبسطة
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
            {sale.extraServices.map((extra, idx) => (
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-xl font-bold text-xs border border-slate-700 transition-all min-h-[44px]"
          >
            تم
          </button>
        </div>

      </div>
    </div>
  );
};
