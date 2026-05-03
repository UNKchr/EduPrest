import { useEffect, useState } from "react";
import { reportsApi, type SummaryReport } from "../services/reportsApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";

export const ReportsPage = () => {
  const [summary, setSummary] = useState<SummaryReport | null>(null);

  useEffect(() => {
    reportsApi.summary().then(setSummary);
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Reportes" subtitle="Resumen global del sistema" />
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Items totales" value={summary.items.totalItems} />
          <StatCard label="Items activos" value={summary.items.activeItems} tone="success" />
          <StatCard label="Préstamos activos" value={summary.loans.activeLoans} tone="brand" />
          <StatCard label="Vencidos" value={summary.loans.overdueLoans} tone="warning" />
        </div>
      )}

      {summary && (
        <Card className="mt-6">
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">Código</th>
                <th className="text-left py-2">Total préstamos</th>
              </tr>
            </thead>
            <tbody>
              {summary.topItems.map((i) => (
                <tr key={i.itemId} className="border-t border-border">
                  <td className="py-2">{i.name}</td>
                  <td>{i.code}</td>
                  <td>{i.totalLoans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AppLayout>
  );
};