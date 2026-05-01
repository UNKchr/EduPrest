import { useState } from "react";
import { useAuth } from "../context/useAuth";

export const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", organizationNit: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form.email, form.password, form.fullName, form.organizationNit);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h2>Register</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <input placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="NIT Organización" value={form.organizationNit} onChange={(e) => setForm({ ...form, organizationNit: e.target.value })} />
        <button type="submit">Crear cuenta</button>
      </form>
    </main>
  );
};