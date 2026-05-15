import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";
import { accessRequestsApi } from "../services/accessRequestsApi";
import { orgRequestsApi } from "../services/orgRequestsApi";
import type { Role } from "../auth/roles";

type Mode = "access" | "org";

const landingByRole = (role: Role) => {
  switch (role) {
    case "SUPER_ADMIN": return "/super-orgs";
    case "ADMIN": return "/admin";
    case "TECH": return "/items";
    case "STUDENT": return "/loans";
    default: return "/";
  }
};

const IconCheck = () => (
  <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    fullName: "",
    email: "",
    password: "",
    organizationNit: ""
  });

  const [orgForm, setOrgForm] = useState({
    orgName: "",
    orgNit: "",
    requesterName: "",
    requesterEmail: ""
  });

  useEffect(() => {
    if (user) {
      navigate(landingByRole(user.role), { replace: true });
    }
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
      const msg = err instanceof Error ? err.message : null;
      setError(msg ?? "No fue posible enviar la solicitud. Verifica los datos e intenta de nuevo.");
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
      const msg = err instanceof Error ? err.message : null;
      setError(msg ?? "No fue posible enviar la solicitud. Verifica los datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-6">
        <Card className="w-full max-w-md animate-fade-in text-center">
          <div className="flex justify-center mb-4">
            <IconCheck />
          </div>
          <h2 className="text-xl font-semibold mb-2">¡Solicitud enviada!</h2>
          <p className="text-sm text-muted mb-6">{successMessage}</p>
          <Link to="/login" className="text-brand hover:underline text-sm">
            Volver al inicio de sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <Card className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <IconLogo />
          <h2 className="text-xl font-semibold">EduPrest</h2>
        </div>

        {/* Tab selector */}
        <div className="flex rounded-lg border border-border mb-6 overflow-hidden">
          <button
            type="button"
            onClick={() => handleModeChange("access")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "access"
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:bg-surface-2"
            }`}
          >
            Solicitar acceso
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("org")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "org"
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:bg-surface-2"
            }`}
          >
            Registrar organización
          </button>
        </div>

        {mode === "access" ? (
          <>
            <p className="text-sm text-muted mb-4">
              Solicita acceso a una organización existente. El administrador revisará tu solicitud.
            </p>
            <form onSubmit={submitAccessRequest} className="grid gap-4">
              <Input
                placeholder="Nombre completo"
                value={accessForm.fullName}
                onChange={(e) => setAccessForm({ ...accessForm, fullName: e.target.value })}
                required
              />
              <Input
                placeholder="Correo institucional"
                type="email"
                value={accessForm.email}
                onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                required
              />
              <Input
                placeholder="Contraseña (mín. 8 caracteres)"
                type="password"
                value={accessForm.password}
                onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })}
                required
              />
              <Input
                placeholder="NIT de la organización"
                value={accessForm.organizationNit}
                onChange={(e) => setAccessForm({ ...accessForm, organizationNit: e.target.value })}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Solicitar acceso"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mb-4">
              Solicita el registro de una nueva organización. El super administrador evaluará tu solicitud.
            </p>
            <form onSubmit={submitOrgRequest} className="grid gap-4">
              <Input
                placeholder="Nombre de la organización"
                value={orgForm.orgName}
                onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })}
                required
              />
              <Input
                placeholder="NIT de la organización"
                value={orgForm.orgNit}
                onChange={(e) => setOrgForm({ ...orgForm, orgNit: e.target.value })}
                required
              />
              <Input
                placeholder="Tu nombre completo"
                value={orgForm.requesterName}
                onChange={(e) => setOrgForm({ ...orgForm, requesterName: e.target.value })}
                required
              />
              <Input
                placeholder="Tu correo de contacto"
                type="email"
                value={orgForm.requesterEmail}
                onChange={(e) => setOrgForm({ ...orgForm, requesterEmail: e.target.value })}
                required
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Solicitar registro"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-4 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
};
