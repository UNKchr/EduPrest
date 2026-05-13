import { useEffect, useState } from "react";
import { organizationsApi, type Organization } from "../services/organizationsApi";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
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

const IconTrash = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SuperAdminOrgsPage = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [form, setForm] = useState({ name: "", nit: "" });
  const { prompt, confirmText } = useModal();
  const { showToast } = useToast();

  const askReason = (title: string) =>
    prompt({
      title,
      message: "Escribe el motivo (min 5 caracteres).",
      placeholder: "Motivo",
      minLength: 5,
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
    showToast({ tone: "success", icon: "check", label: "Creado" });
    await load();
  };

  const ban = async (id: number) => {
    const reason = await askReason("Motivo del baneo");
    if (!reason) return;
    await organizationsApi.ban(id, reason);
    showToast({ tone: "danger", icon: "ban", label: "Baneado" });
    await load();
  };

  const unban = async (id: number) => {
    await organizationsApi.unban(id);
    showToast({ tone: "success", icon: "check", label: "Desbaneado" });
    await load();
  };

  const removeOrg = async (org: Organization) => {
    const confirmed = await askConfirm(`Eliminar ${org.name} y toda su información`);
    if (!confirmed) return;
    await organizationsApi.remove(org.id, CONFIRM_TEXT);
    showToast({ tone: "danger", icon: "trash", label: "Eliminado" });
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Organizaciones" subtitle="Control global de instituciones" />
      <div className="flex flex-col gap-6">
        <Card>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Crear organización</Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-x-auto">
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
                    <div className="flex flex-wrap items-center gap-2">
                      {o.status === "ACTIVE" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="px-2"
                          title="Banear organización"
                          aria-label="Banear organización"
                          onClick={() => ban(o.id)}
                        >
                          <IconBan />
                          <span className="sr-only">Banear organización</span>
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          title="Desbanear organización"
                          aria-label="Desbanear organización"
                          onClick={() => unban(o.id)}
                        >
                          <IconUnban />
                          <span className="sr-only">Desbanear organización</span>
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        className="px-2"
                        title="Eliminar organización"
                        aria-label="Eliminar organización"
                        onClick={() => removeOrg(o)}
                      >
                        <IconTrash />
                        <span className="sr-only">Eliminar organización</span>
                      </Button>
                    </div>
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