import { cn } from "../../utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      "rounded-2xl bg-surface p-5 shadow-soft border border-border animate-fade-in",
      className
    )}
    {...props}
  />
);