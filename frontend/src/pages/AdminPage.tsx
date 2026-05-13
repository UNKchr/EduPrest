import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { reportsApi, type AdminSummary } from "../services/reportsApi";

export const AdminPage = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await reportsApi.adminSummary();
      if (active) setSummary(data);
    };

    load();
    const intervalId = window.setInterval(load, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const activeUsers = summary ? summary.activeUsers : "-";
  const pendingReports = summary ? summary.pendingReports : "-";
  const availableItems = summary ? summary.availableItems : "-";

  return (
    <AppLayout>
      <PageHeader title="Panel Administrativo" subtitle="Resumen general de tu organización" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Usuarios activos" value={activeUsers} tone="success" />
        <StatCard label="Reportes pendientes" value={pendingReports} tone="warning" />
        <StatCard label="Items disponibles" value={availableItems} tone="brand" />
      </div>
    </AppLayout>
  );
};