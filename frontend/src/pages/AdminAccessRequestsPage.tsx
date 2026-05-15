import { useEffect, useRef, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { useToast } from "../context/ToastContext";
import {
  accessRequestsApi,
  type AccessRequest,
  type AccessRequestStatus
} from "../services/accessRequestsApi";

const AUTO_REFRESH_MS = 30_000;

const IconCheck = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconReject = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6l-12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconRefresh = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 12a8 8 0 018-8 8 8 0 016.93 4M20 4v4h-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 12a8 8 0 01-8 8 8 8 0 01-6.93-4M4 20v-4h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const statusLabel: Record<AccessRequestStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada"
};

const statusTone: Record<AccessRequestStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger"
};

export const AdminAccessRequestsPage = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | "">("PENDING");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const limit = 20;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rangeStart = total === 0 ? 0 : page * limit + 1;
  const rangeEnd = Math.min(total, (page + 1) * limit);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const result = await accessRequestsApi.list({
        status: statusFilter || undefined,
        limit,
        offset: nextPage * limit
      });
      setRequests(result.data);
      setTotal(result.total);
      setHasNext((nextPage + 1) * limit < result.total);
      if (nextPage !== page) setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    let active = true;
    accessRequestsApi
      .list({ status: statusFilter || undefined, limit, offset: page * limit })
      .then((result) => {
        if (!active) return;
        setRequests(result.data);
        setTotal(result.total);
        setHasNext((page + 1) * limit < result.total);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => load(), AUTO_REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const approve = async (request: AccessRequest) => {
    try {
      await accessRequestsApi.approve(request.id);
      showToast({ tone: "success", icon: "check", label: "Acceso concedido" });
      await load(0);
    } catch {
      showToast({ tone: "danger", icon: "ban", label: "Error al conceder acceso" });
    }
  };

  const reject = async (request: AccessRequest) => {
    try {
      await accessRequestsApi.reject(request.id);
      showToast({ tone: "danger", icon: "ban", label: "Solicitud rechazada" });
      await load(0);
    } catch {
      showToast({ tone: "danger", icon: "ban", label: "Error al rechazar solicitud" });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Solicitudes de acceso"
        subtitle="Gestiona las solicitudes de nuevos usuarios para tu organización"
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Estado</span>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AccessRequestStatus | "");
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </Select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
            title="Actualizar lista"
            onClick={() => load(0)}
            disabled={loading}
          >
            <IconRefresh />
            <span>Actualizar</span>
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {requests.length === 0 ? (
          <div className="py-12 text-center text-muted">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-3-3v6m-7 5h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">
              No hay solicitudes{statusFilter ? ` con estado "${statusLabel[statusFilter as AccessRequestStatus]}"` : ""}.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="text-muted">
                <tr>
                  <th className="w-[24%] text-left py-2 pr-3">Nombre</th>
                  <th className="w-[28%] text-left py-2 pr-3">Correo</th>
                  <th className="w-[20%] text-left py-2 pr-3">Organización</th>
                  <th className="w-[14%] text-left py-2 pr-3">Fecha</th>
                  <th className="w-[8%] text-left py-2 pr-3">Estado</th>
                  <th className="w-[6%] text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-3 align-middle font-medium">{r.fullName}</td>
                    <td className="py-2 pr-3 align-middle break-all">{r.email}</td>
                    <td className="py-2 pr-3 align-middle">
                      <div className="font-medium leading-snug">{r.organization.name}</div>
                      <div className="text-xs text-muted">{r.organization.nit}</div>
                    </td>
                    <td className="py-2 pr-3 align-middle text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-2 pr-3 align-middle">
                      <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>
                    </td>
                    <td className="py-2 align-middle">
                      {r.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Conceder acceso"
                            aria-label="Conceder acceso"
                            onClick={() => approve(r)}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                          >
                            <IconCheck />
                            <span className="sr-only">Conceder acceso</span>
                          </button>
                          <button
                            type="button"
                            title="Denegar acceso"
                            aria-label="Denegar acceso"
                            onClick={() => reject(r)}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <IconReject />
                            <span className="sr-only">Denegar acceso</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex items-center justify-between gap-2">
              <span className="text-muted text-sm">
                Mostrando {rangeStart}–{rangeEnd} de {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </AppLayout>
  );
};
