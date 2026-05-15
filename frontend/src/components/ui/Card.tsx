import { cn } from "../../utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "elevated" | "glass" | "bordered";
};

export const Card = ({ variant = "default", className, ...props }: CardProps) => {
  const variants = {
    default:  "bg-surface border border-border shadow-sm",
    elevated: "bg-surface border border-border shadow-lg",
    glass:    "glass",
    bordered: "bg-surface border-2 border-border-light"
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-5 animate-fade-in",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
