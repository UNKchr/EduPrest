import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";

export const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", organizationNit: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form.email, form.password, form.fullName, form.organizationNit);
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
          <Button type="submit">Registrarse</Button>
        </form>
      </Card>
    </div>
  );
};