import React, { useState } from 'react';
import { AppUser } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Send, 
  KeyRound, 
  UserCheck, 
  Sparkles,
  Lock,
  Globe,
  Printer
} from 'lucide-react';

interface ShareCredentialsModalProps {
  user: AppUser;
  password?: string;
  isNewUser?: boolean;
  onClose: () => void;
  onResetPassword?: () => void;
}

export const ShareCredentialsModal: React.FC<ShareCredentialsModalProps> = ({
  user,
  password,
  isNewUser = false,
  onClose,
  onResetPassword
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isAdmin = user.roleId === 'super_admin' || user.roleId === 'manager' || user.role === 'manager';
  
  // Construct links
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const baseUrl = `${origin}${pathname}`;
  
  // Admin gets dedicated portal link, others get standard cashier/staff portal link
  const portalType = isAdmin ? 'admin' : 'cashier';
  const loginUrl = `${baseUrl}?portal=${portalType}&user=${encodeURIComponent(user.username)}`;
  const adminDirectUrl = `${baseUrl}?portal=admin&user=${encodeURIComponent(user.username)}`;

  const roleTitle = user.roleName || (
    user.roleId === 'super_admin' ? 'المدير العام (Super Admin)' :
    user.roleId === 'manager' ? 'مدير المغسلة' :
    user.roleId === 'accountant' ? 'محاسب مالي' : 'كاشير'
  );

  const effectivePassword = password || (user.pinCode ? `رمز PIN: ${user.pinCode}` : 'كلمة المرور الحالية المحددة للموظف');

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Full invitation text for WhatsApp / SMS
  const fullInvitationText = `🌟 *نظام محاسبة وإدارة RM STAR CAR WASH* 🌟

أهلاً بك يا *${user.name}*،
تم إعداد بيانات حسابك في نظام مغسلة RM STAR CAR WASH:

📋 *الدور الوظيفي:* ${roleTitle}
${isAdmin ? '🛡️ *نوع الرابط:* رابط بوابة الإدارة العامة والتحكم المخصصة' : '🚗 *نوع الرابط:* رابط كاشير المغسلة المباشر'}

🔗 *رابط الدخول المباشر:*
${loginUrl}

👤 *اسم المستخدم (اليوزر):*
${user.username}

🔑 *كلمة المرور (الباسورد):*
${effectivePassword}
${user.pinCode ? `🔢 *رمز الدخول السريع (PIN):* ${user.pinCode}\n` : ''}
⚡ يرجى حفظ بيانات الدخول والاحتفاظ بها بأمان وعدم مشاركتها مع أي شخص آخر.`;

  // WhatsApp share url
  const whatsappUrl = `https://wa.me/${user.phone ? user.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(fullInvitationText)}`;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-sky-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Logo */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-sky-500/30 p-1 flex items-center justify-center shadow-lg shadow-sky-500/10 shrink-0">
            <img 
              src="/assets/aistudio/d75f30e4-2e7f-48d8-a862-445d465f253d_IMG-7131_646dea62.webp" 
              alt="RM STAR CAR WASH" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">
                {isNewUser ? 'تم إنشاء الحساب بنجاح!' : 'مشاركة معلومات الحساب'}
              </h2>
              {isNewUser && (
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                  جديد
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              بيانات الدخول والرابط المخصص لموظف مغسلة RM STAR
            </p>
          </div>
        </div>

        {/* User Badge Info */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          isAdmin 
            ? 'bg-gradient-to-r from-sky-950/60 to-blue-950/60 border-sky-500/50 text-sky-200'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isAdmin ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-sky-400'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-bold text-white text-sm block">{user.name}</span>
              <span className="text-xs text-slate-400">{roleTitle}</span>
            </div>
          </div>

          {isAdmin ? (
            <span className="text-[11px] font-black bg-sky-500 text-slate-950 px-2.5 py-1 rounded-lg shadow-sm">
              حساب إداري (Admin)
            </span>
          ) : (
            <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
              حساب كاشير
            </span>
          )}
        </div>

        {/* Dedicated Admin Portal Banner (Highlighted specifically if Admin) */}
        {isAdmin && (
          <div className="bg-sky-950/40 border border-sky-500/40 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-sky-200">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-300 block font-black">
                المدير العام يمتلك رابط بوابة إدارية مخصصة:
              </strong>
              <span>
                هذا الرابط يفتح لوحة التحكم والإدارة المالية وصلاحيات المستخدمين مباشرة للمدير المخوّل.
              </span>
            </div>
          </div>
        )}

        {/* Credentials Breakdown Cards */}
        <div className="space-y-2.5">
          
          {/* 1. Login Link */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAdmin ? 'رابط الإدارة المخصص (Admin Portal):' : 'رابط الدخول المباشر:'}</span>
              </span>
              <button
                onClick={() => handleCopy(loginUrl, 'url')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                {copiedField === 'url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl font-mono text-[11px] text-sky-300 break-all select-all flex items-center justify-between gap-2">
              <span className="truncate">{loginUrl}</span>
              <a 
                href={loginUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white shrink-0 p-1"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 2. Username (اليوزر) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">اسم المستخدم (اليوزر):</span>
              <span className="text-base font-black text-white font-mono tracking-wide mt-0.5 block">
                {user.username}
              </span>
            </div>
            <button
              onClick={() => handleCopy(user.username, 'username')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 min-h-[36px]"
            >
              {copiedField === 'username' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>نسخ اليوزر</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Password (الباس وورد) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">كلمة المرور (الباس وورد):</span>
                {password && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    مؤقتة ومفعلة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-black text-sky-400 font-mono tracking-wider truncate">
                  {showPassword ? effectivePassword : '••••••••••••'}
                </span>
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                    title={showPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleCopy(password || user.pinCode || user.username, 'password')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[36px]"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>نسخ الباسورد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. PIN Code if available */}
          {user.pinCode && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                <span>رمز الدخول السريع (PIN):</span>
              </span>
              <span className="font-mono text-sky-300 font-black text-sm bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {user.pinCode}
              </span>
            </div>
          )}

        </div>

        {/* Action Buttons: WhatsApp Share & Copy All */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          
          {/* Main WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99]"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>مشاركة بيانات الدخول عبر واتساب</span>
          </a>

          {/* Copy Full Credentials Message */}
          <button
            type="button"
            onClick={() => handleCopy(fullInvitationText, 'all')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            {copiedField === 'all' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-black">تم نسخ رسالة الدخول كاملة بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ الرسالة كاملة (الرابط + اليوزر + الباسورد)</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info note */}
        <p className="text-[11px] text-slate-400 text-center">
          💡 يمكنك دائماً إعادة نسخ أو مشاركة بيانات هذا المستخدم من لوحة إدارة المستخدمين.
        </p>

      </div>
    </div>
  );
};
