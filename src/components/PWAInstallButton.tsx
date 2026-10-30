import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-md shadow-sky-500/20 transition-all ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
        }`}
        title="تثبيت نظام RM STAR كتطبيق على جهازك"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 hover:text-white font-bold rounded-xl transition-all ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
          }`}
          title="تثبيت التطبيق على الآيفون والآيباد"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0 text-sky-400" />
          <span>تثبيت على الجوال</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-sky-500/40 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-white">
                    تثبيت RM STAR على الآيفون
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <p>
                    اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari بالأسفل <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" />.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <p>
                    مرر لأسفل واختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <p className="text-emerald-300">
                    اضغط <strong>«إضافة» (Add)</strong>، وسيظهر التطبيق بأيقونة المغسلة الرسمية على شاشتك الرئيسية!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 py-2.5 text-xs font-bold text-slate-950 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button if browser doesn't expose prompt yet (manual guide / installable)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className={`flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-white font-bold rounded-xl transition-all ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
        title="تثبيت التطبيق على الشاشة الرئيسية"
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-sky-400" />
        <span>تثبيت التطبيق</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-sky-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">
                  تثبيت النظام كتطبيق على جهازك
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p className="text-slate-400">
                يمكنك تثبيت نظام RM STAR CAR WASH كتطبيق مباشر على شاشة جهازك (أندرويد، آيفون، أو كمبيوتر):
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <p>
                  • <strong>على أجهزة أندرويد وجوجل كروم:</strong> اضغط على قائمة الخيارات (⋮) أعلى المتصفح، ثم اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                </p>
                <p>
                  • <strong>على أجهزة آيفون (Safari):</strong> اضغط على زر المشاركة ثم اختر <strong>«إضافة إلى الصفحة الرئيسية»</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 py-2.5 text-xs font-bold text-slate-950 transition"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
