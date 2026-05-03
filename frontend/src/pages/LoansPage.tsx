import { useEffect, useState } from "react";
import { loansApi, type Loan } from "../services/loansApi";
import { useAuth } from "../context/useAuth";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const LoansPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [form, setForm] = useState({ userId: "", itemId: "", dueAt: "" });

  const load = async () => {
    const data = user?.role === "STUDENT" ? await loansApi.listMine() : await loansApi.list();
    setLoans(data);
  };

  useEffect(() => {
    let active = true;
    const request = user?.role === "STUDENT" ? loansApi.listMine() : loansApi.list();
    request.then((data) => active && setLoans(data));
    return () => {
      active = false;
    };
  }, [user?.role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loansApi.create({
      userId: Number(form.userId),
      itemId: Number(form.itemId),
      dueAt: new Date(form.dueAt).toISOString()
    });
    setForm({ userId: "", itemId: "", dueAt: "" });
    await load();
  };

  return (
    <AppLayout>
      <PageHeader title="Préstamos" subtitle="Controla préstamos activos y retornos" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {user?.role !== "STUDENT" && (
          <Card>
            <form onSubmit={submit} className="grid gap-3">
              <Input placeholder="ID Usuario" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
              <Input placeholder="ID Item" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
              <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
              <Button type="submit">Crear préstamo</Button>
            </form>
          </Card>
        )}

        <Card>
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">Usuario</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Vence</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="py-2">{l.item?.name}</td>
                  <td>{l.user?.email}</td>
                  <td>
                    <Badge tone={l.status === "ACTIVE" ? "success" : l.status === "OVERDUE" ? "danger" : "neutral"}>
                      {l.status}
                    </Badge>
                  </td>
                  <td>{new Date(l.dueAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
};