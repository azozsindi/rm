import { AppUser, CustomRoleDefinition, PermissionKey, DataScope, ShiftType } from '../types';

/**
 * Pure TypeScript SHA-256 implementation for synchronous and consistent
 * password hashing across browser, Node.js, and offline environments.
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) !== 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII only
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Generates a random salt string
 */
export function generateSalt(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Hashes a plain-text password using SHA-256 with salt.
 * Stored passwords are NEVER plain text.
 */
export function hashPassword(plainText: string, salt: string): string {
  return sha256(`${salt}:${plainText}:${salt}`);
}

/**
 * Validates a plain text password against stored hash and salt
 */
export function verifyPassword(plainText: string, salt: string, hash: string): boolean {
  return hashPassword(plainText, salt) === hash;
}

/**
 * Generates a human-friendly secure temporary password (e.g. RmStar#8392)
 */
export function generateTemporaryPassword(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `RmStar#${randomNum}`;
}

/**
 * All Granular Permissions Metadata with Arabic labels, modules, and matrix action categories
 */
export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  module: 'sales' | 'services' | 'shifts' | 'drawer' | 'salaries' | 'reports' | 'system';
  moduleLabel: string;
  actionType: 'view' | 'create' | 'edit' | 'cancel' | 'approve' | 'export';
  actionLabel: string;
  isSensitive?: boolean;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // 1. المبيعات والكاشير
  {
    key: 'sales.view',
    label: 'عرض المبيعات',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'عرض شاشة الكاشير وقائمة العمليات السابقة',
  },
  {
    key: 'sales.create',
    label: 'إنشاء عملية بيع',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'create',
    actionLabel: 'إضافة',
    description: 'تسجيل عملية غسيل جديدة وإضافة خدمات إضافية',
  },
  {
    key: 'sales.pay',
    label: 'تسجيل الدفع',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    description: 'تحصيل الفاتورة نقدًا أو عبر الشبكة',
  },
  {
    key: 'sales.free_wash',
    label: 'تسجيل غسلة مجانية',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'create',
    actionLabel: 'إضافة',
    isSensitive: true,
    description: 'تطبيق الغسلة المجانية الخامسة وفق برنامج الولاء',
  },
  {
    key: 'sales.history',
    label: 'عرض سجل العمليات',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على سجل الفواتير والمقبوضات',
  },
  {
    key: 'sales.edit',
    label: 'تعديل عملية بيع',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تعديل بيانات عملية أو نقلها لشفت آخر مع تبرير',
  },
  {
    key: 'sales.cancel',
    label: 'إلغاء عملية مع تسجيل السبب',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    isSensitive: true,
    description: 'إلغاء فاتورة مسجلة مع تسجيل السبب المالي في التدقيق',
  },
  {
    key: 'sales.export',
    label: 'تصدير سجل المبيعات',
    module: 'sales',
    moduleLabel: 'المبيعات والكاشير',
    actionType: 'export',
    actionLabel: 'تصدير',
    description: 'تصدير عمليات المبيعات كملف أو طباعتها',
  },

  // 2. الخدمات والأسعار
  {
    key: 'services.view',
    label: 'عرض الخدمات والأسعار',
    module: 'services',
    moduleLabel: 'الخدمات والأسعار',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على قائمة خدمات الغسيل وأسعارها',
  },
  {
    key: 'services.create',
    label: 'إضافة خدمة غسيل جديدة',
    module: 'services',
    moduleLabel: 'الخدمات والأسعار',
    actionType: 'create',
    actionLabel: 'إضافة',
    description: 'إضافة باقة غسيل جديدة إلى قائمة الأسعار',
  },
  {
    key: 'services.edit_price',
    label: 'تعديل سعر خدمة',
    module: 'services',
    moduleLabel: 'الخدمات والأسعار',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تعديل سعر أي خدمة غسيل مع حفظ تاريخ التغيير',
  },
  {
    key: 'services.toggle',
    label: 'إيقاف / تفعيل خدمة',
    module: 'services',
    moduleLabel: 'الخدمات والأسعار',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    description: 'تعطيل ظهور خدمة من شاشة الكاشير مؤقتًا',
  },
  {
    key: 'services.history',
    label: 'عرض سجل تغييرات الأسعار',
    module: 'services',
    moduleLabel: 'الخدمات والأسعار',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'متابعة سجل تعديلات الأسعار في التدقيق',
  },

  // 3. الشفتات
  {
    key: 'shifts.view',
    label: 'عرض الشفتات',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على الشفت الحالي والورديات (صباح / مساء)',
  },
  {
    key: 'shifts.view_report',
    label: 'عرض تقرير الشفت',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'عرض إحصائيات المبيعات والصندوق للشفت',
  },
  {
    key: 'shifts.start',
    label: 'بدء الشفت وتسليم العهدة',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'create',
    actionLabel: 'إضافة',
    description: 'استلام الشفت واعتماد الرصيد الافتتاحي',
  },
  {
    key: 'shifts.close',
    label: 'إغلاق الشفت وإدخال النقد',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    description: 'إغلاق وردية الكاشير وتثبيت النقد الفعلي',
  },
  {
    key: 'shifts.audit_drawer',
    label: 'مراجعة فروقات الصندوق',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'مقارنة النقد المتوقع بالفعلي وكشف العجز والزيادة',
  },
  {
    key: 'shifts.edit',
    label: 'تعديل الشفت وتصحيح المبيعات',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تصحيح شفت عملية مسجلة بالخطأ مع توثيق السبب',
  },
  {
    key: 'shifts.reopen',
    label: 'إعادة فتح شفت مغلق',
    module: 'shifts',
    moduleLabel: 'إدارة الشفتات',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    isSensitive: true,
    description: 'إلغاء إغلاق شفت سابق لإعادة مراجعته (صلاحية خاصة جداً)',
  },

  // 4. الصندوق والمصروفات
  {
    key: 'drawer.view',
    label: 'عرض حركة الصندوق',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'متابعة الرصيد اللحظي وحركات الإيداع والصرف',
  },
  {
    key: 'expenses.create',
    label: 'تسجيل مصروف تشغيلي',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'create',
    actionLabel: 'إضافة',
    description: 'تسجيل فواتير ماء، كهرباء، صيانة، ومواد تنظيف',
  },
  {
    key: 'expenses.edit',
    label: 'تعديل مصروف أو سداد مستحق',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'edit',
    actionLabel: 'تعديل',
    description: 'تعديل المصروف وسداد الفواتير الآجلة',
  },
  {
    key: 'expenses.cancel',
    label: 'إلغاء مصروف مع توثيق السبب',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    isSensitive: true,
    description: 'حذف أو إلغاء مصروف مسجل بالخطأ مع توثيق السبب',
  },
  {
    key: 'drawer.deposit_withdraw',
    label: 'تسجيل سحب أو إيداع نقدي',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'create',
    actionLabel: 'إضافة',
    isSensitive: true,
    description: 'إيداع عهدة إضافية أو سحب نقدي للمدير العام',
  },
  {
    key: 'drawer.count_cash',
    label: 'جرد النقد الفعلي',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    description: 'عد وتثبيت الكاش الفعلي الموجود في الدرج',
  },
  {
    key: 'drawer.discrepancy',
    label: 'عرض الفروقات المالية التاريخية',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على عجز أو زيادة الكاشيين السابقة',
  },
  {
    key: 'drawer.approve',
    label: 'اعتماد إغلاق الصندوق نهائياً',
    module: 'drawer',
    moduleLabel: 'الصندوق والمصروفات',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    isSensitive: true,
    description: 'الموافقة الإدارية النهائية على ترحيل مبالغ الصندوق',
  },

  // 5. الرواتب
  {
    key: 'salaries.view',
    label: 'عرض الرواتب ومسير الموظفين',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'view',
    actionLabel: 'عرض',
    isSensitive: true,
    description: 'الاطلاع على الرواتب الشهرية الثابتة والمتبقي',
  },
  {
    key: 'salaries.create_employee',
    label: 'إضافة موظف لسجل الرواتب',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'create',
    actionLabel: 'إضافة',
    isSensitive: true,
    description: 'إدراج موظف أو فني وتحديد راتبه الشهري الثابت',
  },
  {
    key: 'salaries.edit',
    label: 'تعديل بيانات راتب موظف',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تعديل الراتب الأساسي أو بيانات الموظف',
  },
  {
    key: 'salaries.employees_manage',
    label: 'إدارة سجل موظفي المغسلة',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'إضافة وتعديل بيانات الموظفين وتفعيلهم أو تعطيلهم بدون إنشاء حسابات دخول',
  },
  {
    key: 'salaries.pay',
    label: 'تسجيل دفعة راتب',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    isSensitive: true,
    description: 'صرف دفعة نقدية أو تحويل بنكي للموظف',
  },
  {
    key: 'salaries.view_due',
    label: 'عرض المبالغ المستحقة للعمال',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'متابعة الرواتب المعلقة وغير المسددة',
  },
  {
    key: 'salaries.deductions_view',
    label: 'عرض خصومات الموظفين',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على كشف الخصومات والاستقطاعات المسجلة على الموظفين',
  },
  {
    key: 'salaries.deductions_manage',
    label: 'تسجيل وتعديل خصومات الموظفين',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'create',
    actionLabel: 'إضافة',
    isSensitive: true,
    description: 'تسجيل خصم مالي على موظف مع التحقق من الراتب وتوثيق السبب',
  },
  {
    key: 'salaries.deductions_cancel',
    label: 'إلغاء خصم مع توثيق السبب',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    isSensitive: true,
    description: 'إلغاء خصم سابق مع توثيق السبب الإلزامي دون حذفه نهائياً',
  },
  {
    key: 'salaries.export',
    label: 'تصدير كشف الرواتب والخصومات',
    module: 'salaries',
    moduleLabel: 'الرواتب والمستحقات',
    actionType: 'export',
    actionLabel: 'تصدير',
    description: 'تصدير مسير الرواتب الشهري والخصومات وطباعته',
  },

  // 6. التقارير
  {
    key: 'reports.daily',
    label: 'عرض التقرير اليومي',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على مبيعات اليوم وتفصيل الكاش والشبكة',
  },
  {
    key: 'reports.monthly_yearly',
    label: 'عرض التقارير الشهرية والسنوية',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'تحليل الإيرادات التراكمية للمغسلة عبر الأشهر',
  },
  {
    key: 'reports.pnl',
    label: 'عرض الأرباح والخسائر الصافية',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'view',
    actionLabel: 'عرض',
    isSensitive: true,
    description: 'الاطلاع على صافي الربح بعد خصم المصروفات والرواتب',
  },
  {
    key: 'reports.shifts',
    label: 'عرض تقارير مقارنة الشفتات',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'مقارنة أداء شفت الصباح وشفت المساء',
  },
  {
    key: 'reports.expenses',
    label: 'عرض تفاصيل المصروفات التراكمية',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'تفصيل المصروفات حسب فئاتها التشغيلية',
  },
  {
    key: 'reports.export',
    label: 'تصدير وطباعة التقارير المالية',
    module: 'reports',
    moduleLabel: 'التقارير المالية',
    actionType: 'export',
    actionLabel: 'تصدير',
    description: 'طباعة التقارير بصيغة رسمية واضحة وموثقة',
  },

  // 7. إدارة النظام
  {
    key: 'system.users_view',
    label: 'عرض المستخدمين',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'الاطلاع على قائمة موظفي النظام وحالاتهم',
  },
  {
    key: 'system.users_create',
    label: 'إنشاء مستخدم جديد',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'create',
    actionLabel: 'إضافة',
    isSensitive: true,
    description: 'إضافة حساب جديد وتعيين كلمة مرور مؤقتة وتحديد الشفت',
  },
  {
    key: 'system.users_edit',
    label: 'تعديل بيانات المستخدمين',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تعديل الصلاحيات الفردية وإعادة تعيين كلمات المرور',
  },
  {
    key: 'system.users_toggle',
    label: 'تعطيل / تفعيل المستخدمين',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'cancel',
    actionLabel: 'إلغاء/حذف',
    isSensitive: true,
    description: 'إيقاف حساب موظف ومنعه من تسجيل الدخول',
  },
  {
    key: 'system.roles_manage',
    label: 'إدارة الأدوار ومصفوفة الصلاحيات',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'approve',
    actionLabel: 'اعتماد',
    isSensitive: true,
    description: 'إنشاء وتعديل الأدوار المخصصة وقوالب الصلاحيات',
  },
  {
    key: 'system.audit_view',
    label: 'الاطلاع على سجل التدقيق والرقابة',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'view',
    actionLabel: 'عرض',
    description: 'مراجعة كل إجراء مالي أو أمني تم تنفيذه في النظام',
  },
  {
    key: 'system.settings_edit',
    label: 'تعديل الإعدادات العامة والنسخ الاحتياطي',
    module: 'system',
    moduleLabel: 'إدارة النظام والأمان',
    actionType: 'edit',
    actionLabel: 'تعديل',
    isSensitive: true,
    description: 'تصدير قاعدة البيانات وتهيئتها وإدارة إعدادات المغسلة',
  },
];

/**
 * Default System Role Definitions
 */
export const DEFAULT_ROLES: CustomRoleDefinition[] = [
  // 1. المدير العام (Super Admin) - All permissions
  {
    id: 'super_admin',
    name: 'المدير العام (Super Admin)',
    description: 'يمتلك كامل الصلاحيات لإدارة النظام، التقارير المالية، الأسعار، الصلاحيات، وسجل التدقيق.',
    isSystemRole: true,
    permissions: ALL_PERMISSIONS.map(p => p.key),
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 2. المدير (Manager)
  {
    id: 'manager',
    name: 'المدير التشغيلي (Manager)',
    description: 'صلاحيات تشغيلية ومالية لإدارة المبيعات، الشفتات، المصروفات، وتصحيح العمليات دون إدارة المدراء.',
    isSystemRole: true,
    permissions: [
      'sales.view', 'sales.create', 'sales.pay', 'sales.free_wash', 'sales.history', 'sales.edit', 'sales.cancel', 'sales.export',
      'services.view', 'services.create', 'services.edit_price', 'services.toggle', 'services.history',
      'shifts.view', 'shifts.view_report', 'shifts.start', 'shifts.close', 'shifts.audit_drawer', 'shifts.edit',
      'drawer.view', 'expenses.create', 'expenses.edit', 'expenses.cancel', 'drawer.deposit_withdraw', 'drawer.count_cash', 'drawer.discrepancy', 'drawer.approve',
      'salaries.view', 'salaries.create_employee', 'salaries.employees_manage', 'salaries.edit', 'salaries.pay', 'salaries.view_due', 'salaries.deductions_view', 'salaries.export',
      'reports.daily', 'reports.monthly_yearly', 'reports.pnl', 'reports.shifts', 'reports.expenses', 'reports.export',
      'system.users_view', 'system.audit_view'
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 3. الكاشير (Cashier)
  {
    id: 'cashier',
    name: 'الكاشير (Cashier)',
    description: 'تسجيل عمليات الغسيل، الخدمات الإضافية، تحصيل المبالغ كاش/شبكة، الغسلات المجانية، وجرد شفته فقط.',
    isSystemRole: true,
    permissions: [
      'sales.view',
      'sales.create',
      'sales.pay',
      'sales.free_wash',
      'sales.history',
      'shifts.view',
      'shifts.view_report',
      'shifts.start',
      'shifts.close',
      'drawer.view',
      'drawer.count_cash',
      'drawer.deposit_withdraw',
      'expenses.create'
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 4. المحاسب (Accountant)
  {
    id: 'accountant',
    name: 'المحاسب المالي (Accountant)',
    description: 'متابعة المبيعات، الصندوق، تسجيل ومراجعة المصروفات والرواتب، والأرباح والخسائر وتصدير التقارير.',
    isSystemRole: true,
    permissions: [
      'sales.view', 'sales.history', 'sales.export',
      'services.view', 'services.history',
      'shifts.view', 'shifts.view_report', 'shifts.audit_drawer',
      'drawer.view', 'drawer.discrepancy', 'drawer.count_cash',
      'expenses.create', 'expenses.edit',
      'salaries.view', 'salaries.pay', 'salaries.view_due', 'salaries.deductions_view', 'salaries.export',
      'reports.daily', 'reports.monthly_yearly', 'reports.pnl', 'reports.shifts', 'reports.expenses', 'reports.export',
      'system.audit_view'
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },
  // 5. موظف الاطلاع فقط (Viewer)
  {
    id: 'viewer',
    name: 'موظف اطلاع فقط (Viewer)',
    description: 'الاطلاع على لوحات التحكم والتقارير المسموحة دون أي صلاحية لإضافة أو تعديل أو حذف البيانات.',
    isSystemRole: true,
    permissions: [
      'sales.view',
      'sales.history',
      'services.view',
      'shifts.view',
      'shifts.view_report',
      'reports.daily',
      'reports.monthly_yearly',
      'reports.shifts'
    ],
    createdAt: '2026-01-01T00:00:00Z',
  },
];

/**
 * Calculates effective permissions for a user:
 * Role Permissions + User Granted Custom Permissions - User Denied Custom Permissions
 */
export function getEffectivePermissions(
  user: AppUser, 
  roles: CustomRoleDefinition[] = DEFAULT_ROLES
): Set<PermissionKey> {
  const role = roles.find(r => r.id === user.roleId) || roles.find(r => r.id === 'cashier');
  const basePermissions = new Set<PermissionKey>(role ? role.permissions : []);

  // Super admin always retains full access
  if (user.roleId === 'super_admin' || user.id === 'manager-1') {
    return new Set(ALL_PERMISSIONS.map(p => p.key));
  }

  // Apply custom granted overrides
  if (user.customPermissions?.granted) {
    for (const p of user.customPermissions.granted) {
      basePermissions.add(p);
    }
  }

  // Apply custom denied overrides
  if (user.customPermissions?.denied) {
    for (const p of user.customPermissions.denied) {
      basePermissions.delete(p);
    }
  }

  return basePermissions;
}

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(
  user: AppUser | null | undefined, 
  permission: PermissionKey, 
  roles: CustomRoleDefinition[] = DEFAULT_ROLES
): boolean {
  if (!user || !user.isActive) return false;
  if (user.roleId === 'super_admin' || user.id === 'manager-1') return true;
  const effective = getEffectivePermissions(user, roles);
  return effective.has(permission);
}

/**
 * Enforces data-level access control based on user's dataScope:
 * - 'own': Only records performed by this user (by ID or exact cashier name)
 * - 'shift': Only records in the user's assigned shift (or 'any')
 * - 'all': All records in the car wash
 */
export function canAccessDataRecord(
  user: AppUser,
  record: {
    cashierName?: string;
    cashierId?: string;
    performedBy?: string;
    performedById?: string;
    loggedBy?: string;
    loggedById?: string;
    shift?: ShiftType;
  }
): boolean {
  if (user.roleId === 'super_admin' || user.id === 'manager-1') return true;
  if (user.dataScope === 'all') return true;

  if (user.dataScope === 'shift') {
    if (!user.assignedShift || user.assignedShift === 'any') return true;
    return record.shift === user.assignedShift;
  }

  if (user.dataScope === 'own') {
    const matchesId = 
      (record.cashierId && record.cashierId === user.id) ||
      (record.performedById && record.performedById === user.id) ||
      (record.loggedById && record.loggedById === user.id);

    const matchesName = 
      (record.cashierName && record.cashierName === user.name) ||
      (record.performedBy && record.performedBy === user.name) ||
      (record.loggedBy && record.loggedBy === user.name);

    return Boolean(matchesId || matchesName);
  }

  return true;
}

/**
 * Protection rule: Ensures the last active Super Admin cannot be deleted,
 * disabled, or demoted to prevent locking down the system.
 */
export function isLastSuperAdmin(userId: string, allUsers: AppUser[]): boolean {
  const target = allUsers.find(u => u.id === userId);
  if (!target || (target.roleId !== 'super_admin' && target.id !== 'manager-1')) {
    return false;
  }
  const activeSuperAdmins = allUsers.filter(
    u => (u.roleId === 'super_admin' || u.id === 'manager-1') && u.isActive && u.id !== userId
  );
  return activeSuperAdmins.length === 0;
}
