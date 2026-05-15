import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { useAuth } from "../context/useAuth";
import { reportsApi, type DashboardMetrics } from "../services/reportsApi";
import { loansApi, type Loan } from "../services/loansApi";
import { IconLoans, IconBox, IconUsers } from "../components/Icons";

// ─── Student personal dashboard ───────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[] | null>(null);

  useEffect(() => {
    let active = true;
    loansApi.listMine().then((data) => active && setLoans(data));
    return () => { active = false; };
  }, []);

  const active   = loans ? loans.filter((l) => l.status === "ACTIVE").length   : "—";
  const overdue  = loans ? loans.filter((l) => l.status === "OVERDUE").length  : "—";
  const returned = loans ? loans.filter((l) => l.status === "RETURNED").length : "—";
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "EP";

  return (
    <AppLayout>
      {/* Welcome banner */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-brand/20 bg-brand-dim p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-lg font-semibold text-brand-light">
          {initials}
        </div>
        <div>
          <h1 className="text-base font-semibold text-text">Hola, {user?.email}</h1>
          <p className="text-sm text-muted">Aquí puedes ver el resumen de tus préstamos.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Préstamos activos"
          value={active}
          tone="brand"
          icon={<IconLoans />}
          description="Equipos que tienes en tu poder actualmente"
        />
        <StatCard
          label="Vencidos"
          value={overdue}
          tone="danger"
          icon={<IconBox />}
          description="Préstamos que debían haberse devuelto"
        />
        <StatCard
          label="Devueltos"
          value={returned}
          tone="success"
          icon={<IconUsers />}
          description="Equipos que ya devolviste"
        />
      </div>
    </AppLayout>
  );
};

// ─── Org-level dashboard (TECH / ADMIN / SUPER_ADMIN) ────────────────────────
const OrgDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await reportsApi.dashboard();
      if (active) { setMetrics(data); setLastUpdated(new Date()); }
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  const activeLoans    = metrics ? metrics.activeLoans    : "—";
  const availableItems = metrics ? metrics.availableItems : "—";
  const bannedUsers    = metrics ? metrics.bannedUsers    : "—";
  const updatedLabel   = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
    : "Actualizando…";

  return (
    <AppLayout>
      <PageHeader title="Panel General" subtitle={updatedLabel} />
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

export const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === "STUDENT") return <StudentDashboard />;
  return <OrgDashboard />;
};
