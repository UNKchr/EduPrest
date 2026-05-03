import { useEffect, useState } from "react";
import { organizationsApi, type Organization } from "../services/organizationsApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const SuperAdminOrgsPage = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [form, setForm] = useState({ name: "", nit: "" });

  const load = async () => {
    const data = await organizationsApi.list();
    setOrgs(data);
  };

  useEffect(() => {
    let active = true;
    organizationsApi.list().then((data) => active && setOrgs(data));
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await organizationsApi.create(form);
    setForm({ name: "", nit: "" });
    await load();
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
    <AppLayout>
      <PageHeader title="Organizaciones" subtitle="Control global de instituciones" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <form onSubmit={submit} className="grid gap-3">
            <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            <Button type="submit">Crear organización</Button>
          </form>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">NIT</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2">{o.name}</td>
                  <td>{o.nit}</td>
                  <td>
                    <Badge tone={o.status === "ACTIVE" ? "success" : "danger"}>{o.status}</Badge>
                  </td>
                  <td>
                    {o.status === "ACTIVE" ? (
                      <Button variant="danger" size="sm" onClick={() => ban(o.id)}>Banear</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => unban(o.id)}>Desbanear</Button>
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