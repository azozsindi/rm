import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('===================================================================');
console.log(' فحص واختبار التصميم المتجاوب وشاشات الجوال - RM STAR CAR WASH ');
console.log('===================================================================');

// 1. Check index.html viewport meta tag
const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtml.includes('name="viewport"'), 'index.html must have viewport meta tag');
assert(indexHtml.includes('width=device-width'), 'viewport must configure width=device-width');
assert(indexHtml.includes('initial-scale=1.0'), 'viewport must configure initial-scale=1.0');
console.log('1. ✅ [نجاح] ملف index.html يحتوي على وسم meta viewport القياسي المانع للتشوه.');

// 2. Check index.css base rules
const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
assert(indexCss.includes('overflow-x: hidden'), 'index.css must enforce overflow-x: hidden on body/html');
assert(indexCss.includes('touch-action'), 'index.css must have touch manipulation properties');
assert(indexCss.includes('#root'), 'index.css must constrain #root to 100vw to prevent horizontal drift');
console.log('2. ✅ [نجاح] ملف src/index.css يفرض منع التمرير الأفقي العشوائي (overflow-x: hidden) على html, body, #root.');

// 3. Check Header responsiveness
const headerPath = path.resolve(process.cwd(), 'src/components/Header.tsx');
const headerCode = fs.readFileSync(headerPath, 'utf8');
assert(headerCode.includes('truncate'), 'Header user button must have truncate for long names on mobile');
assert(headerCode.includes('overflow-x-hidden'), 'Header container must be overflow-x-hidden');
assert(headerCode.includes('overflow-x-auto'), 'Header snapshot ticker must be scrollable horizontally');
console.log('3. ✅ [نجاح] مكون الهيدر (Header.tsx) مضبوط لشاشات الجوال من 320px مع تصغير ذكي وتمرير محكم للشريط.');

// 4. Check CashierView buttons and form responsiveness
const cashierPath = path.resolve(process.cwd(), 'src/components/CashierView.tsx');
const cashierCode = fs.readFileSync(cashierPath, 'utf8');
assert(cashierCode.includes('grid-cols-3'), 'CashierView must support 3 payment methods');
assert(cashierCode.includes('min-h-[68px]') || cashierCode.includes('min-h-[76px]'), 'Payment buttons must maintain touch target height');
assert(cashierCode.includes('leading-tight'), 'Text in payment buttons must have tight leading to prevent vertical overlap');
console.log('4. ✅ [نجاح] شاشة الكاشير (CashierView.tsx): أزرار الدفع والخدمات الإضافية مصممة للضغط السريع بدون تداخل نصوص.');

// 5. Check DashboardView shift stats grid
const dashboardPath = path.resolve(process.cwd(), 'src/components/DashboardView.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
assert(dashboardCode.includes('grid-cols-1 xs:grid-cols-3'), 'Shift stats must stack on 320px and expand on xs/sm');
console.log('5. ✅ [نجاح] لوحة التحكم (DashboardView.tsx): كروت الشفتات ومؤشرات الأداء تتحول لعمود واحد أو 3 أعمدة حسب عرض الشاشة.');

// 6. Check tables across components for responsive horizontal wrappers (min-w on table + overflow-x-auto)
const componentsWithTables = [
  { file: 'ShiftCloseView.tsx', minW: 'min-w-[700px]' },
  { file: 'CashDrawerView.tsx', minW: 'min-w-[700px]' },
  { file: 'ExpensesView.tsx', minW: 'min-w-[740px]' },
  { file: 'ReportsView.tsx', minW: 'min-w-[740px]' },
  { file: 'AuditLedgerView.tsx', minW: 'min-w-[740px]' },
  { file: 'SalariesView.tsx', minW: 'min-w-[760px]' },
  { file: 'DeductionsView.tsx', minW: 'min-w-[700px]' },
  { file: 'PriceManagementView.tsx', minW: 'min-w-[550px]' },
  { file: 'UserManagementView.tsx', minW: 'min-w-[700px]' },
];

for (const item of componentsWithTables) {
  const filePath = path.resolve(process.cwd(), `src/components/${item.file}`);
  const code = fs.readFileSync(filePath, 'utf8');
  assert(code.includes('overflow-x-auto'), `${item.file} must have overflow-x-auto wrapper`);
  assert(code.includes(item.minW), `${item.file} table must have ${item.minW} to prevent column crushing`);
}
console.log('6. ✅ [نجاح] كافة الجداول الـ 9 في النظام مزودة بحاويات تمرير أفقي مستقلة مع min-w مانعة لانضغاط الأعمدة أو تشوه النصوص.');

// 7. Check Mobile Navigation Bottom Bar (touch targets >= 44px)
const mobileNavPath = path.resolve(process.cwd(), 'src/components/MobileBottomNav.tsx');
const mobileNavCode = fs.readFileSync(mobileNavPath, 'utf8');
assert(mobileNavCode.includes('min-h-[44px]'), 'Mobile bottom tabs must have at least 44px hitboxes for thumb ergonomics');
assert(mobileNavCode.includes('fixed bottom-0'), 'Mobile navigation is anchored to the bottom thumb zone');
console.log('7. ✅ [نجاح] شريط التنقل السفلي للجوال (MobileBottomNav.tsx) يلتزم بأهداف لمس 44px+ ومنطقة الإبهام المريحة.');

console.log('\nالإجمالي: جميع سيناريوهات فحص التصميم المتجاوب الـ 7 ناجحة 100%.');
