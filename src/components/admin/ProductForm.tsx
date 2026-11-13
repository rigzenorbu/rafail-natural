"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { finalPrice, formatINR } from "@/lib/pricing";
import { slugify } from "@/lib/utils";

type VariantRow = { id?: number; label: string; weightGrams: string; price: string; discountPercent: string; stock: string };

export type ProductFormValue = {
  id?: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: number | null;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  variants: VariantRow[];
};

const emptyVariant: VariantRow = { label: "", weightGrams: "", price: "", discountPercent: "0", stock: "10" };

export default function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormValue;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductFormValue>(
    product ?? {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      categoryId: categories[0]?.id ?? null,
      isActive: true,
      isFeatured: false,
      images: [],
      variants: [{ ...emptyVariant }],
    }
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (patch: Partial<ProductFormValue>) => setForm((f) => ({ ...f, ...patch }));

  // ---------- Images ----------
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(files.length);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      } catch (err) {
        setError(`${file.name}: ${(err as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function moveImage(i: number, dir: -1 | 1) {
    const images = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    [images[i], images[j]] = [images[j], images[i]];
    update({ images });
  }

  // ---------- Sizes ----------
  function setVariant(i: number, patch: Partial<VariantRow>) {
    update({ variants: form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });
  }

  // ---------- Save ----------
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(product?.id ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save the product");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 960 }}>
      {error && <p className="alert alert-error" style={{ marginBottom: 16 }}>{error}</p>}

      <section className="form-section">
        <h3>Basic details</h3>
        <p className="hint">The name and descriptions customers will see.</p>
        <div className="stack">
          <div className="grid-2">
            <div className="field">
              <label>Product name *</label>
              <input
                className="input"
                required
                value={form.name}
                placeholder="e.g. Seabuckthorn Juice"
                onChange={(e) => update({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select
                className="select"
                value={form.categoryId ?? ""}
                onChange={(e) => update({ categoryId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">— No category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="hint"><Link href="/admin/categories" className="link">Manage categories</Link></span>
            </div>
          </div>
          <div className="field">
            <label>Short description</label>
            <input
              className="input"
              value={form.shortDescription}
              maxLength={300}
              placeholder="One line shown under the product name, e.g. Cold-pressed, rich in Vitamin C"
              onChange={(e) => update({ shortDescription: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Full description</label>
            <textarea
              className="textarea"
              rows={9}
              value={form.description}
              placeholder={"Write about the product, benefits, ingredients, how to use…\n\nStart a line with \"- \" to make a bullet point:\n- Rich in Vitamin C\n- No added sugar"}
              onChange={(e) => update({ description: e.target.value })}
            />
            <span className="hint">Leave an empty line to start a new paragraph. Lines starting with &quot;- &quot; become bullet points.</span>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Photos</h3>
        <p className="hint">The first photo is the main photo. Use square photos (e.g. 1000×1000) for the best look. JPG, PNG or WEBP, max 5 MB each.</p>
        <div className="image-grid">
          {form.images.map((url, i) => (
            <div className="image-item" key={url}>
              {i === 0 && <div className="main-tag">Main photo</div>}
              <img src={url} alt="" />
              <div className="ctrl">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move left">←</button>
                <button type="button" onClick={() => update({ images: form.images.filter((_, idx) => idx !== i) })} title="Remove">✕</button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} title="Move right">→</button>
              </div>
            </div>
          ))}
          <label className="upload-box">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => uploadFiles(e.target.files)}
            />
            {uploading > 0 ? `Uploading ${uploading}…` : <span>＋<br />Add photos</span>}
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3>Sizes, prices &amp; stock</h3>
        <p className="hint">
          Add one row for each size/pack you sell (e.g. 250 g, 500 g, 1 kg). Price is the MRP; the selling price is calculated from the discount.
        </p>
        <div className="table-wrap">
          <table className="table variant-table">
            <thead>
              <tr>
                <th>Size / label *</th>
                <th>Weight (grams)</th>
                <th>MRP (₹) *</th>
                <th>Discount %</th>
                <th>Selling price</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {form.variants.map((v, i) => {
                const sell = Number(v.price) > 0 ? finalPrice(Number(v.price), Number(v.discountPercent) || 0) : 0;
                return (
                  <tr key={v.id ?? `new-${i}`}>
                    <td><input className="input" required value={v.label} placeholder="250 g" onChange={(e) => setVariant(i, { label: e.target.value })} style={{ minWidth: 100 }} /></td>
                    <td><input className="input" type="number" min={0} value={v.weightGrams} placeholder="250" onChange={(e) => setVariant(i, { weightGrams: e.target.value })} style={{ minWidth: 80 }} /></td>
                    <td><input className="input" type="number" min={1} required value={v.price} placeholder="499" onChange={(e) => setVariant(i, { price: e.target.value })} style={{ minWidth: 80 }} /></td>
                    <td><input className="input" type="number" min={0} max={90} value={v.discountPercent} onChange={(e) => setVariant(i, { discountPercent: e.target.value })} style={{ minWidth: 70 }} /></td>
                    <td style={{ whiteSpace: "nowrap" }}><b>{sell ? formatINR(sell) : "—"}</b></td>
                    <td><input className="input" type="number" min={0} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} style={{ minWidth: 70 }} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={form.variants.length === 1}
                        onClick={() => update({ variants: form.variants.filter((_, idx) => idx !== i) })}
                        title="Remove this size"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => update({ variants: [...form.variants, { ...emptyVariant }] })}>
          + Add another size
        </button>
      </section>

      <section className="form-section">
        <h3>Visibility</h3>
        <div className="stack">
          <label className="checkbox">
            <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} />
            Visible in store <span className="muted small">(untick to hide the product without deleting it)</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => update({ isFeatured: e.target.checked })} />
            Show on home page as a bestseller
          </label>
          <div className="field" style={{ maxWidth: 420 }}>
            <label>Web address</label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value });
              }}
            />
            <span className="hint">yoursite.com/products/{slugify(form.slug) || "…"}</span>
          </div>
        </div>
      </section>

      <div className="sticky-save">
        <Link href="/admin/products" className="btn btn-outline">Cancel</Link>
        <button className="btn btn-primary" disabled={saving || uploading > 0}>
          {saving ? "Saving…" : product?.id ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
