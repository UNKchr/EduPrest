import { cn } from "../../utils/cn";

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: "brand" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
  description?: string;
};

export const StatCard = ({ label, value, tone = "brand", icon, description }: StatCardProps) => {
  const tones = {
    brand: {
      card: "border-brand/20",
      glow: "from-brand/10 to-transparent",
      icon: "bg-brand-dim text-brand-light",
      value: "text-brand-light"
    },
    success: {
      card: "border-success/20",
      glow: "from-success/10 to-transparent",
      icon: "bg-success-dim text-success",
      value: "text-success"
    },
    warning: {
      card: "border-warning/20",
      glow: "from-warning/10 to-transparent",
      icon: "bg-warning-dim text-warning",
      value: "text-warning"
    },
    danger: {
      card: "border-danger/20",
      glow: "from-danger/10 to-transparent",
      icon: "bg-danger-dim text-danger",
      value: "text-danger"
    }
  };

  const t = tones[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-sm animate-fade-in",
        t.card
      )}
    >
      {/* Gradient glow in corner */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
          t.glow
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">{label}</p>
          <p className={cn("mt-1.5 text-3xl font-semibold tracking-tight", t.value)}>
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-subtle">{description}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              t.icon
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
