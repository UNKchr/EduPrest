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

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const beginClose = (id: string) => {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast))
    );
    timers.current[id] = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      delete timers.current[id];
    }, 220);
  };

  const showToast = (options: ToastOptions) => {
    const id = window.crypto?.randomUUID?.() ?? String(Date.now());
    setToasts((current) => [...current, { ...options, id, closing: false }]);
    timers.current[`auto-${id}`] = window.setTimeout(() => beginClose(id), 3500);
  };

  const toneBorder = {
    danger: "border-danger/40",
    info: "border-brand-2/40",
    success: "border-success/40"
  };

  const toneIcon = {
    danger: "text-danger",
    info: "text-brand-2",
    success: "text-success"
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "toast-enter flex items-center gap-3 rounded-xl border border-l-4 bg-surface px-4 py-3 text-sm text-text shadow-soft",
              toneBorder[toast.tone],
              toast.closing && "toast-exit"
            )}
            onClick={() => beginClose(toast.id)}
            role="status"
            aria-live="polite"
          >
            <ToastIconView icon={toast.icon} className={toneIcon[toast.tone]} />
            <span>{toast.label}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
