# UNIMART — PART 5 OF 5: Frontend Admin Views + Interactions
### Scope: Dashboard · Users · Products · Orders · AuditLogs · AdminToast · Confirmation Modals
### Prerequisites: Part 4 complete (AdminLayout, tokens, auth context, adminApi all exist)

---

## CONTEXT

All five admin views share the same table/pagination pattern. Build `AdminTable` as a reusable
component first, then implement each page view on top of it.

---

## STEP 1 — Reusable AdminTable Component (`src/admin/components/AdminTable.jsx`)

```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { tokens } from "../styles/tokens";

export default function AdminTable({ columns, rows, onAction }) {
  /**
   * columns: [{ key, label, render? }]
   * rows:    array of row objects
   * onAction: (action, row) => void
   */
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: tokens.fontBody }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                color: tokens.textMuted, textTransform: "uppercase",
                position: "sticky", top: 0, background: tokens.surface,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id ?? i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                borderBottom: `1px solid ${tokens.border}`,
                background: i % 2 === 0 ? "transparent" : tokens.bgElevated,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = tokens.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : tokens.bgElevated}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 14px", fontSize: 13, color: tokens.textSecondary }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## STEP 2 — Status Badge Helper (`src/admin/components/StatusBadge.jsx`)

```jsx
import { tokens } from "../styles/tokens";

const STATUS_MAP = {
  AVAILABLE:   { color: tokens.success,  bg: tokens.accentGlow  },
  RESERVED:    { color: tokens.warning,  bg: tokens.warningGlow },
  SOLD_OUT:    { color: "#9ca3af",       bg: "rgba(156,163,175,0.1)" },
  REMOVED:     { color: tokens.danger,   bg: tokens.dangerGlow  },
  PENDING:     { color: tokens.warning,  bg: tokens.warningGlow },
  CONFIRMED:   { color: tokens.primary,  bg: tokens.primaryGlow },
  IN_DELIVERY: { color: tokens.accent,   bg: tokens.accentGlow  },
  COMPLETED:   { color: tokens.success,  bg: "rgba(34,212,126,0.12)" },
  CANCELLED:   { color: tokens.danger,   bg: tokens.dangerGlow  },
  SUSPENDED:   { color: tokens.danger,   bg: tokens.dangerGlow  },
  ACTIVE:      { color: tokens.success,  bg: "rgba(34,212,126,0.12)" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_MAP[status] ?? { color: tokens.textMuted, bg: "transparent" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: tokens.radius.pill,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      color: style.color, background: style.bg, fontFamily: tokens.fontBody,
    }}>
      {status}
    </span>
  );
}
```

---

## STEP 3 — Confirmation Modal (`src/admin/components/ConfirmModal.jsx`)

All destructive actions require typing the target identifier to confirm — like GitHub repository deletion.

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/tokens";

export default function ConfirmModal({ isOpen, title, description, targetIdentifier, confirmLabel = "Confirm", onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(4px)",
        }}
        onClick={onCancel}>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 180, damping: 24 } }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: tokens.surface, border: `1px solid ${tokens.border}`,
            borderRadius: tokens.radius.xl, padding: 28, width: 400,
            boxShadow: tokens.shadowLg,
          }}>

          <h3 style={{ fontFamily: tokens.fontDisplay, color: tokens.textPrimary, margin: "0 0 8px", fontSize: 18 }}>
            {title}
          </h3>
          <p style={{ color: tokens.textSecondary, fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
            {description}
          </p>

          <p style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 8 }}>
            Type <code style={{ color: tokens.warning, fontFamily: tokens.fontMono }}>{targetIdentifier}</code> to confirm:
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={targetIdentifier}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: tokens.radius.md,
              background: tokens.bgElevated, border: `1px solid ${tokens.border}`,
              color: tokens.textPrimary, fontFamily: tokens.fontMono, fontSize: 13,
              marginBottom: 20, boxSizing: "border-box", outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: "8px 18px", borderRadius: tokens.radius.md,
                background: "transparent", border: `1px solid ${tokens.border}`,
                color: tokens.textSecondary, cursor: "pointer", fontSize: 13,
              }}>
              Cancel
            </motion.button>
            <motion.button
              onClick={() => { onConfirm(); setTyped(""); }}
              disabled={typed !== targetIdentifier}
              whileHover={typed === targetIdentifier ? { scale: 1.02 } : {}}
              whileTap={typed === targetIdentifier ? { scale: 0.97 } : {}}
              style={{
                padding: "8px 18px", borderRadius: tokens.radius.md,
                background: typed === targetIdentifier ? tokens.danger : tokens.textDisabled,
                border: "none", color: "#fff", cursor: typed === targetIdentifier ? "pointer" : "not-allowed",
                fontSize: 13, fontWeight: 600,
              }}>
              {confirmLabel}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## STEP 4 — Toast Notification System (`src/admin/components/AdminToast.jsx`)

```jsx
import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../styles/tokens";

const ToastContext = createContext(null);

const TYPE_COLORS = {
  success: tokens.success,
  error:   tokens.danger,
  warning: tokens.warning,
  info:    tokens.primary,
};

const toastVariants = {
  initial: { opacity: 0, x: 60, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 22 } },
  exit:    { opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.18 } },
};

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000, display: "flex", flexDirection: "column", gap: 10 }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                padding: "12px 18px", borderRadius: tokens.radius.lg,
                background: tokens.surface, border: `1px solid ${TYPE_COLORS[t.type]}33`,
                boxShadow: tokens.shadowMd, display: "flex", alignItems: "center", gap: 10,
                minWidth: 260, maxWidth: 360,
                borderLeft: `3px solid ${TYPE_COLORS[t.type]}`,
              }}>
              <span style={{ color: TYPE_COLORS[t.type], fontSize: 16 }}>
                {{ success: "✓", error: "✕", warning: "⚠", info: "ℹ" }[t.type]}
              </span>
              <span style={{ color: tokens.textPrimary, fontSize: 13, fontFamily: tokens.fontBody }}>
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

Wrap `AdminApp` with `<AdminToastProvider>` in `AdminApp.jsx`. Use like:

```jsx
const toast = useToast();
toast("User suspended successfully", "success");
toast("Something went wrong", "error");
```

---

## STEP 5 — Dashboard View (`src/admin/pages/Dashboard.jsx`)

```jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { adminApi } from "../api/adminApi";
import { tokens } from "../styles/tokens";

const STAT_CARDS = (stats) => [
  { label: "Total Users",    value: stats.total_users,    sub: `${stats.suspended_users} suspended` },
  { label: "Active Users",   value: stats.active_users,   sub: "not suspended" },
  { label: "Total Products", value: stats.total_products, sub: `${stats.available_products} available` },
  { label: "Total Orders",   value: stats.total_orders,   sub: `${stats.completed_orders} completed` },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.get("/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div style={{ padding: 32, color: tokens.textMuted }}>Loading…</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: tokens.fontDisplay, color: tokens.textPrimary, marginBottom: 8, fontSize: 24 }}>
        Dashboard
      </h1>
      <p style={{ color: tokens.textMuted, marginBottom: 32, fontSize: 14 }}>Platform overview</p>

      {/* Stat cards — 4 column grid, staggered entry */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {STAT_CARDS(stats).map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ translateY: -2 }}
            style={{
              background: tokens.surface, border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radius.lg, padding: 20,
              boxShadow: tokens.shadowSm, transition: "box-shadow 0.2s",
            }}>
            <div style={{ fontSize: 13, color: tokens.textMuted, marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: tokens.textPrimary, fontFamily: tokens.fontDisplay }}>
              {card.value.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 4 }}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Weekly summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { label: "New registrations this week", value: stats.recent_registrations_7d, color: tokens.primary },
          { label: "Orders this week",            value: stats.recent_orders_7d,         color: tokens.accent  },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            style={{
              background: tokens.surface, border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radius.lg, padding: 20,
            }}>
            <div style={{ fontSize: 13, color: tokens.textMuted, marginBottom: 10 }}>{item.label}</div>
            {/* Animated progress bar */}
            <div style={{ height: 6, background: tokens.bgElevated, borderRadius: 999, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (item.value / 50) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 + i * 0.1 }}
                style={{ height: "100%", background: item.color, borderRadius: 999 }}
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, marginTop: 8 }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## STEP 6 — Users View (`src/admin/pages/Users.jsx`)

Build on top of `AdminTable`. Key action buttons: **View detail**, **Suspend / Reinstate**, **Delete**.
Every destructive action (Suspend, Delete) must go through `ConfirmModal` with the user's `register_number` as `targetIdentifier`.

```jsx
// Pattern for action buttons — apply to ALL action columns:
<motion.button
  onClick={() => handleAction(row)}
  whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
  whileTap={{ scale: 0.95 }}
  title="Suspend user"   // tooltip
  style={{ ... }}>
  Suspend
</motion.button>
```

Actions to implement:
- `GET /admin/users?search=&suspended_only=&page=` → paginated table with search input (debounced 300ms)
- `POST /admin/users/{register_number}/suspend` → requires ConfirmModal
- `POST /admin/users/{register_number}/reinstate` → requires ConfirmModal
- `DELETE /admin/users/{register_number}` → requires ConfirmModal
- Show user status with `<StatusBadge status={user.is_suspended ? "SUSPENDED" : "ACTIVE"} />`
- Show `register_number` in JetBrains Mono font

---

## STEP 7 — Products View (`src/admin/pages/Products.jsx`)

Actions to implement:
- `GET /admin/products?search=&status=&flagged_only=&page=` → paginated table
- `PATCH /admin/products/{id}/status` → status override dropdown in modal
- `POST /admin/products/{id}/flag` → requires ConfirmModal with product ID
- `DELETE /admin/products/{id}` → requires ConfirmModal with product ID
- Flagged products show a pulsing amber badge (`animation: badgePulse 2s ease-in-out infinite`)
- Show product status with `<StatusBadge />`

---

## STEP 8 — Orders View (`src/admin/pages/Orders.jsx`)

Actions to implement:
- `GET /admin/orders?status=&search=&page=` → paginated table
- `PATCH /admin/orders/{id}/status` → override with mandatory reason (textarea required)
- Show order status with `<StatusBadge />`
- Require reason text (min 5 chars) before override confirm button activates

---

## STEP 9 — Audit Logs View (`src/admin/pages/AuditLogs.jsx`)

- `GET /admin/audit-logs?action=&page=`
- Show: timestamp, admin username, action (monospace badge), target type + ID, IP address
- Filter by action type (dropdown)
- All IDs displayed in `fontMono`
- Read-only view — no action buttons

---

## FINAL ENV FILE STATE

After completing all 5 parts, `.env` should contain exactly:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unimart

# Redis
REDIS_URL=redis://localhost:6379

# Student JWT (existing — do not change)
JWT_SECRET_KEY=<existing key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Student Refresh Token (NEW)
REFRESH_TOKEN_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">

# Admin JWT (NEW — separate secret, never share)
ADMIN_JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_hex(64))">
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=<strong password — minimum 16 chars>
ADMIN_DISPLAY_NAME=Super Admin

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@unimart.edu

# AWS (optional — leave blank if not configured)
AWS_S3_BUCKET=
AWS_CLOUDFRONT_DOMAIN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
```

---

## IMPLEMENTATION ORDER (all 5 parts combined)

```
1.  backend/admin_models.py            [Part 1]
2.  backend/admin_auth.py              [Part 1]
3.  backend/admin_schemas.py           [Part 1]
4.  backend/routers/admin.py           [Part 3]
5.  backend/main.py                    [Part 1 — register router, call seed]
6.  backend/services/email_service.py  [Part 2]
7.  backend/models.py                  [Part 2 — is_deleted, is_flagged, product_images]
8.  backend/database.py                [Part 2 — connection pool]
9.  backend/middleware/rate_limit.py   [Part 2]
10. backend/routers/auth.py            [Part 2 — refresh token]
11. alembic: generate + apply migration
12. frontend: index.html               [Part 4 — fonts]
13. frontend: src/admin/styles/tokens.js         [Part 4]
14. frontend: src/admin/AdminAuthContext.jsx     [Part 4]
15. frontend: src/admin/api/adminApi.js          [Part 4]
16. frontend: src/admin/pages/AdminLoginPage.jsx [Part 4]
17. frontend: src/admin/components/AdminLayout.jsx [Part 4]
18. frontend: src/admin/AdminApp.jsx             [Part 4]
19. frontend: src/routes/AppRoutes.jsx           [Part 4]
20. frontend: src/admin/components/AdminTable.jsx    [Part 5]
21. frontend: src/admin/components/StatusBadge.jsx   [Part 5]
22. frontend: src/admin/components/ConfirmModal.jsx  [Part 5]
23. frontend: src/admin/components/AdminToast.jsx    [Part 5]
24. frontend: src/admin/pages/Dashboard.jsx     [Part 5]
25. frontend: src/admin/pages/Users.jsx         [Part 5]
26. frontend: src/admin/pages/Products.jsx      [Part 5]
27. frontend: src/admin/pages/Orders.jsx        [Part 5]
28. frontend: src/admin/pages/AuditLogs.jsx     [Part 5]
```

---

## FINAL VERIFICATION CHECKLIST

**Backend:**
- [ ] `admin_accounts` table created
- [ ] `admin_audit_logs` table created
- [ ] `product_images` table created
- [ ] Old `ADMIN_KEY` deleted everywhere
- [ ] `seed_super_admin` runs on startup without error
- [ ] All `send_email()` replaced with `await send_email_async()`
- [ ] `pool_pre_ping` and `pool_recycle` set on engine
- [ ] Rate limiting active on all auth + admin endpoints
- [ ] `/auth/refresh` endpoint works; login returns both tokens
- [ ] `is_deleted`, `is_flagged` columns present in DB

**Frontend:**
- [ ] `/admin/login` loads with cinematic animation
- [ ] Wrong credentials shake the error message
- [ ] Successful login redirects to `/admin` dashboard
- [ ] Sidebar active indicator animates with `layoutId`
- [ ] Page transitions on every route change
- [ ] Stat cards stagger in on dashboard load
- [ ] Progress bars animate from 0 on mount
- [ ] All destructive actions require typing the identifier
- [ ] Toast notifications stack correctly from bottom-right
- [ ] Admin logout clears only `admin_token`
