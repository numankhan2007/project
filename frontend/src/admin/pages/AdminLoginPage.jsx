import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdminAuth } from "../AdminAuthContext";
import { tokens } from "../styles/tokens";
import "./admin.css";

const LETTER_STAGGER = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  letter:    { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } },
};

const CARD_ENTRY = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 22, delay: 0.5 } },
};

const fieldEntry = (i) => ({
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: { delay: 0.7 + i * 0.1, duration: 0.35, ease: "easeOut" } },
});

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const titleChars = "UNIMART ADMIN".split("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      setSuccess(true);
      setTimeout(() => navigate("/admin"), 400);
    } catch (err) {
      const msg = err.response?.data?.detail || "Authentication failed";
      setError(msg);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: tokens.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: tokens.fontBody,
    }}>
      <div className="admin-bg-grid" />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tokens.primaryGlow} 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <motion.div
          variants={LETTER_STAGGER.container}
          initial="hidden"
          animate="show"
          style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 8, flexWrap: "wrap" }}
        >
          {titleChars.map((char, i) => (
            <motion.span
              key={i}
              variants={LETTER_STAGGER.letter}
              style={{
                fontFamily: tokens.fontDisplay,
                fontSize: 28,
                fontWeight: 800,
                color: tokens.textPrimary,
                letterSpacing: char === " " ? 8 : 0,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            textAlign: "center",
            marginBottom: 32,
            color: tokens.textMuted,
            fontSize: 12,
            letterSpacing: "0.2em",
            fontFamily: tokens.fontBody,
          }}
        >
          CONTROL CENTER
        </motion.div>

        <motion.div
          variants={CARD_ENTRY}
          initial="hidden"
          animate="show"
          style={{
            background: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: tokens.radius.xl,
            padding: 32,
            boxShadow: tokens.shadowLg,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.6 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: tokens.radius.lg,
              background: `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              fontSize: 22,
            }}
          >
            🔐
          </motion.div>

          <form onSubmit={handleSubmit}>
            {error && (
              <motion.div
                key={shakeKey}
                animate={{ x: [0, -8, 8, -8, 8, 0] }}
                transition={{ duration: 0.4 }}
                style={{
                  background: tokens.dangerGlow,
                  border: `1px solid ${tokens.danger}`,
                  borderRadius: tokens.radius.md,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: tokens.danger,
                  fontSize: 13,
                  fontFamily: tokens.fontBody,
                }}
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={fieldEntry(0)} initial="hidden" animate="show" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: tokens.textSecondary, marginBottom: 6, fontFamily: tokens.fontBody, letterSpacing: "0.05em" }}>
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: tokens.bgElevated,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.textPrimary,
                  fontSize: 14,
                  fontFamily: tokens.fontBody,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </motion.div>

            <motion.div variants={fieldEntry(1)} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: tokens.textSecondary, marginBottom: 6, fontFamily: tokens.fontBody, letterSpacing: "0.05em" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: tokens.bgElevated,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.textPrimary,
                  fontSize: 14,
                  fontFamily: tokens.fontBody,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </motion.div>

            <motion.div variants={fieldEntry(2)} initial="hidden" animate="show">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 24px rgba(108,99,255,0.4)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                animate={success ? { background: tokens.success } : {}}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: loading ? tokens.primaryHover : tokens.primary,
                  border: "none",
                  borderRadius: tokens.radius.md,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: tokens.fontBody,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em",
                  transition: "background 0.3s",
                }}
              >
                {success ? "✓ Authenticated" : loading ? "Authenticating…" : "Sign In"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{
            textAlign: "center",
            marginTop: 20,
            color: tokens.textMuted,
            fontSize: 11,
            fontFamily: tokens.fontMono,
            letterSpacing: "0.1em",
          }}
        >
          SECURED · ACCESS LOGGED · ACTIONS AUDITED
        </motion.div>
      </div>
    </div>
  );
}
