import { useEffect, useState } from "react";
import { userReportsApi, type UserReport } from "../services/userReportsApi";
import { usersApi } from "../services/usersApi";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const CONFIRM_TEXT = "CONFIRMAR";

const IconApprove = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconReject = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconBan = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const { prompt, confirmText } = useModal();
  const { showToast } = useToast();

  const askReason = (title: string) =>
    prompt({
      title,
      message: "Escribe el motivo (min 10 caracteres).",
      placeholder: "Motivo",
      minLength: 10,
      multiline: true
    });

  const askConfirm = (title: string) =>
    confirmText({
      title,
      message: `Escribe ${CONFIRM_TEXT} para continuar.`,
      confirmText: CONFIRM_TEXT,
      placeholder: CONFIRM_TEXT
    });

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
    const reason = await askReason("Motivo del baneo");
    if (!reason) return;
    const confirmed = await askConfirm("Confirmar baneo de usuario");
    if (!confirmed) return;
    await usersApi.ban(userId, reason, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "ban", label: "Baneado" });
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
                <td>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="px-2"
                      title="Aprobar"
                      aria-label="Aprobar"
                      onClick={() => update(r.id, "APPROVED")}
                    >
                      <IconApprove />
                      <span className="sr-only">Aprobar</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="px-2"
                      title="Rechazar"
                      aria-label="Rechazar"
                      onClick={() => update(r.id, "REJECTED")}
                    >
                      <IconReject />
                      <span className="sr-only">Rechazar</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="px-2"
                      title="Banear"
                      aria-label="Banear"
                      onClick={() => banUser(r.user.id)}
                    >
                      <IconBan />
                      <span className="sr-only">Banear</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  );
};