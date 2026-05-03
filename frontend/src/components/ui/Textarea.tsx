import { cn } from "../../utils/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={cn(
      "w-full min-h-[100px] rounded-xl bg-surface-2 px-4 py-2 text-sm text-text placeholder:text-muted outline-none ring-1 ring-border focus:ring-2 focus:ring-brand/60 transition",
      className
    )}
    {...props}
  />
);