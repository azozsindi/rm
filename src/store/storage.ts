import { 
  SaleTransaction, 
  Expense, 
  EmployeeSalary, 
  PayrollEmployee,
  EmployeeDeduction,
  CashDrawerMovement, 
  ShiftCloseRecord, 
  AuditLogEntry, 
  WashService, 
  ExtraServiceItem,
  AppUser, 
  CustomRoleDefinition,
  ShiftType 
} from '../types';
import { formatSaudiDate, formatSaudiTime, formatSaudiDateTime } from '../utils/time';
import { DEFAULT_ROLES, hashPassword } from '../utils/security';

const STORAGE_KEY = 'RM_STAR_CAR_WASH_SYSTEM_STATE_v3';

export interface AccountingState {
  services: WashService[];
  extraServices: ExtraServiceItem[];
  sales: SaleTransaction[];
  expenses: Expense[];
  salaries: EmployeeSalary[];
  payrollEmployees: PayrollEmployee[];
  deductions: EmployeeDeduction[];
  drawerMovements: CashDrawerMovement[];
  shiftClosures: ShiftCloseRecord[];
  auditLogs: AuditLogEntry[];
  openingBalance: number;
  currentUser: AppUser;
  // Loyalty counter helper for the current cashier session
  cashierLoyaltyCounter: number;
  users: AppUser[];
  roles: CustomRoleDefinition[];
}

export const INITIAL_USERS: AppUser[] = [
  { 
    id: 'manager-1', 
    name: 'المدير العام (أبو فهد)', 
    username: 'admin',
    email: 'admin@rmstar.sa',
    roleId: 'super_admin',
    roleName: 'المدير العام (Super Admin)',
    role: 'manager', 
    dataScope: 'all',
    assignedShift: 'any', 
    phone: '0500000001',
    pinCode: '9999',
    passwordSalt: 'salt_super_admin_2026',
    passwordHash: hashPassword('admin123', 'salt_super_admin_2026'),
    isActive: true, 
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-28T12:00:00Z'
  },
  { 
    id: 'cashier-bandar', 
    name: 'الكاشير بندر', 
    username: 'bandar',
    email: 'bandar@rmstar.sa',
    roleId: 'cashier',
    roleName: 'الكاشير (Cashier)',
    role: 'cashier', 
    dataScope: 'shift',
    assignedShift: 'bandar', 
    phone: '0555551122',
    pinCode: '1122',
    passwordSalt: 'salt_bandar_2026',
    passwordHash: hashPassword('bandar123', 'salt_bandar_2026'),
    isActive: true, 
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-28T14:30:00Z'
  },
  { 
    id: 'cashier-hakim', 
    name: 'الكاشير حكيم', 
    username: 'hakim',
    email: 'hakim@rmstar.sa',
    roleId: 'cashier',
    roleName: 'الكاشير (Cashier)',
    role: 'cashier', 
    dataScope: 'shift',
    assignedShift: 'hakim', 
    phone: '0555553344',
    pinCode: '3344',
    passwordSalt: 'salt_hakim_2026',
    passwordHash: hashPassword('hakim123', 'salt_hakim_2026'),
    isActive: true, 
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-28T02:15:00Z'
  },
];

/**
 * Initial wash services ready for the branch manager to enter / customize branch prices.
 * We do NOT claim arbitrary fake prices as official RM STAR rates.
 */
export const INITIAL_SERVICES: WashService[] = [
  {
    id: 'srv-1',
    name: 'غسيل خارجي سريع (آلي)',
    price: 25,
    description: 'غسيل بالماء العالي والفرش الآلية وتجفيف سريع',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-2',
    name: 'غسيل عادي (داخلي وخارجي)',
    price: 35,
    description: 'غسيل خارجي آلي وتنظيف وكنس المقصورة الداخلية',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-3',
    name: 'غسيل مميز مع صابون ملمع وتكييس',
    price: 50,
    description: 'غسيل شامل + تنظيف المقاعد وتلميع الطبلون والإطارات',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-4',
    name: 'غسيل ساطع VIP مع شمع واكس وحماية',
    price: 75,
    description: 'غسيل VIP متكامل + واكس حماية خارجي ومعطر فندقي',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'srv-5',
    name: 'غسيل بالبخار والمحرك',
    price: 100,
    description: 'تنظيف بالبخار الحار للمقصورة والمحرك',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_EXTRA_SERVICES: ExtraServiceItem[] = [
  {
    id: 'extra-1',
    name: 'تعطير فاخر',
    price: 10,
    description: 'معطر مركز فاخر للمقصورة والمفارش',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'extra-2',
    name: 'تلميع كفرات',
    price: 15,
    description: 'تلميع أسود فاحم عالي الجودة وحماية للإطارات',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'extra-3',
    name: 'تكييس مقاعد',
    price: 10,
    description: 'تكييس نايلون مقوى للمقاعد والدعاسات',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'extra-4',
    name: 'واكس سائل',
    price: 20,
    description: 'طبقة شمع نانو مائية لحماية اللمعة',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'extra-5',
    name: 'إزالة بقع',
    price: 25,
    description: 'تنظيف عميق وإزالة البقع المستعصية',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_PAYROLL_EMPLOYEES: PayrollEmployee[] = [
  {
    id: 'emp-1',
    fullName: 'بندر الشمري',
    jobTitle: 'كاشير ومسؤول شفت (الظهر)',
    basicSalary: 4500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    notes: 'دوام شفت الظهر 12 ظهراً إلى 12 منتصف الليل',
  },
  {
    id: 'emp-2',
    fullName: 'حكيم العتيبي',
    jobTitle: 'كاشير ومسؤول شفت (الليل)',
    basicSalary: 4500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    notes: 'دوام شفت الليل 12 منتصف الليل إلى 12 ظهراً',
  },
  {
    id: 'emp-3',
    fullName: 'محمد إسماعيل',
    jobTitle: 'فني تنظيف ومسؤول خط الغسيل',
    basicSalary: 2800,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    notes: 'عامل غسيل ثابت بدون حساب مستخدم نظام',
  },
  {
    id: 'emp-4',
    fullName: 'كومار راجو',
    jobTitle: 'عامل تجفيف وتلميع',
    basicSalary: 2500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    notes: 'عامل تلميع ثابت بدون حساب مستخدم نظام',
  },
  {
    id: 'emp-5',
    fullName: 'نور العالم',
    jobTitle: 'عامل تنظيف داخلي ومكنسة',
    basicSalary: 2500,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    notes: 'عامل تنظيف ثابت بدون حساب مستخدم نظام',
  },
];

export const INITIAL_EMPLOYEES: EmployeeSalary[] = [
  {
    id: 'sal-1',
    employeeId: 'emp-1',
    employeeName: 'بندر الشمري',
    jobTitle: 'كاشير ومسؤول شفت (الظهر)',
    monthlySalary: 4500,
    month: '2026-10',
    payments: [],
    totalPaid: 0,
    deductionsTotal: 0,
    remainingAmount: 4500,
    status: 'unpaid',
    notes: 'دوام شفت الظهر 12 ظهراً إلى 12 منتصف الليل',
  },
  {
    id: 'sal-2',
    employeeId: 'emp-2',
    employeeName: 'حكيم العتيبي',
    jobTitle: 'كاشير ومسؤول شفت (الليل)',
    monthlySalary: 4500,
    month: '2026-10',
    payments: [],
    totalPaid: 0,
    deductionsTotal: 0,
    remainingAmount: 4500,
    status: 'unpaid',
    notes: 'دوام شفت الليل 12 منتصف الليل إلى 12 ظهراً',
  },
  {
    id: 'sal-3',
    employeeId: 'emp-3',
    employeeName: 'محمد إسماعيل',
    jobTitle: 'فني تنظيف ومسؤول خط الغسيل',
    monthlySalary: 2800,
    month: '2026-10',
    payments: [],
    totalPaid: 0,
    deductionsTotal: 0,
    remainingAmount: 2800,
    status: 'unpaid',
    notes: 'راتب شهري ثابت دون عمولة',
  },
  {
    id: 'sal-4',
    employeeId: 'emp-4',
    employeeName: 'كومار راجو',
    jobTitle: 'عامل تجفيف وتلميع',
    monthlySalary: 2500,
    month: '2026-10',
    payments: [],
    totalPaid: 0,
    deductionsTotal: 0,
    remainingAmount: 2500,
    status: 'unpaid',
    notes: 'راتب شهري ثابت دون عمولة',
  },
  {
    id: 'sal-5',
    employeeId: 'emp-5',
    employeeName: 'نور العالم',
    jobTitle: 'عامل تنظيف داخلي ومكنسة',
    monthlySalary: 2500,
    month: '2026-10',
    payments: [],
    totalPaid: 0,
    deductionsTotal: 0,
    remainingAmount: 2500,
    status: 'unpaid',
    notes: 'راتب شهري ثابت دون عمولة',
  },
];

export function getInitialState(): AccountingState {
  const initialOpeningBalance = 500; // 500 SAR default opening cash in drawer
  const now = new Date();
  
  const initialMovement: CashDrawerMovement = {
    id: 'm-init-1',
    timestamp: now.toISOString(),
    saudiTime: formatSaudiDateTime(now),
    type: 'opening_balance',
    typeLabel: 'رصيد افتتاحي للصندوق',
    amount: initialOpeningBalance,
    direction: 'in',
    runningBalance: initialOpeningBalance,
    shift: 'bandar',
    notes: 'الرصيد الافتتاحي المعتمد لبداية الصندوق',
    performedBy: 'المدير العام',
  };

  const initialAudit: AuditLogEntry = {
    id: 'audit-init-1',
    timestamp: now.toISOString(),
    saudiTime: formatSaudiDateTime(now),
    action: 'تهيئة النظام',
    details: 'بدء تشغيل النظام المحاسبي لمغسلة RM STAR CAR WASH وتعيين الرصيد الافتتاحي للصندوق 500 ر.س',
    performedBy: 'النظام',
    category: 'system',
  };

  return {
    services: INITIAL_SERVICES,
    extraServices: INITIAL_EXTRA_SERVICES,
    sales: [],
    expenses: [],
    salaries: INITIAL_EMPLOYEES,
    payrollEmployees: INITIAL_PAYROLL_EMPLOYEES,
    deductions: [],
    drawerMovements: [initialMovement],
    shiftClosures: [],
    auditLogs: [initialAudit],
    openingBalance: initialOpeningBalance,
    currentUser: INITIAL_USERS[0], // Manager by default
    cashierLoyaltyCounter: 0,
    users: INITIAL_USERS,
    roles: DEFAULT_ROLES,
  };
}

export function loadSavedState(): AccountingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('RM_STAR_CAR_WASH_SYSTEM_STATE_v1');
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    const initial = getInitialState();

    // Ensure roles are available and include default system roles
    const existingRoles: CustomRoleDefinition[] = Array.isArray(parsed.roles) && parsed.roles.length > 0 
      ? parsed.roles 
      : DEFAULT_ROLES;

    // Merge any missing default system roles
    for (const defRole of DEFAULT_ROLES) {
      if (!existingRoles.some(r => r.id === defRole.id)) {
        existingRoles.push(defRole);
      }
    }

    // Sanitize users with new security attributes
    const rawUsers: any[] = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : initial.users;
    const sanitizedUsers: AppUser[] = rawUsers.map((u, idx) => {
      const isSuper = u.id === 'manager-1' || u.roleId === 'super_admin' || u.role === 'manager';
      const roleId = u.roleId || (isSuper ? 'super_admin' : (u.role === 'manager' ? 'manager' : 'cashier'));
      const matchingRole = existingRoles.find(r => r.id === roleId);

      return {
        id: u.id || `user-${idx}`,
        name: u.name || 'مستخدم',
        username: u.username || (u.id === 'manager-1' ? 'admin' : (u.assignedShift ? `cashier_${u.assignedShift}` : `user_${idx}`)),
        email: u.email || `${u.username || `user_${idx}`}@rmstar.sa`,
        roleId,
        roleName: matchingRole ? matchingRole.name : (isSuper ? 'المدير العام' : 'كاشير'),
        role: isSuper ? 'manager' : 'cashier',
        dataScope: u.dataScope || (isSuper ? 'all' : (u.assignedShift ? 'shift' : 'all')),
        assignedShift: u.assignedShift || 'any',
        phone: u.phone,
        pinCode: u.pinCode,
        passwordHash: u.passwordHash,
        passwordSalt: u.passwordSalt,
        mustChangePassword: Boolean(u.mustChangePassword),
        customPermissions: u.customPermissions,
        isActive: u.isActive !== false,
        createdAt: u.createdAt || new Date().toISOString(),
        lastLoginAt: u.lastLoginAt,
      };
    });

    // Make sure current user is one of the sanitized users
    const matchedCurrentUser = sanitizedUsers.find(u => u.id === parsed.currentUser?.id) || sanitizedUsers[0];

    // Ensure extraServices exists
    const extraServices: ExtraServiceItem[] = Array.isArray(parsed.extraServices) && parsed.extraServices.length > 0
      ? parsed.extraServices
      : INITIAL_EXTRA_SERVICES;

    // Ensure payrollEmployees exists
    const payrollEmployees: PayrollEmployee[] = Array.isArray(parsed.payrollEmployees) && parsed.payrollEmployees.length > 0
      ? parsed.payrollEmployees
      : INITIAL_PAYROLL_EMPLOYEES;

    // Ensure deductions exists
    const deductions: EmployeeDeduction[] = Array.isArray(parsed.deductions)
      ? parsed.deductions
      : [];

    // Ensure salaries have deductionsTotal and accurate remainingAmount
    const rawSalaries: any[] = Array.isArray(parsed.salaries) && parsed.salaries.length > 0 ? parsed.salaries : initial.salaries;
    const sanitizedSalaries: EmployeeSalary[] = rawSalaries.map(sal => {
      const payments = Array.isArray(sal.payments) ? sal.payments : [];
      const totalPaid = typeof sal.totalPaid === 'number' ? sal.totalPaid : payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
      const deductionsTotal = typeof sal.deductionsTotal === 'number' ? sal.deductionsTotal : 0;
      const monthlySalary = typeof sal.monthlySalary === 'number' ? sal.monthlySalary : 0;
      const remainingAmount = typeof sal.remainingAmount === 'number' 
        ? sal.remainingAmount 
        : Math.max(0, monthlySalary - totalPaid - deductionsTotal);

      return {
        ...sal,
        payments,
        totalPaid,
        deductionsTotal,
        remainingAmount,
        status: remainingAmount === 0 ? 'fully_paid' : totalPaid > 0 ? 'partially_paid' : 'unpaid'
      };
    });

    return {
      ...initial,
      ...parsed,
      users: sanitizedUsers,
      roles: existingRoles,
      extraServices,
      payrollEmployees,
      deductions,
      salaries: sanitizedSalaries,
      currentUser: matchedCurrentUser,
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getInitialState();
  }
}

export function saveStateToStorage(state: AccountingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Generates next unique sequential serial for sales: RM-2026-0001
 */
export function generateSaleSerialNumber(sales: SaleTransaction[]): string {
  const year = new Date().getFullYear();
  const nextNum = sales.length + 1;
  return `RM-${year}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generates next unique sequential serial for expenses: EXP-2026-0001
 */
export function generateExpenseSerialNumber(expenses: Expense[]): string {
  const year = new Date().getFullYear();
  const nextNum = expenses.length + 1;
  return `EXP-${year}-${String(nextNum).padStart(4, '0')}`;
}
