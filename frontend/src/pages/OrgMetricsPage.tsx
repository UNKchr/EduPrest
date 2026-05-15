import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/useAuth";
import { reportsApi, type OrgAnalytics, type WeekStat, type ActivityRecord } from "../services/reportsApi";
import { IconLoans, IconBox, IconShield, IconUsers } from "../components/Icons";
import { cn } from "../utils/cn";

// ─── Mini bar chart (no external library) ────────────────────────────────────
const BarChart = ({ data }: { data: WeekStat[] }) => {
  const max = Math.max(...data.flatMap((d) => [d.loans, d.returns]), 1);

  return (
    <div>
      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/50" />
          Préstamos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success/50" />
          Devoluciones
        </span>
      </div>

      {/* Chart area */}
      <div className="flex items-end gap-1.5" style={{ height: 140 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-0.5" style={{ height: 112 }}>
              {/* Loans bar */}
              <div
                className="flex-1 rounded-t bg-brand/40 transition-all duration-500"
                style={{ height: `${Math.max(3, (d.loans / max) * 100)}%` }}
                title={`Préstamos: ${d.loans}`}
              />
              {/* Returns bar */}
              <div
                className="flex-1 rounded-t bg-success/40 transition-all duration-500"
                style={{ height: `${Math.max(3, (d.returns / max) * 100)}%` }}
                title={`Devoluciones: ${d.returns}`}
              />
            </div>
            <span
              className={cn(
                "text-center text-2xs leading-tight text-muted",
                i === data.length - 1 && "font-medium text-text"
              )}
            >
              {d.week}
            </span>
          </div>
        ))}
      </div>

      {/* Y-axis hint */}
      <div className="mt-2 flex justify-between text-2xs text-subtle">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

// ─── Status badge helper ───────────────────────────────────────────────────────
const LoanStatusBadge = ({ status }: { status: ActivityRecord["status"] }) => {
  const map = {
    ACTIVE:   { tone: "brand"    as const, label: "Activo"    },
    RETURNED: { tone: "success"  as const, label: "Devuelto"  },
    OVERDUE:  { tone: "danger"   as const, label: "Vencido"   }
  };
  const { tone, label } = map[status];
  return <Badge tone={tone} dot>{label}</Badge>;
};

// ─── Main page ─────────────────────────────────────────────────────────────────
export const OrgMetricsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OrgAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const load = async () => {
    setLoading(true);
    try {
      const result = await reportsApi.analytics();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
    : "Cargando métricas…";

  const subtitle = isSuperAdmin
    ? `Global — todas las organizaciones · ${updatedLabel}`
    : updatedLabel;

  return (
    <AppLayout>
      <PageHeader
        title="Métricas"
        subtitle={subtitle}
        action={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            Actualizar
          </Button>
        }
      />

      {/* ── KPI stat cards ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Préstamos activos"
          value={data ? data.activeLoans : "—"}
          tone="brand"
          icon={<IconLoans />}
          description="En curso actualmente"
        />
        <StatCard
          label="Vencidos / Pendientes"
          value={data ? data.overdueLoans : "—"}
          tone="danger"
          icon={<IconShield />}
          description="Sin devolver fuera de plazo"
        />
        <StatCard
          label="Ítems disponibles"
          value={data ? data.availableItems : "—"}
          tone="success"
          icon={<IconBox />}
          description="Listos para préstamo"
        />
        <StatCard
          label="Préstamos sem. actual"
          value={data ? (data.weeklyStats[data.weeklyStats.length - 1]?.loans ?? "—") : "—"}
          tone="warning"
          icon={<IconUsers />}
          description="Nuevos préstamos esta semana"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Weekly chart ──────────────────────────────────────────────────── */}
        <Card>
          <p className="mb-5 text-sm font-semibold text-text">Préstamos y devoluciones por semana</p>
          {data ? (
            <BarChart data={data.weeklyStats} />
          ) : (
            <div className="h-36 animate-pulse rounded-xl bg-surface-3" />
          )}
        </Card>

        {/* ── Per-org breakdown (SUPER_ADMIN only) ──────────────────────────── */}
        {isSuperAdmin && (
          <Card>
            <p className="mb-4 text-sm font-semibold text-text">Resumen por organización</p>
            {data?.orgs ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Organización", "Préstamos", "Usuarios", "Ítems"].map((h) => (
                        <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-subtle last:pr-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.orgs.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-text">{o.name}</p>
                          <p className="text-2xs text-muted">{o.nit}</p>
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-text">{o.totalLoans}</td>
                        <td className="py-3 pr-4 tabular-nums text-text">{o.totalUsers}</td>
                        <td className="py-3 tabular-nums text-text">{o.totalItems}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-3" />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Weekly summary table ───────────────────────────────────────────── */}
        {!isSuperAdmin && (
          <Card>
            <p className="mb-4 text-sm font-semibold text-text">Resumen semanal</p>
            {data ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Semana", "Préstamos", "Devoluciones", "Diferencia"].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-subtle last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...data.weeklyStats].reverse().map((w, i) => {
                    const diff = w.loans - w.returns;
                    return (
                      <tr key={i}>
                        <td className={cn("py-2.5 pr-4 font-medium", i === 0 ? "text-text" : "text-muted")}>
                          {w.week}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-brand-light">{w.loans}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-success">{w.returns}</td>
                        <td className={cn("py-2.5 tabular-nums font-medium", diff > 0 ? "text-warning" : diff < 0 ? "text-danger" : "text-muted")}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-xl bg-surface-3" />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Recent activity log ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <Card className="overflow-hidden">
          <p className="mb-4 text-sm font-semibold text-text">Registro de actividad reciente</p>
          {data && data.recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No hay actividad registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {(isSuperAdmin
                      ? ["Fecha", "Hora inicio", "Organización", "Ítem / Código", "Usuario", "Estado", "Vence / Devuelto"]
                      : ["Fecha", "Hora inicio", "Ítem / Código", "Usuario", "Estado", "Vence / Devuelto"]
                    ).map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-subtle last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data
                    ? data.recentActivity.map((a) => {
                        const loanedDate = new Date(a.loanedAt);
                        const endDate = a.returnedAt ? new Date(a.returnedAt) : new Date(a.dueAt);
                        return (
                          <tr key={a.id}>
                            <td className="py-3 pr-4 text-xs text-muted">
                              {loanedDate.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted">
                              {loanedDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            {isSuperAdmin && (
                              <td className="py-3 pr-4 text-xs text-muted">{a.orgName}</td>
                            )}
                            <td className="py-3 pr-4">
                              <p className="font-medium text-text">{a.itemName}</p>
                              <p className="font-mono text-2xs text-muted">{a.itemCode}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="text-text">{a.userFullName}</p>
                              <p className="text-2xs text-muted">{a.userEmail}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <LoanStatusBadge status={a.status} />
                            </td>
                            <td className="py-3 text-xs text-muted">
                              <p>{endDate.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}</p>
                              <p className="text-subtle">{a.returnedAt ? "Devuelto" : "Vencimiento"}</p>
                            </td>
                          </tr>
                        );
                      })
                    : [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i}>
                          <td colSpan={7} className="py-3">
                            <div className="h-7 animate-pulse rounded-xl bg-surface-3" />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};
