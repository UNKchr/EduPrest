import { useEffect, useState } from "react";
import { loansApi, type Loan } from "../services/loansApi";
import { usersApi, type UserRow } from "../services/usersApi";
import { itemsApi, type Item } from "../services/itemsApi";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/ToastContext";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { cn } from "../utils/cn";

const statusLabel = { ACTIVE: "Activo", RETURNED: "Devuelto", OVERDUE: "Vencido" } as const;
const statusTone  = { ACTIVE: "success", RETURNED: "neutral", OVERDUE: "danger" } as const;

const IconReturn = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20v-7a4 4 0 00-4-4H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSearch = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Chip = ({ label, sub, onClear }: { label: string; sub: string; onClear: () => void }) => (
  <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-dim px-3 py-1.5">
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-brand-light">{label}</p>
      <p className="text-2xs text-subtle">{sub}</p>
    </div>
    <button type="button" onClick={onClear} className="shrink-0 text-subtle hover:text-brand-light" aria-label="Quitar">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
    <svg className="h-12 w-12 opacity-30 text-muted" viewBox="0 0 24 24" fill="none">
      <path d="M4 5h16v4H4V5Zm0 6h10v8H4v-8Zm12 0h4v8h-4v-8Z" fill="currentColor" />
    </svg>
    <p className="text-sm text-muted">{message}</p>
  </div>
);

// ─── Student-only history view ─────────────────────────────────────────────────
const StudentLoansView = ({ loans }: { loans: Loan[] }) => (
  <AppLayout>
    <PageHeader title="Mis Préstamos" subtitle="Historial de préstamos y sus estados" />
    <Card>
      {loans.length === 0 ? (
        <EmptyState message="No tienes préstamos registrados aún." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Ítem", "Código", "Estado", "Prestado", "Vence / Venció", "Devuelto"].map((h) => (
                  <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-subtle last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="py-3.5 pr-4 font-medium text-text">{l.item?.name ?? "—"}</td>
                  <td className="py-3.5 pr-4">
                    <span className="rounded-md bg-surface-3 px-2 py-0.5 font-mono text-xs text-muted">
                      {l.item?.code ?? "—"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <Badge tone={statusTone[l.status]} dot>{statusLabel[l.status]}</Badge>
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-muted">
                    {new Date(l.loanedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className={cn("py-3.5 pr-4 text-xs", l.status === "OVERDUE" ? "text-danger font-medium" : "text-muted")}>
                    {new Date(l.dueAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3.5 text-xs text-muted">
                    {l.returnedAt
                      ? new Date(l.returnedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  </AppLayout>
);

// ─── Staff loan management ─────────────────────────────────────────────────────
export const LoansPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);

  const [userQuery, setUserQuery] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [foundUser, setFoundUser] = useState<UserRow | null>(null);
  const [foundItem, setFoundItem] = useState<Item | null>(null);
  const [userLookupErr, setUserLookupErr] = useState("");
  const [itemLookupErr, setItemLookupErr] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isStudent = user?.role === "STUDENT";

  const load = async () => {
    const data = isStudent ? await loansApi.listMine() : await loansApi.list();
    setLoans(data);
  };

  useEffect(() => {
    let active = true;
    const req = isStudent ? loansApi.listMine() : loansApi.list();
    req.then((data) => active && setLoans(data));
    return () => { active = false; };
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) itemsApi.list().then(setItems);
  }, [isStudent]);

  if (isStudent) return <StudentLoansView loans={loans} />;

  // ── Lookup helpers ────────────────────────────────────────────────────────
  const lookupUser = async () => {
    setUserLookupErr("");
    setFoundUser(null);
    const q = userQuery.trim();
    if (!q) return;
    const result = await usersApi.list({ q, limit: 10 });
    const match = result.data.find((u) => u.email.toLowerCase() === q.toLowerCase());
    if (match) setFoundUser(match);
    else setUserLookupErr("No se encontró ningún usuario con ese correo.");
  };

  const lookupItem = () => {
    setItemLookupErr("");
    setFoundItem(null);
    const q = itemQuery.trim().toLowerCase();
    if (!q) return;
    const match = items.find((i) => i.code.toLowerCase() === q);
    if (match) setFoundItem(match);
    else setItemLookupErr("No se encontró ningún ítem con ese código.");
  };

  const clearUser = () => { setFoundUser(null); setUserQuery(""); setUserLookupErr(""); };
  const clearItem = () => { setFoundItem(null); setItemQuery(""); setItemLookupErr(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser || !foundItem || !dueAt) return;
    setSubmitting(true);
    try {
      await loansApi.create({
        userId: foundUser.id,
        itemId: foundItem.id,
        dueAt: new Date(dueAt).toISOString()
      });
      showToast({ tone: "success", icon: "check", label: "Préstamo creado" });
      clearUser(); clearItem(); setDueAt("");
      await load();
    } catch {
      showToast({ tone: "danger", icon: "ban", label: "Error al crear el préstamo" });
    } finally {
      setSubmitting(false);
    }
  };

  const markReturned = async (loan: Loan) => {
    try {
      await loansApi.markReturned(loan.id);
      showToast({ tone: "success", icon: "check", label: "Devolución registrada" });
      await load();
    } catch {
      showToast({ tone: "danger", icon: "ban", label: "Error al registrar devolución" });
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Préstamos" subtitle="Gestión de préstamos y devoluciones" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

        {/* Create form */}
        <Card>
          <p className="mb-4 text-sm font-semibold text-text">Nuevo préstamo</p>
          <form onSubmit={submit} className="flex flex-col gap-4">

            {/* User lookup */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide text-muted">Correo del usuario</label>
              {foundUser ? (
                <Chip label={foundUser.fullName || foundUser.email} sub={foundUser.email} onClear={clearUser} />
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="usuario@org.edu"
                    value={userQuery}
                    onChange={(e) => { setUserQuery(e.target.value); setUserLookupErr(""); }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupUser())}
                    error={userLookupErr}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" size="sm" className="shrink-0 px-2.5" onClick={lookupUser}>
                    <IconSearch />
                  </Button>
                </div>
              )}
            </div>

            {/* Item lookup */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide text-muted">Código del ítem</label>
              {foundItem ? (
                <Chip label={foundItem.name} sub={`Código: ${foundItem.code}`} onClear={clearItem} />
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="EQ-001"
                    value={itemQuery}
                    onChange={(e) => { setItemQuery(e.target.value); setItemLookupErr(""); }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupItem())}
                    error={itemLookupErr}
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" size="sm" className="shrink-0 px-2.5" onClick={lookupItem}>
                    <IconSearch />
                  </Button>
                </div>
              )}
            </div>

            <Input
              label="Fecha y hora de devolución"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              required
            />

            <Button type="submit" loading={submitting} disabled={!foundUser || !foundItem || !dueAt} className="w-full">
              Crear préstamo
            </Button>
          </form>
        </Card>

        {/* Loans table */}
        <Card className="overflow-hidden">
          {loans.length === 0 ? (
            <EmptyState message="No hay préstamos registrados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Ítem", "Usuario", "Estado", "Prestado", "Vence", "Acción"].map((h) => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-subtle last:pr-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-text">{l.item?.name ?? "—"}</p>
                        <p className="font-mono text-2xs text-muted">{l.item?.code ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-text">{l.user?.fullName ?? "—"}</p>
                        <p className="text-2xs text-muted">{l.user?.email ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={statusTone[l.status]} dot>{statusLabel[l.status]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted">
                        {new Date(l.loanedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                        {" · "}
                        {new Date(l.loanedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className={cn("py-3 pr-4 text-xs", l.status === "OVERDUE" ? "text-danger font-medium" : "text-muted")}>
                        {new Date(l.dueAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3">
                        {l.status !== "RETURNED" && (
                          <button
                            type="button"
                            title="Registrar devolución"
                            aria-label="Registrar devolución"
                            onClick={() => markReturned(l)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                              l.status === "OVERDUE"
                                ? "border-warning/20 bg-warning-dim text-warning hover:bg-warning/20 focus-visible:ring-warning/50"
                                : "border-success/20 bg-success-dim text-success hover:bg-success/20 focus-visible:ring-success/50"
                            )}
                          >
                            <IconReturn />
                            {l.status === "OVERDUE" ? "Devolver (vencido)" : "Devolver"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};
