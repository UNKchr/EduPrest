import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";
import type { Role } from "../auth/roles";

const landingByRole = (role: Role) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-orgs";
    case "ADMIN":
      return "/admin";
    case "TECH":
      return "/items";
    case "STUDENT":
      return "/loans";
    default:
      return "/";
  }
};

export const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", organizationNit: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(landingByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form.email, form.password, form.fullName, form.organizationNit);
    } catch {
      setError("No fue posible registrarte. Verifica los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <Card className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <IconLogo />
          <h2 className="text-xl font-semibold">EduPrest</h2>
        </div>
        <p className="text-sm text-muted mb-6">Crear cuenta</p>

        <form onSubmit={submit} className="grid gap-4">
          <Input placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input placeholder="NIT Organización" value={form.organizationNit} onChange={(e) => setForm({ ...form, organizationNit: e.target.value })} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Registrando..." : "Registrarse"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Ya tienes cuenta?{" "}
          <Link to="/login" className="text-brand hover:underline">
            Inicia sesion
          </Link>
        </p>
      </Card>
    </div>
  );
};