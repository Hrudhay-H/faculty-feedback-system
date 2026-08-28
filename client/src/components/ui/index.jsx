/**
 * Shared UI primitives — import from here everywhere instead of duplicating.
 */

import React from 'react';

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 6, color = 'text-indigo-600', className = '' }) {
  return (
    <svg
      className={`animate-spin h-${size} w-${size} ${color} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3" role="status" aria-label={label}>
      <Spinner size={8} color="text-indigo-600" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}

// ── Error Alert ───────────────────────────────────────────────────────────────
export function ErrorAlert({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-3"
    >
      <span className="text-base flex-shrink-0">⚠️</span>
      <div className="flex-1 space-y-1.5">
        <p className="font-semibold">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-rose-700 underline font-bold hover:text-rose-900"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
      <span className="text-4xl" role="img" aria-hidden="true">{icon}</span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = 'default' }) {
  const variants = {
    default:  'bg-slate-100 text-slate-700 border-slate-200',
    success:  'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning:  'bg-amber-50 text-amber-800 border-amber-200',
    danger:   'bg-rose-50 text-rose-800 border-rose-200',
    info:     'bg-blue-50 text-blue-800 border-blue-200',
    indigo:   'bg-indigo-50 text-indigo-800 border-indigo-200'
  };
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 rounded text-[10px] font-bold ${variants[variant] || variants.default}`}>
      {label}
    </span>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
        <h2 id="confirm-dialog-title" className="text-sm font-extrabold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`text-xs font-bold px-4 py-2 rounded-lg text-white ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────────
import { toast } from '../../utils/toast';

export function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    return toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      
      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    });
  }, []);

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-250 text-emerald-900',
    danger: 'bg-rose-50 border-rose-250 text-rose-900',
    warning: 'bg-amber-50 border-amber-250 text-amber-900',
    info: 'bg-blue-50 border-blue-250 text-blue-900'
  };

  const typeIcons = {
    success: '✅',
    danger: '⚠️',
    warning: '🔔',
    info: 'ℹ️'
  };

  return (
    <div id="toast-root">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter border p-3.5 rounded-xl shadow-lg flex items-start gap-2.5 max-w-sm pointer-events-auto transition-all ${typeStyles[t.type] || typeStyles.success}`}
        >
          <span className="text-sm flex-shrink-0">{typeIcons[t.type] || '🔔'}</span>
          <div className="flex-1 text-[11px] font-semibold leading-relaxed">
            {t.message}
          </div>
          <button
            onClick={() => remove(t.id)}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs leading-none"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

