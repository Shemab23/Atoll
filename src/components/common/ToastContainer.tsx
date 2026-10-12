import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AlertTriangle, CheckCircle, Info, X, ShieldAlert } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-[410px] px-3 space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let style = 'bg-slate-900/95 text-white border-slate-700';

        if (toast.type === 'error') {
          Icon = ShieldAlert;
          style = 'bg-rose-950/95 text-rose-100 border-rose-800 shadow-rose-900/20';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          style = 'bg-amber-950/95 text-amber-100 border-amber-800 shadow-amber-900/20';
        } else if (toast.type === 'success') {
          Icon = CheckCircle;
          style = 'bg-emerald-950/95 text-emerald-100 border-emerald-800 shadow-emerald-900/20';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 duration-200 ${style}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-90" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              <p className="text-[11px] leading-relaxed mt-0.5 opacity-90 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
