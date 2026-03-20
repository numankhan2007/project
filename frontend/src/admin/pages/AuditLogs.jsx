import { useEffect, useState } from "react";
import { tokens } from "../styles/tokens";
import adminApi from "../api/adminApi";
import { AdminTable, Pagination } from "../components/AdminTable";
import { useToast } from "../components/AdminToast";

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const load = (p = page) => {
    setLoading(true);
    adminApi.get("/admin/audit-logs", { params: { page: p, page_size: 20 } })
      .then((r) => setData(r.data))
      .catch(() => addToast("Failed to load audit logs", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "id", label: "ID", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.id}</span> },
    { key: "admin_username", label: "ADMIN", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 12 }}>{r.admin_username}</span> },
    { key: "action", label: "ACTION", render: (r) => (
      <span style={{ padding: "2px 8px", borderRadius: tokens.radius.pill, background: tokens.primaryGlow, color: tokens.primary, fontSize: 11, fontFamily: tokens.fontMono }}>
        {r.action}
      </span>
    )},
    { key: "target_type", label: "TARGET TYPE", render: (r) => <span style={{ color: tokens.textSecondary, fontSize: 12 }}>{r.target_type}</span> },
    { key: "target_id", label: "TARGET ID", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11 }}>{r.target_id}</span> },
    { key: "ip_address", label: "IP", render: (r) => <span style={{ fontFamily: tokens.fontMono, fontSize: 11, color: tokens.textMuted }}>{r.ip_address || "—"}</span> },
    { key: "created_at", label: "TIMESTAMP", render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : "—" },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800, color: tokens.textPrimary, margin: "0 0 24px" }}>Audit Logs</h1>
      <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.lg, overflow: "hidden" }}>
        <AdminTable columns={columns} rows={data?.items || []} loading={loading} />
      </div>
      {data && <Pagination page={page} totalPages={data.total_pages} onChange={(p) => { setPage(p); load(p); }} />}
    </div>
  );
}
