import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { reportsApi, type AdminSummary } from "../services/reportsApi";
import { IconUsers, IconShield, IconBox } from "../components/Icons";

export const AdminPage = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await reportsApi.adminSummary();
      if (active) {
        setSummary(data);
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

  const activeUsers      = summary ? summary.activeUsers      : "—";
  const pendingReports   = summary ? summary.pendingReports   : "—";
  const availableItems   = summary ? summary.availableItems   : "—";

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
    : "Actualizando…";

  return (
    <AppLayout>
      <PageHeader
        title="Panel Administrativo"
        subtitle={updatedLabel}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Usuarios activos"
          value={activeUsers}
          tone="success"
          icon={<IconUsers />}
          description="Miembros con acceso activo a la plataforma"
        />
        <StatCard
          label="Reportes pendientes"
          value={pendingReports}
          tone="warning"
          icon={<IconShield />}
          description="Reportes de usuarios sin revisar"
        />
        <StatCard
          label="Ítems disponibles"
          value={availableItems}
          tone="brand"
          icon={<IconBox />}
          description="Equipos listos para préstamo"
        />
      </div>
    </AppLayout>
  );
};
