import { useEffect, useState } from "react";
import { userReportsApi, type UserReport } from "../services/userReportsApi";
import { usersApi } from "../services/usersApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<UserReport[]>([]);

  const load = async () => {
    const data = await userReportsApi.list();
    setReports(data);
  };

  useEffect(() => {
    let active = true;
    userReportsApi.list().then((data) => active && setReports(data));
    return () => {
      active = false;
    };
  }, []);

  const update = async (id: number, status: "APPROVED" | "REJECTED") => {
    await userReportsApi.updateStatus(id, status);
    await load();
  };

  const banUser = async (userId: number) => {
    const reason = window.prompt("Motivo del baneo:");
    if (!reason || reason.trim().length < 5) return;
    await usersApi.ban(userId, reason);
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Reportes de Usuarios" subtitle="Revisión y acciones" />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr>
              <th className="text-left py-2">Usuario reportado</th>
              <th className="text-left py-2">Reportado por</th>
              <th className="text-left py-2">Motivo</th>
              <th className="text-left py-2">Estado</th>
              <th className="text-left py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-2">{r.user.email}</td>
                <td>{r.reportedBy.email}</td>
                <td>{r.reason}</td>
                <td>
                  <Badge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}>
                    {r.status}
                  </Badge>
                </td>
                <td className="space-x-2">
                  <Button size="sm" onClick={() => update(r.id, "APPROVED")}>Aprobar</Button>
                  <Button variant="secondary" size="sm" onClick={() => update(r.id, "REJECTED")}>Rechazar</Button>
                  <Button variant="danger" size="sm" onClick={() => banUser(r.user.id)}>Banear</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  );
};