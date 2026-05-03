import { useEffect, useState } from "react";
import { auditApi, type AuditLog } from "../services/auditApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";

export const AuditPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    auditApi.list().then(setLogs);
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Audit Log" subtitle="Historial de operaciones críticas" />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr>
              <th className="text-left py-2">Acción</th>
              <th className="text-left py-2">Entidad</th>
              <th className="text-left py-2">ID</th>
              <th className="text-left py-2">Usuario</th>
              <th className="text-left py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="py-2">{l.action}</td>
                <td>{l.entity}</td>
                <td>{l.entityId ?? "-"}</td>
                <td>{l.user?.email ?? "N/A"}</td>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  );
};