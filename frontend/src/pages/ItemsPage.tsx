import { useEffect, useState } from "react";
import { itemsApi, type Item } from "../services/itemsApi";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  quantity: 1,
  isActive: true
};

export const ItemsPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    try {
      const data = await itemsApi.list();
      setItems(data);
    } catch {
      setMessage({ type: "error", text: "No se pudo cargar el inventario." });
    }
  };

  useEffect(() => {
    let active = true;
    itemsApi.list().then((data) => {
      if (active) setItems(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    if (form.name.trim().length < 2) return "Nombre inválido.";
    if (form.code.trim().length < 2) return "Código inválido.";
    if (form.quantity < 1) return "Cantidad mínima 1.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (editingId) {
        await itemsApi.update(editingId, form);
        setMessage({ type: "success", text: "Item actualizado." });
      } else {
        await itemsApi.create(form);
        setMessage({ type: "success", text: "Item creado." });
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch {
      setMessage({ type: "error", text: "No se pudo guardar el item." });
    } finally {
      setLoading(false);
    }
  };

  const edit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description ?? "",
      quantity: item.quantity,
      isActive: item.isActive
    });
  };

  const remove = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await itemsApi.remove(id);
      setMessage({ type: "success", text: "Item eliminado." });
      await load();
    } catch {
      setMessage({ type: "error", text: "No se pudo eliminar el item." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Inventario de Items</h2>

      {message && (
        <p style={{ color: message.type === "error" ? "crimson" : "green" }}>
          {message.text}
        </p>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Código"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <input
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="number"
          min={1}
          placeholder="Cantidad"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        />
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Activo
        </label>
        <button type="submit" disabled={loading}>
          {editingId ? "Actualizar" : "Crear"}
        </button>
      </form>

      <hr />

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Cantidad</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.code}</td>
              <td>{i.quantity}</td>
              <td>{i.isActive ? "Sí" : "No"}</td>
              <td>
                <button onClick={() => edit(i)} disabled={loading}>
                  Editar
                </button>{" "}
                <button onClick={() => remove(i.id)} disabled={loading}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};