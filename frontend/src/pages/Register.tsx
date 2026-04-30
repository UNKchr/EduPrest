import { useState } from "react";
import axios from "axios";
import { authApi } from "../services/authApi";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (!email || !fullName || !password) return "Todos los campos son obligatorios";
    if (!email.includes("@")) return "Email inválido";
    if (fullName.trim().length < 3) return "Nombre muy corto";
    if (password.length < 8) return "Contraseña mínima 8 caracteres";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validation = validate();
    if (validation) return setError(validation);

    try {
      await authApi.register(email, password, fullName);
      setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");
      setEmail("");
      setFullName("");
      setPassword("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Registro fallido");
      } else {
        setError("Error inesperado");
      }
    }
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Registro</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label>Nombre completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit">Crear cuenta</button>
      </form>
    </main>
  );
};