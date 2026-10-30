import React, { useState, useMemo } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { 
  Scissors, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Printer, 
  Users, 
  Calendar, 
  FileText, 
  X, 
  UserCheck, 
  UserX, 
  DollarSign,
  Info,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { formatSaudiDate } from '../utils/time';
import { EmployeeDeduction, PayrollEmployee } from '../types';

export const DeductionsView: React.FC = () => {
  const { 
    state, 
    currentUser, 
    can, 
    scopedDeductions, 
    payrollEmployees, 
    recordDeduction, 
    cancelDeduction,
    addPayrollEmployee,
    updatePayrollEmployee,
    togglePayrollEmployeeActive,
    saudiTimeNow
  } = useAccounting();

  // Permissions
  const canViewDeductions = can('salaries.deductions_view');
  const canManageDeductions = can('salaries.deductions_manage');
  const canCancelDeduction = can('salaries.deductions_cancel');
  const canManageEmployees = can('salaries.employees_manage') || can('salaries.create_employee');

  const currentSaudiDateStr = formatSaudiDate(saudiTimeNow);
  const currentMonthStr = currentSaudiDateStr.substring(0, 7);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState<boolean>(false);
  const [cancelModalDeduction, setCancelModalDeduction] = useState<EmployeeDeduction | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Add Deduction Form state
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [deductionAmount, setDeductionAmount] = useState<string>('');
  const [deductionReasonPreset, setDeductionReasonPreset] = useState<string>('غياب غير مبرر');
  const [customReason, setCustomReason] = useState<string>('');
  const [deductionDate, setDeductionDate] = useState<string>(currentSaudiDateStr);
  const [deductionNotes, setDeductionNotes] = useState<string>('');
  const [allowExceedConfirm, setAllowExceedConfirm] = useState<boolean>(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // New Payroll Employee Form state (Inside Employees Modal)
  const [newEmpFullName, setNewEmpFullName] = useState<string>('');
  const [newEmpJobTitle, setNewEmpJobTitle] = useState<string>('فني غسيل وتلميع');
  const [newEmpSalary, setNewEmpSalary] = useState<string>('');
  const [newEmpNotes, setNewEmpNotes] = useState<string>('');
  const [empFormError, setEmpFormError] = useState<string | null>(null);

  // Edit employee state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editEmpName, setEditEmpName] = useState<string>('');
  const [editEmpJob, setEditEmpJob] = useState<string>('');
  const [editEmpSalary, setEditEmpSalary] = useState<string>('');

  // Combine employees list: state.payrollEmployees or fallback to active salaries
  const allEmployeesList = useMemo(() => {
    if (payrollEmployees && payrollEmployees.length > 0) {
      return payrollEmployees;
    }
    // Fallback: derive from salaries
    const map = new Map<string, PayrollEmployee>();
    for (const s of state.salaries) {
      const id = s.employeeId || s.id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          fullName: s.employeeName,
          jobTitle: s.jobTitle,
          basicSalary: s.monthlySalary,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
        });
      }
    }
    return Array.from(map.values());
  }, [payrollEmployees, state.salaries]);

  // Selected employee for deduction calculation preview in add modal
  const selectedEmpDetails = useMemo(() => {
    if (!selectedEmpId) return null;
    const emp = allEmployeesList.find(e => e.id === selectedEmpId);
    const sal = state.salaries.find(s => (s.employeeId === selectedEmpId || s.id === selectedEmpId) && s.month === deductionDate.substring(0, 7));
    const basic = emp ? emp.basicSalary : (sal ? sal.monthlySalary : 0);
    const deductionsTotal = sal ? (sal.deductionsTotal || 0) : 0;
    const paidTotal = sal ? (sal.totalPaid || 0) : 0;
    const netDue = Math.max(0, basic - deductionsTotal - paidTotal);

    return {
      emp,
      basic,
      deductionsTotal,
      paidTotal,
      netDue,
    };
  }, [selectedEmpId, allEmployeesList, state.salaries, deductionDate]);

  // Filtered Deductions
  const filteredDeductions = useMemo(() => {
    return scopedDeductions.filter(d => {
      // Month filter
      if (selectedMonth && d.month !== selectedMonth) return false;
      // Employee filter
      if (selectedEmployeeFilter !== 'all' && d.employeeId !== selectedEmployeeFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = d.employeeName.toLowerCase().includes(q);
        const matchesReason = d.reason.toLowerCase().includes(q);
        const matchesLoggedBy = d.loggedBy.toLowerCase().includes(q);
        if (!matchesName && !matchesReason && !matchesLoggedBy) return false;
      }
      return true;
    });
  }, [scopedDeductions, selectedMonth, selectedEmployeeFilter, statusFilter, searchQuery]);

  // KPIs for the selected month
  const monthKpis = useMemo(() => {
    const monthDeductions = scopedDeductions.filter(d => d.month === selectedMonth && d.status === 'approved');
    const totalDeductionsAmount = monthDeductions.reduce((sum, d) => sum + d.amount, 0);
    const affectedEmployeesSet = new Set(monthDeductions.map(d => d.employeeId));

    // Net salaries due for this month
    const monthSalaries = state.salaries.filter(s => s.month === selectedMonth);
    const totalObligation = monthSalaries.reduce((sum, s) => sum + s.monthlySalary, 0);
    const totalPaid = monthSalaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const netDue = Math.max(0, totalObligation - totalDeductionsAmount - totalPaid);

    return {
      totalApprovedAmount: totalDeductionsAmount,
      approvedCount: monthDeductions.length,
      affectedEmployeesCount: affectedEmployeesSet.size,
      netSalariesDue: netDue,
      totalBasicSalaries: totalObligation,
    };
  }, [scopedDeductions, state.salaries, selectedMonth]);

  // Handler: Open Add Modal
  const handleOpenAddModal = () => {
    setAddFormError(null);
    setAllowExceedConfirm(false);
    setDeductionAmount('');
    setCustomReason('');
    setDeductionNotes('');
    setDeductionDate(currentSaudiDateStr);
    if (allEmployeesList.length > 0 && !selectedEmpId) {
      setSelectedEmpId(allEmployeesList[0].id);
    }
    setShowAddModal(true);
  };

  // Handler: Submit Add Deduction
  const handleSubmitDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    if (!selectedEmpId) {
      setAddFormError('يرجى اختيار الموظف المطلوب الخصم عليه');
      return;
    }

    const amt = parseFloat(deductionAmount);
    if (isNaN(amt) || amt <= 0) {
      setAddFormError('مبلغ الخصم يجب أن يكون أكبر من الصفر');
      return;
    }

    const finalReason = deductionReasonPreset === 'سبب آخر' 
      ? customReason.trim() 
      : deductionReasonPreset;

    if (!finalReason) {
      setAddFormError('يرجى كتابة سبب الخصم بوضوح');
      return;
    }

    const res = recordDeduction({
      employeeId: selectedEmpId,
      amount: amt,
      reason: finalReason,
      date: deductionDate,
      month: deductionDate.substring(0, 7),
      notes: deductionNotes.trim() || undefined,
      allowExceedNet: allowExceedConfirm,
    });

    if (res.success) {
      setShowAddModal(false);
      setDeductionAmount('');
      setCustomReason('');
      setDeductionNotes('');
      setAllowExceedConfirm(false);
    } else {
      setAddFormError(res.error || 'حدث خطأ أثناء تسجيل الخصم');
    }
  };

  // Handler: Open Cancel Modal
  const handleOpenCancelModal = (deduction: EmployeeDeduction) => {
    setCancelModalDeduction(deduction);
    setCancelReasonInput('');
    setCancelError(null);
  };

  // Handler: Submit Cancel
  const handleSubmitCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalDeduction) return;

    if (!cancelReasonInput.trim()) {
      setCancelError('تدوين سبب إلغاء الخصم إلزامي لتوثيق العملية في سجل التدقيق');
      return;
    }

    const res = cancelDeduction(cancelModalDeduction.id, cancelReasonInput.trim());
    if (res.success) {
      setCancelModalDeduction(null);
      setCancelReasonInput('');
      setCancelError(null);
    } else {
      setCancelError(res.error || 'حدث خطأ أثناء إلغاء الخصم');
    }
  };

  // Handler: Submit Add Payroll Employee
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpFormError(null);

    const sal = parseFloat(newEmpSalary);
    if (!newEmpFullName.trim() || !newEmpJobTitle.trim() || isNaN(sal) || sal <= 0) {
      setEmpFormError('يرجى ملء جميع الحقول والتحقق من أن الراتب الأساسي أكبر من صفر');
      return;
    }

    const res = addPayrollEmployee(
      newEmpFullName.trim(),
      newEmpJobTitle.trim(),
      sal,
      newEmpNotes.trim() || undefined
    );

    if (res.success) {
      setNewEmpFullName('');
      setNewEmpJobTitle('فني غسيل وتلميع');
      setNewEmpSalary('');
      setNewEmpNotes('');
      setEmpFormError(null);
    } else {
      setEmpFormError(res.error || 'حدث خطأ أثناء إضافة الموظف');
    }
  };

  // Handler: Save Edited Employee
  const handleSaveEditEmployee = (id: string) => {
    const sal = parseFloat(editEmpSalary);
    if (!editEmpName.trim() || !editEmpJob.trim() || isNaN(sal) || sal <= 0) return;

    updatePayrollEmployee(id, {
      fullName: editEmpName.trim(),
      jobTitle: editEmpJob.trim(),
      basicSalary: sal,
    });
    setEditingEmpId(null);
  };

  const handleStartEdit = (emp: PayrollEmployee) => {
    setEditingEmpId(emp.id);
    setEditEmpName(emp.fullName);
    setEditEmpJob(emp.jobTitle);
    setEditEmpSalary(String(emp.basicSalary));
  };

  // Handler: Print
  const handlePrint = () => {
    window.print();
  };

  // Permission Guard
  if (!canViewDeductions) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">غير مصرح بالوصول</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          شاشة خصومات واستقطاعات الموظفين مخصصة للإدارة العامة والمحاسب المخوّل فقط.
          حساب الكاشير محجوب تماماً عن الاطلاع على الرواتب والخصومات المالية.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Scissors className="w-6 h-6 text-sky-400" />
              <span>خصومات واستقطاعات الموظفين</span>
            </h1>
            <span className="text-[11px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-md font-semibold">
              تعديل مستحقات معتمد
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            وفق المعالجة المحاسبية السليمة: الخصم يقلل من صافي التزام الراتب المستحق للموظف، 
            ولا يُعتبر مصروفاً تشغيلياً على المغسلة ولا يؤثر على رصيد الكاش بالصندوق تلقائياً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {canManageEmployees && (
            <button
              onClick={() => setShowEmployeesModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>قائمة موظفي المغسلة ({allEmployeesList.length})</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة الكشف</span>
          </button>

          {canManageDeductions && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs shadow-md shadow-sky-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل خصم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block text-right mb-6 border-b border-slate-300 pb-4 text-slate-900">
        <h1 className="text-2xl font-black">RM STAR CAR WASH - مغسلة النجم الساطع</h1>
        <h2 className="text-lg font-bold mt-1">كشف خصومات واستقطاعات العاملين لشهر {selectedMonth}</h2>
        <div className="text-xs text-slate-600 mt-2 flex justify-between">
          <span>تاريخ الطباعة: {currentSaudiDateStr}</span>
          <span>المسؤول المستخرج: {currentUser.name}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Deductions Approved */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <span className="text-[11px] sm:text-xs text-slate-400 block mb-1">إجمالي الخصومات المعتمدة:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono-numbers">
              {monthKpis.totalApprovedAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">ر.س</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">لشهر {selectedMonth}</span>
        </div>

        {/* Deductions Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <span className="text-[11px] sm:text-xs text-slate-400 block mb-1">عدد الخصومات المعتمدة:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white font-mono-numbers">
              {monthKpis.approvedCount}
            </span>
            <span className="text-[10px] text-slate-400">عملية</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">استقطاعات موثقة بالسبب</span>
        </div>

        {/* Affected Employees Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <span className="text-[11px] sm:text-xs text-slate-400 block mb-1">الموظفون المخصوم عليهم:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono-numbers">
              {monthKpis.affectedEmployeesCount}
            </span>
            <span className="text-[10px] text-slate-400">من أصل {allEmployeesList.length}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">معدل الانضباط والالتزام</span>
        </div>

        {/* Net Salaries Due After Deductions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <span className="text-[11px] sm:text-xs text-slate-400 block mb-1">صافي الرواتب المستحقة:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono-numbers">
              {monthKpis.netSalariesDue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">ر.س</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            الأساسي ({monthKpis.totalBasicSalaries.toLocaleString()}) − الخصومات
          </span>
        </div>
      </div>

      {/* Accounting Formula Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 text-[11px] leading-relaxed">
          <strong className="text-amber-300">المعادلة المحاسبية المعتمدة: </strong>
          <span>صافي الراتب المستحق = الراتب الأساسي − الخصومات المعتمدة − المدفوعات المسجلة. منع احتساب أي استقطاع مرتين أو اعتباره مصروف مغسلة خارجي.</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Month Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">شهر الاستحقاق:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Employee Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">تصفية حسب الموظف:</label>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">جميع موظفي المغسلة ({allEmployeesList.length})</option>
              {allEmployeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} - {emp.jobTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">حالة الخصم:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">الكل (معتمد وملغي)</option>
              <option value="approved">معتمد فقط</option>
              <option value="cancelled">ملغي فقط</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">بحث في السبب أو الموظف:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">سجل الخصومات المسجلة</h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {filteredDeductions.length} عملية
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            شهر {selectedMonth}
          </span>
        </div>

        {filteredDeductions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40" />
            <p className="font-medium text-slate-300">لا توجد خصومات مسجلة تطابق هذه المعايير</p>
            <p className="text-[11px] text-slate-500">طاقم العمل منتظم ولا توجد استقطاعات مسجلة في هذا الشهر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3.5">تاريخ الخصم</th>
                  <th className="p-3.5">اسم الموظف</th>
                  <th className="p-3.5">سبب الخصم</th>
                  <th className="p-3.5 text-center">مبلغ الخصم</th>
                  <th className="p-3.5 text-center">الراتب الأساسي</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5">سجل بواسطة</th>
                  <th className="p-3.5 text-center no-print">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDeductions.map(ded => {
                  const isCancelled = ded.status === 'cancelled';
                  const emp = allEmployeesList.find(e => e.id === ded.employeeId);
                  const basic = emp ? emp.basicSalary : 3000;

                  return (
                    <tr 
                      key={ded.id} 
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isCancelled ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                        {ded.date}
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {new Date(ded.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">
                          {ded.employeeName}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {emp ? emp.jobTitle : 'فني غسيل'}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-200">
                          {ded.reason}
                        </div>
                        {ded.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">
                            ملاحظة: {ded.notes}
                          </p>
                        )}
                        {isCancelled && ded.cancelReason && (
                          <div className="mt-1 p-1.5 rounded bg-rose-950/40 border border-rose-500/20 text-[10px] text-rose-300">
                            <strong>سبب الإلغاء:</strong> {ded.cancelReason} ({ded.cancelledBy})
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center font-mono-numbers text-sm font-bold text-rose-400 whitespace-nowrap">
                        <span className={isCancelled ? 'line-through text-slate-500' : ''}>
                          {ded.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 mr-1">ر.س</span>
                      </td>

                      <td className="p-3.5 text-center font-mono-numbers text-slate-300 whitespace-nowrap">
                        {basic.toLocaleString()} <span className="text-[10px] text-slate-500">ر.س</span>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          isCancelled
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isCancelled ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>ملغي</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>معتمد</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        <span className="font-medium text-slate-200">{ded.loggedBy}</span>
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap no-print">
                        {!isCancelled && canCancelDeduction ? (
                          <button
                            onClick={() => handleOpenCancelModal(ded)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                            title="إلغاء الخصم مع تدوين السبب"
                          >
                            إلغاء الخصم
                          </button>
                        ) : isCancelled ? (
                          <span className="text-[10px] text-slate-500">تم الإلغاء</span>
                        ) : (
                          <span className="text-[10px] text-slate-600">للمدير العام</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Employee Breakdown Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              ملخص مسير رواتب واستقطاعات الموظفين لشهر ({selectedMonth})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            حسابات آلية تضمن عدم تكرار الخصم
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {allEmployeesList.map(emp => {
            const sal = state.salaries.find(s => (s.employeeId === emp.id || s.id === emp.id) && s.month === selectedMonth);
            const basic = emp.basicSalary;
            const empDeductions = scopedDeductions.filter(d => d.employeeId === emp.id && d.month === selectedMonth && d.status === 'approved');
            const totalDeds = empDeductions.reduce((sum, d) => sum + d.amount, 0);
            const totalPaid = sal ? sal.totalPaid : 0;
            const netRemaining = Math.max(0, basic - totalDeds - totalPaid);

            return (
              <div 
                key={emp.id} 
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{emp.fullName}</h4>
                    <span className="text-[11px] text-slate-400">{emp.jobTitle}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    emp.isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {emp.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                {/* Numbers row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg text-center text-xs font-mono-numbers">
                  <div>
                    <span className="text-[10px] text-slate-400 block">الأساسي:</span>
                    <span className="font-bold text-white">{basic.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block">الخصومات:</span>
                    <span className="font-bold text-rose-400">{totalDeds.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block">صافي المستحق:</span>
                    <span className="font-bold text-emerald-400">{netRemaining.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions Breakdown mini-list */}
                {empDeductions.length > 0 ? (
                  <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="text-[10px] text-slate-400 font-semibold block">تفاصيل الخصومات ({empDeductions.length}):</span>
                    {empDeductions.map(d => (
                      <div key={d.id} className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-2 py-1 rounded">
                        <span className="truncate max-w-[150px]">{d.reason} ({d.date})</span>
                        <span className="font-bold text-rose-400 font-mono-numbers">−{d.amount} ر.س</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 text-center pt-1">
                    لا توجد خصومات على هذا الموظف هذا الشهر
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add Deduction */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 overflow-y-auto">
          <form 
            onSubmit={handleSubmitDeduction}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto text-right"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">تسجيل خصم مالي على موظف</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addFormError && (
              <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p>{addFormError}</p>
                  {selectedEmpDetails && parseFloat(deductionAmount) > selectedEmpDetails.netDue && (
                    <label className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-500/30 cursor-pointer font-bold text-white">
                      <input
                        type="checkbox"
                        checked={allowExceedConfirm}
                        onChange={(e) => setAllowExceedConfirm(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>تأكيد صريح: أوافق على خصم مبلغ يتجاوز صافي الراتب المستحق</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اختر الموظف: <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              >
                {allEmployeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.jobTitle}) - الراتب: {emp.basicSalary} ر.س
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Balance Live Summary Card */}
            {selectedEmpDetails && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>الراتب الأساسي الثابت:</span>
                  <span className="font-bold text-white font-mono-numbers">{selectedEmpDetails.basic.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>إجمالي الخصومات المسجلة هذا الشهر:</span>
                  <span className="font-bold text-rose-400 font-mono-numbers">−{selectedEmpDetails.deductionsTotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>المدفوعات المسددة مسبقاً:</span>
                  <span className="font-bold text-slate-300 font-mono-numbers">−{selectedEmpDetails.paidTotal.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1.5 border-t border-slate-800 font-bold">
                  <span>صافي الراتب المستحق الحالي:</span>
                  <span className="text-emerald-400 font-mono-numbers">{selectedEmpDetails.netDue.toLocaleString()} ر.س</span>
                </div>
              </div>
            )}

            {/* Deduction Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  مبلغ الخصم (ر.س): <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="مثال: 100"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono-numbers text-sm focus:outline-none focus:border-amber-500"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500">ر.س</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تاريخ الخصم: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={deductionDate}
                  onChange={(e) => setDeductionDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Reason Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                سبب الخصم: <span className="text-rose-400">*</span>
              </label>
              <select
                value={deductionReasonPreset}
                onChange={(e) => setDeductionReasonPreset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500 mb-2"
              >
                <option value="غياب غير مبرر">غياب يوم كامل بدون عذر مسبق</option>
                <option value="تأخير متكرر عن بداية الشفت">تأخير متكرر عن استلام الشفت</option>
                <option value="إتلاف أدوات ومعدات الغسيل">إتلاف أدوات أو فوهات أو مضخات غسيل</option>
                <option value="مخالفة تعليمات السلامة والنظافة">مخالفة اشتراطات السلامة والزي الرسمي</option>
                <option value="شكوى عميل مثبتة وسوء خدمة">شكوى عميل مثبتة على سوء تنظيف المركبة</option>
                <option value="سلفة شهرية مستقطعة">سلفة نقدية مستقطعة من الراتب</option>
                <option value="سبب آخر">سبب آخر (تحديد يدوي)</option>
              </select>

              {deductionReasonPreset === 'سبب آخر' && (
                <input
                  type="text"
                  placeholder="اكتب سبب الخصم التفصيلي هنا..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ملاحظات إضافية (اختياري):
              </label>
              <textarea
                rows={2}
                placeholder="أرقام سيارات ذات صلة، أو تفاصيل محضر الواقعة..."
                value={deductionNotes}
                onChange={(e) => setDeductionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                اعتماد وتسجيل الخصم
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cancel Deduction (Requires mandatory cancellation reason) */}
      {cancelModalDeduction && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3.5">
          <form 
            onSubmit={handleSubmitCancel}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">إلغاء خصم موظف</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setCancelModalDeduction(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">الموظف:</span>
                <span className="font-bold text-white">{cancelModalDeduction.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ الخصم:</span>
                <span className="font-bold text-rose-400 font-mono-numbers">{cancelModalDeduction.amount} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">السبب الأصلي:</span>
                <span className="text-slate-200">{cancelModalDeduction.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ الخصم:</span>
                <span className="text-slate-300 font-mono">{cancelModalDeduction.date}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              وفق ضوابط الحماية والرقابة: لن يُحذف الخصم من قاعدة البيانات، بل ستتغير حالته إلى 
              <strong>«ملغي»</strong> مع إعادة المبلغ تلقائياً إلى صافي استحقاق الموظف وتوثيق الإجراء في سجل التدقيق.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                سبب إلغاء الخصم (إلزامي): <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="اكتب التبرير الإداري لإلغاء هذا الخصم (مثل: تقديم عذر طبي مقبول، خطأ في تسجيل الاسم)..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCancelModalDeduction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                تراجع
              </button>
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تأكيد إلغاء الخصم واستعادة المستحق
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Manage Payroll Employees (Roster) */}
      {showEmployeesModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">قائمة موظفي وعمال مغسلة RM STAR</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEmployeesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note about login accounts */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>تنويه أمني وإداري: </strong>
                الموظفون المسجلون في هذه القائمة هم عمال وفنيو تشغيل مسير الرواتب.
                <strong> لا يحتاجون إلى حسابات دخول أو كلمات مرور</strong>.
                حسابات الدخول مخصصة فقط لمن يستخدم النظام (الكاشير والمدير) من شاشة «إدارة المستخدمين والصلاحيات».
              </div>
            </div>

            {empFormError && (
              <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                {empFormError}
              </div>
            )}

            {/* Add Employee Form */}
            <form onSubmit={handleAddEmployeeSubmit} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-amber-400 text-xs">إضافة موظف جديد إلى سجل الرواتب:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الاسم الكامل: *</label>
                  <input
                    type="text"
                    placeholder="مثال: سلمان الشهري"
                    value={newEmpFullName}
                    onChange={(e) => setNewEmpFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">المسمى الوظيفي: *</label>
                  <input
                    type="text"
                    placeholder="فني غسيل، عامل تجفيف..."
                    value={newEmpJobTitle}
                    onChange={(e) => setNewEmpJobTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الراتب الأساسي الثابت (ر.س): *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 3000"
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-slate-500">
                  لن يتم إنشاء أي حساب دخول أو كلمة مرور لهذا الموظف
                </span>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  حفظ وإدراج الموظف
                </button>
              </div>
            </form>

            {/* Existing Employees Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">الوظيفة</th>
                    <th className="p-3 text-center">الراتب الشهري الأساسي</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {allEmployeesList.map(emp => {
                    const isEditing = editingEmpId === emp.id;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-800/30">
                        {isEditing ? (
                          <>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editEmpName}
                                onChange={(e) => setEditEmpName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editEmpJob}
                                onChange={(e) => setEditEmpJob(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                value={editEmpSalary}
                                onChange={(e) => setEditEmpSalary(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono w-24 text-center mx-auto"
                              />
                            </td>
                            <td className="p-2.5 text-center text-slate-400">
                              -
                            </td>
                            <td className="p-2.5 text-center space-x-1 space-x-reverse">
                              <button
                                onClick={() => handleSaveEditEmployee(emp.id)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded text-[11px] font-bold"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingEmpId(null)}
                                className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[11px]"
                              >
                                إلغاء
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-bold text-white">
                              {emp.fullName}
                            </td>
                            <td className="p-3 text-slate-300">
                              {emp.jobTitle}
                            </td>
                            <td className="p-3 text-center font-mono-numbers font-bold text-amber-400">
                              {emp.basicSalary.toLocaleString()} <span className="text-[10px] text-slate-500">ر.س</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                emp.isActive 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {emp.isActive ? 'نشط' : 'معطّل'}
                              </span>
                            </td>
                            <td className="p-3 text-center space-x-1.5 space-x-reverse whitespace-nowrap">
                              <button
                                onClick={() => handleStartEdit(emp)}
                                className="text-slate-400 hover:text-amber-400 p-1"
                                title="تعديل بيانات الموظف والراتب"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => togglePayrollEmployeeActive(emp.id)}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  emp.isActive 
                                    ? 'text-rose-400 hover:bg-rose-500/10' 
                                    : 'text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                {emp.isActive ? 'تعطيل' : 'تفعيل'}
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEmployeesModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
