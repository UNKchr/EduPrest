import { cn } from "../../utils/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = ({ label, error, hint, className, id, ...props }: InputProps) => {
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  if (!label && !error && !hint) {
    return (
      <input
        id={inputId}
        className={cn(
          "h-9 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text",
          "placeholder:text-subtle",
          "outline-none transition-all duration-200",
          "hover:border-border-light",
          "focus:border-brand/50 focus:ring-2 focus:ring-brand/15",
          error && "border-danger/50 focus:border-danger/60 focus:ring-danger/15",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-9 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text",
          "placeholder:text-subtle",
          "outline-none transition-all duration-200",
          "hover:border-border-light",
          "focus:border-brand/50 focus:ring-2 focus:ring-brand/15",
          error && "border-danger/50 focus:border-danger/60 focus:ring-danger/15",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
};
