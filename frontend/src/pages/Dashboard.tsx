import { useAuth } from "../context/useAuth";
import { RoleGate } from "../components/RoleGate";

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>EduPrest</h1>
      <p>Bienvenido: {user?.email}</p>
      <p>Rol: {user?.role}</p>

      <RoleGate allowed={["STUDENT", "TECH", "ADMIN"]}>
        <section>
          <h3>Panel Estudiante</h3>
          <p>Contenido visible para estudiantes.</p>
        </section>
      </RoleGate>

      <RoleGate allowed={["TECH", "ADMIN"]}>
        <section>
          <h3>Panel Técnico</h3>
          <p>Contenido visible para técnicos.</p>
        </section>
      </RoleGate>

      <RoleGate allowed={["ADMIN"]}>
        <section>
          <h3>Panel Admin</h3>
          <p>Contenido visible solo para admin.</p>
        </section>
      </RoleGate>

      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
};