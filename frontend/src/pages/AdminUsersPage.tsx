import { useEffect, useState } from "react";
import { usersApi, type UserRow } from "../services/usersApi";
import { organizationsApi, type Organization } from "../services/OrganizationsApi";
import { useAuth } from "../context/useAuth";
import type { Role } from "../auth/roles";

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
    if (form.email.trim().length < 5 || form.password.length < 8 || form.fullName.length < 3) {
      return;
    }
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
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Usuarios</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Nombre completo"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {user?.role === "SUPER_ADMIN" && (
          <select
            value={form.organizationId}
            onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
          >
            <option value="">Organización</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.nit})
              </option>
            ))}
          </select>
        )}
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          <option value="STUDENT">STUDENT</option>
          <option value="TECH">TECH</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="submit">Crear usuario</button>
      </form>

      <hr />

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Org</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.fullName}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>{u.organizationId}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TECH">TECH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>{" "}
                {u.status === "ACTIVE" ? (
                  <button onClick={() => ban(u.id)}>Banear</button>
                ) : (
                  <button onClick={() => unban(u.id)}>Desbanear</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};