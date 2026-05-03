import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/ui/StatCard";

export const Dashboard = () => {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl glass p-6">
          <h1 className="text-3xl font-semibold">Panel General</h1>
          <p className="text-muted text-sm mt-2">
            Visualiza el estado de préstamos y actividad de tu organización.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Préstamos activos" value="12" tone="brand" />
          <StatCard label="Items disponibles" value="87" tone="success" />
          <StatCard label="Usuarios bloqueados" value="3" tone="warning" />
        </div>
      </div>
    </AppLayout>
  );
};