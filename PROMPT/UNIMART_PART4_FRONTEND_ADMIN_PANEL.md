# UNIMART — PART 4 OF 5: Frontend Admin Panel (Design System + Auth + Login + Layout)
### Scope: tokens.js · AdminAuthContext · adminApi.js · AdminLoginPage · AdminLayout · AppRoutes
### Prerequisites: Parts 1–3 complete (all backend admin endpoints exist)

---

## CONTEXT

The admin panel is a fully isolated React sub-application. It has its own auth context,
Axios instance, route protection, and design system. It shares zero state with the student app.

---

## STEP 1 — Install Fonts (`index.html`)

Add to `<head>` before any stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link
  href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
>
```

---

## STEP 2 — Design Tokens (`src/admin/styles/tokens.js`)

```javascript
export const tokens = {
  // Core palette
  bg:            "#0a0c12",
  bgElevated:    "#0f1219",
  surface:       "#141720",
  surfaceHover:  "#191d2a",
  border:        "#1e2333",
  borderLight:   "#263045",

  // Brand
  primary:        "#6c63ff",
  primaryHover:   "#5a52e0",
  primaryActive:  "#4a43c8",
  primaryGlow:    "rgba(108, 99, 255, 0.18)",
  primaryShimmer: "rgba(108, 99, 255, 0.06)",

  // Semantic
  accent:      "#00d4aa",                    // teal — success, online
  accentGlow:  "rgba(0, 212, 170, 0.14)",
  danger:      "#ff4d6d",                    // red — destructive, suspended, errors
  dangerGlow:  "rgba(255, 77, 109, 0.14)",
  warning:     "#f59e0b",                    // amber — pending, reserved
  warningGlow: "rgba(245, 158, 11, 0.14)",
  success:     "#22d47e",                    // green — completed, active

  // Text hierarchy
  textPrimary:   "#edf0f7",
  textSecondary: "#7c88a3",
  textMuted:     "#404c65",
  textDisabled:  "#2a3347",

  // Typography
  fontDisplay: "'Syne', sans-serif",           // headings, brand
  fontBody:    "'DM Sans', sans-serif",        // body text
  fontMono:    "'JetBrains Mono', monospace",  // IDs, register numbers

  // Spacing scale
  radius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", pill: "999px" },

  // Shadows
  shadowSm:   "0 2px 8px rgba(0,0,0,0.3)",
  shadowMd:   "0 4px 20px rgba(0,0,0,0.4)",
  shadowLg:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowGlow: (color) => `0 0 24px ${color}`,
};
```

---

## STEP 3 — Admin Auth Context (`src/admin/AdminAuthContext.jsx`)

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import { adminApi } from "./api/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { setLoading(false); return; }
    adminApi.get("/auth/me")
      .then(({ data }) => setAdmin(data))
      .catch(() => localStorage.removeItem("admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await adminApi.post("/auth/login", { username, password });
    localStorage.setItem("admin_token", data.access_token);
    setAdmin({ username: data.admin_username, display_name: data.display_name, role: data.role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    // Never touch student tokens — admin and student auth are fully isolated
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
```

---

## STEP 4 — Admin Axios Instance (`src/admin/api/adminApi.js`)

```javascript
import axios from "axios";

export const adminApi = axios.create({
  baseURL: "/admin",
  headers: { "Content-Type": "application/json" },
});

// Attach admin token to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Redirect to admin login on 401
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);
```

---

## STEP 5 — Admin Login Page (`src/admin/pages/AdminLoginPage.jsx`)

This is the most important UI moment — implement all animation states exactly as specified.

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AdminAuthContext";
import { tokens } from "../styles/tokens";

// Animation variants
const LETTER_STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  letter: {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
  },
};

const CARD_ENTRY = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 22, delay: 0.5 } },
};

const FIELD_ENTRY = (i) => ({
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: { delay: 0.7 + i * 0.1, duration: 0.35, ease: "easeOut" } },
});

export default function AdminLoginPage() {
  const { login }    = useAdminAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const titleChars = "UNIMART ADMIN".split("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
      setShakeKey((k) => k + 1); // trigger shake
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: tokens.radius.md,
    background: tokens.bgElevated, border: `1px solid ${tokens.border}`,
    color: tokens.textPrimary, fontFamily: tokens.fontBody, fontSize: 14,
    outline: "none", boxSizing: "border-box", marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: "100vh", background: tokens.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div className="admin-bg-grid" />

      {/* Glowing orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${tokens.primaryGlow} 0%, transparent 70%)`,
          filter: "blur(60px)", pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 24px" }}>

        {/* Staggered title */}
        <motion.div variants={LETTER_STAGGER.container} initial="hidden" animate="show"
          style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 8, flexWrap: "wrap" }}>
          {titleChars.map((char, i) => (
            <motion.span key={i} variants={LETTER_STAGGER.letter}
              style={{
                fontFamily: tokens.fontDisplay, fontSize: 28, fontWeight: 800,
                color: tokens.textPrimary, letterSpacing: char === " " ? 8 : 0,
              }}>
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{ textAlign: "center", marginBottom: 32, color: tokens.textMuted, fontSize: 12, letterSpacing: "0.2em", fontFamily: tokens.fontBody }}>
          CONTROL CENTER
        </motion.div>

        {/* Login card */}
        <motion.div variants={CARD_ENTRY} initial="hidden" animate="show"
          style={{
            background: tokens.surface, border: `1px solid ${tokens.border}`,
            borderRadius: tokens.radius.xl, padding: 32, boxShadow: tokens.shadowLg,
          }}>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.6 }}
            style={{
              width: 52, height: 52, borderRadius: tokens.radius.lg,
              background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24, fontSize: 22,
            }}>
            🔐
          </motion.div>

          {/* Username */}
          <motion.div variants={FIELD_ENTRY(0)} initial="hidden" animate="show">
            <input
              style={inputStyle}
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={FIELD_ENTRY(1)} initial="hidden" animate="show">
            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                key={shakeKey}
                animate={{ x: [0, -8, 8, -8, 8, 0] }}
                transition={{ duration: 0.4 }}
                style={{ color: tokens.danger, fontSize: 13, marginBottom: 12, fontFamily: tokens.fontBody }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Login button */}
          <motion.div variants={FIELD_ENTRY(2)} initial="hidden" animate="show">
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: `0 0 24px rgba(108,99,255,0.4)` }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "12px 0",
                background: loading ? tokens.primaryActive : tokens.primary,
                color: "#fff", border: "none", borderRadius: tokens.radius.md,
                fontFamily: tokens.fontBody, fontSize: 15, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "Authenticating…" : "Sign In"}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Security notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ textAlign: "center", marginTop: 20, color: tokens.textMuted, fontSize: 11, fontFamily: tokens.fontMono }}>
          SECURED · ACCESS LOGGED · ACTIONS AUDITED
        </motion.div>
      </div>
    </div>
  );
}
```

**Add to your admin CSS file (`src/admin/admin.css`):**

```css
.admin-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(108, 99, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108, 99, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 8s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
}
```

---

## STEP 6 — Admin Layout (`src/admin/components/AdminLayout.jsx`)

```jsx
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingCart, Shield, LogOut } from "lucide-react";
import { useAdminAuth } from "../AdminAuthContext";
import { tokens } from "../styles/tokens";

const NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/admin" },
  { id: "users",     icon: <Users size={18} />,           label: "Users",      path: "/admin/users" },
  { id: "products",  icon: <Package size={18} />,         label: "Products",   path: "/admin/products" },
  { id: "orders",    icon: <ShoppingCart size={18} />,    label: "Orders",     path: "/admin/orders" },
  { id: "audit",     icon: <Shield size={18} />,          label: "Audit Logs", path: "/admin/audit" },
];

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show:   (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 } }),
};

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location          = useLocation();
  const navigate          = useNavigate();

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tokens.bg, fontFamily: tokens.fontBody }}>

      {/* Sidebar */}
      <div style={{
        width: 220, background: tokens.surface, borderRight: `1px solid ${tokens.border}`,
        display: "flex", flexDirection: "column", padding: "24px 0",
      }}>
        {/* Brand */}
        <div style={{ padding: "0 20px 28px", borderBottom: `1px solid ${tokens.border}` }}>
          <div style={{ fontFamily: tokens.fontDisplay, fontSize: 18, fontWeight: 800, color: tokens.textPrimary }}>
            UNIMART
          </div>
          <div style={{ fontSize: 10, color: tokens.textMuted, letterSpacing: "0.15em", marginTop: 2 }}>
            ADMIN PANEL
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map((item, i) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <motion.div key={item.id} custom={i} variants={itemVariants} initial="hidden" animate="show"
                style={{ position: "relative", marginBottom: 4 }}>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 20, borderRadius: 99, background: tokens.primary,
                    }}
                  />
                )}

                <motion.div
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}>
                  <NavLink to={item.path} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px 9px 16px", borderRadius: tokens.radius.md,
                      background: isActive ? tokens.surfaceHover : "transparent",
                      color: isActive ? tokens.textPrimary : tokens.textSecondary,
                      transition: "background 0.15s, color 0.15s",
                    }}>
                      {item.icon}
                      <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 400 }}>{item.label}</span>
                    </div>
                  </NavLink>
                </motion.div>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer: admin info + logout */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${tokens.border}` }}>
          <div style={{ fontSize: 12, color: tokens.textSecondary, marginBottom: 10 }}>
            {admin?.display_name}
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "transparent", border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radius.md, color: tokens.textMuted,
              padding: "7px 12px", fontSize: 13, cursor: "pointer", width: "100%",
            }}>
            <LogOut size={14} /> Sign Out
          </motion.button>
        </div>
      </div>

      {/* Main content with page transitions */}
      <div style={{ flex: 1, overflow: "auto", background: tokens.bg }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

## STEP 7 — Admin App Entry (`src/admin/AdminApp.jsx`)

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout    from "./components/AdminLayout";
import Dashboard      from "./pages/Dashboard";
import Users          from "./pages/Users";
import Products       from "./pages/Products";
import Orders         from "./pages/Orders";
import AuditLogs      from "./pages/AuditLogs";

function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="*" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index          element={<Dashboard />} />
          <Route path="users"   element={<Users />} />
          <Route path="products" element={<Products />} />
          <Route path="orders"  element={<Orders />} />
          <Route path="audit"   element={<AuditLogs />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
```

---

## STEP 8 — Register in App Routes (`src/routes/AppRoutes.jsx`)

Add the admin route **outside** any `ProtectedRoute` wrapper:

```jsx
import AdminApp from "../admin/AdminApp";

// Inside your <Routes>:
<Route path="/admin/*" element={<AdminApp />} />
```

---

## VERIFICATION CHECKLIST

- [ ] Fonts (Syne, DM Sans, JetBrains Mono) load in the browser
- [ ] `/admin/login` shows the login page with grid background and orb glow
- [ ] Title letters stagger in one-by-one
- [ ] Login card springs in from below with delay
- [ ] Wrong credentials trigger a horizontal shake animation on the error message
- [ ] Successful login redirects to `/admin`
- [ ] Sidebar active item shows the purple bar with `layoutId` animation
- [ ] Page transition fades/slides on route change
- [ ] Admin logout clears `admin_token` only — student tokens untouched
- [ ] Unauthenticated direct access to `/admin` redirects to `/admin/login`
