"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: number; name: string; count: number };

export default function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState("");

  async function call(url: string, method: string, body?: object) {
    setError("");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Something went wrong");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <form
        className="form-section row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await call("/api/admin/categories", "POST", { name })) setName("");
        }}
      >
        <input className="input" style={{ flex: 1 }} placeholder="New category name, e.g. Herbal Teas" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn btn-primary">Add category</button>
      </form>
      {error && <p className="alert alert-error" style={{ marginBottom: 12 }}>{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Products</th><th /></tr></thead>
          <tbody>
            {categories.length === 0 && <tr><td colSpan={3} className="muted center">No categories yet</td></tr>}
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {editing?.id === c.id ? (
                    <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
                  ) : (
                    c.name
                  )}
                </td>
                <td>{c.count}</td>
                <td>
                  <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap", gap: 8 }}>
                    {editing?.id === c.id ? (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={async () => (await call(`/api/admin/categories/${c.id}`, "PUT", { name: editing.name })) && setEditing(null)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditing({ id: c.id, name: c.name })}>Rename</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            confirm(`Delete category "${c.name}"?${c.count ? ` Its ${c.count} product(s) will be kept without a category.` : ""}`) &&
                            call(`/api/admin/categories/${c.id}`, "DELETE")
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
