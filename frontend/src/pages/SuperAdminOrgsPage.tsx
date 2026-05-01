import { useEffect, useState } from "react";
import { organizationsApi, type Organization } from "../services/OrganizationsApi";

export const SuperAdminOrgsPage = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [form, setForm] = useState({ name: "", nit: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    try {
      const data = await organizationsApi.list();
      setOrgs(data);
    } catch {
      setMessage({ type: "error", text: "No se pudieron cargar organizaciones." });
    }
  };

  useEffect(() => {
    let active = true;
    organizationsApi.list().then((data) => {
      if (active) setOrgs(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3 || form.nit.trim().length < 3) {
      setMessage({ type: "error", text: "Nombre y NIT inválidos." });
      return;
    }
    try {
      await organizationsApi.create(form);
      setForm({ name: "", nit: "" });
      setMessage({ type: "success", text: "Organización creada." });
      await load();
    } catch {
      setMessage({ type: "error", text: "No se pudo crear la organización." });
    }
  };

  const ban = async (id: number) => {
    const reason = window.prompt("Motivo del baneo:");
    if (!reason || reason.trim().length < 5) return;
    await organizationsApi.ban(id, reason);
    await load();
  };

  const unban = async (id: number) => {
    await organizationsApi.unban(id);
    await load();
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Organizaciones</h2>

      {message && (
        <p style={{ color: message.type === "error" ? "crimson" : "green" }}>
          {message.text}
        </p>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="NIT"
          value={form.nit}
          onChange={(e) => setForm({ ...form, nit: e.target.value })}
        />
        <button type="submit">Crear organización</button>
      </form>

      <hr />

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>NIT</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id}>
              <td>{o.name}</td>
              <td>{o.nit}</td>
              <td>{o.status}</td>
              <td>
                {o.status === "ACTIVE" ? (
                  <button onClick={() => ban(o.id)}>Banear</button>
                ) : (
                  <button onClick={() => unban(o.id)}>Desbanear</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};