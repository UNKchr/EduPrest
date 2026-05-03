import { cn } from "../../utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) => {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand text-white hover:brightness-110 shadow-soft",
    secondary: "bg-surface-2 text-text hover:bg-surface",
    ghost: "bg-transparent text-text hover:bg-surface-2",
    danger: "bg-danger text-white hover:brightness-110"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
};