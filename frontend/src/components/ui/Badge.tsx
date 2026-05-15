import { cn } from "../../utils/cn";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  dot?: boolean;
};

export const Badge = ({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) => {
  const tones = {
    neutral: "bg-surface-3 text-muted border border-border",
    success: "bg-success-dim text-success border border-success/20",
    warning: "bg-warning-dim text-warning border border-warning/20",
    danger:  "bg-danger-dim text-danger border border-danger/20",
    brand:   "bg-brand-dim text-brand-light border border-brand/20"
  };

  const dotColors = {
    neutral: "bg-muted",
    success: "bg-success",
    warning: "bg-warning",
    danger:  "bg-danger",
    brand:   "bg-brand-light"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
