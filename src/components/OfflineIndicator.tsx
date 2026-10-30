import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 text-slate-950 px-3.5 py-2 text-xs font-black shadow-xl border border-amber-300 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>وضع العمل دون اتصال (أوفلاين) — النظام يعمل بالبيانات المحفوظة محلياً</span>
    </div>
  );
};
