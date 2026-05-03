import { useEffect, useState } from "react";
import { usersApi, type UserRow } from "../services/usersApi";
import { organizationsApi, type Organization } from "../services/organizationsApi";
import { useAuth } from "../context/useAuth";
import type { Role } from "../auth/roles";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STUDENT" as Role,
    organizationId: ""
  });

  const load = async () => {
    const data = await usersApi.list();
    setUsers(data);
  };

  useEffect(() => {
    let active = true;
    usersApi.list().then((data) => active && setUsers(data));
    if (user?.role === "SUPER_ADMIN") {
      organizationsApi.list().then((data) => active && setOrgs(data));
    }
    return () => {
      active = false;
    };
  }, [user?.role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await usersApi.create({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      role: form.role,
      organizationId: user?.role === "SUPER_ADMIN" ? Number(form.organizationId) : undefined
    });
    setForm({ email: "", password: "", fullName: "", role: "STUDENT", organizationId: "" });
    await load();
  };

  const changeRole = async (id: number, role: Role) => {
    await usersApi.updateRole(id, role);
    await load();
  };

  const ban = async (id: number) => {
    const reason = window.prompt("Motivo del baneo:");
    if (!reason || reason.trim().length < 5) return;
    await usersApi.ban(id, reason);
    await load();
  };

  const unban = async (id: number) => {
    await usersApi.unban(id);
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Usuarios" subtitle="Gestión de usuarios y roles" />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <form onSubmit={submit} className="grid gap-3">
            <Input placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {user?.role === "SUPER_ADMIN" && (
              <Select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
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
            <Button type="submit">Crear usuario</Button>
          </form>
        </Card>

        <Card>
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
                  <td className="space-x-2">
                    <Select value={u.role} onChange={(e) => changeRole(u.id, e.target.value as Role)} className="inline-flex w-auto">
                      <option value="STUDENT">STUDENT</option>
                      <option value="TECH">TECH</option>
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                    {u.status === "ACTIVE" ? (
                      <Button variant="danger" size="sm" onClick={() => ban(u.id)}>Banear</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => unban(u.id)}>Desbanear</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
};