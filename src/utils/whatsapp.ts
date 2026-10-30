import { SaleTransaction } from '../types';

export function formatSaudiPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('05')) {
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppReceiptText(sale: SaleTransaction): string {
  const extrasText = sale.extraServices && sale.extraServices.length > 0
    ? sale.extraServices.map(e => `• ${e.name} (${e.price.toFixed(2)} ر.س)`).join('\n')
    : 'لا توجد خدمات إضافية';

  const paymentMethodLabel = 
    sale.paymentMethod === 'cash' ? 'كاش (نقداً)' :
    sale.paymentMethod === 'network' ? 'شبكة (مدى)' :
    'غسلة مجانية (ولاء 0 ر.س)';

  return `⭐ *مغسلة RM STAR CAR WASH* ⭐
أهلاً بك عزيزي العميل! نسعد بخدمتك دائماً.

📄 *إيصال الفاتورة الإلكتروني*
━━━━━━━━━━━━━━━━━━
🔢 *رقم الفاتورة:* ${sale.serialNumber}
📅 *التاريخ:* ${sale.saudiFormattedDate}
⏰ *الوقت:* ${sale.saudiFormattedTime}
🚗 *نوع الغسيل:* ${sale.washServiceName} (${sale.originalWashPrice.toFixed(2)} ر.س)
✨ *الخدمات الإضافية:*
${extrasText}
💳 *طريقة الدفع:* ${paymentMethodLabel}
💰 *المبلغ الإجمالي:* ${sale.totalAmount.toFixed(2)} ر.س
━━━━━━━━━━━━━━━━━━
👤 *الكاشير:* ${sale.cashierName}
🎁 *نظام الولاء:* الغسلة الخامسة مجاناً!
📍 شكراً لزيارتكم مغسلة RM STAR CAR WASH`;
}

export function openWhatsAppReceipt(sale: SaleTransaction, targetPhone?: string): void {
  const phone = targetPhone || sale.customerPhone || '';
  const formattedPhone = formatSaudiPhoneNumber(phone);
  const text = encodeURIComponent(generateWhatsAppReceiptText(sale));
  
  const url = formattedPhone 
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`
    : `https://api.whatsapp.com/send?text=${text}`;
    
  window.open(url, '_blank');
}
