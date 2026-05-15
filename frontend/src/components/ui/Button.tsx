import { cn } from "../../utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const base = [
    "relative inline-flex select-none cursor-pointer items-center justify-center gap-2",
    "rounded-xl font-medium tracking-tight",
    "transition-all duration-200 ease-spring",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97]"
  ].join(" ");

  const variants = {
    primary: [
      "bg-gradient-to-r from-brand to-brand-light text-white",
      "shadow-brand hover:brightness-110 hover:shadow-[0_6px_24px_rgba(124,92,255,0.35)]"
    ].join(" "),
    secondary: [
      "border border-border-light bg-surface-2 text-text",
      "hover:bg-surface-3 hover:border-[var(--border-light)]"
    ].join(" "),
    ghost: "text-muted hover:text-text hover:bg-surface-2",
    danger: [
      "border border-danger/25 bg-danger-dim text-danger",
      "hover:bg-danger/20 hover:border-danger/45"
    ].join(" ")
  };

  const sizes = {
    sm: "h-7 px-2.5 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm"
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-20"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="3"
          />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
