import { cn } from "../../utils/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "w-full rounded-xl bg-surface-2 px-4 py-2 text-sm text-text placeholder:text-muted outline-none ring-1 ring-border focus:ring-2 focus:ring-brand/60 transition",
      className
    )}
    {...props}
  />
);