import { useEffect, useState } from "react";
import { usersApi, type UserRow } from "../services/usersApi";
import { organizationsApi, type Organization } from "../services/organizationsApi";
import { banRequestsApi } from "../services/banRequestsApi";
import { useAuth } from "../context/useAuth";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import type { Role } from "../auth/roles";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const CONFIRM_TEXT = "CONFIRMAR";

const IconBan = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUnban = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRequest = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l9 16H3l9-16Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

const IconTrash = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const { prompt, confirmText } = useModal();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STUDENT" as Role,
    organizationId: ""
  });

  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const showRoleFilter = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const rangeStart = total === 0 ? 0 : page * limit + 1;
  const rangeEnd = Math.min(total, (page + 1) * limit);

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
    if (!user) return;
    const response = await usersApi.list({
      q: query.trim() || undefined,
      role: showRoleFilter && roleFilter ? roleFilter : undefined,
      limit,
      offset: page * limit
    });
    setUsers(response.data);
    setTotal(response.total);
    setHasNext((page + 1) * limit < response.total);
  };

  useEffect(() => {
    let active = true;
    if (user?.role === "SUPER_ADMIN") {
      organizationsApi.list().then((data) => active && setOrgs(data));
    }
    return () => {
      active = false;
    };
  }, [user?.role]);

  useEffect(() => {
    let active = true;
    if (!user) return undefined;
    usersApi
      .list({
        q: query.trim() || undefined,
        role: showRoleFilter && roleFilter ? roleFilter : undefined,
        limit,
        offset: page * limit
      })
      .then((response) => {
        if (!active) return;
        setUsers(response.data);
        setTotal(response.total);
        setHasNext((page + 1) * limit < response.total);
      });
    return () => {
      active = false;
    };
  }, [user, query, roleFilter, limit, page, showRoleFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    await usersApi.create({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      role: form.role,
      organizationId: user?.role === "SUPER_ADMIN" ? Number(form.organizationId) : undefined
    });
    setForm({ email: "", password: "", fullName: "", role: "STUDENT", organizationId: "" });
    showToast({ tone: "success", icon: "check", label: "Creado" });
    await load();
  };

  const changeRole = async (target: UserRow, role: Role) => {
    if (!canManage) return;
    if (target.role === role) return;
    const reason = await askReason("Motivo del cambio de rol");
    if (!reason) return;
    const confirmed = await askConfirm(`Confirmar cambio de rol de ${target.email} a ${role}`);
    if (!confirmed) return;
    await usersApi.updateRole(target.id, role, reason, CONFIRM_TEXT);
    await load();
  };

  const ban = async (target: UserRow) => {
    if (!canManage) return;
    const reason = await askReason("Motivo del baneo");
    if (!reason) return;
    const confirmed = await askConfirm(`Confirmar baneo de ${target.email}`);
    if (!confirmed) return;
    await usersApi.ban(target.id, reason, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "ban", label: "Baneado" });
    await load();
  };

  const unban = async (target: UserRow) => {
    if (!canManage) return;
    const reason = await askReason("Motivo del desbaneo");
    if (!reason) return;
    const confirmed = await askConfirm(`Confirmar desbaneo de ${target.email}`);
    if (!confirmed) return;
    await usersApi.unban(target.id, reason, CONFIRM_TEXT);
    showToast({ tone: "success", icon: "check", label: "Desbaneado" });
    await load();
  };

  const requestAdminBan = async (target: UserRow) => {
    if (!canManage) return;
    const reason = await askReason("Motivo de la solicitud");
    if (!reason) return;
    const confirmed = await askConfirm(`Confirmar solicitud de baneo para ${target.email}`);
    if (!confirmed) return;
    await banRequestsApi.create({ targetUserId: target.id, reason });
    showToast({ tone: "success", icon: "check", label: "Creado" });
    await load();
  };

  const removeUser = async (target: UserRow) => {
    if (!canManage) return;
    const confirmed = await askConfirm(`Confirmar eliminacion de ${target.email}`);
    if (!confirmed) return;
    await usersApi.remove(target.id, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "trash", label: "Eliminado" });
    await load();
  };

  const canDeleteTarget = (target: UserRow) => {
    if (!canManage || target.id === user?.id) return false;
    if (user?.role === "SUPER_ADMIN") return true;
    return user?.role === "ADMIN" && target.role !== "ADMIN" && target.role !== "SUPER_ADMIN";
  };

  return (
    <AppLayout>
      <PageHeader title="Usuarios" subtitle="Gestión de usuarios y roles" />

      <div className="flex flex-col gap-6">
        {canManage && (
          <Card>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Nombre completo"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {user?.role === "SUPER_ADMIN" && (
                <Select
                  value={form.organizationId}
                  onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                >
                  <option value="">Organización</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.nit})
                    </option>
                  ))}
                </Select>
              )}
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="STUDENT">STUDENT</option>
                <option value="TECH">TECH</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">Crear usuario</Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-x-auto">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Buscar por email o nombre"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
            {showRoleFilter && (
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as Role | "");
                  setPage(0);
                }}
              >
                <option value="">Todos los roles</option>
                {user?.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                <option value="ADMIN">ADMIN</option>
                <option value="TECH">TECH</option>
                <option value="STUDENT">STUDENT</option>
              </Select>
            )}
            <Select
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value="5">5 por pagina</option>
              <option value="10">10 por pagina</option>
              <option value="20">20 por pagina</option>
              <option value="30">30 por pagina</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
            >
              Limpiar
            </Button>
          </div>

          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Rol</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Org</th>
                <th className="text-left py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-2">{u.email}</td>
                  <td>{u.fullName}</td>
                  <td>{u.role}</td>
                  <td>
                    <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status}</Badge>
                  </td>
                  <td>{u.organizationId}</td>
                  <td>
                    {canManage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value as Role)}
                          className="inline-flex w-auto"
                          disabled={user?.role === "ADMIN" && u.role === "ADMIN"}
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="TECH">TECH</option>
                          <option value="ADMIN">ADMIN</option>
                        </Select>
                        {u.status === "ACTIVE" ? (
                          user?.role === "ADMIN" && u.role === "ADMIN" ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="px-2"
                              title="Solicitar baneo"
                              aria-label="Solicitar baneo"
                              onClick={() => requestAdminBan(u)}
                            >
                              <IconRequest />
                              <span className="sr-only">Solicitar baneo</span>
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              className="px-2"
                              title="Banear"
                              aria-label="Banear"
                              onClick={() => ban(u)}
                            >
                              <IconBan />
                              <span className="sr-only">Banear</span>
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-2"
                            title="Desbanear"
                            aria-label="Desbanear"
                            onClick={() => unban(u)}
                          >
                            <IconUnban />
                            <span className="sr-only">Desbanear</span>
                          </Button>
                        )}
                        {canDeleteTarget(u) && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="px-2"
                            title="Eliminar usuario"
                            aria-label="Eliminar usuario"
                            onClick={() => removeUser(u)}
                          >
                            <IconTrash />
                            <span className="sr-only">Eliminar usuario</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted text-sm">Sin acciones</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-muted text-sm">
              Mostrando {rangeStart}-{rangeEnd} de {total}
            </span>
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
        </Card>
      </div>
    </AppLayout>
  );
};