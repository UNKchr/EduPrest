import { createContext, useContext, useRef, useState } from "react";
import { cn } from "../utils/cn";

type ToastTone = "danger" | "info" | "success";
type ToastIcon = "trash" | "ban" | "info" | "check";

type ToastOptions = {
  tone: ToastTone;
  label: string;
  icon: ToastIcon;
};

type ToastItem = ToastOptions & { id: string; closing: boolean };

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ToastIconView = ({ icon, className }: { icon: ToastIcon; className?: string }) => {
  switch (icon) {
    case "trash":
      return (
        <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "ban":
      return (
        <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "info":
      return (
        <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      );
    case "check":
    default:
      return (
        <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

const toneStyles = {
  danger:  { border: "border-l-danger   border-danger/15",  icon: "text-danger",       bg: "bg-surface" },
  info:    { border: "border-l-brand    border-brand/15",   icon: "text-brand-light",  bg: "bg-surface" },
  success: { border: "border-l-success  border-success/15", icon: "text-success",      bg: "bg-surface" },
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const beginClose = (id: string) => {
    setToasts((cur) => cur.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    timers.current[id] = window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 220);
  };

  const showToast = (options: ToastOptions) => {
    const id = window.crypto?.randomUUID?.() ?? String(Date.now());
    setToasts((cur) => [...cur, { ...options, id, closing: false }]);
    timers.current[`auto-${id}`] = window.setTimeout(() => beginClose(id), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="region"
        aria-label="Notificaciones"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
      >
        {toasts.map((toast) => {
          const s = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "toast-enter flex min-w-[220px] max-w-sm cursor-pointer items-center gap-3 rounded-xl border border-l-4 px-4 py-3 text-sm text-text shadow-lg transition-all duration-200",
                s.border,
                s.bg,
                toast.closing && "toast-exit"
              )}
              onClick={() => beginClose(toast.id)}
            >
              <span className={cn("shrink-0", s.icon)}>
                <ToastIconView icon={toast.icon} />
              </span>
              <span className="flex-1 leading-snug">{toast.label}</span>
              <button
                aria-label="Cerrar notificación"
                onClick={(e) => { e.stopPropagation(); beginClose(toast.id); }}
                className="ml-1 shrink-0 text-subtle hover:text-text focus-visible:outline-none"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
