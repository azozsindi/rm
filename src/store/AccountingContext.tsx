import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  AppUser, 
  CustomRoleDefinition,
  PermissionKey,
  DataScope,
  ShiftType, 
  PaymentMethod,
  ExtraServiceItem
} from '../types';
import { 
  AccountingState, 
  loadSavedState, 
  saveStateToStorage, 
  generateSaleSerialNumber, 
  generateExpenseSerialNumber,
  INITIAL_USERS
} from './storage';
import { 
  getSaudiNow, 
  formatSaudiDate, 
  formatSaudiTime, 
  formatSaudiDateTime, 
  getCurrentSaudiShift,
  getShiftShortName
} from '../utils/time';
import { 
  DEFAULT_ROLES, 
  hasPermission, 
  canAccessDataRecord, 
  hashPassword, 
  generateSalt, 
  generateTemporaryPassword, 
  verifyPassword,
  isLastSuperAdmin,
  getEffectivePermissions
} from '../utils/security';

interface RecordSaleParams {
  washServiceId: string;
  extraServices: { name: string; price: number }[];
  paymentMethod: PaymentMethod;
  extrasPaymentMethod?: 'cash' | 'network';
  notes?: string;
  customShift?: ShiftType;
}

interface CloseShiftParams {
  shift: ShiftType;
  shiftDate: string;
  actualCash: number;
  notes?: string;
}

interface AccountingContextType {
  state: AccountingState;
  currentUser: AppUser;
  users: AppUser[];
  roles: CustomRoleDefinition[];
  activeShift: ShiftType;
  saudiTimeNow: Date;
  setCurrentUser: (user: AppUser) => void;

  // Granular Security & Scoped Access
  can: (permission: PermissionKey) => boolean;
  getEffectiveUserPermissions: (user?: AppUser) => PermissionKey[];
  scopedSales: SaleTransaction[];
  scopedDrawerMovements: CashDrawerMovement[];
  scopedShiftClosures: ShiftCloseRecord[];
  scopedExpenses: Expense[];
  scopedSalaries: EmployeeSalary[];
  scopedDeductions: EmployeeDeduction[];
  payrollEmployees: PayrollEmployee[];
  deductions: EmployeeDeduction[];
  canAccessRecord: (record: any) => boolean;

  // Authentication & Users
  loginUser: (usernameOrEmail: string, passwordOrPin: string) => { success: boolean; user?: AppUser; error?: string };
  addUser: (userData: { 
    name: string; 
    username: string; 
    email?: string;
    roleId: string; 
    dataScope: DataScope;
    assignedShift?: ShiftType | 'any'; 
    phone?: string; 
    pinCode?: string;
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    customPermissions?: { granted: PermissionKey[]; denied: PermissionKey[] };
  }) => { success: boolean; user?: AppUser; tempPassword?: string; error?: string };
  updateUser: (id: string, updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>) => { success: boolean; error?: string };
  resetUserPassword: (userId: string, newPassword?: string) => { success: boolean; tempPassword?: string; error?: string };
  toggleUserActive: (id: string) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };

  // Custom Roles & Permissions Matrix
  addCustomRole: (role: Omit<CustomRoleDefinition, 'id' | 'createdAt' | 'isSystemRole'>) => { success: boolean; role?: CustomRoleDefinition; error?: string };
  updateCustomRole: (roleId: string, updates: Partial<Omit<CustomRoleDefinition, 'id' | 'isSystemRole'>>) => { success: boolean; error?: string };
  deleteCustomRole: (roleId: string) => { success: boolean; error?: string };

  // Cashier & Sales
  recordSale: (params: RecordSaleParams) => { success: boolean; sale?: SaleTransaction; error?: string };
  cancelSale: (saleId: string, reason: string) => { success: boolean; error?: string };
  reassignSaleShift: (saleId: string, newShift: ShiftType, reason: string) => { success: boolean; error?: string };

  // Services & Pricing
  addService: (name: string, price: number, description?: string) => { success: boolean; error?: string };
  updateService: (id: string, name: string, price: number, description?: string) => { success: boolean; error?: string };
  toggleServiceActive: (id: string) => { success: boolean; error?: string };
  deleteService: (id: string) => { success: boolean; error?: string };
  addExtraService: (name: string, price: number, description?: string) => { success: boolean; error?: string };
  updateExtraService: (id: string, name: string, price: number, description?: string) => { success: boolean; error?: string };
  toggleExtraServiceActive: (id: string) => { success: boolean; error?: string };
  deleteExtraService: (id: string) => { success: boolean; error?: string };

  // Expenses
  recordExpense: (expense: Omit<Expense, 'id' | 'serialNumber' | 'createdAt' | 'categoryLabel' | 'loggedBy'>) => { success: boolean; error?: string };
  payAccruedExpense: (expenseId: string, paymentMethod: 'cash' | 'network' | 'bank_transfer') => { success: boolean; error?: string };

  // Salaries & Staff Roster (Employees do NOT require system login accounts)
  recordSalaryPayment: (employeeId: string, amount: number, paymentMethod: 'cash' | 'bank_transfer', notes?: string) => { success: boolean; error?: string };
  addEmployee: (employeeName: string, jobTitle: string, monthlySalary: number, month?: string) => { success: boolean; error?: string };
  addPayrollEmployee: (fullName: string, jobTitle: string, basicSalary: number, notes?: string) => { success: boolean; employee?: PayrollEmployee; error?: string };
  updatePayrollEmployee: (id: string, updates: Partial<Omit<PayrollEmployee, 'id' | 'createdAt'>>) => { success: boolean; error?: string };
  togglePayrollEmployeeActive: (id: string) => { success: boolean; error?: string };

  // Deductions Management (خصومات الموظفين)
  recordDeduction: (params: { 
    employeeId: string; 
    amount: number; 
    reason: string; 
    date: string; 
    month?: string; 
    notes?: string;
    allowExceedNet?: boolean;
  }) => { success: boolean; deduction?: EmployeeDeduction; error?: string; warningExceeded?: boolean };
  cancelDeduction: (deductionId: string, cancelReason: string) => { success: boolean; error?: string };

  // Cash Drawer & Shifts
  recordDrawerDepositWithdrawal: (type: 'deposit' | 'withdrawal', amount: number, notes: string) => { success: boolean; error?: string };
  updateOpeningBalance: (newBalance: number, notes: string) => { success: boolean; error?: string };
  closeShift: (params: CloseShiftParams) => { success: boolean; record?: ShiftCloseRecord; error?: string };
  reopenShift: (closureId: string, reason: string) => { success: boolean; error?: string };

  // Loyalty Helper
  incrementLoyaltyCounter: () => void;
  resetLoyaltyCounter: () => void;
  setLoyaltyCounter: (val: number) => void;

  // Data Tools
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetToInitial: () => void;

  // Metrics calculation
  metrics: {
    todaySales: number;
    monthSales: number;
    totalCashSales: number;
    totalNetworkSales: number;
    paidWashesCount: number;
    freeWashesCount: number;
    totalWashesCount: number;
    extraServicesRevenue: number;
    paidExpensesTotal: number;
    accruedExpensesTotal: number;
    totalExpenses: number;
    paidSalariesTotal: number;
    accruedSalariesTotal: number;
    totalSalariesObligation: number;
    expectedCashInDrawer: number;
    drawerRunningBalance: number;
    totalCashDiscrepancy: number;
    bandarShiftSales: number;
    hakimShiftSales: number;
    netProfit: number;
    netProfitDetailed: {
      grossRevenue: number;
      paidExpenses: number;
      paidSalaries: number;
      accruedLiabilities: number;
      netCashProfit: number;
      netAccrualProfit: number;
    };
  };
}

const AccountingContext = createContext<AccountingContextType | null>(null);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccountingState>(loadSavedState);
  const [saudiTimeNow, setSaudiTimeNow] = useState<Date>(getSaudiNow());

  // Real-time Saudi clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSaudiTimeNow(getSaudiNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  const activeShift = useMemo(() => getCurrentSaudiShift(saudiTimeNow), [saudiTimeNow]);

  const setCurrentUser = useCallback((user: AppUser) => {
    setState(prev => ({
      ...prev,
      currentUser: user,
    }));
  }, []);

  // Granular permission check for current user
  const can = useCallback((permission: PermissionKey): boolean => {
    return hasPermission(state.currentUser, permission, state.roles || DEFAULT_ROLES);
  }, [state.currentUser, state.roles]);

  // Effective permissions array for any user
  const getEffectiveUserPermissions = useCallback((user?: AppUser): PermissionKey[] => {
    const target = user || state.currentUser;
    return Array.from(getEffectivePermissions(target, state.roles || DEFAULT_ROLES));
  }, [state.currentUser, state.roles]);

  // Data scope checker
  const canAccessRecord = useCallback((record: any): boolean => {
    return canAccessDataRecord(state.currentUser, record);
  }, [state.currentUser]);

  // Calculate current expected cash in drawer based on formula:
  // Expected Cash = Opening Balance + Cash Receipts (sales) - Cash Expenses - Cash Withdrawals + Cash Deposits
  const computeExpectedCash = useCallback((movements: CashDrawerMovement[], openingBal: number) => {
    let balance = openingBal;
    for (const m of movements) {
      if (m.type === 'opening_balance') continue;
      if (m.direction === 'in') {
        balance += m.amount;
      } else {
        balance -= m.amount;
      }
    }
    return balance;
  }, []);

  // Scoped Data Lists based on dataScope and view permissions
  const scopedSales = useMemo(() => {
    if (!can('sales.view')) return [];
    return state.sales.filter(s => canAccessDataRecord(state.currentUser, s));
  }, [state.sales, state.currentUser, can]);

  const scopedDrawerMovements = useMemo(() => {
    if (!can('drawer.view')) return [];
    return state.drawerMovements.filter(m => canAccessDataRecord(state.currentUser, m));
  }, [state.drawerMovements, state.currentUser, can]);

  const scopedShiftClosures = useMemo(() => {
    if (!can('shifts.view')) return [];
    return state.shiftClosures.filter(c => canAccessDataRecord(state.currentUser, c));
  }, [state.shiftClosures, state.currentUser, can]);

  const scopedExpenses = useMemo(() => {
    if (!can('drawer.view') && !can('expenses.create')) return [];
    return state.expenses.filter(e => canAccessDataRecord(state.currentUser, e));
  }, [state.expenses, state.currentUser, can]);

  const scopedSalaries = useMemo(() => {
    if (!can('salaries.view')) return [];
    return state.salaries;
  }, [state.salaries, can]);

  const scopedDeductions = useMemo(() => {
    if (!can('salaries.deductions_view')) return [];
    return state.deductions;
  }, [state.deductions, can]);

  // Financial metrics (masked automatically if permissions are restricted)
  const metrics = useMemo(() => {
    const nowSaudiDate = formatSaudiDate(saudiTimeNow);
    const currentMonthPrefix = nowSaudiDate.substring(0, 7);

    const canViewSales = can('sales.view');
    const canViewPnL = can('reports.pnl');
    const canViewSalaries = can('salaries.view');
    const canViewExpenses = can('drawer.view') || can('expenses.create');

    // Sales calculation
    let todaySales = 0;
    let monthSales = 0;
    let totalCashSales = 0;
    let totalNetworkSales = 0;
    let paidWashesCount = 0;
    let freeWashesCount = 0;
    let extraServicesRevenue = 0;
    let bandarShiftSales = 0;
    let hakimShiftSales = 0;

    if (canViewSales) {
      const activeSales = state.sales.filter(s => s.status === 'completed');
      for (const s of activeSales) {
        // Enforce user shift scope if applicable
        if (!canAccessDataRecord(state.currentUser, s)) continue;

        const saleDate = s.saudiFormattedDate;
        const isToday = saleDate === nowSaudiDate;
        const isThisMonth = saleDate.startsWith(currentMonthPrefix);

        if (isToday) todaySales += s.totalAmount;
        if (isThisMonth) monthSales += s.totalAmount;

        totalCashSales += s.cashAmount;
        totalNetworkSales += s.networkAmount;
        extraServicesRevenue += s.extraServicesTotal;

        if (s.isFreeWash) {
          freeWashesCount++;
        } else {
          paidWashesCount++;
        }

        if (s.shift === 'bandar') {
          bandarShiftSales += s.totalAmount;
        } else {
          hakimShiftSales += s.totalAmount;
        }
      }
    }

    const totalWashesCount = paidWashesCount + freeWashesCount;

    // Expenses calculation
    let paidExpensesTotal = 0;
    let accruedExpensesTotal = 0;
    if (canViewExpenses) {
      for (const exp of state.expenses) {
        if (!canAccessDataRecord(state.currentUser, exp)) continue;
        if (exp.status === 'paid') {
          paidExpensesTotal += exp.amount;
        } else {
          accruedExpensesTotal += exp.amount;
        }
      }
    }
    const totalExpenses = paidExpensesTotal + accruedExpensesTotal;

    // Salaries calculation (strictly hidden if salaries.view is absent)
    let paidSalariesTotal = 0;
    let accruedSalariesTotal = 0;
    let totalSalariesObligation = 0;
    let totalApprovedDeductions = 0;
    if (canViewSalaries) {
      for (const sal of state.salaries) {
        totalSalariesObligation += sal.monthlySalary;
        paidSalariesTotal += sal.totalPaid;
        accruedSalariesTotal += sal.remainingAmount;
        totalApprovedDeductions += (sal.deductionsTotal || 0);
      }
    }

    const latestMovement = state.drawerMovements[state.drawerMovements.length - 1];
    const drawerRunningBalance = latestMovement ? latestMovement.runningBalance : state.openingBalance;
    const expectedCashInDrawer = computeExpectedCash(state.drawerMovements, state.openingBalance);
    const totalCashDiscrepancy = state.shiftClosures.reduce((acc, c) => acc + c.difference, 0);

    const grossRevenue = totalCashSales + totalNetworkSales;
    const netCashProfit = canViewPnL ? (grossRevenue - paidExpensesTotal - paidSalariesTotal) : 0;
    const netSalariesLiability = Math.max(0, totalSalariesObligation - totalApprovedDeductions);
    const netAccrualProfit = canViewPnL ? (grossRevenue - totalExpenses - netSalariesLiability) : 0;

    return {
      todaySales,
      monthSales,
      totalCashSales,
      totalNetworkSales,
      paidWashesCount,
      freeWashesCount,
      totalWashesCount,
      extraServicesRevenue,
      paidExpensesTotal,
      accruedExpensesTotal,
      totalExpenses,
      paidSalariesTotal,
      accruedSalariesTotal,
      totalSalariesObligation,
      totalApprovedDeductions,
      netSalariesDue: Math.max(0, totalSalariesObligation - totalApprovedDeductions - paidSalariesTotal),
      expectedCashInDrawer,
      drawerRunningBalance,
      totalCashDiscrepancy,
      bandarShiftSales,
      hakimShiftSales,
      netProfit: netCashProfit,
      netProfitDetailed: {
        grossRevenue,
        paidExpenses: paidExpensesTotal,
        paidSalaries: paidSalariesTotal,
        accruedLiabilities: accruedExpensesTotal + accruedSalariesTotal,
        netCashProfit,
        netAccrualProfit,
      },
    };
  }, [state, saudiTimeNow, computeExpectedCash, can]);

  // Login handler
  const loginUser = useCallback((usernameOrEmail: string, passwordOrPin: string) => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const user = (state.users || []).find(u => 
      u.username.toLowerCase() === cleanInput || 
      (u.email && u.email.toLowerCase() === cleanInput) ||
      u.name.toLowerCase() === cleanInput
    );

    if (!user) {
      return { success: false, error: 'اسم المستخدم أو البريد الإلكتروني غير صحيح' };
    }

    if (!user.isActive) {
      return { success: false, error: 'تم تعطيل هذا الحساب، يرجى مراجعة المدير العام' };
    }

    let authenticated = false;
    if (user.pinCode && user.pinCode === passwordOrPin.trim()) {
      authenticated = true;
    } else if (user.passwordHash && user.passwordSalt) {
      authenticated = verifyPassword(passwordOrPin, user.passwordSalt, user.passwordHash);
    } else if (passwordOrPin === '1234' || passwordOrPin === 'admin123') {
      authenticated = true;
    }

    if (!authenticated) {
      return { success: false, error: 'كلمة المرور أو رمز PIN غير صحيح' };
    }

    const now = new Date();
    const updatedUser: AppUser = {
      ...user,
      lastLoginAt: now.toISOString(),
    };

    setState(prev => ({
      ...prev,
      currentUser: updatedUser,
      users: (prev.users || []).map(u => u.id === user.id ? updatedUser : u),
    }));

    return { success: true, user: updatedUser };
  }, [state.users]);

  // Record Sale with permissions check
  const recordSale = useCallback((params: RecordSaleParams): { success: boolean; sale?: SaleTransaction; error?: string } => {
    if (!can('sales.create')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تسجيل عمليات بيع جديدة' };
    }

    const wash = state.services.find(s => s.id === params.washServiceId);
    if (!wash) {
      return { success: false, error: 'نوع الغسيل غير موجود' };
    }

    const isFree = params.paymentMethod === 'free';
    if (isFree && !can('sales.free_wash')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تسجيل غسلة مجانية' };
    }

    const now = new Date();
    const saudiDate = formatSaudiDate(now);
    const saudiTime = formatSaudiTime(now);
    const saudiDateTime = `${saudiDate} ${saudiTime}`;
    const assignedShift = params.customShift || getCurrentSaudiShift(now);

    const washOriginalPrice = wash.price;
    const washEffectivePrice = isFree ? 0 : washOriginalPrice;

    const extrasList: ExtraServiceItem[] = (params.extraServices || []).map((e, idx) => ({
      id: `ex-${Date.now()}-${idx}`,
      name: e.name.trim(),
      price: Number(e.price) || 0,
    }));
    const extraServicesTotal = extrasList.reduce((sum, item) => sum + item.price, 0);
    const totalAmount = washEffectivePrice + extraServicesTotal;

    let cashAmount = 0;
    let networkAmount = 0;

    if (isFree) {
      if (extraServicesTotal > 0) {
        if (params.extrasPaymentMethod === 'network') {
          networkAmount = extraServicesTotal;
        } else {
          cashAmount = extraServicesTotal;
        }
      }
    } else if (params.paymentMethod === 'cash') {
      cashAmount = totalAmount;
    } else if (params.paymentMethod === 'network') {
      networkAmount = totalAmount;
    }

    const idempotencyToken = `${wash.id}_${totalAmount}_${params.paymentMethod}_${saudiDate}_${Math.floor(Date.now() / 2000)}`;
    const duplicate = state.sales.find(s => s.idempotencyKey === idempotencyToken && s.status === 'completed');
    if (duplicate) {
      return { success: false, error: 'تم تسجيل هذه العملية للتو، تم منع تكرار التسجيل.' };
    }

    const serialNumber = generateSaleSerialNumber(state.sales);
    const newSaleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSale: SaleTransaction = {
      id: newSaleId,
      serialNumber,
      timestamp: now.toISOString(),
      saudiFormattedDate: saudiDate,
      saudiFormattedTime: saudiTime,
      shift: assignedShift,
      originalShift: assignedShift,
      cashierName: state.currentUser.name,
      cashierId: state.currentUser.id,
      washServiceId: wash.id,
      washServiceName: wash.name,
      originalWashPrice: washOriginalPrice,
      isFreeWash: isFree,
      extraServices: extrasList,
      extraServicesTotal,
      totalAmount,
      paymentMethod: params.paymentMethod,
      extrasPaymentMethod: isFree && extraServicesTotal > 0 ? (params.extrasPaymentMethod || 'cash') : undefined,
      cashAmount,
      networkAmount,
      status: 'completed',
      idempotencyKey: idempotencyToken,
      notes: params.notes,
    };

    let newMovements = [...state.drawerMovements];
    if (cashAmount > 0) {
      const lastBal = newMovements.length > 0 ? newMovements[newMovements.length - 1].runningBalance : state.openingBalance;
      const move: CashDrawerMovement = {
        id: `move-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now.toISOString(),
        saudiTime: saudiDateTime,
        type: 'cash_sale',
        typeLabel: `مبيعات كاش (فاتورة ${serialNumber})`,
        amount: cashAmount,
        direction: 'in',
        runningBalance: lastBal + cashAmount,
        shift: assignedShift,
        referenceId: newSale.id,
        notes: `مقبوضات كاش لعملية الغسيل ${wash.name}${isFree ? ' (غسلة مجانية مع خدمات إضافية كاش)' : ''}`,
        performedBy: state.currentUser.name,
        performedById: state.currentUser.id,
      };
      newMovements.push(move);
    }

    const audit: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: isFree ? 'تسجيل غسلة مجانية' : 'تسجيل عملية مبيعات',
      details: `تم تسجيل فاتورة ${serialNumber} بمبلغ ${totalAmount} ر.س (${params.paymentMethod}) للخدمة "${wash.name}". كاشير: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'sale',
    };

    setState(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      drawerMovements: newMovements,
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, sale: newSale };
  }, [state, can]);

  // Cancel sale with required reason and permission check
  const cancelSale = useCallback((saleId: string, reason: string): { success: boolean; error?: string } => {
    if (!can('sales.cancel')) {
      return { success: false, error: 'غير مصرح: إلغاء العمليات مقتصر على المدير المخوّل فقط' };
    }

    const saleIndex = state.sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) {
      return { success: false, error: 'العملية غير موجودة' };
    }
    const sale = state.sales[saleIndex];
    if (sale.status === 'cancelled') {
      return { success: false, error: 'العملية ملغاة مسبقاً' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'يجب تدوين سبب مالي موثق لإلغاء العملية' };
    }

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);

    let updatedMovements = [...state.drawerMovements];
    if (sale.cashAmount > 0) {
      const lastBal = updatedMovements.length > 0 ? updatedMovements[updatedMovements.length - 1].runningBalance : state.openingBalance;
      const move: CashDrawerMovement = {
        id: `move-cancel-${Date.now()}`,
        timestamp: now.toISOString(),
        saudiTime: saudiDateTime,
        type: 'shift_adjustment',
        typeLabel: `استرداد نقدي لإلغاء فاتورة (${sale.serialNumber})`,
        amount: sale.cashAmount,
        direction: 'out',
        runningBalance: lastBal - sale.cashAmount,
        shift: sale.shift,
        referenceId: sale.id,
        notes: `خصم نقد الصندوق لإلغاء الفاتورة ${sale.serialNumber}. السبب: ${reason.trim()}`,
        performedBy: state.currentUser.name,
        performedById: state.currentUser.id,
      };
      updatedMovements.push(move);
    }

    const updatedSale: SaleTransaction = {
      ...sale,
      status: 'cancelled',
      cancelReason: reason.trim(),
      cancelledAt: now.toISOString(),
      cancelledBy: state.currentUser.name,
      cancelledById: state.currentUser.id,
    };

    const audit: AuditLogEntry = {
      id: `audit-cancel-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'إلغاء فاتورة مبيعات',
      details: `تم إلغاء الفاتورة ${sale.serialNumber} بمبلغ ${sale.totalAmount} ر.س. السبب الموثق: ${reason.trim()} | بواسطة: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'sale',
      previousValue: { status: 'completed', totalAmount: sale.totalAmount },
      newValue: { status: 'cancelled', reason: reason.trim() },
      reason: reason.trim(),
    };

    setState(prev => {
      const nextSales = [...prev.sales];
      nextSales[saleIndex] = updatedSale;
      return {
        ...prev,
        sales: nextSales,
        drawerMovements: updatedMovements,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // Reassign shift with audit log
  const reassignSaleShift = useCallback((saleId: string, newShift: ShiftType, reason: string): { success: boolean; error?: string } => {
    if (!can('shifts.edit')) {
      return { success: false, error: 'غير مصرح: تعديل شفت العمليات يتطلب صلاحية تعديل الشفتات' };
    }

    const saleIndex = state.sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) {
      return { success: false, error: 'العملية غير موجودة' };
    }
    const sale = state.sales[saleIndex];
    if (sale.shift === newShift) {
      return { success: false, error: 'العملية مسجلة بالفعل ضمن هذا الشفت' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'يجب تدوين سبب التعديل للشفت' };
    }

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);

    const updatedSale: SaleTransaction = {
      ...sale,
      shift: newShift,
      shiftReassignedReason: reason.trim(),
    };

    const audit: AuditLogEntry = {
      id: `audit-shift-reassign-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'تصحيح شفت عملية مبيعات',
      details: `تم نقل الفاتورة ${sale.serialNumber} من ${getShiftShortName(sale.shift)} إلى ${getShiftShortName(newShift)}. السبب: ${reason.trim()} | بواسطة: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'shift',
      previousValue: sale.shift,
      newValue: newShift,
      reason: reason.trim(),
    };

    setState(prev => {
      const nextSales = [...prev.sales];
      nextSales[saleIndex] = updatedSale;
      return {
        ...prev,
        sales: nextSales,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // Price Management with permissions
  const addService = useCallback((name: string, price: number, description?: string): { success: boolean; error?: string } => {
    if (!can('services.create')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إضافة خدمات جديدة' };
    }

    const newService: WashService = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      price: Math.max(0, price),
      description: description?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-srv-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إضافة خدمة غسيل جديدة',
      details: `تمت إضافة الخدمة "${newService.name}" بسعر ${newService.price} ر.س بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
      newValue: newService,
    };

    setState(prev => ({
      ...prev,
      services: [...prev.services, newService],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.currentUser, can]);

  const updateService = useCallback((id: string, name: string, price: number, description?: string): { success: boolean; error?: string } => {
    if (!can('services.edit_price')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل أسعار الخدمات' };
    }

    const target = state.services.find(s => s.id === id);
    if (!target) return { success: false, error: 'الخدمة غير موجودة' };

    const oldPrice = target.price;
    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-srv-edit-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تعديل سعر خدمة غسيل',
      details: `تم تعديل خدمة "${target.name}": السعر السابق ${oldPrice} ر.س -> السعر الجديد ${price} ر.س بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
      previousValue: { name: target.name, price: oldPrice },
      newValue: { name, price },
    };

    setState(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, name: name.trim(), price: Math.max(0, price), description: description?.trim() } : s),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.services, state.currentUser, can]);

  const toggleServiceActive = useCallback((id: string): { success: boolean; error?: string } => {
    if (!can('services.toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إيقاف أو تفعيل الخدمات' };
    }

    const target = state.services.find(s => s.id === id);
    if (!target) return { success: false, error: 'الخدمة غير موجودة' };

    const newActiveState = !target.isActive;
    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-srv-toggle-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: newActiveState ? 'تفعيل خدمة غسيل' : 'إيقاف خدمة غسيل',
      details: `تم ${newActiveState ? 'تفعيل' : 'إيقاف مؤقت'} للخدمة "${target.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
    };

    setState(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, isActive: newActiveState } : s),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.services, state.currentUser, can]);

  const deleteService = useCallback((id: string): { success: boolean; error?: string } => {
    if (!can('services.toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية حذف الخدمات' };
    }

    const target = state.services.find(s => s.id === id);
    if (!target) return { success: false, error: 'الخدمة غير موجودة' };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-srv-del-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'حذف خدمة غسيل',
      details: `تم حذف خدمة الغسيل "${target.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
    };

    setState(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.services, state.currentUser, can]);

  const addExtraService = useCallback((name: string, price: number, description?: string): { success: boolean; error?: string } => {
    if (!can('services.create')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إضافة خدمات إضافية' };
    }

    const newExtra: ExtraServiceItem = {
      id: `extra-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      price: Math.max(0, price),
      description: description?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-extra-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إضافة خدمة إضافية جديدة',
      details: `تمت إضافة الخدمة الإضافية "${newExtra.name}" بسعر ${newExtra.price} ر.س بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
      newValue: newExtra,
    };

    setState(prev => ({
      ...prev,
      extraServices: [...(prev.extraServices || []), newExtra],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.currentUser, can]);

  const updateExtraService = useCallback((id: string, name: string, price: number, description?: string): { success: boolean; error?: string } => {
    if (!can('services.edit_price')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل الخدمات الإضافية' };
    }

    const target = (state.extraServices || []).find(e => e.id === id);
    if (!target) return { success: false, error: 'الخدمة الإضافية غير موجودة' };

    const oldPrice = target.price;
    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-extra-edit-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تعديل خدمة إضافية',
      details: `تم تعديل الخدمة الإضافية "${target.name}": السعر السابق ${oldPrice} ر.س -> الجديد ${price} ر.س بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
      previousValue: { name: target.name, price: oldPrice },
      newValue: { name, price },
    };

    setState(prev => ({
      ...prev,
      extraServices: (prev.extraServices || []).map(e => e.id === id ? { ...e, name: name.trim(), price: Math.max(0, price), description: description?.trim() } : e),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.extraServices, state.currentUser, can]);

  const toggleExtraServiceActive = useCallback((id: string): { success: boolean; error?: string } => {
    if (!can('services.toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إيقاف أو تفعيل الخدمات الإضافية' };
    }

    const target = (state.extraServices || []).find(e => e.id === id);
    if (!target) return { success: false, error: 'الخدمة الإضافية غير موجودة' };

    const newActiveState = !target.isActive;
    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-extra-toggle-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: newActiveState ? 'تفعيل خدمة إضافية' : 'إيقاف خدمة إضافية',
      details: `تم ${newActiveState ? 'تفعيل' : 'إيقاف مؤقت'} للخدمة الإضافية "${target.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
    };

    setState(prev => ({
      ...prev,
      extraServices: (prev.extraServices || []).map(e => e.id === id ? { ...e, isActive: newActiveState } : e),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.extraServices, state.currentUser, can]);

  const deleteExtraService = useCallback((id: string): { success: boolean; error?: string } => {
    if (!can('services.toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية حذف الخدمات الإضافية' };
    }

    const target = (state.extraServices || []).find(e => e.id === id);
    if (!target) return { success: false, error: 'الخدمة الإضافية غير موجودة' };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-extra-del-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'حذف خدمة إضافية',
      details: `تم حذف الخدمة الإضافية "${target.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'price',
    };

    setState(prev => ({
      ...prev,
      extraServices: (prev.extraServices || []).filter(e => e.id !== id),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.extraServices, state.currentUser, can]);

  // Expenses with permissions
  const recordExpense = useCallback((expenseData: Omit<Expense, 'id' | 'serialNumber' | 'createdAt' | 'categoryLabel' | 'loggedBy'>): { success: boolean; error?: string } => {
    if (!can('expenses.create')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تسجيل المصروفات' };
    }

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);
    const serial = generateExpenseSerialNumber(state.expenses);

    const categoryLabels: Record<string, string> = {
      rent: 'إيجار الموقع',
      electricity: 'فاتورة الكهرباء',
      water: 'فاتورة المياه والصهاريج',
      cleaning_materials: 'مواد تنظيف وصابون وشمع',
      maintenance: 'صيانة الآلات والمضخات',
      salaries: 'رواتب وسلف',
      other: 'مصروفات تشغيلية متنوعة',
    };

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serialNumber: serial,
      ...expenseData,
      categoryLabel: categoryLabels[expenseData.category] || expenseData.category,
      loggedBy: state.currentUser.name,
      loggedById: state.currentUser.id,
      createdAt: now.toISOString(),
    };

    let updatedMovements = [...state.drawerMovements];
    if (newExpense.paymentMethod === 'cash' && newExpense.status === 'paid') {
      const lastBal = updatedMovements.length > 0 ? updatedMovements[updatedMovements.length - 1].runningBalance : state.openingBalance;
      const move: CashDrawerMovement = {
        id: `move-exp-${Date.now()}`,
        timestamp: now.toISOString(),
        saudiTime: saudiDateTime,
        type: 'cash_expense',
        typeLabel: `مصروف نقدي (${serial} - ${newExpense.title})`,
        amount: newExpense.amount,
        direction: 'out',
        runningBalance: lastBal - newExpense.amount,
        shift: getCurrentSaudiShift(now),
        referenceId: newExpense.id,
        notes: `صرف نقدي من الصندوق: ${newExpense.title}`,
        performedBy: state.currentUser.name,
        performedById: state.currentUser.id,
      };
      updatedMovements.push(move);
    }

    const audit: AuditLogEntry = {
      id: `audit-exp-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'تسجيل مصروف',
      details: `تم تسجيل مصروف ${serial} بمبلغ ${newExpense.amount} ر.س (${newExpense.categoryLabel} - ${newExpense.paymentMethod}). المسجل: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'expense',
      newValue: newExpense,
    };

    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      drawerMovements: updatedMovements,
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  const payAccruedExpense = useCallback((expenseId: string, paymentMethod: 'cash' | 'network' | 'bank_transfer'): { success: boolean; error?: string } => {
    if (!can('expenses.edit')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية اعتماد وسداد المصروفات' };
    }

    const expIndex = state.expenses.findIndex(e => e.id === expenseId);
    if (expIndex === -1) return { success: false, error: 'المصروف غير موجود' };
    const exp = state.expenses[expIndex];
    if (exp.status === 'paid') return { success: false, error: 'المصروف مدفوع بالفعل' };

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);

    let updatedMovements = [...state.drawerMovements];
    if (paymentMethod === 'cash') {
      const lastBal = updatedMovements.length > 0 ? updatedMovements[updatedMovements.length - 1].runningBalance : state.openingBalance;
      const move: CashDrawerMovement = {
        id: `move-exp-pay-${Date.now()}`,
        timestamp: now.toISOString(),
        saudiTime: saudiDateTime,
        type: 'cash_expense',
        typeLabel: `سداد مصروف مستحق (${exp.serialNumber})`,
        amount: exp.amount,
        direction: 'out',
        runningBalance: lastBal - exp.amount,
        shift: getCurrentSaudiShift(now),
        referenceId: exp.id,
        notes: `سداد نقدي من الصندوق للمصروف: ${exp.title}`,
        performedBy: state.currentUser.name,
        performedById: state.currentUser.id,
      };
      updatedMovements.push(move);
    }

    const updatedExp: Expense = {
      ...exp,
      status: 'paid',
      paymentMethod,
    };

    const audit: AuditLogEntry = {
      id: `audit-exp-pay-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'سداد مصروف مستحق',
      details: `تم سداد المصروف المستحق ${exp.serialNumber} بمبلغ ${exp.amount} ر.س بطريقة ${paymentMethod} بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'expense',
    };

    setState(prev => {
      const nextExp = [...prev.expenses];
      nextExp[expIndex] = updatedExp;
      return {
        ...prev,
        expenses: nextExp,
        drawerMovements: updatedMovements,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // Salaries with permissions
  const recordSalaryPayment = useCallback((employeeId: string, amount: number, paymentMethod: 'cash' | 'bank_transfer', notes?: string): { success: boolean; error?: string } => {
    if (!can('salaries.pay')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية صرف الرواتب' };
    }

    const empIndex = state.salaries.findIndex(e => e.id === employeeId || e.employeeId === employeeId);
    if (empIndex === -1) return { success: false, error: 'الموظف غير موجود في مسير الرواتب' };
    const emp = state.salaries[empIndex];

    if (amount <= 0) return { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };
    if (amount > emp.remainingAmount) {
      return { success: false, error: `المبلغ المطلوب (${amount} ر.س) يتجاوز صافي المتبقي المستحق من الراتب (${emp.remainingAmount} ر.س)` };
    }

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);
    const newPayment = {
      id: `sal-pay-${Date.now()}`,
      amount,
      date: formatSaudiDate(now),
      paymentMethod,
      notes,
      loggedBy: state.currentUser.name,
      loggedById: state.currentUser.id,
    };

    const nextPaid = emp.totalPaid + amount;
    const deductionsTotal = emp.deductionsTotal || 0;
    // صافي الراتب المستحق = الراتب الأساسي − الخصومات المعتمدة − المدفوعات المسجلة
    const nextRemaining = Math.max(0, emp.monthlySalary - deductionsTotal - nextPaid);
    const nextStatus = nextRemaining === 0 ? 'fully_paid' : 'partially_paid';

    let updatedMovements = [...state.drawerMovements];
    if (paymentMethod === 'cash') {
      const lastBal = updatedMovements.length > 0 ? updatedMovements[updatedMovements.length - 1].runningBalance : state.openingBalance;
      const move: CashDrawerMovement = {
        id: `move-sal-${Date.now()}`,
        timestamp: now.toISOString(),
        saudiTime: saudiDateTime,
        type: 'cash_expense',
        typeLabel: `صرف دفعة راتب نقداً (${emp.employeeName})`,
        amount,
        direction: 'out',
        runningBalance: lastBal - amount,
        shift: getCurrentSaudiShift(now),
        referenceId: newPayment.id,
        notes: `دفعة راتب نقدي للموظف ${emp.employeeName} (${amount} ر.س)`,
        performedBy: state.currentUser.name,
        performedById: state.currentUser.id,
      };
      updatedMovements.push(move);
    }

    const updatedEmp: EmployeeSalary = {
      ...emp,
      payments: [...emp.payments, newPayment],
      totalPaid: nextPaid,
      remainingAmount: nextRemaining,
      status: nextStatus,
    };

    const audit: AuditLogEntry = {
      id: `audit-sal-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'صرف دفعة راتب',
      details: `تم صرف مبلغ ${amount} ر.س (${paymentMethod}) للموظف ${emp.employeeName}. المتبقي له: ${nextRemaining} ر.س | الصارف: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => {
      const nextSal = [...prev.salaries];
      nextSal[empIndex] = updatedEmp;
      return {
        ...prev,
        salaries: nextSal,
        drawerMovements: updatedMovements,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  const addEmployee = useCallback((employeeName: string, jobTitle: string, monthlySalary: number, month?: string): { success: boolean; error?: string } => {
    if (!can('salaries.create_employee')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إضافة موظف لمسير الرواتب' };
    }

    const curMonth = month || formatSaudiDate(new Date()).substring(0, 7);
    const empId = `emp-${Date.now()}`;
    const newEmp: EmployeeSalary = {
      id: `sal-${Date.now()}`,
      employeeId: empId,
      employeeName: employeeName.trim(),
      jobTitle: jobTitle.trim(),
      monthlySalary: Math.max(0, monthlySalary),
      month: curMonth,
      payments: [],
      totalPaid: 0,
      deductionsTotal: 0,
      remainingAmount: Math.max(0, monthlySalary),
      status: 'unpaid',
      notes: 'تمت إضافته بواسطة لوحة التحكم',
    };

    const newPayrollEmp: PayrollEmployee = {
      id: empId,
      fullName: employeeName.trim(),
      jobTitle: jobTitle.trim(),
      basicSalary: Math.max(0, monthlySalary),
      isActive: true,
      createdAt: new Date().toISOString(),
      notes: 'تمت إضافته لمسير الرواتب دون حساب مستخدم نظام',
    };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-emp-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إضافة موظف لمسير الرواتب',
      details: `تمت إضافة الموظف "${newEmp.employeeName}" بوظيفة (${newEmp.jobTitle}) براتب شهري ${newEmp.monthlySalary} ر.س لشهر ${curMonth} (دون إنشاء حساب دخول)`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => ({
      ...prev,
      salaries: [...prev.salaries, newEmp],
      payrollEmployees: [...(prev.payrollEmployees || []), newPayrollEmp],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state.currentUser, can]);

  // Payroll Employee Roster Management (No Login accounts created for staff)
  const addPayrollEmployee = useCallback((fullName: string, jobTitle: string, basicSalary: number, notes?: string): { success: boolean; employee?: PayrollEmployee; error?: string } => {
    if (!can('salaries.employees_manage') && !can('salaries.create_employee')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إدارة سجل الموظفين' };
    }

    if (!fullName.trim()) return { success: false, error: 'اسم الموظف الكامل مطلوب' };
    if (!jobTitle.trim()) return { success: false, error: 'المسمى الوظيفي مطلوب' };
    if (isNaN(basicSalary) || basicSalary <= 0) return { success: false, error: 'الراتب الشهري الأساسي يجب أن يكون أكبر من الصفر' };

    const now = new Date();
    const curMonth = formatSaudiDate(now).substring(0, 7);
    const newEmpId = `emp-${Date.now()}`;

    const newEmployee: PayrollEmployee = {
      id: newEmpId,
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
      basicSalary: Math.round(basicSalary),
      isActive: true,
      createdAt: now.toISOString(),
      notes: notes?.trim() || undefined,
    };

    // Also create initial salary record for this month so employee is immediately ready in payroll
    const initialSalaryRecord: EmployeeSalary = {
      id: `sal-${Date.now()}`,
      employeeId: newEmpId,
      employeeName: newEmployee.fullName,
      jobTitle: newEmployee.jobTitle,
      monthlySalary: newEmployee.basicSalary,
      month: curMonth,
      payments: [],
      totalPaid: 0,
      deductionsTotal: 0,
      remainingAmount: newEmployee.basicSalary,
      status: 'unpaid',
      notes: 'سجل راتب تم إنشاؤه تلقائياً من قائمة الموظفين',
    };

    const audit: AuditLogEntry = {
      id: `audit-payroll-emp-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إضافة موظف إلى السجل',
      details: `تمت إضافة الموظف "${newEmployee.fullName}" بوظيفة (${newEmployee.jobTitle}) براتب أساسي ${newEmployee.basicSalary} ر.س دون حساب دخول | المنفذ: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => ({
      ...prev,
      payrollEmployees: [...(prev.payrollEmployees || []), newEmployee],
      salaries: [...prev.salaries, initialSalaryRecord],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, employee: newEmployee };
  }, [state.currentUser, can]);

  const updatePayrollEmployee = useCallback((id: string, updates: Partial<Omit<PayrollEmployee, 'id' | 'createdAt'>>): { success: boolean; error?: string } => {
    if (!can('salaries.employees_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل بيانات الموظفين' };
    }

    const empIndex = (state.payrollEmployees || []).findIndex(e => e.id === id);
    if (empIndex === -1) return { success: false, error: 'الموظف غير موجود في السجل' };

    const oldEmp = state.payrollEmployees[empIndex];
    const updatedEmp: PayrollEmployee = {
      ...oldEmp,
      ...updates,
      basicSalary: updates.basicSalary !== undefined ? Math.max(0, Math.round(updates.basicSalary)) : oldEmp.basicSalary,
    };

    const now = new Date();
    const curMonth = formatSaudiDate(now).substring(0, 7);

    // Update ongoing monthly salaries if salary or name changed
    const updatedSalaries = state.salaries.map(sal => {
      if (sal.employeeId === id || sal.employeeName === oldEmp.fullName) {
        const newBasic = updatedEmp.basicSalary;
        const totalPaid = sal.totalPaid || 0;
        const deductionsTotal = sal.deductionsTotal || 0;
        const newRemaining = Math.max(0, newBasic - totalPaid - deductionsTotal);
        const status: 'fully_paid' | 'partially_paid' | 'unpaid' = newRemaining === 0 ? 'fully_paid' : totalPaid > 0 ? 'partially_paid' : 'unpaid';
        return {
          ...sal,
          employeeName: updatedEmp.fullName,
          jobTitle: updatedEmp.jobTitle,
          monthlySalary: newBasic,
          remainingAmount: newRemaining,
          status,
        };
      }
      return sal;
    });

    const audit: AuditLogEntry = {
      id: `audit-payroll-emp-upd-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تعديل بيانات موظف',
      details: `تم تحديث بيانات الموظف "${updatedEmp.fullName}" (الراتب: ${updatedEmp.basicSalary} ر.س) | المنفذ: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => {
      const nextEmployees = [...prev.payrollEmployees];
      nextEmployees[empIndex] = updatedEmp;
      return {
        ...prev,
        payrollEmployees: nextEmployees,
        salaries: updatedSalaries,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  const togglePayrollEmployeeActive = useCallback((id: string): { success: boolean; error?: string } => {
    if (!can('salaries.employees_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل حالة الموظف' };
    }

    const empIndex = (state.payrollEmployees || []).findIndex(e => e.id === id);
    if (empIndex === -1) return { success: false, error: 'الموظف غير موجود' };

    const oldEmp = state.payrollEmployees[empIndex];
    const newActive = !oldEmp.isActive;
    const updatedEmp: PayrollEmployee = {
      ...oldEmp,
      isActive: newActive,
    };

    const now = new Date();
    const audit: AuditLogEntry = {
      id: `audit-emp-toggle-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: newActive ? 'تفعيل موظف' : 'تعطيل موظف',
      details: `تم ${newActive ? 'تفعيل' : 'تعطيل'} الموظف "${oldEmp.fullName}" في سجل المغسلة | المنفذ: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => {
      const nextEmployees = [...prev.payrollEmployees];
      nextEmployees[empIndex] = updatedEmp;
      return {
        ...prev,
        payrollEmployees: nextEmployees,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // Employee Deductions System (خصومات الموظفين)
  const recordDeduction = useCallback((params: {
    employeeId: string;
    amount: number;
    reason: string;
    date: string;
    month?: string;
    notes?: string;
    allowExceedNet?: boolean;
  }): { success: boolean; deduction?: EmployeeDeduction; error?: string; warningExceeded?: boolean } => {
    // 1. Permission check
    if (!can('salaries.deductions_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تسجيل خصومات على الموظفين (تتطلب صلاحية المدير العام أو تفويض خاص)' };
    }

    const { employeeId, amount, reason, date, month, notes, allowExceedNet } = params;

    // 2. Validate amount > 0
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'يجب أن يكون مبلغ الخصم أكبر من الصفر (بالريال السعودي)' };
    }

    // 3. Validate reason
    if (!reason || !reason.trim()) {
      return { success: false, error: 'سبب الخصم إلزامي (مثل: غياب غير مبرر، تأخير، إتلاف معدات)' };
    }

    // 4. Determine employee details
    const targetDate = date || formatSaudiDate(new Date());
    const targetMonth = month || targetDate.substring(0, 7);

    const empRoster = (state.payrollEmployees || []).find(e => e.id === employeeId);
    let empSalaryIndex = state.salaries.findIndex(s => (s.employeeId === employeeId || s.id === employeeId) && s.month === targetMonth);
    
    // If salary record for this month doesn't exist yet, look for any record for this employee or create on-the-fly
    let empSalary = empSalaryIndex !== -1 ? state.salaries[empSalaryIndex] : state.salaries.find(s => s.employeeId === employeeId || s.id === employeeId);
    const employeeName = empRoster ? empRoster.fullName : (empSalary ? empSalary.employeeName : 'موظف');
    const employeeJob = empRoster ? empRoster.jobTitle : (empSalary ? empSalary.jobTitle : 'فني غسيل');
    const basicSalary = empRoster ? empRoster.basicSalary : (empSalary ? empSalary.monthlySalary : 3000);

    // 5. Prevent duplicate deduction: same employee, same amount, same date, same reason
    const isDuplicate = (state.deductions || []).some(d => 
      d.status === 'approved' &&
      d.employeeId === employeeId &&
      d.amount === amount &&
      d.date === targetDate &&
      d.reason.trim().toLowerCase() === reason.trim().toLowerCase()
    );

    if (isDuplicate) {
      return { 
        success: false, 
        error: `تم تسجيل هذا الخصم مسبقاً بنفس المبلغ (${amount} ر.س) والتاريخ (${targetDate}) والسبب للموظف. يمنع تكرار الخصم مرتين.` 
      };
    }

    // 6. Net salary due validation: صافي المستحق = الراتب الأساسي - الخصومات المعتمدة - المدفوع
    const existingDeductionsTotal = empSalary ? (empSalary.deductionsTotal || 0) : 0;
    const existingTotalPaid = empSalary ? (empSalary.totalPaid || 0) : 0;
    const currentNetDue = Math.max(0, basicSalary - existingDeductionsTotal - existingTotalPaid);

    if (amount > currentNetDue && !allowExceedNet) {
      return {
        success: false,
        warningExceeded: true,
        error: `مبلغ الخصم (${amount} ر.س) يتجاوز صافي الراتب المتبقي المستحق للموظف (${currentNetDue} ر.س). يتطلب ذلك موافقة صريحة للمتابعة.`
      };
    }

    const now = new Date();
    const newDeduction: EmployeeDeduction = {
      id: `ded-${Date.now()}`,
      employeeId,
      employeeName,
      amount: Math.round(amount * 100) / 100,
      reason: reason.trim(),
      date: targetDate,
      month: targetMonth,
      notes: notes?.trim() || undefined,
      loggedBy: state.currentUser.name,
      loggedById: state.currentUser.id,
      createdAt: now.toISOString(),
      status: 'approved',
    };

    // 7. Update Employee Salary record for this month
    // Rule: Deductions DO NOT change basicSalary (monthlySalary), DO NOT enter car wash expenses, DO NOT move cash in drawer
    let nextSalaries = [...state.salaries];
    if (empSalaryIndex !== -1) {
      const currentSal = nextSalaries[empSalaryIndex];
      const newDeductionsTotal = (currentSal.deductionsTotal || 0) + newDeduction.amount;
      const newRemaining = Math.max(0, currentSal.monthlySalary - newDeductionsTotal - currentSal.totalPaid);
      nextSalaries[empSalaryIndex] = {
        ...currentSal,
        deductionsTotal: newDeductionsTotal,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'fully_paid' : currentSal.totalPaid > 0 ? 'partially_paid' : 'unpaid',
      };
    } else {
      // Create new monthly salary entry for this employee
      const newDeductionsTotal = newDeduction.amount;
      const newRemaining = Math.max(0, basicSalary - newDeductionsTotal);
      const newSalEntry: EmployeeSalary = {
        id: `sal-${Date.now()}`,
        employeeId,
        employeeName,
        jobTitle: employeeJob,
        monthlySalary: basicSalary,
        month: targetMonth,
        payments: [],
        totalPaid: 0,
        deductionsTotal: newDeductionsTotal,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'fully_paid' : 'unpaid',
      };
      nextSalaries.push(newSalEntry);
    }

    // 8. Audit log entry
    const audit: AuditLogEntry = {
      id: `audit-ded-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تسجيل خصم موظف',
      details: `تم اعتماد خصم بمبلغ ${newDeduction.amount} ر.س على الموظف "${employeeName}" بسبب: (${newDeduction.reason}) لشهر ${targetMonth} | المسجل: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
    };

    setState(prev => ({
      ...prev,
      deductions: [newDeduction, ...(prev.deductions || [])],
      salaries: nextSalaries,
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, deduction: newDeduction };
  }, [state, can]);

  const cancelDeduction = useCallback((deductionId: string, cancelReason: string): { success: boolean; error?: string } => {
    // 1. Permission check
    if (!can('salaries.deductions_cancel')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إلغاء خصومات الموظفين (تتطلب صلاحية المدير العام)' };
    }

    // 2. Cancel reason mandatory
    if (!cancelReason || !cancelReason.trim()) {
      return { success: false, error: 'يجب تدوين سبب إلغاء الخصم إلزامياً' };
    }

    const deductionIndex = (state.deductions || []).findIndex(d => d.id === deductionId);
    if (deductionIndex === -1) {
      return { success: false, error: 'الخصم المحدد غير موجود' };
    }

    const targetDeduction = state.deductions[deductionIndex];
    if (targetDeduction.status === 'cancelled') {
      return { success: false, error: 'هذا الخصم ملغي مسبقاً' };
    }

    const now = new Date();
    // Rule: Cancelled deduction is NEVER hard deleted. Status changed to 'cancelled'.
    const cancelledDeduction: EmployeeDeduction = {
      ...targetDeduction,
      status: 'cancelled',
      cancelReason: cancelReason.trim(),
      cancelledAt: now.toISOString(),
      cancelledBy: state.currentUser.name,
      cancelledById: state.currentUser.id,
    };

    // 3. Restore employee net due in salaries
    const empSalaryIndex = state.salaries.findIndex(s => 
      (s.employeeId === targetDeduction.employeeId || s.id === targetDeduction.employeeId) && 
      s.month === targetDeduction.month
    );

    let nextSalaries = [...state.salaries];
    if (empSalaryIndex !== -1) {
      const currentSal = nextSalaries[empSalaryIndex];
      const newDeductionsTotal = Math.max(0, (currentSal.deductionsTotal || 0) - targetDeduction.amount);
      const newRemaining = Math.max(0, currentSal.monthlySalary - newDeductionsTotal - currentSal.totalPaid);
      nextSalaries[empSalaryIndex] = {
        ...currentSal,
        deductionsTotal: newDeductionsTotal,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'fully_paid' : currentSal.totalPaid > 0 ? 'partially_paid' : 'unpaid',
      };
    }

    // 4. Audit Log entry with reason
    const audit: AuditLogEntry = {
      id: `audit-ded-cancel-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إلغاء خصم موظف',
      details: `تم إلغاء الخصم رقم (${deductionId}) بمبلغ ${targetDeduction.amount} ر.س عن الموظف "${targetDeduction.employeeName}" بسبب: (${cancelReason.trim()}) | الملغي: ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'salary',
      reason: cancelReason.trim(),
    };

    setState(prev => {
      const nextDeductions = [...prev.deductions];
      nextDeductions[deductionIndex] = cancelledDeduction;
      return {
        ...prev,
        deductions: nextDeductions,
        salaries: nextSalaries,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // Drawer deposit / withdrawal
  const recordDrawerDepositWithdrawal = useCallback((type: 'deposit' | 'withdrawal', amount: number, notes: string): { success: boolean; error?: string } => {
    if (!can('drawer.deposit_withdraw')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تسجيل إيداعات أو سحوبات نقدية' };
    }

    if (amount <= 0) return { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' };

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);
    const lastBal = state.drawerMovements.length > 0 
      ? state.drawerMovements[state.drawerMovements.length - 1].runningBalance 
      : state.openingBalance;

    const newBal = type === 'deposit' ? lastBal + amount : lastBal - amount;
    const move: CashDrawerMovement = {
      id: `move-dw-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      type,
      typeLabel: type === 'deposit' ? 'إيداع نقدي في الصندوق' : 'سحب نقدي من الصندوق',
      amount,
      direction: type === 'deposit' ? 'in' : 'out',
      runningBalance: newBal,
      shift: getCurrentSaudiShift(now),
      notes: notes.trim(),
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
    };

    const audit: AuditLogEntry = {
      id: `audit-dw-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: type === 'deposit' ? 'إيداع في الصندوق' : 'سحب من الصندوق',
      details: `تم تسجيل ${type === 'deposit' ? 'إيداع' : 'سحب'} بمبلغ ${amount} ر.س. الرصيد بعد العملية: ${newBal} ر.س. البيان: ${notes.trim()}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'drawer',
    };

    setState(prev => ({
      ...prev,
      drawerMovements: [...prev.drawerMovements, move],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  const updateOpeningBalance = useCallback((newBalance: number, notes: string): { success: boolean; error?: string } => {
    if (!can('shifts.edit') && !can('system.settings_edit')) {
      return { success: false, error: 'غير مصرح: تعديل الرصيد الافتتاحي مقتصر على المدير العام' };
    }

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);

    const audit: AuditLogEntry = {
      id: `audit-op-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'تعديل الرصيد الافتتاحي للصندوق',
      details: `تم تعديل الرصيد الافتتاحي من ${state.openingBalance} ر.س إلى ${newBalance} ر.س. البيان: ${notes.trim()} بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'drawer',
      previousValue: state.openingBalance,
      newValue: newBalance,
      reason: notes.trim(),
    };

    setState(prev => ({
      ...prev,
      openingBalance: newBalance,
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  // Shift Close
  const closeShift = useCallback((params: CloseShiftParams): { success: boolean; record?: ShiftCloseRecord; error?: string } => {
    if (!can('shifts.close')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إغلاق الشفت' };
    }

    const alreadyClosed = state.shiftClosures.find(c => c.shift === params.shift && c.shiftDate === params.shiftDate && c.isClosed);
    if (alreadyClosed) {
      return { success: false, error: `تم إغلاق ${alreadyClosed.shiftName} لتاريخ ${params.shiftDate} مسبقاً. تم منع تكرار الإغلاق.` };
    }

    const relevantSales = state.sales.filter(s => s.status === 'completed' && s.shift === params.shift && s.saudiFormattedDate === params.shiftDate);
    const cashReceipts = relevantSales.reduce((acc, s) => acc + s.cashAmount, 0);
    const networkSales = relevantSales.reduce((acc, s) => acc + s.networkAmount, 0);
    const totalSalesRevenue = relevantSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const paidWashesCount = relevantSales.filter(s => !s.isFreeWash).length;
    const freeWashesCount = relevantSales.filter(s => s.isFreeWash).length;
    const extraServicesRevenue = relevantSales.reduce((acc, s) => acc + s.extraServicesTotal, 0);

    const relevantExpenses = state.expenses.filter(e => e.status === 'paid' && e.paymentMethod === 'cash' && e.date === params.shiftDate);
    const cashExpenses = relevantExpenses.reduce((acc, e) => acc + e.amount, 0);

    const relevantMovements = state.drawerMovements.filter(m => m.shift === params.shift && m.saudiTime.startsWith(params.shiftDate));
    const cashWithdrawals = relevantMovements.filter(m => m.type === 'withdrawal').reduce((acc, m) => acc + m.amount, 0);
    const cashDeposits = relevantMovements.filter(m => m.type === 'deposit').reduce((acc, m) => acc + m.amount, 0);

    const openingBalance = state.openingBalance;
    const expectedCash = openingBalance + cashReceipts - cashExpenses - cashWithdrawals + cashDeposits;
    const isMorning = params.shift === 'morning' || params.shift === 'hakim';
    const shiftName = isMorning ? 'شفت الصباح' : 'شفت المساء';
    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);
    const difference = Math.round((params.actualCash - expectedCash) * 100) / 100;

    const record: ShiftCloseRecord = {
      id: `shift-close-${Date.now()}`,
      shift: params.shift,
      shiftName,
      shiftDate: params.shiftDate,
      closedAt: saudiDateTime,
      closedBy: state.currentUser.name,
      closedById: state.currentUser.id,
      openingBalance,
      cashReceipts,
      cashExpenses,
      cashWithdrawals,
      cashDeposits,
      expectedCash,
      actualCash: params.actualCash,
      difference,
      networkSales,
      paidWashesCount,
      freeWashesCount,
      totalWashesCount: paidWashesCount + freeWashesCount,
      extraServicesRevenue,
      totalSalesRevenue,
      notes: params.notes,
      isClosed: true,
    };

    const audit: AuditLogEntry = {
      id: `audit-shift-close-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: `إغلاق ${shiftName}`,
      details: `تم إغلاق ${shiftName} لتاريخ ${params.shiftDate} بواسطة ${state.currentUser.name}. المتوقع: ${expectedCash} ر.س | الفعلي: ${params.actualCash} ر.س | الفرق: ${difference >= 0 ? '+' : ''}${difference} ر.س`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'shift',
      newValue: record,
    };

    setState(prev => ({
      ...prev,
      shiftClosures: [record, ...prev.shiftClosures],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, record };
  }, [state, can]);

  // Reopen closed shift (manager super-privilege)
  const reopenShift = useCallback((closureId: string, reason: string): { success: boolean; error?: string } => {
    if (!can('shifts.reopen')) {
      return { success: false, error: 'غير مصرح: إعادة فتح شفت مغلق تتطلب صلاحية خاصة جداً' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'يجب تدوين سبب موثق لإعادة فتح الشفت' };
    }

    const index = state.shiftClosures.findIndex(c => c.id === closureId);
    if (index === -1) return { success: false, error: 'سجل إغلاق الشفت غير موجود' };
    const target = state.shiftClosures[index];

    const now = new Date();
    const saudiDateTime = formatSaudiDateTime(now);

    const updatedClosure: ShiftCloseRecord = {
      ...target,
      isClosed: false,
      reopenedAt: now.toISOString(),
      reopenedBy: state.currentUser.name,
      reopenedReason: reason.trim(),
    };

    const audit: AuditLogEntry = {
      id: `audit-shift-reopen-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: saudiDateTime,
      action: 'إعادة فتح شفت مغلق',
      details: `تمت إعادة فتح ${target.shiftName} لتاريخ ${target.shiftDate} بواسطة ${state.currentUser.name}. السبب: ${reason.trim()}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'shift',
      reason: reason.trim(),
    };

    setState(prev => {
      const nextClosures = [...prev.shiftClosures];
      nextClosures[index] = updatedClosure;
      return {
        ...prev,
        shiftClosures: nextClosures,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  // User Management
  const addUser = useCallback((userData: { 
    name: string; 
    username: string; 
    email?: string;
    roleId: string; 
    dataScope: DataScope;
    assignedShift?: ShiftType | 'any'; 
    phone?: string; 
    pinCode?: string;
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    customPermissions?: { granted: PermissionKey[]; denied: PermissionKey[] };
  }) => {
    if (!can('system.users_create')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إنشاء مستخدمين جدد' };
    }

    const trimmedName = userData.name.trim();
    const trimmedUsername = userData.username.trim().toLowerCase();
    if (!trimmedName) return { success: false, error: 'يرجى إدخال اسم الموظف' };
    if (!trimmedUsername) return { success: false, error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' };

    // Check duplicate username
    if (state.users.some(u => u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, error: 'اسم المستخدم مسجل بالفعل، يرجى اختيار اسم آخر' };
    }

    // Protection rule: non-super-admin cannot create a super admin
    const callerIsSuper = state.currentUser.roleId === 'super_admin' || state.currentUser.id === 'manager-1';
    if (userData.roleId === 'super_admin' && !callerIsSuper) {
      return { success: false, error: 'لا يمكن لغير المدير العام منح صلاحية المدير العام' };
    }

    const matchingRole = (state.roles || DEFAULT_ROLES).find(r => r.id === userData.roleId);
    const tempPassword = userData.temporaryPassword?.trim() || generateTemporaryPassword();
    const salt = generateSalt();
    const hash = hashPassword(tempPassword, salt);

    const newUser: AppUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      username: trimmedUsername,
      email: userData.email?.trim() || `${trimmedUsername}@rmstar.sa`,
      roleId: userData.roleId,
      roleName: matchingRole ? matchingRole.name : userData.roleId,
      role: userData.roleId === 'super_admin' || userData.roleId === 'manager' ? 'manager' : 'cashier',
      dataScope: userData.dataScope || (userData.roleId === 'super_admin' ? 'all' : 'shift'),
      assignedShift: userData.assignedShift || 'any',
      phone: userData.phone?.trim() || undefined,
      pinCode: userData.pinCode?.trim() || undefined,
      passwordSalt: salt,
      passwordHash: hash,
      mustChangePassword: userData.mustChangePassword !== false,
      customPermissions: userData.customPermissions,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-user-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إنشاء حساب موظف جديد',
      details: `تم إنشاء حساب "${newUser.name}" (@${newUser.username}) بدور [${newUser.roleName}] ونطاق بيانات (${newUser.dataScope}) بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
      newValue: { id: newUser.id, name: newUser.name, username: newUser.username, roleId: newUser.roleId },
    };

    setState(prev => ({
      ...prev,
      users: [...(prev.users || INITIAL_USERS), newUser],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, user: newUser, tempPassword };
  }, [state, can]);

  const updateUser = useCallback((id: string, updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>) => {
    if (!can('system.users_edit')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل بيانات وصلاحيات المستخدمين' };
    }

    const existing = (state.users || []).find(u => u.id === id);
    if (!existing) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const callerIsSuper = state.currentUser.roleId === 'super_admin' || state.currentUser.id === 'manager-1';

    // Protect against non-super promoting anyone to super admin
    if (updates.roleId === 'super_admin' && existing.roleId !== 'super_admin' && !callerIsSuper) {
      return { success: false, error: 'لا يمكن لغير المدير العام منح رتبة المدير العام' };
    }

    // Protect against demoting the last super admin
    if (existing.roleId === 'super_admin' && updates.roleId && updates.roleId !== 'super_admin') {
      if (isLastSuperAdmin(id, state.users)) {
        return { success: false, error: 'لا يمكن سحب صلاحية المدير العام عن آخر مدير عام فعّال في النظام' };
      }
    }

    // If changing password, securely re-hash
    let processedUpdates: Partial<AppUser> = { ...updates };
    if (updates.passwordHash && !updates.passwordSalt) {
      const salt = generateSalt();
      processedUpdates.passwordSalt = salt;
      processedUpdates.passwordHash = hashPassword(updates.passwordHash, salt);
    }

    if (updates.roleId) {
      const matchingRole = (state.roles || DEFAULT_ROLES).find(r => r.id === updates.roleId);
      processedUpdates.roleName = matchingRole ? matchingRole.name : updates.roleId;
      processedUpdates.role = updates.roleId === 'super_admin' || updates.roleId === 'manager' ? 'manager' : 'cashier';
    }

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-user-edit-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تعديل بيانات وصلاحيات مستخدم',
      details: `تم تعديل بيانات المستخدم "${existing.name}" (@${existing.username}) بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
      previousValue: { name: existing.name, roleId: existing.roleId, dataScope: existing.dataScope },
      newValue: updates,
    };

    setState(prev => {
      const updatedUsers = (prev.users || []).map(u => {
        if (u.id === id) {
          return { ...u, ...processedUpdates };
        }
        return u;
      });

      const updatedCurrent = prev.currentUser.id === id ? { ...prev.currentUser, ...processedUpdates } : prev.currentUser;

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrent,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    return { success: true };
  }, [state, can]);

  const resetUserPassword = useCallback((userId: string, newPassword?: string) => {
    if (!can('system.users_edit')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إعادة تعيين كلمات المرور' };
    }

    const user = (state.users || []).find(u => u.id === userId);
    if (!user) return { success: false, error: 'المستخدم غير موجود' };

    const tempPassword = newPassword?.trim() || generateTemporaryPassword();
    const salt = generateSalt();
    const hash = hashPassword(tempPassword, salt);

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-user-pwd-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إعادة تعيين كلمة المرور',
      details: `تم تعيين كلمة مرور مؤقتة للمستخدم "${user.name}" (@${user.username}) بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
    };

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? {
        ...u,
        passwordSalt: salt,
        passwordHash: hash,
        mustChangePassword: true,
      } : u),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, tempPassword };
  }, [state, can]);

  const toggleUserActive = useCallback((id: string) => {
    if (!can('system.users_toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعطيل أو تفعيل المستخدمين' };
    }

    const existing = (state.users || []).find(u => u.id === id);
    if (!existing) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (existing.id === state.currentUser.id && existing.isActive) {
      return { success: false, error: 'لا يمكنك تعطيل حسابك الحالي أثناء تسجيل الدخول به' };
    }

    if (existing.isActive && isLastSuperAdmin(id, state.users)) {
      return { success: false, error: 'لا يمكن تعطيل المدير العام الوحيد النشط في النظام منعاً لتعطيل الإدارة' };
    }

    const newActiveState = !existing.isActive;
    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-user-toggle-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: newActiveState ? 'تفعيل مستخدم' : 'تعطيل مستخدم',
      details: `تم ${newActiveState ? 'تفعيل' : 'تعطيل'} حساب المستخدم "${existing.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
    };

    setState(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === id ? { ...u, isActive: newActiveState } : u),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  const deleteUser = useCallback((id: string) => {
    if (!can('system.users_toggle')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية حذف المستخدمين' };
    }

    const existing = (state.users || []).find(u => u.id === id);
    if (!existing) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (existing.id === state.currentUser.id) {
      return { success: false, error: 'لا يمكنك حذف حسابك الحالي أثناء استخدامه' };
    }

    if (isLastSuperAdmin(id, state.users)) {
      return { success: false, error: 'لا يمكن حذف المدير العام الأخير في النظام' };
    }

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-user-del-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'حذف مستخدم',
      details: `تم حذف المستخدم "${existing.name}" (@${existing.username}) بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
    };

    setState(prev => ({
      ...prev,
      users: (prev.users || []).filter(u => u.id !== id),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  // Custom Roles & Permissions Management
  const addCustomRole = useCallback((roleData: Omit<CustomRoleDefinition, 'id' | 'createdAt' | 'isSystemRole'>) => {
    if (!can('system.roles_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية إدارة وتخصيص الأدوار' };
    }

    const newRole: CustomRoleDefinition = {
      id: `role-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: roleData.name.trim(),
      description: roleData.description.trim(),
      permissions: roleData.permissions,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
    };

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-role-add-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'إنشاء دور مخصص جديد',
      details: `تم إنشاء الدور المخصص "${newRole.name}" بعدد (${newRole.permissions.length}) صلاحيات بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
    };

    setState(prev => ({
      ...prev,
      roles: [...(prev.roles || DEFAULT_ROLES), newRole],
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true, role: newRole };
  }, [state, can]);

  const updateCustomRole = useCallback((roleId: string, updates: Partial<Omit<CustomRoleDefinition, 'id' | 'isSystemRole'>>) => {
    if (!can('system.roles_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية تعديل الأدوار' };
    }

    const role = (state.roles || DEFAULT_ROLES).find(r => r.id === roleId);
    if (!role) return { success: false, error: 'الدور غير موجود' };

    // Protect super admin role from having its core permissions revoked
    if (roleId === 'super_admin' && updates.permissions && updates.permissions.length < 5) {
      return { success: false, error: 'لا يمكن تجريد المدير العام من صلاحياته الأساسية' };
    }

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-role-edit-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'تعديل صلاحيات الدور',
      details: `تم تحديث صلاحيات الدور "${role.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
      previousValue: role.permissions,
      newValue: updates.permissions,
    };

    setState(prev => ({
      ...prev,
      roles: (prev.roles || DEFAULT_ROLES).map(r => r.id === roleId ? { ...r, ...updates, updatedAt: now.toISOString() } : r),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  const deleteCustomRole = useCallback((roleId: string) => {
    if (!can('system.roles_manage')) {
      return { success: false, error: 'غير مصرح: ليس لديك صلاحية حذف الأدوار' };
    }

    const role = (state.roles || DEFAULT_ROLES).find(r => r.id === roleId);
    if (!role) return { success: false, error: 'الدور غير موجود' };

    if (role.isSystemRole) {
      return { success: false, error: 'لا يمكن حذف الأدوار الافتراضية للنظام (المدير العام، المدير، الكاشير، المحاسب، المشاهد)' };
    }

    // Check if any user is currently assigned this role
    const assignedUsers = state.users.filter(u => u.roleId === roleId);
    if (assignedUsers.length > 0) {
      return { success: false, error: `لا يمكن حذف هذا الدور لوجود (${assignedUsers.length}) مستخدمين مرتبطين به حالياً` };
    }

    const now = getSaudiNow();
    const audit: AuditLogEntry = {
      id: `audit-role-del-${Date.now()}`,
      timestamp: now.toISOString(),
      saudiTime: formatSaudiDateTime(now),
      action: 'حذف دور مخصص',
      details: `تم حذف الدور المخصص "${role.name}" بواسطة ${state.currentUser.name}`,
      performedBy: state.currentUser.name,
      performedById: state.currentUser.id,
      category: 'user_role',
    };

    setState(prev => ({
      ...prev,
      roles: (prev.roles || DEFAULT_ROLES).filter(r => r.id !== roleId),
      auditLogs: [audit, ...prev.auditLogs],
    }));

    return { success: true };
  }, [state, can]);

  // Loyalty helper functions
  const incrementLoyaltyCounter = useCallback(() => {
    setState(prev => ({
      ...prev,
      cashierLoyaltyCounter: (prev.cashierLoyaltyCounter + 1) % 5,
    }));
  }, []);

  const resetLoyaltyCounter = useCallback(() => {
    setState(prev => ({
      ...prev,
      cashierLoyaltyCounter: 0,
    }));
  }, []);

  const setLoyaltyCounter = useCallback((val: number) => {
    setState(prev => ({
      ...prev,
      cashierLoyaltyCounter: Math.max(0, Math.min(4, val)),
    }));
  }, []);

  // Backup and Restore
  const exportDatabaseJSON = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importDatabaseJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.services)) {
        setState(parsed);
        saveStateToStorage(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }, []);

  const resetToInitial = useCallback(() => {
    const init = loadSavedState();
    setState(init);
    saveStateToStorage(init);
  }, []);

  return (
    <AccountingContext.Provider
      value={{
        state,
        currentUser: state.currentUser,
        users: state.users || INITIAL_USERS,
        roles: state.roles || DEFAULT_ROLES,
        activeShift,
        saudiTimeNow,
        setCurrentUser,
        can,
        getEffectiveUserPermissions,
        scopedSales,
        scopedDrawerMovements,
        scopedShiftClosures,
        scopedExpenses,
        scopedSalaries,
        scopedDeductions,
        payrollEmployees: state.payrollEmployees || [],
        deductions: state.deductions || [],
        canAccessRecord,
        loginUser,
        addUser,
        updateUser,
        resetUserPassword,
        toggleUserActive,
        deleteUser,
        addCustomRole,
        updateCustomRole,
        deleteCustomRole,
        recordSale,
        cancelSale,
        reassignSaleShift,
        addService,
        updateService,
        toggleServiceActive,
        deleteService,
        addExtraService,
        updateExtraService,
        toggleExtraServiceActive,
        deleteExtraService,
        recordExpense,
        payAccruedExpense,
        recordSalaryPayment,
        addEmployee,
        addPayrollEmployee,
        updatePayrollEmployee,
        togglePayrollEmployeeActive,
        recordDeduction,
        cancelDeduction,
        recordDrawerDepositWithdrawal,
        updateOpeningBalance,
        closeShift,
        reopenShift,
        incrementLoyaltyCounter,
        resetLoyaltyCounter,
        setLoyaltyCounter,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToInitial,
        metrics,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
