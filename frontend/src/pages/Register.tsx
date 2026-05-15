import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";
import { accessRequestsApi } from "../services/accessRequestsApi";
import { orgRequestsApi } from "../services/orgRequestsApi";
import { cn } from "../utils/cn";
import type { Role } from "../auth/roles";

type Mode = "access" | "org";

const landingByRole = (role: Role) => {
  switch (role) {
    case "SUPER_ADMIN": return "/super-orgs";
    case "ADMIN":       return "/admin";
    case "TECH":        return "/items";
    case "STUDENT":     return "/loans";
    default:            return "/";
  }
};

const IconCircleCheck = () => (
  <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" className="fill-success-dim stroke-success/30" strokeWidth="1.5" />
    <path d="M8 12l3 3 5-6" stroke="currentColor" className="text-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("access");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [accessForm, setAccessForm] = useState({
    fullName: "", email: "", password: "", organizationNit: ""
  });
  const [orgForm, setOrgForm] = useState({
    orgName: "", orgNit: "", requesterName: "", requesterEmail: ""
  });

  useEffect(() => {
    if (user) navigate(landingByRole(user.role), { replace: true });
  }, [user, navigate]);

  const handleModeChange = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await accessRequestsApi.requestAccess(accessForm);
      setSuccessMessage(result.message);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No fue posible enviar la solicitud. Verifica los datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOrgRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await orgRequestsApi.requestOrg(orgForm);
      setSuccessMessage(result.message);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No fue posible enviar la solicitud. Verifica los datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-success/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-sm animate-scale-in">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <IconCircleCheck />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">¡Solicitud enviada!</h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">{successMessage}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-light hover:underline focus-visible:outline-none"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-lg">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <IconLogo />
            <h1 className="text-xl font-semibold tracking-tight text-text">EduPrest</h1>
            <p className="text-sm text-muted">Solicita acceso o registra tu organización</p>
          </div>

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Tipo de solicitud"
            className="mb-6 flex rounded-xl border border-border bg-surface-2 p-1"
          >
            {(["access", "org"] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={mode === tab}
                type="button"
                onClick={() => handleModeChange(tab)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-medium transition-all duration-200",
                  mode === tab
                    ? "bg-brand-dim text-brand-light shadow-[inset_0_0_0_1px_rgba(124,92,255,0.2)]"
                    : "text-muted hover:text-text"
                )}
              >
                {tab === "access" ? "Solicitar acceso" : "Nueva organización"}
              </button>
            ))}
          </div>

          {mode === "access" ? (
            <>
              <p className="mb-4 text-sm text-muted leading-relaxed">
                Solicita acceso a una organización existente. El administrador revisará tu solicitud.
              </p>
              <form onSubmit={submitAccessRequest} className="flex flex-col gap-4" noValidate>
                <Input
                  label="Nombre completo"
                  placeholder="María García López"
                  autoComplete="name"
                  value={accessForm.fullName}
                  onChange={(e) => setAccessForm({ ...accessForm, fullName: e.target.value })}
                  required
                />
                <Input
                  label="Correo institucional"
                  type="email"
                  placeholder="usuario@institucion.edu"
                  autoComplete="email"
                  value={accessForm.email}
                  onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                  required
                />
                <Input
                  label="Contraseña (mín. 8 caracteres)"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={accessForm.password}
                  onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })}
                  required
                />
                <Input
                  label="NIT de la organización"
                  placeholder="900123456-7"
                  value={accessForm.organizationNit}
                  onChange={(e) => setAccessForm({ ...accessForm, organizationNit: e.target.value })}
                  required
                />
                {error && (
                  <div role="alert" className="rounded-xl border border-danger/20 bg-danger-dim px-3.5 py-2.5 text-sm text-danger">
                    {error}
                  </div>
                )}
                <Button type="submit" loading={submitting} className="mt-1 w-full">
                  Solicitar acceso
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted leading-relaxed">
                Solicita el registro de una nueva organización. El super administrador evaluará tu solicitud.
              </p>
              <form onSubmit={submitOrgRequest} className="flex flex-col gap-4" noValidate>
                <Input
                  label="Nombre de la organización"
                  placeholder="Instituto Tecnológico Nacional"
                  value={orgForm.orgName}
                  onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                  required
                />
                <Input
                  label="NIT de la organización"
                  placeholder="900123456-7"
                  value={orgForm.orgNit}
                  onChange={(e) => setOrgForm({ ...orgForm, orgNit: e.target.value })}
                  required
                />
                <Input
                  label="Tu nombre completo"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  value={orgForm.requesterName}
                  onChange={(e) => setOrgForm({ ...orgForm, requesterName: e.target.value })}
                  required
                />
                <Input
                  label="Tu correo de contacto"
                  type="email"
                  placeholder="contacto@institucion.edu"
                  autoComplete="email"
                  value={orgForm.requesterEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, requesterEmail: e.target.value })}
                  required
                />
                {error && (
                  <div role="alert" className="rounded-xl border border-danger/20 bg-danger-dim px-3.5 py-2.5 text-sm text-danger">
                    {error}
                  </div>
                )}
                <Button type="submit" loading={submitting} className="mt-1 w-full">
                  Solicitar registro
                </Button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="font-medium text-brand-light hover:underline focus-visible:outline-none"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
