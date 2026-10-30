export type ShiftType = 'morning' | 'evening' | 'bandar' | 'hakim';

export type SystemRoleId = 'super_admin' | 'manager' | 'cashier' | 'accountant' | 'viewer';
export type UserRole = 'manager' | 'cashier' | SystemRoleId | string;

export type DataScope = 'own' | 'shift' | 'all';

export type PermissionKey =
  // المبيعات والكاشير
  | 'sales.view'
  | 'sales.create'
  | 'sales.pay'
  | 'sales.free_wash'
  | 'sales.history'
  | 'sales.edit'
  | 'sales.cancel'
  | 'sales.export'
  // الخدمات والأسعار
  | 'services.view'
  | 'services.create'
  | 'services.edit_price'
  | 'services.toggle'
  | 'services.history'
  // الشفتات
  | 'shifts.view'
  | 'shifts.view_report'
  | 'shifts.start'
  | 'shifts.close'
  | 'shifts.audit_drawer'
  | 'shifts.edit'
  | 'shifts.reopen'
  // الصندوق والمصروفات
  | 'drawer.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.cancel'
  | 'drawer.deposit_withdraw'
  | 'drawer.count_cash'
  | 'drawer.discrepancy'
  | 'drawer.approve'
  // الرواتب والخصومات
  | 'salaries.view'
  | 'salaries.create_employee'
  | 'salaries.employees_manage'
  | 'salaries.edit'
  | 'salaries.pay'
  | 'salaries.view_due'
  | 'salaries.export'
  | 'salaries.deductions_view'
  | 'salaries.deductions_manage'
  | 'salaries.deductions_cancel'
  // التقارير
  | 'reports.daily'
  | 'reports.monthly_yearly'
  | 'reports.pnl'
  | 'reports.shifts'
  | 'reports.expenses'
  | 'reports.export'
  // إدارة النظام
  | 'system.users_view'
  | 'system.users_create'
  | 'system.users_edit'
  | 'system.users_toggle'
  | 'system.roles_manage'
  | 'system.audit_view'
  | 'system.settings_edit';

export interface CustomRoleDefinition {
  id: string; // 'super_admin', 'manager', 'cashier', 'accountant', 'viewer', or custom
  name: string; // Arabic name
  description: string;
  isSystemRole: boolean;
  permissions: PermissionKey[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AppUser {
  id: string;
  name: string;
  username: string; // Username or email for login
  email?: string;
  roleId: string; // Links to CustomRoleDefinition.id
  roleName?: string;
  role: 'manager' | 'cashier'; // Backward compatibility
  dataScope: DataScope; // 'own' | 'shift' | 'all'
  assignedShift?: ShiftType | 'any';
  phone?: string;
  pinCode?: string;
  passwordHash?: string; // Salted SHA-256 hash (never plain text)
  passwordSalt?: string;
  mustChangePassword?: boolean;
  customPermissions?: {
    granted: PermissionKey[];
    denied: PermissionKey[];
  };
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface WashService {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExtraServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type PaymentMethod = 'cash' | 'network' | 'free';

export interface SaleTransaction {
  id: string;
  serialNumber: string; // e.g., RM-2026-0001
  timestamp: string; // ISO
  saudiFormattedDate: string;
  saudiFormattedTime: string;
  shift: ShiftType;
  originalShift: ShiftType;
  shiftReassignedReason?: string;
  cashierName: string;
  cashierId?: string;
  washServiceId: string;
  washServiceName: string;
  originalWashPrice: number; // Snapshot of the price at transaction time
  isFreeWash: boolean;
  extraServices: ExtraServiceItem[];
  extraServicesTotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  extrasPaymentMethod?: 'cash' | 'network'; // For extra services if wash is free
  cashAmount: number; // Actual cash received
  networkAmount: number; // Actual network received
  status: 'completed' | 'cancelled';
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledById?: string;
  idempotencyKey: string;
  customerPhone?: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'rent'
  | 'electricity'
  | 'water'
  | 'cleaning_materials'
  | 'maintenance'
  | 'salaries'
  | 'other';

export interface Expense {
  id: string;
  serialNumber: string;
  title: string;
  category: ExpenseCategory;
  categoryLabel: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'network' | 'bank_transfer';
  status: 'paid' | 'accrued'; // مدفوع أو مستحق غير مدفوع
  loggedBy: string;
  loggedById?: string;
  notes?: string;
  attachmentName?: string;
  attachmentData?: string; // Data URL for receipt image
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer';
  notes?: string;
  loggedBy: string;
  loggedById?: string;
}

export interface PayrollEmployee {
  id: string;
  fullName: string;
  jobTitle: string;
  basicSalary: number; // الراتب الشهري الأساسي
  isActive: boolean; // نشط أو غير نشط
  createdAt: string;
  notes?: string;
}

export interface EmployeeDeduction {
  id: string;
  employeeId: string; // Links to PayrollEmployee.id or EmployeeSalary.id
  employeeName: string;
  amount: number; // مبلغ الخصم بالريال السعودي (> 0)
  reason: string; // سبب الخصم
  date: string; // YYYY-MM-DD تاريخ الخصم
  month: string; // YYYY-MM شهر الاستحقاق
  notes?: string; // ملاحظات إضافية اختيارية
  loggedBy: string; // اسم المستخدم الذي سجّل الخصم
  loggedById?: string;
  createdAt: string; // تاريخ ووقت تسجيل العملية تلقائياً
  status: 'approved' | 'cancelled';
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledById?: string;
}

export interface EmployeeSalary {
  id: string;
  employeeId?: string;
  employeeName: string;
  jobTitle: string;
  monthlySalary: number; // الراتب الشهري الثابت
  month: string; // YYYY-MM
  payments: SalaryPayment[];
  totalPaid: number;
  deductionsTotal: number; // إجمالي الخصومات المعتمدة لهذا الشهر
  remainingAmount: number; // صافي الراتب المستحق = الراتب الأساسي - الخصومات المعتمدة - المدفوع
  status: 'fully_paid' | 'partially_paid' | 'unpaid';
  notes?: string;
}

export type DrawerMovementType = 
  | 'opening_balance'
  | 'cash_sale'
  | 'cash_expense'
  | 'deposit'
  | 'withdrawal'
  | 'shift_adjustment';

export interface CashDrawerMovement {
  id: string;
  timestamp: string;
  saudiTime: string;
  type: DrawerMovementType;
  typeLabel: string;
  amount: number;
  direction: 'in' | 'out'; // in increases cash, out decreases cash
  runningBalance: number;
  shift: ShiftType;
  referenceId?: string; // Sale or Expense ID
  notes: string;
  performedBy: string;
  performedById?: string;
}

export interface ShiftCloseRecord {
  id: string;
  shift: ShiftType;
  shiftName: string; // "شفت الصباح" أو "شفت المساء"
  shiftDate: string; // YYYY-MM-DD
  closedAt: string;
  closedBy: string;
  closedById?: string;
  openingBalance: number;
  cashReceipts: number;
  cashExpenses: number;
  cashWithdrawals: number;
  cashDeposits: number;
  expectedCash: number; // افتتاح + مقبوضات - مصروفات - سحوبات + إيداعات
  actualCash: number;
  difference: number; // actual - expected
  networkSales: number; // Not added to drawer
  paidWashesCount: number;
  freeWashesCount: number;
  totalWashesCount: number;
  extraServicesRevenue: number;
  totalSalesRevenue: number;
  notes?: string;
  isClosed: boolean;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  saudiTime: string;
  action: string;
  details: string;
  performedBy: string;
  performedById?: string;
  category: 'sale' | 'shift' | 'expense' | 'salary' | 'drawer' | 'price' | 'system' | 'user_role';
  previousValue?: any;
  newValue?: any;
  reason?: string;
}

export interface ShiftInfo {
  type: ShiftType;
  name: string;
  manager: string;
  startTime: string; // "12:00 PM"
  endTime: string;   // "12:00 AM"
  hoursRange: string;
}
