import { cn } from "../../utils/cn";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
};

export const Badge = ({ tone = "neutral", className, ...props }: BadgeProps) => {
  const tones = {
    neutral: "bg-surface-2 text-text",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-danger/20 text-danger"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs", tones[tone], className)} {...props} />
  );
};