import { useState } from "react";
import { useAuth } from "../context/useAuth";

export const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", organizationNit: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.email, form.password, form.organizationNit);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h2>Login</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="NIT Organización" value={form.organizationNit} onChange={(e) => setForm({ ...form, organizationNit: e.target.value })} />
        <button type="submit">Ingresar</button>
      </form>
    </main>
  );
};