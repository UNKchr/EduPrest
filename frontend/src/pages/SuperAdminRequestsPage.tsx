import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { banRequestsApi, type BanRequest, type BanRequestStatus } from "../services/banRequestsApi";
import { organizationsApi, type Organization } from "../services/organizationsApi";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { usersApi } from "../services/usersApi";

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

const IconTrash = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SuperAdminRequestsPage = () => {
  const [requests, setRequests] = useState<BanRequest[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [status, setStatus] = useState<BanRequestStatus | "">("PENDING");
  const [orgFilter, setOrgFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const rangeStart = total === 0 ? 0 : page * limit + 1;
  const rangeEnd = Math.min(total, (page + 1) * limit);
  const { confirmText, prompt } = useModal();
  const { showToast } = useToast();

  const askConfirm = (title: string) =>
    confirmText({
      title,
      message: `Escribe ${CONFIRM_TEXT} para continuar.`,
      confirmText: CONFIRM_TEXT,
      placeholder: CONFIRM_TEXT
    });

  const askReason = (title: string, minLength: number) =>
    prompt({
      title,
      message: `Escribe el motivo (min ${minLength} caracteres).`,
      placeholder: "Motivo",
      minLength,
      multiline: true
    });

  const reload = async (nextPage = page) => {
    const params = {
      status: status || undefined,
      organizationId: orgFilter ? Number(orgFilter) : undefined,
      limit,
      offset: nextPage * limit
    };
    const response = await banRequestsApi.list(params);
    setRequests(response.data);
    setTotal(response.total);
    setHasNext((nextPage + 1) * limit < response.total);
    if (nextPage !== page) setPage(nextPage);
  };

  useEffect(() => {
    let active = true;
    organizationsApi.list().then((data) => active && setOrgs(data));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = {
      status: status || undefined,
      organizationId: orgFilter ? Number(orgFilter) : undefined,
      limit,
      offset: page * limit
    };
    banRequestsApi.list(params).then((response) => {
      if (!active) return;
      setRequests(response.data);
      setTotal(response.total);
      setHasNext((page + 1) * limit < response.total);
    });
    return () => { active = false; };
  }, [status, orgFilter, page]);

  const approve = async (id: number, targetEmail: string) => {
    const confirmed = await askConfirm(`Aprobar baneo de ${targetEmail}`);
    if (!confirmed) return;

    const note = await prompt({
      title: "Nota de aprobacion (opcional)",
      message: "Puedes dejarla vacia si no aplica.",
      placeholder: "Nota",
      minLength: 0,
      multiline: true,
      allowEmpty: true,
      confirmLabel: "Guardar"
    });
    if (note === null) return;

    await banRequestsApi.approve(id, note.trim() ? note.trim() : undefined);
    await reload(0);
  };

  const reject = async (id: number, targetEmail: string) => {
    const confirmed = await askConfirm(`Rechazar baneo de ${targetEmail}`);
    if (!confirmed) return;

    const note = await askReason("Motivo del rechazo", 5);
    if (!note) return;

    await banRequestsApi.reject(id, note);
    await reload(0);
  };

  const banUser = async (userId: number, targetEmail: string) => {
    const reason = await askReason(`Motivo del baneo de ${targetEmail}`, 10);
    if (!reason) return;
    const confirmed = await askConfirm(`Confirmar baneo de ${targetEmail}`);
    if (!confirmed) return;

    await usersApi.ban(userId, reason, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "ban", label: "Baneado" });
    await reload(0);
  };

  const removeUser = async (userId: number, targetEmail: string) => {
    const confirmed = await askConfirm(`Eliminar usuario ${targetEmail}`);
    if (!confirmed) return;

    await usersApi.remove(userId, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "trash", label: "Eliminado" });
    await reload(0);
  };

  return (
    <AppLayout>
      <PageHeader title="Solicitudes de baneo" subtitle="Revisa y aprueba solicitudes de admins" />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Estado</span>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as BanRequestStatus | "");
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Organización</span>
            <Select
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.nit})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {requests.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-7 5h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No se encontraron solicitudes con los filtros actuales.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="text-muted">
                <tr>
                  <th className="w-[22%] text-left py-2">Org</th>
                  <th className="w-[26%] text-left py-2">Solicitud</th>
                  <th className="w-[28%] text-left py-2">Motivo</th>
                  <th className="w-[12%] text-left py-2">Estado</th>
                  <th className="w-[12%] text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-3 align-top">
                      <div className="font-medium leading-snug">{r.organization.name}</div>
                      <div className="text-xs text-muted">{r.organization.nit}</div>
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <div className="text-xs text-muted">Solicitante</div>
                      <div className="text-sm break-all">{r.requestedBy.email}</div>
                      <div className="mt-2 text-xs text-muted">Objetivo</div>
                      <div className="text-sm break-all">{r.targetUser.email}</div>
                    </td>
                    <td className="py-2 pr-3 align-top text-sm break-words">{r.reason}</td>
                    <td className="py-2 align-top">
                      <Badge tone={r.status === "PENDING" ? "warning" : r.status === "APPROVED" ? "success" : "danger"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="px-2"
                              title="Aprobar"
                              aria-label="Aprobar"
                              onClick={() => approve(r.id, r.targetUser.email)}
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
                              onClick={() => reject(r.id, r.targetUser.email)}
                            >
                              <IconReject />
                              <span className="sr-only">Rechazar</span>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-2"
                          title="Banear usuario"
                          aria-label="Banear usuario"
                          onClick={() => banUser(r.targetUser.id, r.targetUser.email)}
                        >
                          <IconBan />
                          <span className="sr-only">Banear usuario</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-2"
                          title="Eliminar usuario"
                          aria-label="Eliminar usuario"
                          onClick={() => removeUser(r.targetUser.id, r.targetUser.email)}
                        >
                          <IconTrash />
                          <span className="sr-only">Eliminar usuario</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex items-center justify-between gap-2">
              <span className="text-muted text-sm">
                Mostrando {rangeStart}-{rangeEnd} de {total}
              </span>
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </>
        )}
      </Card>
    </AppLayout>
  );
};