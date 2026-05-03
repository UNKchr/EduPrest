type StatCardProps = {
  label: string;
  value: string | number;
  tone?: "brand" | "success" | "warning";
};

export const StatCard = ({ label, value, tone = "brand" }: StatCardProps) => {
  const tones = {
    brand: "from-brand/20 to-brand/5",
    success: "from-success/20 to-success/5",
    warning: "from-warning/20 to-warning/5"
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-4 border border-border`}>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </div>
  );
};