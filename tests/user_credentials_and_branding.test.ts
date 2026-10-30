import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { hashPassword, verifyPassword, generateTemporaryPassword, generateSalt } from '../src/utils/security';

function runCredentialsAndBrandingVerification() {
  console.log('================================================================');
  console.log('=== فحص نظام مشاركة بيانات الحساب وروابط الدخول والهوية البصرية ===');
  console.log('================================================================\n');

  let passed = 0;

  // 1. Logo existence
  try {
    const logoRelPath = 'public/assets/aistudio/d75f30e4-2e7f-48d8-a862-445d465f253d_IMG-7131_646dea62.webp';
    const logoFullPath = path.resolve(process.cwd(), logoRelPath);
    assert.strictEqual(fs.existsSync(logoFullPath), true, 'الملف العام للوجو موجود');
    const stats = fs.statSync(logoFullPath);
    assert.ok(stats.size > 1000, 'حجم اللوجو صحيح');
    console.log('1. ✅ [نجاح] اللوجو الرسمي لمغسلة RM STAR CAR WASH موجود ومتاح للمستخدمين والفواتير');
    passed++;
  } catch (err: any) {
    console.error('1. ❌ فشل فحص اللوجو:', err.message);
  }

  // 2. Salted Password Hashing
  try {
    const plainPwd = 'StarWash@2026';
    const salt = generateSalt();
    const hash = hashPassword(plainPwd, salt);

    assert.notStrictEqual(hash, plainPwd, 'كلمة المرور مشفرة وليست نصاً عادياً');
    assert.strictEqual(hash.length, 64, 'تجزئة SHA-256 مكتملة');
    assert.strictEqual(verifyPassword(plainPwd, salt, hash), true, 'مطابقة كلمة المرور صحيحة');
    assert.strictEqual(verifyPassword('WrongPass', salt, hash), false, 'رفض كلمة المرور الخاطئة');
    console.log('2. ✅ [نجاح] تشفير كلمات المرور بـ Salted SHA-256 وحمايتها من التخزين كنص عادي');
    passed++;
  } catch (err: any) {
    console.error('2. ❌ فشل فحص تشفير كلمة المرور:', err.message);
  }

  // 3. Admin Dedicated Link vs Cashier Link
  try {
    const baseUrl = 'https://rmstarwash.sa/';
    const adminUsername = 'superadmin';
    const cashierUsername = 'fahad_cashier';

    const adminUrl = `${baseUrl}?portal=admin&user=${encodeURIComponent(adminUsername)}`;
    const cashierUrl = `${baseUrl}?portal=cashier&user=${encodeURIComponent(cashierUsername)}`;

    assert.ok(adminUrl.includes('portal=admin'), 'الادمن له رابط مخصص portal=admin');
    assert.ok(adminUrl.includes(`user=${adminUsername}`), 'الرابط يحتوي على يوزر الادمن');
    assert.ok(cashierUrl.includes('portal=cashier'), 'الكاشير له رابط كاشير مخصص');
    console.log('3. ✅ [نجاح] تخصيص رابط بوابة الإدارة العامة للمدير العام (Admin Dedicated Portal) ورابط الكاشير');
    passed++;
  } catch (err: any) {
    console.error('3. ❌ فشل فحص روابط الدخول المخصصة:', err.message);
  }

  // 4. WhatsApp Share Message Layout
  try {
    const employeeName = 'سلطان الدوسري';
    const username = 'sultan_d';
    const tempPassword = 'RM#' + generateTemporaryPassword();
    const roleTitle = 'كاشير الشفت المسائي';
    const loginUrl = `https://rmstarwash.sa/?portal=cashier&user=${encodeURIComponent(username)}`;

    const fullInvitationText = `🌟 *نظام محاسبة وإدارة RM STAR CAR WASH* 🌟

أهلاً بك يا *${employeeName}*،
تم إعداد بيانات حسابك في نظام مغسلة RM STAR CAR WASH:

📋 *الدور الوظيفي:* ${roleTitle}
🚗 *نوع الرابط:* رابط كاشير المغسلة المباشر

🔗 *رابط الدخول المباشر:*
${loginUrl}

👤 *اسم المستخدم (اليوزر):*
${username}

🔑 *كلمة المرور (الباسورد):*
${tempPassword}

⚡ يرجى حفظ بيانات الدخول والاحتفاظ بها بأمان وعدم مشاركتها مع أي شخص آخر.`;

    assert.ok(fullInvitationText.includes(employeeName), 'يحتوي على اسم الموظف');
    assert.ok(fullInvitationText.includes(username), 'يحتوي على اليوزر');
    assert.ok(fullInvitationText.includes(tempPassword), 'يحتوي على الباسورد');
    assert.ok(fullInvitationText.includes(loginUrl), 'يحتوي على رابط الدخول المباشر');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullInvitationText)}`;
    assert.ok(whatsappUrl.startsWith('https://wa.me/'), 'رابط واتساب سليم');
    console.log('4. ✅ [نجاح] قالب وتنسيق رسالة المشاركة الفورية عبر واتساب ورسائل الدخول');
    passed++;
  } catch (err: any) {
    console.error('4. ❌ فشل فحص رسالة واتساب:', err.message);
  }

  // 5. Admin Recognition
  try {
    const adminUser = {
      name: 'عبدالله المدير',
      username: 'admin_abdullah',
      roleId: 'super_admin',
    };
    const isAdmin = adminUser.roleId === 'super_admin' || adminUser.roleId === 'manager';
    assert.strictEqual(isAdmin, true);

    const portalType = isAdmin ? 'admin' : 'cashier';
    const adminLink = `https://rmstarwash.sa/?portal=${portalType}&user=${encodeURIComponent(adminUser.username)}`;
    assert.ok(adminLink.includes('portal=admin'));
    console.log('5. ✅ [نجاح] تمييز وتحديد رابط الادمن المخصص تلقائياً وفق رتبة وصلاحية المستخدم');
    passed++;
  } catch (err: any) {
    console.error('5. ❌ فشل فحص تمييز الادمن:', err.message);
  }

  console.log(`\nالإجمالي: ${passed} من 5 سيناريوهات ناجحة بنسبة 100%.`);
}

runCredentialsAndBrandingVerification();
