import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { cn } from "../utils/cn";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PromptOptions = {
  title: string;
  message?: string;
  placeholder?: string;
  minLength?: number;
  multiline?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  allowEmpty?: boolean;
};

type ConfirmTextOptions = {
  title: string;
  message?: string;
  confirmText: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ModalState =
  | ({ kind: "confirm" } & ConfirmOptions)
  | ({ kind: "prompt" } & PromptOptions)
  | ({ kind: "confirmText" } & ConfirmTextOptions);

type ModalResult = { confirmed: boolean; value?: string };

type ModalContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  confirmText: (options: ConfirmTextOptions) => Promise<boolean>;
};

const ModalContext = createContext<ModalContextValue | null>(null);

const IconX = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const resolverRef = useRef<((result: ModalResult) => void) | null>(null);

  useEffect(() => {
    setValue("");
    setError("");
    if (modal) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [modal?.kind]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose({ confirmed: false });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  const open = (next: ModalState) => {
    setModal(next);
    return new Promise<ModalResult>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleClose = (result: ModalResult) => {
    setVisible(false);
    setTimeout(() => {
      setModal(null);
      resolverRef.current?.(result);
      resolverRef.current = null;
    }, 180);
  };

  const confirm = async (options: ConfirmOptions) => {
    const result = await open({ kind: "confirm", ...options });
    return result.confirmed;
  };

  const prompt = async (options: PromptOptions) => {
    const result = await open({ kind: "prompt", ...options });
    return result.confirmed ? result.value ?? null : null;
  };

  const confirmText = async (options: ConfirmTextOptions) => {
    const result = await open({ kind: "confirmText", ...options });
    return result.confirmed;
  };

  const handleConfirm = () => {
    if (!modal) return;

    if (modal.kind === "prompt") {
      const minLength = modal.minLength ?? 1;
      const trimmed = value.trim();
      if (trimmed.length === 0 && modal.allowEmpty) {
        handleClose({ confirmed: true, value: "" });
        return;
      }
      if (trimmed.length < minLength) {
        setError(`Mínimo ${minLength} caracteres.`);
        return;
      }
      handleClose({ confirmed: true, value: trimmed });
      return;
    }

    if (modal.kind === "confirmText") {
      const trimmed = value.trim();
      if (trimmed.toUpperCase() !== modal.confirmText.toUpperCase()) {
        setError(`Escribe "${modal.confirmText}" para continuar.`);
        return;
      }
      handleClose({ confirmed: true, value: trimmed });
      return;
    }

    handleClose({ confirmed: true });
  };

  return (
    <ModalContext.Provider value={{ confirm, prompt, confirmText }}>
      {children}
      {modal && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
            visible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => handleClose({ confirmed: false })}
        >
          <div
            className={cn(
              "w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200",
              visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 id="modal-title" className="text-base font-semibold text-text">
                {modal.title}
              </h2>
              <button
                onClick={() => handleClose({ confirmed: false })}
                aria-label="Cerrar"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <IconX />
              </button>
            </div>

            {modal.message && (
              <p className="mt-2 text-sm text-muted leading-relaxed">{modal.message}</p>
            )}

            {modal.kind === "prompt" && (
              <div className="mt-4">
                {modal.multiline ? (
                  <Textarea
                    placeholder={modal.placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={modal.placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                )}
              </div>
            )}

            {modal.kind === "confirmText" && (
              <div className="mt-4">
                <Input
                  placeholder={modal.placeholder || "CONFIRMAR"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-danger" role="alert">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleClose({ confirmed: false })}
              >
                {modal.cancelLabel || "Cancelar"}
              </Button>
              <Button size="sm" onClick={handleConfirm}>
                {modal.confirmLabel || "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};
