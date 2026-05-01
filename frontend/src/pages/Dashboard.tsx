import { useAuth } from "../context/useAuth";
import { RoleGate } from "../components/RoleGate";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>EduPrest</h1>
      <p>Bienvenido: {user?.email}</p>
      <p>Rol: {user?.role}</p>

      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/loans">Préstamos</Link>

        <RoleGate allowed={["TECH", "ADMIN", "SUPER_ADMIN"]}>
          <Link to="/items">Items</Link>
        </RoleGate>

        <RoleGate allowed={["TECH"]}>
          <Link to="/tech-reports">Reportar usuario</Link>
        </RoleGate>

        <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
          <Link to="/admin-users">Usuarios</Link>
          <Link to="/admin-reports">Reportes</Link>
        </RoleGate>

        <RoleGate allowed={["SUPER_ADMIN"]}>
          <Link to="/super-orgs">Organizaciones</Link>
          <Link to="/reports">Reportes Globales</Link>
        </RoleGate>
      </nav>

      <button onClick={logout}>Cerrar sesión</button>
    </main>
  );
};