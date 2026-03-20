import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, StatusBadge, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

export default function Products() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const load = (p = page, s = search) => {
    setLoading(true);
    adminApi.get("/admin/products", { params: { page: p, page_size: 20, search: s || undefined } })
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load products", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flagProduct = async (id) => {
    try {
      await adminApi.post(`/admin/products/${id}/flag`);
      addToast("Product flagged", "warning");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await adminApi.delete(`/admin/products/${id}`);
      addToast("Product deleted", "success");
      load();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed", "error");
    }
  };

  const columns = [
    { key: "id", label: "ID", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12 }}>#{r.id}</span> },
    { key: "title", label: "TITLE", render: (r) => <span style={{ color: tokens.textPrimary }}>{r.title}</span> },
    { key: "price", label: "PRICE", render: (r) => <span style={{ fontFamily: tokens.fontMono }}>₹{r.price}</span> },
    { key: "product_status", label: "STATUS", render: (r) => <StatusBadge status={r.product_status} /> },
    { key: "is_flagged", label: "FLAGGED", render: (r) => r.is_flagged ? <span style={{ color: tokens.danger, fontSize: 12 }}>⚑ Flagged</span> : <span style={{ color: tokens.textMuted, fontSize: 12 }}>—</span> },
    { key: "seller", label: "SELLER", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.seller_username}</span> },
    { key: "actions", label: "ACTIONS", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        {!r.is_flagged && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => flagProduct(r.id)}
            style={{ padding: "4px 10px", background: tokens.warningGlow, border: `1px solid ${tokens.warning}`, borderRadius: tokens.radius.md, color: tokens.warning, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
            Flag
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => deleteProduct(r.id)}
          style={{ padding: "4px 10px", background: tokens.dangerGlow, border: `1px solid ${tokens.danger}`, borderRadius: tokens.radius.md, color: tokens.danger, fontSize: 11, cursor: "pointer", fontFamily: tokens.fontBody }}>
          Delete
        </motion.button>
      </div>
    )},
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Products</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1, search))}
          placeholder="Search by title…"
          style={{ flex: 1, padding: "8px 14px", background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, color: tokens.textPrimary, fontSize: 13, outline: "none", fontFamily: tokens.fontBody }}
        />
        <button onClick={() => { setPage(1); load(1, search); }} style={{ padding: "8px 16px", background: tokens.primary, border: "none", borderRadius: tokens.radius.md, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: tokens.fontBody }}>
          Search
        </button>
      </div>
      <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, overflow: "hidden" }}>
        <AdminTable columns={columns} rows={data?.items || []} loading={loading} />
      </div>
      {data && <Pagination page={page} totalPages={data.total_pages} onChange={(p) => { setPage(p); load(p, search); }} />}
    </div>
  );
}
