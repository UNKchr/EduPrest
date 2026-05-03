import { useEffect, useState } from "react";
import { itemsApi, type Item } from "../services/itemsApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const emptyForm = { name: "", code: "", description: "", quantity: 1, isActive: true };

export const ItemsPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    const data = await itemsApi.list();
    setItems(data);
  };

  useEffect(() => {
    let active = true;
    itemsApi.list().then((data) => active && setItems(data));
    return () => {
      active = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await itemsApi.update(editingId, form);
    else await itemsApi.create(form);

    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Inventario de Items" subtitle="Gestiona items disponibles en tu organización" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <form onSubmit={submit} className="grid gap-3">
            <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="number" min={1} placeholder="Cantidad" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Activo
            </label>
            <Button type="submit">{editingId ? "Actualizar" : "Crear"}</Button>
          </form>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Código</th>
                <th className="text-left py-2">Cantidad</th>
                <th className="text-left py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-2">{i.name}</td>
                  <td>{i.code}</td>
                  <td>{i.quantity}</td>
                  <td>
                    <Badge tone={i.isActive ? "success" : "danger"}>
                      {i.isActive ? "Activo" : "Inactivo"}
                    </Badge>
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