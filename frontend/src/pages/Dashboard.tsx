import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { reportsApi, type DashboardMetrics } from "../services/reportsApi";
import { IconLoans, IconBox, IconUsers } from "../components/Icons";

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await reportsApi.dashboard();
      if (active) {
        setMetrics(data);
        setLastUpdated(new Date());
      }
    };

    load();
    const intervalId = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const activeLoans    = metrics ? metrics.activeLoans    : "—";
  const availableItems = metrics ? metrics.availableItems : "—";
  const bannedUsers    = metrics ? metrics.bannedUsers    : "—";

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
    : "Actualizando…";

  return (
    <AppLayout>
      <PageHeader
        title="Panel General"
        subtitle={updatedLabel}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Préstamos activos"
          value={activeLoans}
          tone="brand"
          icon={<IconLoans />}
          description="Préstamos en curso en tu organización"
        />
        <StatCard
          label="Ítems disponibles"
          value={availableItems}
          tone="success"
          icon={<IconBox />}
          description="Equipos listos para préstamo"
        />
        <StatCard
          label="Usuarios bloqueados"
          value={bannedUsers}
          tone="warning"
          icon={<IconUsers />}
          description="Usuarios con acceso restringido"
        />
      </div>
    </AppLayout>
  );
};
