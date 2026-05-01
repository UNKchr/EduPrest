import { useEffect, useState } from "react";
import { auditApi, type AuditLog } from "../services/auditApi";

export const AuditPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    auditApi.list().then(setLogs);
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Audit Log</h2>
      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Acción</th>
            <th>Entidad</th>
            <th>ID</th>
            <th>Usuario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.action}</td>
              <td>{l.entity}</td>
              <td>{l.entityId ?? "-"}</td>
              <td>{l.user?.email ?? "N/A"}</td>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};