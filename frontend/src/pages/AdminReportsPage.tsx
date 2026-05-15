import { useEffect, useMemo, useState } from "react";
import { userReportsApi, type ReportStatus, type UserReport } from "../services/userReportsApi";
import { usersApi } from "../services/usersApi";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

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

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado"
};

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [emailQuery, setEmailQuery] = useState("");
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
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = emailQuery.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q && !r.user.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reports, statusFilter, emailQuery]);

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
      <PageHeader title="Reportes de Usuarios" subtitle="Revisión y acciones sobre reportes" />

      <Card>
        {/* Filtros */}
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Buscar por email del reportado…"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
          />
          <Select
            className="w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | "")}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="REJECTED">Rechazado</option>
          </Select>
          {(statusFilter || emailQuery) && (
            <Button
              variant="secondary"
              onClick={() => { setStatusFilter(""); setEmailQuery(""); }}
            >
              Limpiar
            </Button>
          )}
          <span className="ml-auto self-center text-sm text-muted">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-3 font-medium text-muted w-52">Usuario reportado</th>
                <th className="text-left px-3 py-3 font-medium text-muted w-52">Reportado por</th>
                <th className="text-left px-3 py-3 font-medium text-muted">Motivo</th>
                <th className="text-left px-3 py-3 font-medium text-muted w-32">Estado</th>
                <th className="text-left px-3 py-3 font-medium text-muted w-36">Fecha</th>
                <th className="text-left px-3 py-3 font-medium text-muted w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    No hay reportes{statusFilter || emailQuery ? " que coincidan con los filtros" : ""}.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium truncate max-w-[180px]" title={r.user.email}>
                        {r.user.email}
                      </div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{r.user.fullName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="truncate max-w-[180px]" title={r.reportedBy.email}>
                        {r.reportedBy.email}
                      </div>
                      <div className="text-xs text-muted truncate max-w-[180px]">{r.reportedBy.fullName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm leading-snug line-clamp-2 max-w-xs" title={r.reason}>
                        {r.reason}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={
                          r.status === "APPROVED"
                            ? "success"
                            : r.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          className="px-2"
                          title="Aprobar"
                          aria-label="Aprobar reporte"
                          onClick={() => update(r.id, "APPROVED")}
                        >
                          <IconApprove />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          title="Rechazar"
                          aria-label="Rechazar reporte"
                          onClick={() => update(r.id, "REJECTED")}
                        >
                          <IconReject />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-2"
                          title="Banear usuario"
                          aria-label="Banear usuario"
                          onClick={() => banUser(r.user.id)}
                        >
                          <IconBan />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
};
