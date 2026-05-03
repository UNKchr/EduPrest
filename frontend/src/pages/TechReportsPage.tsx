import { useState } from "react";
import { userReportsApi } from "../services/userReportsApi";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

export const TechReportsPage = () => {
  const [form, setForm] = useState({ userId: "", reason: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await userReportsApi.create({
      userId: Number(form.userId),
      reason: form.reason
    });
    setForm({ userId: "", reason: "" });
  };

  return (
    <AppLayout>
      <PageHeader title="Reportar usuario" subtitle="Solicitud de baneo" />
      <Card className="max-w-lg">
        <form onSubmit={submit} className="grid gap-3">
          <Input placeholder="ID Usuario" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
          <Textarea placeholder="Motivo" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button type="submit">Enviar reporte</Button>
        </form>
      </Card>
    </AppLayout>
  );
};