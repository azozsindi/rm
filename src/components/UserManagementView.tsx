import React, { useState, useMemo } from 'react';
import { useAccounting } from '../store/AccountingContext';
import { AppUser, CustomRoleDefinition, PermissionKey, DataScope, ShiftType } from '../types';
import { ALL_PERMISSIONS, DEFAULT_ROLES, generateTemporaryPassword } from '../utils/security';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  UserCheck, 
  KeyRound, 
  Phone, 
  Clock, 
  Edit3, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertCircle,
  X,
  Lock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Share2
} from 'lucide-react';
import { ShareCredentialsModal } from './ShareCredentialsModal';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    roles, 
    currentUser, 
    setCurrentUser, 
    can,
    getEffectiveUserPermissions,
    addUser, 
    updateUser, 
    resetUserPassword,
    toggleUserActive, 
    deleteUser,
    addCustomRole,
    updateCustomRole,
    deleteCustomRole
  } = useAccounting();

  // Active sub-tab: 'users' or 'roles_matrix'
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles_matrix'>('users');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userCustomizingPermissions, setUserCustomizingPermissions] = useState<AppUser | null>(null);

  // Password reset modal
  const [passwordResetUser, setPasswordResetUser] = useState<AppUser | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string>('');
  const [passwordCopied, setPasswordCopied] = useState<boolean>(false);

  // Custom role modal
  const [showAddRoleModal, setShowAddRoleModal] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<CustomRoleDefinition | null>(null);

  // Share credentials modal state (username, password, designated login link)
  const [shareCredentialsData, setShareCredentialsData] = useState<{ user: AppUser; password?: string; isNewUser?: boolean } | null>(null);

  // User form states
  const [formName, setFormName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRoleId, setFormRoleId] = useState<string>('cashier');
  const [formDataScope, setFormDataScope] = useState<DataScope>('shift');
  const [formAssignedShift, setFormAssignedShift] = useState<ShiftType | 'any'>('any');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPinCode, setFormPinCode] = useState<string>('');
  const [formTempPassword, setFormTempPassword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role Form states
  const [roleFormName, setRoleFormName] = useState<string>('');
  const [roleFormDesc, setRoleFormDesc] = useState<string>('');
  const [roleSelectedPerms, setRoleSelectedPerms] = useState<Set<PermissionKey>>(new Set());

  // Individual User Custom Permissions State
  const [userGrantedPerms, setUserGrantedPerms] = useState<Set<PermissionKey>>(new Set());
  const [userDeniedPerms, setUserDeniedPerms] = useState<Set<PermissionKey>>(new Set());

  // Permissions checked
  const canManageUsers = can('system.users_create') || can('system.users_edit');
  const canManageRoles = can('system.roles_manage');
  const isSuperAdmin = currentUser.roleId === 'super_admin' || currentUser.id === 'manager-1';

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        u.name.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q) || 
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      const matchRole = roleFilter === 'all' || u.roleId === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
      const matchShift = 
        shiftFilter === 'all' || 
        (shiftFilter === 'morning' && (u.assignedShift === 'morning' || u.assignedShift === 'hakim')) ||
        (shiftFilter === 'evening' && (u.assignedShift === 'evening' || u.assignedShift === 'bandar')) ||
        u.assignedShift === shiftFilter;

      return matchSearch && matchRole && matchStatus && matchShift;
    });
  }, [users, searchQuery, roleFilter, statusFilter, shiftFilter]);

  // Grouped Permissions by Module for Matrix Table
  const modulesList = useMemo(() => [
    { id: 'sales', label: 'المبيعات والكاشير' },
    { id: 'services', label: 'الخدمات والأسعار' },
    { id: 'shifts', label: 'إدارة الشفتات' },
    { id: 'drawer', label: 'الصندوق والمصروفات' },
    { id: 'salaries', label: 'الرواتب والمستحقات' },
    { id: 'reports', label: 'التقارير المالية' },
    { id: 'system', label: 'إدارة النظام والأمان' },
  ], []);

  // Open Add User
  const handleOpenAddUser = () => {
    const generated = generateTemporaryPassword();
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormRoleId('cashier');
    setFormDataScope('shift');
    setFormAssignedShift('any');
    setFormPhone('');
    setFormPinCode('');
    setFormTempPassword(generated);
    setFormError('');
    setShowAddUserModal(true);
  };

  // Open Edit User
  const handleOpenEditUser = (u: AppUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormEmail(u.email || '');
    setFormRoleId(u.roleId || (u.role === 'manager' ? 'manager' : 'cashier'));
    setFormDataScope(u.dataScope || 'all');
    setFormAssignedShift(u.assignedShift || 'any');
    setFormPhone(u.phone || '');
    setFormPinCode(u.pinCode || '');
    setFormTempPassword('');
    setFormError('');
  };

  // Submit Add User
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('يرجى كتابة اسم الموظف');
      return;
    }
    if (!formUsername.trim()) {
      setFormError('يرجى تحديد اسم المستخدم لتسجيل الدخول');
      return;
    }

    const res = addUser({
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim() || undefined,
      roleId: formRoleId,
      dataScope: formDataScope,
      assignedShift: formAssignedShift,
      phone: formPhone.trim() || undefined,
      pinCode: formPinCode.trim() || undefined,
      temporaryPassword: formTempPassword.trim() || undefined,
    });

    if (res.success) {
      setShowAddUserModal(false);
      if (res.user) {
        setShareCredentialsData({
          user: res.user,
          password: res.tempPassword,
          isNewUser: true,
        });
      }
      setFeedbackMsg({ 
        type: 'success', 
        text: `تم إنشاء حساب "${formName}" بنجاح! تم فتح بطاقة مشاركة بيانات الدخول والرابط المخصص.` 
      });
      setTimeout(() => setFeedbackMsg(null), 8000);
    } else {
      setFormError(res.error || 'فشلت إضافة المستخدم');
    }
  };

  // Submit Edit User
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');

    if (!formName.trim()) {
      setFormError('يرجى كتابة اسم الموظف');
      return;
    }

    const res = updateUser(editingUser.id, {
      name: formName.trim(),
      username: formUsername.trim() || editingUser.username,
      email: formEmail.trim() || undefined,
      roleId: formRoleId,
      dataScope: formDataScope,
      assignedShift: formAssignedShift,
      phone: formPhone.trim() || undefined,
      pinCode: formPinCode.trim() || undefined,
    });

    if (res.success) {
      setEditingUser(null);
      setFeedbackMsg({ type: 'success', text: `تم تحديث بيانات الموظف "${formName}" بنجاح!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFormError(res.error || 'فشل تحديث البيانات');
    }
  };

  // Open Reset Password
  const handleOpenResetPassword = (u: AppUser) => {
    setPasswordResetUser(u);
    const temp = generateTemporaryPassword();
    setNewTempPassword(temp);
    setPasswordCopied(false);
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = () => {
    if (!passwordResetUser) return;
    const targetUser = passwordResetUser;
    const res = resetUserPassword(targetUser.id, newTempPassword);
    if (res.success) {
      setPasswordResetUser(null);
      setShareCredentialsData({
        user: targetUser,
        password: res.tempPassword,
        isNewUser: false,
      });
      setFeedbackMsg({ 
        type: 'success', 
        text: `تم تعيين كلمة مرور جديدة لـ (${targetUser.name}) وتم فتح بطاقة المشاركة!` 
      });
      setTimeout(() => setFeedbackMsg(null), 8000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر إعادة تعيين كلمة المرور' });
    }
  };

  // Open User Custom Permissions Matrix Modal
  const handleOpenCustomPermissions = (u: AppUser) => {
    setUserCustomizingPermissions(u);
    const granted = new Set<PermissionKey>(u.customPermissions?.granted || []);
    const denied = new Set<PermissionKey>(u.customPermissions?.denied || []);
    setUserGrantedPerms(granted);
    setUserDeniedPerms(denied);
  };

  // Save User Custom Permissions
  const handleSaveUserCustomPermissions = () => {
    if (!userCustomizingPermissions) return;
    const res = updateUser(userCustomizingPermissions.id, {
      customPermissions: {
        granted: Array.from(userGrantedPerms),
        denied: Array.from(userDeniedPerms),
      }
    });

    if (res.success) {
      setUserCustomizingPermissions(null);
      setFeedbackMsg({ type: 'success', text: `تم حفظ الصلاحيات المخصصة لـ (${userCustomizingPermissions.name}) بنجاح!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر حفظ الصلاحيات' });
    }
  };

  // Open Add Role Modal
  const handleOpenAddRole = () => {
    setRoleFormName('');
    setRoleFormDesc('');
    // Default clone cashier perms
    const cashierRole = roles.find(r => r.id === 'cashier');
    setRoleSelectedPerms(new Set(cashierRole ? cashierRole.permissions : []));
    setShowAddRoleModal(true);
  };

  // Save Add Role
  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormName.trim()) return;

    const res = addCustomRole({
      name: roleFormName.trim(),
      description: roleFormDesc.trim() || 'دور وظيفي مخصص',
      permissions: Array.from(roleSelectedPerms),
    });

    if (res.success) {
      setShowAddRoleModal(false);
      setFeedbackMsg({ type: 'success', text: `تم إنشاء الدور الوظيفي "${roleFormName}" بنجاح!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر إنشاء الدور' });
    }
  };

  // Open Edit Role
  const handleOpenEditRole = (role: CustomRoleDefinition) => {
    setEditingRole(role);
    setRoleFormName(role.name);
    setRoleFormDesc(role.description);
    setRoleSelectedPerms(new Set(role.permissions));
  };

  // Save Edit Role
  const handleEditRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    const res = updateCustomRole(editingRole.id, {
      name: roleFormName.trim(),
      description: roleFormDesc.trim(),
      permissions: Array.from(roleSelectedPerms),
    });

    if (res.success) {
      setEditingRole(null);
      setFeedbackMsg({ type: 'success', text: `تم تحديث صلاحيات الدور "${roleFormName}" بنجاح!` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر تعديل الدور' });
    }
  };

  // Delete Role
  const handleDeleteRole = (role: CustomRoleDefinition) => {
    if (confirm(`هل أنت متأكد من حذف الدور المخصص "${role.name}"؟`)) {
      const res = deleteCustomRole(role.id);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `تم حذف الدور بنجاح` });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'تعذر حذف الدور' });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>إدارة المستخدمين والأدوار والصلاحيات</span>
                  <span className="text-[10px] sm:text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                    RBAC متقدم
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  إنشاء حسابات الموظفين، مصفوفة الصلاحيات التفصيلية، تشفير كلمات المرور SHA-256، والتحكم بنطاق البيانات والشفتات
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canManageUsers && (
              <button
                onClick={handleOpenAddUser}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-xs sm:text-sm min-h-[42px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة موظف جديد</span>
              </button>
            )}

            {canManageRoles && (
              <button
                onClick={handleOpenAddRole}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl transition-all text-xs sm:text-sm min-h-[42px]"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>إنشاء دور مخصص</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 text-xs sm:text-sm">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الموظفون والمستخدمون ({users.length})</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('roles_matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeSubTab === 'roles_matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>مصفوفة الصلاحيات والأدوار ({roles.length})</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-lg transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: USERS LIST & ADVANCED SEARCH                   */}
      {/* ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          
          {/* Search & Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              
              {/* Search text */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الموظف، اسم المستخدم، البريد، أو الجوال..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 min-w-[130px]"
              >
                <option value="all">كل الأدوار</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              {/* Shift filter */}
              <select
                value={shiftFilter}
                onChange={e => setShiftFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 min-w-[120px]"
              >
                <option value="all">كل الورديات</option>
                <option value="morning">☀️ شفت الصباح (12:00 ص – 12:00 م)</option>
                <option value="evening">🌙 شفت المساء (12:00 م – 12:00 ص)</option>
                <option value="any">أي شفت (متاح)</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 min-w-[110px]"
              >
                <option value="all">كل الحالات</option>
                <option value="active">النشط فقط</option>
                <option value="inactive">المعطل فقط</option>
              </select>
            </div>
          </div>

          {/* Users List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => {
              const isCurrent = currentUser.id === user.id;
              const userRole = roles.find(r => r.id === user.roleId) || { name: user.roleName || user.roleId };
              const effectivePermsCount = getEffectiveUserPermissions(user).length;
              const hasCustomOverrides = Boolean(
                user.customPermissions && 
                ((user.customPermissions.granted && user.customPermissions.granted.length > 0) ||
                 (user.customPermissions.denied && user.customPermissions.denied.length > 0))
              );

              return (
                <div
                  key={user.id}
                  className={`bg-slate-900/90 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                    isCurrent 
                      ? 'border-sky-500 shadow-lg shadow-sky-500/15 ring-1 ring-sky-500/40' 
                      : user.isActive 
                      ? 'border-slate-800 hover:border-slate-700' 
                      : 'border-slate-800/40 opacity-60 bg-slate-950/40'
                  }`}
                >
                  <div>
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                          user.roleId === 'super_admin' 
                            ? 'bg-gradient-to-br from-sky-400 to-cyan-500 text-slate-950 shadow-sky-500/30' 
                            : user.roleId === 'manager'
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : user.roleId === 'accountant'
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                            : 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {user.roleId === 'super_admin' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                              {user.name}
                            </h3>
                            {isCurrent && (
                              <span className="bg-sky-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm shadow-sky-500/20">
                                أنت الآن
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        user.isActive 
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' 
                          : 'bg-rose-950/50 border-rose-500/40 text-rose-400'
                      }`}>
                        {user.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </div>

                    {/* Metadata Badges */}
                    <div className="space-y-2 py-2 border-t border-slate-800/80 text-xs">
                      
                      {/* Role & Perms */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-500/70" />
                          <span>الدور الوظيفي:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-amber-300">{userRole.name}</span>
                          {hasCustomOverrides && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded" title="يحتوي على استثناءات صلاحيات خاصة">
                              مخصص
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Data Scope */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>نطاق البيانات:</span>
                        </span>
                        <span className="font-semibold text-xs">
                          {user.dataScope === 'all' && <span className="text-emerald-400">جميع بيانات المغسلة</span>}
                          {user.dataScope === 'shift' && <span className="text-blue-400">بيانات شفته فقط</span>}
                          {user.dataScope === 'own' && <span className="text-amber-400">عملياته الشخصية فقط</span>}
                        </span>
                      </div>

                      {/* Shift assignment */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>الوردية (الشفت):</span>
                        </span>
                        <span className="font-semibold text-slate-200">
                          {(user.assignedShift === 'morning' || user.assignedShift === 'hakim') && '☀️ شفت الصباح (12:00 ص – 12:00 م)'}
                          {(user.assignedShift === 'evening' || user.assignedShift === 'bandar') && '🌙 شفت المساء (12:00 م – 12:00 ص)'}
                          {(!user.assignedShift || user.assignedShift === 'any') && 'أي شفت (متاح)'}
                        </span>
                      </div>

                      {/* PIN code if set */}
                      {user.pinCode && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span>رمز الدخول السريع:</span>
                          </span>
                          <span className="font-mono text-amber-400 text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {user.pinCode}
                          </span>
                        </div>
                      )}

                      {/* Last Login & Created */}
                      <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1">
                        <span>أنشئ: {user.createdAt ? user.createdAt.substring(0, 10) : '—'}</span>
                        <span>آخر دخول: {user.lastLoginAt ? user.lastLoginAt.substring(0, 10) : 'لم يسجل بعد'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 mt-2 flex-wrap">
                    
                    {/* Switch to this user */}
                    {!isCurrent && user.isActive && (
                      <button
                        onClick={() => setCurrentUser(user)}
                        className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs px-2.5 py-1 rounded-xl transition-all"
                        title="الدخول فورا والعمل باسم هذا المستخدم"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>دخول</span>
                      </button>
                    )}

                    {/* Share Account Credentials (URL + Username + Password + Dedicated Admin Link) */}
                    <button
                      onClick={() => setShareCredentialsData({ user, password: undefined, isNewUser: false })}
                      className="min-h-[36px] px-2.5 py-1 bg-sky-950/70 hover:bg-sky-900/90 text-sky-300 hover:text-white border border-sky-500/40 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                      title="مشاركة معلومات الحساب، رابط الدخول المخصص، اليوزر، والباسورد"
                    >
                      <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>مشاركة الحساب</span>
                    </button>

                    {/* Edit User Info */}
                    {canManageUsers && (
                      <button
                        onClick={() => handleOpenEditUser(user)}
                        className="min-h-[36px] p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                        title="تعديل بيانات الحساب"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Custom Permissions Matrix Button */}
                    {canManageRoles && (
                      <button
                        onClick={() => handleOpenCustomPermissions(user)}
                        className="min-h-[36px] p-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded-xl transition-all"
                        title="تخصيص استثناءات الصلاحيات لهذا الموظف"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Reset Password */}
                    {canManageUsers && (
                      <button
                        onClick={() => handleOpenResetPassword(user)}
                        className="min-h-[36px] p-2 bg-slate-800/80 hover:bg-slate-700 text-sky-400 rounded-xl transition-all"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Toggle Active Switch */}
                    {canManageUsers && !isCurrent && (
                      <button
                        onClick={() => toggleUserActive(user.id)}
                        className={`min-h-[36px] p-2 rounded-xl transition-all ${
                          user.isActive 
                            ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30' 
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30'
                        }`}
                        title={user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete User */}
                    {canManageUsers && !isCurrent && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب "${user.name}" نهائياً؟`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="min-h-[36px] p-2 bg-slate-800/50 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded-xl transition-all"
                        title="حذف المستخدم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800/60">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">لا يوجد مستخدمين يطابقون خيارات البحث أو التصفية</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: PERMISSIONS MATRIX & ROLES CONFIGURATION      */}
      {/* ======================================================== */}
      {activeSubTab === 'roles_matrix' && (
        <div className="space-y-6">
          
          {/* Roles Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map(role => {
              const assignedCount = users.filter(u => u.roleId === role.id).length;

              return (
                <div 
                  key={role.id}
                  className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Shield className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">{role.name}</h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {role.isSystemRole ? 'دور افتراضي ثابت' : 'دور وظيفي مخصص'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full">
                        {role.permissions.length} صلاحية
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      الموظفون المرتبطون: <strong className="text-white font-mono">{assignedCount}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canManageRoles && (
                        <button
                          onClick={() => handleOpenEditRole(role)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                        >
                          تعديل الصلاحيات
                        </button>
                      )}
                      {canManageRoles && !role.isSystemRole && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="حذف الدور"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Granular Matrix Table View */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span>مصفوفة الصلاحيات التفصيلية للأدوار</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  توزيع الصلاحيات على الأدوار الخمسة الأساسية (المدير العام، المدير، الكاشير، المحاسب، المشاهد)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[700px] text-right text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5 font-bold text-white min-w-[200px]">الصلاحية والوحدة</th>
                    <th className="p-3.5 text-center font-bold text-amber-400 min-w-[100px]">المدير العام</th>
                    <th className="p-3.5 text-center font-bold text-blue-400 min-w-[100px]">المدير</th>
                    <th className="p-3.5 text-center font-bold text-emerald-400 min-w-[100px]">الكاشير</th>
                    <th className="p-3.5 text-center font-bold text-purple-400 min-w-[100px]">المحاسب</th>
                    <th className="p-3.5 text-center font-bold text-slate-400 min-w-[100px]">الاطلاع فقط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {modulesList.map(mod => {
                    const modulePerms = ALL_PERMISSIONS.filter(p => p.module === mod.id);
                    return (
                      <React.Fragment key={mod.id}>
                        {/* Section Header */}
                        <tr className="bg-slate-950/70 border-y border-slate-800 font-bold text-amber-300">
                          <td colSpan={6} className="px-3.5 py-2 text-xs">
                            {mod.label} ({modulePerms.length} صلاحيات)
                          </td>
                        </tr>

                        {/* Module Permissions Rows */}
                        {modulePerms.map(perm => {
                          const superRole = roles.find(r => r.id === 'super_admin');
                          const managerRole = roles.find(r => r.id === 'manager');
                          const cashierRole = roles.find(r => r.id === 'cashier');
                          const accountantRole = roles.find(r => r.id === 'accountant');
                          const viewerRole = roles.find(r => r.id === 'viewer');

                          const hasSuper = superRole?.permissions.includes(perm.key);
                          const hasManager = managerRole?.permissions.includes(perm.key);
                          const hasCashier = cashierRole?.permissions.includes(perm.key);
                          const hasAccountant = accountantRole?.permissions.includes(perm.key);
                          const hasViewer = viewerRole?.permissions.includes(perm.key);

                          return (
                            <tr key={perm.key} className="hover:bg-slate-800/30 transition-colors">
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-200">{perm.label}</div>
                                <div className="text-[10px] text-slate-400">{perm.description}</div>
                              </td>

                              {/* Super Admin */}
                              <td className="p-3.5 text-center">
                                {hasSuper ? (
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center font-bold">✓</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Manager */}
                              <td className="p-3.5 text-center">
                                {hasManager ? (
                                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center font-bold">✓</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Cashier */}
                              <td className="p-3.5 text-center">
                                {hasCashier ? (
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center font-bold">✓</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Accountant */}
                              <td className="p-3.5 text-center">
                                {hasAccountant ? (
                                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 inline-flex items-center justify-center font-bold">✓</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Viewer */}
                              <td className="p-3.5 text-center">
                                {hasViewer ? (
                                  <span className="w-5 h-5 rounded-full bg-slate-500/20 text-slate-300 inline-flex items-center justify-center font-bold">✓</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT EMPLOYEE ACCOUNT                        */}
      {/* ======================================================== */}
      {(showAddUserModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>{editingUser ? `تعديل حساب: ${editingUser.name}` : 'إنشاء حساب موظف جديد'}</span>
              </div>
              <button
                onClick={() => { setShowAddUserModal(false); setEditingUser(null); }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingUser ? handleEditUserSubmit : handleAddUserSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الموظف الثلاثي *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="مثال: بندر الشمري"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المستخدم للدخول (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="مثال: bandar_cashier"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="employee@rmstar.sa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الدور الوظيفي الرئيسي *
                </label>
                <select
                  value={formRoleId}
                  onChange={e => setFormRoleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {roles.map(r => (
                    <option 
                      key={r.id} 
                      value={r.id}
                      disabled={r.id === 'super_admin' && !isSuperAdmin}
                    >
                      {r.name} {r.id === 'super_admin' ? '(يتطلب مدير عام)' : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {roles.find(r => r.id === formRoleId)?.description}
                </span>
              </div>

              {/* Data Scope & Assigned Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    نطاق الوصول للبيانات *
                  </label>
                  <select
                    value={formDataScope}
                    onChange={e => setFormDataScope(e.target.value as DataScope)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="shift">شفت الموظف فقط (الأمان الافتراضي)</option>
                    <option value="own">عملياته الشخصية فقط</option>
                    <option value="all">جميع بيانات وفروع المغسلة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الوردية (الشفت المعيّن)
                  </label>
                  <select
                    value={formAssignedShift}
                    onChange={e => setFormAssignedShift(e.target.value as ShiftType | 'any')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="any">أي شفت (متاح)</option>
                    <option value="morning">☀️ شفت الصباح (12:00 ص – 12:00 م)</option>
                    <option value="evening">🌙 شفت المساء (12:00 م – 12:00 ص)</option>
                  </select>
                </div>
              </div>

              {/* Quick PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رمز الدخول السريع (PIN 4 أرقام - اختياري)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formPinCode}
                  onChange={e => setFormPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 5544"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Temporary password for new account */}
              {!editingUser && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300">
                      كلمة المرور المؤقتة للحساب الجديد
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormTempPassword(generateTemporaryPassword())}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>توليد كلمة جديدة</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formTempPassword}
                    onChange={e => setFormTempPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-wider focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    🔒 لا تُحفظ كلمة المرور كنص عادي؛ سيتم تشفيرها بخوارزمية SHA-256 مع Salt فريد فور الحفظ.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddUserModal(false); setEditingUser(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {editingUser ? 'حفظ التعديلات' : 'تأكيد وإنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET PASSWORD                                    */}
      {/* ======================================================== */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>إعادة تعيين كلمة المرور</span>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              سيتم إعادة تعيين كلمة المرور للموظف: <strong className="text-white">{passwordResetUser.name}</strong> (@{passwordResetUser.username})
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <label className="block text-[11px] font-bold text-slate-400">
                كلمة المرور المؤقتة الجديدة:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={e => setNewTempPassword(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-wider focus:outline-none"
                />
                <button
                  onClick={() => handleCopyPassword(newTempPassword)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {passwordCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{passwordCopied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  سيُطلب من الموظف تغييرها فور تسجيل دخوله الأول
                </span>
                <button
                  type="button"
                  onClick={() => setNewTempPassword(generateTemporaryPassword())}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  توليد عشوائي
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPasswordResetUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
              >
                تأكيد التعيين والتشفير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CUSTOM PERMISSIONS FOR SINGLE USER                */}
      {/* ======================================================== */}
      {userCustomizingPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-thin space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                  <span>تخصيص صلاحيات مستقلة للموظف: {userCustomizingPermissions.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  الدور الأساسي: <strong className="text-amber-400">{userCustomizingPermissions.roleName}</strong>. يمكنك منح صلاحيات إضافية أو حجب صلاحيات محددة.
                </p>
              </div>
              <button
                onClick={() => setUserCustomizingPermissions(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick reset */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">
                الصلاحيات الممنوحة كاستثناء: <strong className="text-emerald-400">{userGrantedPerms.size}</strong> | المحجوبة كاستثناء: <strong className="text-rose-400">{userDeniedPerms.size}</strong>
              </span>
              <button
                onClick={() => { setUserGrantedPerms(new Set()); setUserDeniedPerms(new Set()); }}
                className="text-amber-400 hover:underline font-bold"
              >
                إعادة ضبط للتوافق مع الدور الأساسي
              </button>
            </div>

            {/* Modules Checkboxes */}
            <div className="space-y-4">
              {modulesList.map(mod => {
                const modulePerms = ALL_PERMISSIONS.filter(p => p.module === mod.id);
                const roleDef = roles.find(r => r.id === userCustomizingPermissions.roleId);
                const basePerms = roleDef ? roleDef.permissions : [];

                return (
                  <div key={mod.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{mod.label}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const nextGranted = new Set(userGrantedPerms);
                            const nextDenied = new Set(userDeniedPerms);
                            modulePerms.forEach(p => {
                              nextGranted.add(p.key);
                              nextDenied.delete(p.key);
                            });
                            setUserGrantedPerms(nextGranted);
                            setUserDeniedPerms(nextDenied);
                          }}
                          className="text-emerald-400 hover:underline"
                        >
                          منح الكل بالوحدة
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextGranted = new Set(userGrantedPerms);
                            const nextDenied = new Set(userDeniedPerms);
                            modulePerms.forEach(p => {
                              nextGranted.delete(p.key);
                              nextDenied.add(p.key);
                            });
                            setUserGrantedPerms(nextGranted);
                            setUserDeniedPerms(nextDenied);
                          }}
                          className="text-rose-400 hover:underline"
                        >
                          حجب الكل بالوحدة
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {modulePerms.map(perm => {
                        const inBaseRole = basePerms.includes(perm.key);
                        const isGrantedOverride = userGrantedPerms.has(perm.key);
                        const isDeniedOverride = userDeniedPerms.has(perm.key);
                        const isEffectivelyActive = (inBaseRole || isGrantedOverride) && !isDeniedOverride;

                        return (
                          <div
                            key={perm.key}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                              isEffectivelyActive 
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-white' 
                                : 'bg-slate-900 border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold">
                                <span>{perm.label}</span>
                                {perm.isSensitive && (
                                  <span title="صلاحية مالية حساسة">
                                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {inBaseRole ? 'مشمول في الدور الأساسي' : 'غير مشمول في الدور'}
                              </div>
                            </div>

                            {/* Toggle tri-state */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextGranted = new Set(userGrantedPerms);
                                  const nextDenied = new Set(userDeniedPerms);
                                  if (isEffectivelyActive) {
                                    // Turn off: add to denied, remove from granted
                                    nextGranted.delete(perm.key);
                                    nextDenied.add(perm.key);
                                  } else {
                                    // Turn on: add to granted, remove from denied
                                    nextGranted.add(perm.key);
                                    nextDenied.delete(perm.key);
                                  }
                                  setUserGrantedPerms(nextGranted);
                                  setUserDeniedPerms(nextDenied);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isEffectivelyActive 
                                    ? 'bg-emerald-500 text-slate-950' 
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {isEffectivelyActive ? 'مسموح' : 'محجوب'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserCustomizingPermissions(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveUserCustomPermissions}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
              >
                اعتماد الصلاحيات الفردية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT ROLE TEMPLATE                           */}
      {/* ======================================================== */}
      {(showAddRoleModal || editingRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-thin space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>{editingRole ? `تعديل صلاحيات الدور: ${editingRole.name}` : 'إنشاء دور وظيفي مخصص جديد'}</span>
              </div>
              <button
                onClick={() => { setShowAddRoleModal(false); setEditingRole(null); }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingRole ? handleEditRoleSubmit : handleAddRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الدور الوظيفي *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleFormName}
                    onChange={e => setRoleFormName(e.target.value)}
                    placeholder="مثال: مشرف فرع، كاشير مسائي متقدم..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    وصف الدور والمهام
                  </label>
                  <input
                    type="text"
                    value={roleFormDesc}
                    onChange={e => setRoleFormDesc(e.target.value)}
                    placeholder="توضيح مختصر للمهام..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Copy from existing role */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">نسخ الصلاحيات من دور جاهز:</span>
                <div className="flex items-center gap-1.5">
                  {DEFAULT_ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoleSelectedPerms(new Set(r.permissions))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      {r.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Checklist per module */}
              <div className="space-y-4">
                {modulesList.map(mod => {
                  const modulePerms = ALL_PERMISSIONS.filter(p => p.module === mod.id);
                  const allSelectedInMod = modulePerms.every(p => roleSelectedPerms.has(p.key));

                  return (
                    <div key={mod.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="font-bold text-white text-xs">{mod.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(roleSelectedPerms);
                            if (allSelectedInMod) {
                              modulePerms.forEach(p => next.delete(p.key));
                            } else {
                              modulePerms.forEach(p => next.add(p.key));
                            }
                            setRoleSelectedPerms(next);
                          }}
                          className="text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          {allSelectedInMod ? 'إلغاء تحديد القسم' : 'تحديد جميع صلاحيات القسم'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {modulePerms.map(perm => {
                          const isChecked = roleSelectedPerms.has(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-amber-500/10 border-amber-500/40 text-white' 
                                  : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div>
                                <div className="font-semibold">{perm.label}</div>
                                <div className="text-[10px] text-slate-500">{perm.description}</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const next = new Set(roleSelectedPerms);
                                  if (e.target.checked) next.add(perm.key);
                                  else next.delete(perm.key);
                                  setRoleSelectedPerms(next);
                                }}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddRoleModal(false); setEditingRole(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  {editingRole ? 'حفظ تعديلات الدور' : 'إنشاء الدور وحفظه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SHARE ACCOUNT CREDENTIALS                         */}
      {/* ======================================================== */}
      {shareCredentialsData && (
        <ShareCredentialsModal
          user={shareCredentialsData.user}
          password={shareCredentialsData.password}
          isNewUser={shareCredentialsData.isNewUser}
          onClose={() => setShareCredentialsData(null)}
        />
      )}

    </div>
  );
};
