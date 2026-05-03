import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";

export const AdminPage = () => {
  return (
    <AppLayout>
      <PageHeader title="Panel Administrativo" subtitle="Resumen general de tu organización" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Usuarios activos" value="120" tone="success" />
        <StatCard label="Reportes pendientes" value="7" tone="warning" />
        <StatCard label="Items disponibles" value="84" tone="brand" />
      </div>
    </AppLayout>
  );
};