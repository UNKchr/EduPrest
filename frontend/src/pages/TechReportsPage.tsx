import { useState } from "react";
import { userReportsApi } from "../services/userReportsApi";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export const TechReportsPage = () => {
  const [form, setForm] = useState({ userIdentifier: "" });
  const { prompt } = useModal();
  const { showToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = form.userIdentifier.trim();
    if (!identifier) return;

    const reason = await prompt({
      title: "Motivo del reporte",
      message: "Describe el motivo (min 10 caracteres).",
      placeholder: "Motivo del reporte",
      minLength: 10,
      multiline: true
    });
    if (!reason) return;

    if (identifier.includes("@")) {
      await userReportsApi.create({ userEmail: identifier, reason });
    } else {
      const userId = Number(identifier);
      if (!Number.isFinite(userId) || userId <= 0) return;
      await userReportsApi.create({ userId, reason });
    }

    showToast({ tone: "info", icon: "info", label: "Reportado" });
    setForm({ userIdentifier: "" });
  };

  return (
    <AppLayout>
      <PageHeader title="Reportar usuario" subtitle="Solicitud de baneo" />
      <Card className="max-w-lg">
        <form onSubmit={submit} className="grid gap-3">
          <Input
            placeholder="ID o correo del usuario"
            value={form.userIdentifier}
            onChange={(e) => setForm({ ...form, userIdentifier: e.target.value })}
          />
          <Button type="submit">Enviar reporte</Button>
        </form>
      </Card>
    </AppLayout>
  );
};