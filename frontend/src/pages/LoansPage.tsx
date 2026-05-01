import { useEffect, useState } from "react";
import { loansApi, type Loan } from "../services/loansApi";
import { useAuth } from "../context/useAuth";

type ApiErrorResponse = { error?: string };

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: ApiErrorResponse } }).response;
    const message = response?.data?.error;
    if (message) return message;
  }
  return fallback;
};

export const LoansPage = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [form, setForm] = useState({ userId: "", itemId: "", dueAt: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    try {
      const data =
        user?.role === "STUDENT" ? await loansApi.listMine() : await loansApi.list();
      setLoans(data);
    } catch {
      setMessage({ type: "error", text: "No se pudo cargar préstamos." });
    }
  };

  useEffect(() => {
    let active = true;
    const request =
      user?.role === "STUDENT" ? loansApi.listMine() : loansApi.list();
    request.then((data) => {
      if (active) setLoans(data);
    });
    return () => {
      active = false;
    };
  }, [user?.role]);

  const validate = () => {
    if (user?.role === "STUDENT") return null;
    if (!form.userId || Number(form.userId) <= 0) return "Usuario inválido.";
    if (!form.itemId || Number(form.itemId) <= 0) return "Item inválido.";
    if (!form.dueAt) return "Fecha de vencimiento requerida.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await loansApi.create({
        userId: Number(form.userId),
        itemId: Number(form.itemId),
        dueAt: new Date(form.dueAt).toISOString()
      });
      setMessage({ type: "success", text: "Préstamo creado." });
      setForm({ userId: "", itemId: "", dueAt: "" });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "No se pudo crear el préstamo.") });
    } finally {
      setLoading(false);
    }
  };

  const markReturned = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await loansApi.markReturned(id);
      setMessage({ type: "success", text: "Préstamo marcado como devuelto." });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err, "No se pudo actualizar el préstamo.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Préstamos</h2>

      {message && (
        <p style={{ color: message.type === "error" ? "crimson" : "green" }}>
          {message.text}
        </p>
      )}

      {user?.role !== "STUDENT" && (
        <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input
            placeholder="ID Usuario"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          />
          <input
            placeholder="ID Item"
            value={form.itemId}
            onChange={(e) => setForm({ ...form, itemId: e.target.value })}
          />
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
          <button type="submit" disabled={loading}>
            Crear préstamo
          </button>
        </form>
      )}

      <hr />

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Vence</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id}>
              <td>
                {l.item?.name} ({l.item?.code})
              </td>
              <td>{l.user?.email}</td>
              <td>{l.status}</td>
              <td>{new Date(l.dueAt).toLocaleString()}</td>
              <td>
                {user?.role !== "STUDENT" && l.status !== "RETURNED" && (
                  <button onClick={() => markReturned(l.id)} disabled={loading}>
                    Marcar devuelto
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};