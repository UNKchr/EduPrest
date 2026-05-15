import { cn } from "../../utils/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = ({ label, className, id, ...props }: SelectProps) => {
  const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  const selectEl = (
    <div className="relative">
      <select
        id={selectId}
        className={cn(
          "h-9 w-full appearance-none rounded-xl border border-border bg-surface-2 pl-3.5 pr-8 text-sm text-text",
          "outline-none transition-all duration-200",
          "hover:border-border-light",
          "focus:border-brand/50 focus:ring-2 focus:ring-brand/15",
          className
        )}
        {...props}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-subtle"
        aria-hidden="true"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );

  if (!label) return selectEl;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-medium text-muted tracking-wide">
        {label}
      </label>
      {selectEl}
    </div>
  );
};
