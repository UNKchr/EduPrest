import { useState } from "react";
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

const NavItem = ({
  to,
  icon,
  label
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-brand-dim text-brand-light shadow-[inset_0_0_0_1px_rgba(124,92,255,0.2)]"
          : "text-muted hover:bg-surface-3 hover:text-text"
      )
    }
  >
    <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
    {label}
  </NavLink>
);

const IconHamburger = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconClose = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconLogout = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M16 17l5-5-5-5M21 12H9"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => {
  const { user, logout } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "EP";

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 pb-5 pt-1">
        <IconLogo />
        <div>
          <span className="text-base font-semibold tracking-tight text-text">EduPrest</span>
          <p className="text-2xs text-subtle leading-none">Sistema de préstamos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" onClick={onNavClick}>
        <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-widest text-subtle">
          General
        </p>

        <NavItem to="/" icon={<IconGrid />} label="Panel" />
        <NavItem to="/loans" icon={<IconLoans />} label="Préstamos" />

        <RoleGate allowed={["TECH", "ADMIN", "SUPER_ADMIN"]}>
          <NavItem to="/items" icon={<IconBox />} label="Ítems" />
        </RoleGate>

        <RoleGate allowed={["TECH"]}>
          <NavItem to="/tech-reports" icon={<IconReport />} label="Reportar usuario" />
        </RoleGate>

        <RoleGate allowed={["ADMIN", "SUPER_ADMIN"]}>
          <div className="mt-4">
            <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-widest text-subtle">
              Administración
            </p>
          </div>
          <NavItem to="/admin-users" icon={<IconUsers />} label="Usuarios" />
          <NavItem to="/admin-access-requests" icon={<IconReport />} label="Solicitudes de acceso" />
          <NavItem to="/admin-reports" icon={<IconShield />} label="Reportes" />
        </RoleGate>

        <RoleGate allowed={["SUPER_ADMIN"]}>
          <div className="mt-4">
            <p className="mb-1 px-3 text-2xs font-semibold uppercase tracking-widest text-subtle">
              Super Admin
            </p>
          </div>
          <NavItem to="/super-orgs" icon={<IconChart />} label="Organizaciones" />
          <NavItem to="/super-org-requests" icon={<IconReport />} label="Solicitudes de orgs" />
          <NavItem to="/super-requests" icon={<IconShield />} label="Solicitudes de baneo" />
        </RoleGate>
      </nav>

      {/* User footer */}
      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-dim text-xs font-semibold text-brand-light"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-text">{user?.email}</p>
            <p className="text-2xs text-subtle">{user?.role?.replace("_", " ")}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-3 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 flex-col gap-0 border-r border-border bg-surface px-3 py-5">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar panel */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface px-3 py-5 shadow-lg transition-transform duration-300 ease-spring lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Navegación principal"
        >
          <button
            className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-text lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <IconClose />
          </button>
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">

          {/* Top bar (mobile only) */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface-2 hover:text-text"
            >
              <IconHamburger />
            </button>
            <span className="text-sm font-semibold text-text">EduPrest</span>
          </header>

          <main className="flex-1 p-5 lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
