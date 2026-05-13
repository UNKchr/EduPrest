import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { RoleGate } from "../RoleGate";
import {
  IconLogo,
  IconGrid,
  IconBox,
  IconLoans,
  IconUsers,
  IconShield,
  IconChart,
  IconReport
} from "../Icons";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col gap-6 border-r border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <IconLogo />
            <span className="text-lg font-semibold">EduPrest</span>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <NavLink to="/" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
              <IconGrid /> Panel
            </NavLink>

            <NavLink to="/loans" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
              <IconLoans /> Préstamos
            </NavLink>

            <RoleGate allowed={["TECH", "ADMIN", "SUPER_ADMIN"]}>
              <NavLink to="/items" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconBox /> Items
              </NavLink>
            </RoleGate>

            <RoleGate allowed={["TECH"]}>
              <NavLink to="/tech-reports" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconReport /> Reportar usuario
              </NavLink>
            </RoleGate>

            <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
              <NavLink to="/admin-users" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconUsers /> Usuarios
              </NavLink>
              <NavLink to="/admin-reports" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconShield /> Reportes
              </NavLink>
            </RoleGate>

            <RoleGate allowed={["SUPER_ADMIN"]}>
              <NavLink to="/super-orgs" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconChart /> Organizaciones
              </NavLink>
              <NavLink to="/super-requests" className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2", isActive && "bg-surface-2")}>
                <IconShield /> Solicitudes de baneo
              </NavLink>
            </RoleGate>
          </nav>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Bienvenido</p>
                <p className="text-sm font-semibold">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={logout}>
                Cerrar sesión
              </Button>
            </div>
          </header>

          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};