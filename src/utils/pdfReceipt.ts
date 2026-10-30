import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SaleTransaction } from '../types';
import { getShiftShortName } from './time';
import { openWhatsAppReceipt } from './whatsapp';

/**
 * Creates an offscreen DOM element styled as an authentic 80mm thermal receipt,
 * perfect for high-resolution canvas capture and PDF generation.
 */
function createReceiptDOMElement(sale: SaleTransaction): HTMLElement {
  const container = document.createElement('div');
  container.id = 'temp-pdf-receipt-node';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '380px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '20px';
  container.style.fontFamily = 'Cairo, system-ui, sans-serif';
  container.style.direction = 'rtl';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-1000';

  const extrasHtml = sale.extraServices && sale.extraServices.length > 0
    ? sale.extraServices.map(e => `
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; padding-right: 8px; margin-top: 3px;">
          <span>+ ${e.name}</span>
          <span style="font-family: monospace; font-weight: bold;">${e.price.toFixed(2)} ر.س</span>
        </div>
      `).join('')
    : '';

  const paymentLabel = 
    sale.paymentMethod === 'free' ? 'غسلة مجانية (ولاء)' :
    sale.paymentMethod === 'cash' ? 'نقداً (كاش)' : 'شبكة / مدى';

  container.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: center; margin-bottom: 6px;">
        <img 
          src="/assets/aistudio/d75f30e4-2e7f-48d8-a862-445d465f253d_IMG-7131_646dea62.webp" 
          alt="RM STAR" 
          style="height: 55px; width: auto; object-fit: contain;" 
        />
      </div>
      <div style="font-weight: 900; font-size: 17px; color: #020617; letter-spacing: 0.5px;">
        RM STAR CAR WASH
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #334155;">
        مغسلة سيارات آر إم ستار
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        فاتورة ضريبية نقدية مبسطة
      </div>
    </div>

    <div style="font-size: 11px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">رقم الفاتورة:</span>
        <span style="font-weight: 900; font-family: monospace;">${sale.serialNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">التاريخ والوقت:</span>
        <span style="font-family: monospace; font-weight: 600;">${sale.saudiFormattedDate} - ${sale.saudiFormattedTime}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">الشفت:</span>
        <span style="font-weight: 700;">${getShiftShortName(sale.shift)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">الكاشير المسؤول:</span>
        <span style="font-weight: 700;">${sale.cashierName}</span>
      </div>
      ${sale.customerPhone ? `
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">جوال العميل:</span>
          <span style="font-family: monospace;">${sale.customerPhone}</span>
        </div>
      ` : ''}
    </div>

    <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11px; color: #475569; margin-bottom: 6px;">
        <span>الخدمة</span>
        <span>المبلغ</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 12px; color: #0f172a;">
        <span>${sale.washServiceName} ${sale.isFreeWash ? '(مجاناً)' : ''}</span>
        <span style="font-family: monospace;">${sale.isFreeWash ? '0.00 ر.س' : `${sale.originalWashPrice.toFixed(2)} ر.س`}</span>
      </div>

      ${extrasHtml}
    </div>

    <div style="margin-bottom: 12px; font-size: 11px;">
      ${sale.extraServicesTotal > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 4px;">
          <span>إجمالي الخدمات الإضافية:</span>
          <span style="font-family: monospace; font-weight: bold;">${sale.extraServicesTotal.toFixed(2)} ر.س</span>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #020617; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 4px;">
        <span>المجموع النهائي:</span>
        <span style="font-family: monospace;">${sale.totalAmount.toFixed(2)} ر.س</span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-top: 4px;">
        <span>طريقة الدفع:</span>
        <span style="font-weight: 800; color: #0f172a;">${paymentLabel}</span>
      </div>
    </div>

    <div style="text-align: center; font-size: 10px; color: #64748b; border-top: 2px dashed #cbd5e1; padding-top: 10px; line-height: 1.5;">
      ${sale.isFreeWash ? `
        <div style="font-weight: 800; color: #7c3aed; margin-bottom: 2px;">
          ★ تم استهلاك الغسلة المجانية المستحقة بنجاح ★
        </div>
      ` : `
        <div>نظام الولاء: 4 غسلات مدفوعة والخامسة مجاناً 🎁</div>
      `}
      <div style="font-weight: 700; color: #020617; margin-top: 4px;">
        نسعد بخدمتكم في مغسلة RM STAR CAR WASH ⭐
      </div>
    </div>
  `;

  return container;
}

/**
 * Builds the PDF blob and File instance from a SaleTransaction
 */
export async function createReceiptPdf(sale: SaleTransaction): Promise<{ pdf: jsPDF; blob: Blob; file: File; filename: string }> {
  // Try to use rendered #receipt-print-area if available, otherwise build offscreen element
  let targetElement = document.getElementById('receipt-print-area');
  let createdOffscreen = false;

  if (!targetElement) {
    targetElement = createReceiptDOMElement(sale);
    document.body.appendChild(targetElement);
    createdOffscreen = true;
  }

  try {
    const canvas = await html2canvas(targetElement, {
      scale: 3, // High DPI for crisp Arabic typography and barcode/logo
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 80mm thermal receipt standard dimensions
    const pdfWidth = 80;
    const canvasAspectRatio = canvas.height / canvas.width;
    const pdfHeight = pdfWidth * canvasAspectRatio;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const filename = `RM-STAR-فاتورة-${sale.serialNumber}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });

    return { pdf, blob, file, filename };
  } finally {
    if (createdOffscreen && targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}

/**
 * Directly downloads the receipt as a PDF file
 */
export async function downloadReceiptPDF(sale: SaleTransaction): Promise<void> {
  const { pdf, filename } = await createReceiptPdf(sale);
  pdf.save(filename);
}

/**
 * Opens WhatsApp directly with prefilled receipt text and downloads the PDF receipt,
 * giving the user an instant, 100% direct sharing experience.
 */
export async function directWhatsAppWithPdf(sale: SaleTransaction, customerPhone?: string): Promise<void> {
  // 1. Immediately open WhatsApp chat
  openWhatsAppReceipt(sale, customerPhone);
  
  // 2. Also save PDF invoice so cashier or customer has the actual PDF file
  try {
    const { pdf, filename } = await createReceiptPdf(sale);
    pdf.save(filename);
  } catch (err) {
    console.warn('Background PDF generation for WhatsApp failed:', err);
  }
}

/**
 * Shares the PDF file directly via Web Share API (WhatsApp / AirDrop / Files on mobile),
 * or directly opens WhatsApp with the customer if native file sharing is not supported.
 */
export async function shareOrSendPdfReceipt(
  sale: SaleTransaction, 
  customerPhone?: string
): Promise<{ shared: boolean; mode: 'web_share' | 'whatsapp_direct' }> {
  // Check if Web Share API with files is supported (iOS Safari, Android Chrome)
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const { file } = await createReceiptPdf(sale);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `فاتورة ${sale.serialNumber} - RM STAR CAR WASH`,
          text: `إيصال فاتورة مغسلة RM STAR CAR WASH (${sale.serialNumber}) بمبلغ ${sale.totalAmount.toFixed(2)} ر.س`,
          files: [file],
        });
        return { shared: true, mode: 'web_share' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { shared: false, mode: 'web_share' };
      }
      console.warn('Native file share failed, falling back to direct WhatsApp:', err);
    }
  }

  // Direct Fallback: Open WhatsApp with the customer chat directly AND download the PDF file
  await directWhatsAppWithPdf(sale, customerPhone);
  return { shared: true, mode: 'whatsapp_direct' };
}
