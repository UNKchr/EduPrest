import { useEffect, useState } from "react";
import { reportsApi, type SummaryReport } from "../services/reportsApi";

export const ReportsPage = () => {
  const [data, setData] = useState<SummaryReport | null>(null);

  useEffect(() => {
    reportsApi.summary().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Reportes</h2>

      <section>
        <h3>Inventario</h3>
        <p>Total Items: {data.items.totalItems}</p>
        <p>Items Activos: {data.items.activeItems}</p>
      </section>

      <section>
        <h3>Préstamos</h3>
        <p>Total: {data.loans.totalLoans}</p>
        <p>Activos: {data.loans.activeLoans}</p>
        <p>Devueltos: {data.loans.returnedLoans}</p>
        <p>Atrasados: {data.loans.overdueLoans}</p>
      </section>

      <section>
        <h3>Items más prestados</h3>
        <ul>
          {data.topItems.map((i) => (
            <li key={i.itemId}>
              {i.name} ({i.code}) — {i.totalLoans} préstamos
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};