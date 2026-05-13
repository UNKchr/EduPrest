import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";

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

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const resolverRef = useRef<((result: ModalResult) => void) | null>(null);

  useEffect(() => {
    setValue("");
    setError("");
  }, [modal?.kind]);

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose({ confirmed: false });
      }
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
    setModal(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
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
        setError(`Minimo ${minLength} caracteres.`);
        return;
      }
      handleClose({ confirmed: true, value: trimmed });
      return;
    }

    if (modal.kind === "confirmText") {
      const trimmed = value.trim();
      if (trimmed.toUpperCase() !== modal.confirmText.toUpperCase()) {
        setError(`Escribe ${modal.confirmText} para continuar.`);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => handleClose({ confirmed: false })}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text">{modal.title}</h2>
            {modal.message && (
              <p className="mt-2 text-sm text-muted">{modal.message}</p>
            )}

            {modal.kind === "prompt" && (
              <div className="mt-4">
                {modal.multiline ? (
                  <Textarea
                    placeholder={modal.placeholder}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={modal.placeholder}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                )}
              </div>
            )}

            {modal.kind === "confirmText" && (
              <div className="mt-4">
                <Input
                  placeholder={modal.placeholder || "CONFIRMAR"}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </div>
            )}

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleClose({ confirmed: false })}>
                {modal.cancelLabel || "Cancelar"}
              </Button>
              <Button onClick={handleConfirm}>{modal.confirmLabel || "Confirmar"}</Button>
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
