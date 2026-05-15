type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
};

export const PageHeader = ({ title, subtitle, action, badge }: PageHeaderProps) => (
  <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="truncate text-xl font-semibold tracking-tight text-text">{title}</h1>
        {badge}
      </div>
      {subtitle && (
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      )}
    </div>
    {action && (
      <div className="flex shrink-0 items-center gap-2">{action}</div>
    )}
  </header>
);
