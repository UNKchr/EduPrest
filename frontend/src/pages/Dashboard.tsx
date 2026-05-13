import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { StatCard } from "../components/ui/StatCard";
import { reportsApi, type DashboardMetrics } from "../services/reportsApi";

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await reportsApi.dashboard();
      if (active) setMetrics(data);
    };

    load();
    const intervalId = window.setInterval(load, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const activeLoans = metrics ? metrics.activeLoans : "-";
  const availableItems = metrics ? metrics.availableItems : "-";
  const bannedUsers = metrics ? metrics.bannedUsers : "-";

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
          <StatCard label="Préstamos activos" value={activeLoans} tone="brand" />
          <StatCard label="Items disponibles" value={availableItems} tone="success" />
          <StatCard label="Usuarios bloqueados" value={bannedUsers} tone="warning" />
        </div>
      </div>
    </AppLayout>
  );
};