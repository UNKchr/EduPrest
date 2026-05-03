import { cn } from "../../utils/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ className, ...props }: SelectProps) => (
  <select
    className={cn(
      "w-full rounded-xl bg-surface-2 px-4 py-2 text-sm text-text outline-none ring-1 ring-border focus:ring-2 focus:ring-brand/60 transition",
      className
    )}
    {...props}
  />
);