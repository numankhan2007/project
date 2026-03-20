import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Package, ShoppingCart, Shield, LogOut } from "lucide-react";
import { tokens } from "../styles/tokens";
import { useAdminAuth } from "../AdminAuthContext";

const NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard",  path: "/admin" },
  { id: "users",     icon: <Users size={18} />,           label: "Users",       path: "/admin/users" },
  { id: "products",  icon: <Package size={18} />,         label: "Products",    path: "/admin/products" },
  { id: "orders",    icon: <ShoppingCart size={18} />,    label: "Orders",      path: "/admin/orders" },
  { id: "audit",     icon: <Shield size={18} />,          label: "Audit Logs",  path: "/admin/audit" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tokens.bg, fontFamily: tokens.fontBody }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: tokens.bgElevated,
        borderRight: `1px solid ${tokens.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ padding: "0 20px", marginBottom: 32 }}>
          <div style={{ fontFamily: tokens.fontDisplay, fontSize: 18, fontWeight: 800, color: tokens.textPrimary }}>
            UNIMART
          </div>
          <div style={{ fontSize: 10, color: tokens.textMuted, letterSpacing: "0.15em", marginTop: 2 }}>
            ADMIN PANEL
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {NAV.map((item, i) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 }}
                style={{ position: "relative", marginBottom: 4 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: tokens.primary,
                      borderRadius: tokens.radius.pill,
                    }}
                  />
                )}
                <Link
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px 10px 16px",
                    borderRadius: tokens.radius.md,
                    color: isActive ? tokens.textPrimary : tokens.textSecondary,
                    background: isActive ? tokens.surfaceHover : "transparent",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = tokens.surfaceHover; e.currentTarget.style.color = tokens.textPrimary; e.currentTarget.style.paddingLeft = "18px"; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.textSecondary; e.currentTarget.style.paddingLeft = "16px"; } }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Admin info + logout */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${tokens.border}` }}>
          {admin && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: tokens.textPrimary, fontWeight: 500 }}>{admin.displayName}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted, fontFamily: tokens.fontMono }}>{admin.username}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: `1px solid ${tokens.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.textSecondary,
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 12px",
              width: "100%",
              fontFamily: tokens.fontBody,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.danger; e.currentTarget.style.color = tokens.danger; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.textSecondary; }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", padding: 32 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
