import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IconLogo } from "../components/Icons";

export const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", organizationNit: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.email, form.password, form.organizationNit);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <Card className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <IconLogo />
          <h2 className="text-xl font-semibold">EduPrest</h2>
        </div>
        <p className="text-sm text-muted mb-6">Accede a tu organización</p>

        <form onSubmit={submit} className="grid gap-4">
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input placeholder="NIT Organización" value={form.organizationNit} onChange={(e) => setForm({ ...form, organizationNit: e.target.value })} />
          <Button type="submit">Ingresar</Button>
        </form>
      </Card>
    </div>
  );
};