import { useState } from "react";
import { userReportsApi } from "../services/userReportsApi";

export const TechReportsPage = () => {
  const [form, setForm] = useState({ userId: "", reason: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || form.reason.trim().length < 5) {
      setMessage({ type: "error", text: "Usuario y motivo son requeridos." });
      return;
    }
    try {
      await userReportsApi.create({
        userId: Number(form.userId),
        reason: form.reason
      });
      setMessage({ type: "success", text: "Reporte enviado." });
      setForm({ userId: "", reason: "" });
    } catch {
      setMessage({ type: "error", text: "No se pudo enviar el reporte." });
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Reportar usuario</h2>
      {message && (
        <p style={{ color: message.type === "error" ? "crimson" : "green" }}>
          {message.text}
        </p>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="ID Usuario"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
        />
        <textarea
          placeholder="Motivo"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <button type="submit">Enviar reporte</button>
      </form>
    </main>
  );
};