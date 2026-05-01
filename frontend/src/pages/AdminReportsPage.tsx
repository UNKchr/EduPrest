import { useEffect, useState } from "react";
import { userReportsApi, type UserReport } from "../services/userReportsApi";
import { usersApi } from "../services/usersApi";

export const AdminReportsPage = () => {
  const [reports, setReports] = useState<UserReport[]>([]);

  const load = async () => {
    const data = await userReportsApi.list();
    setReports(data);
  };

  useEffect(() => {
    let active = true;
    userReportsApi.list().then((data) => active && setReports(data));
    return () => {
      active = false;
    };
  }, []);

  const update = async (id: number, status: "APPROVED" | "REJECTED") => {
    await userReportsApi.updateStatus(id, status);
    await load();
  };

  const banUser = async (userId: number) => {
    const reason = window.prompt("Motivo del baneo:");
    if (!reason || reason.trim().length < 5) return;
    await usersApi.ban(userId, reason);
    await load();
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Reportes de Usuarios</h2>
      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Usuario reportado</th>
            <th>Reportado por</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.user.email}</td>
              <td>{r.reportedBy.email}</td>
              <td>{r.reason}</td>
              <td>{r.status}</td>
              <td>
                <button onClick={() => update(r.id, "APPROVED")}>Aprobar</button>{" "}
                <button onClick={() => update(r.id, "REJECTED")}>Rechazar</button>{" "}
                <button onClick={() => banUser(r.user.id)}>Banear usuario</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};