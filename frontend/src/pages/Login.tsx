import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";
import type { Role } from "../auth/roles";

const landingByRole = (role: Role) => {
  switch (role) {
    case "SUPER_ADMIN": return "/super-orgs";
    case "ADMIN":       return "/admin";
    case "TECH":        return "/items";
    case "STUDENT":     return "/loans";
    default:            return "/";
  }
};

export const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", organizationNit: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate(landingByRole(user.role), { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form.email, form.password, form.organizationNit);
    } catch {
      setError("Credenciales incorrectas o NIT inválido. Verifica tus datos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-lg">
          {/* Brand */}
          <div className="mb-7 flex flex-col items-center gap-2 text-center">
            <IconLogo />
            <h1 className="text-xl font-semibold tracking-tight text-text">
              Bienvenido a EduPrest
            </h1>
            <p className="text-sm text-muted">Ingresa con tus credenciales institucionales</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="usuario@institucion.edu"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              label="NIT de la organización"
              placeholder="900123456-7"
              autoComplete="organization"
              value={form.organizationNit}
              onChange={(e) => setForm({ ...form, organizationNit: e.target.value })}
              required
            />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-danger/20 bg-danger-dim px-3.5 py-2.5 text-sm text-danger"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={submitting} className="mt-1 w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            ¿No tienes acceso?{" "}
            <Link
              to="/register"
              className="font-medium text-brand-light hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
            >
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
