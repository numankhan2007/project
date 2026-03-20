export const tokens = {
  bg:            "#0a0c12",
  bgElevated:    "#0f1219",
  surface:       "#141720",
  surfaceHover:  "#191d2a",
  border:        "#1e2333",
  borderLight:   "#263045",

  primary:       "#6c63ff",
  primaryHover:  "#5a52e0",
  primaryActive: "#4a43c8",
  primaryGlow:   "rgba(108, 99, 255, 0.18)",
  primaryShimmer:"rgba(108, 99, 255, 0.06)",

  accent:        "#00d4aa",
  accentGlow:    "rgba(0, 212, 170, 0.14)",
  danger:        "#ff4d6d",
  dangerGlow:    "rgba(255, 77, 109, 0.14)",
  warning:       "#f59e0b",
  warningGlow:   "rgba(245, 158, 11, 0.14)",
  success:       "#22d47e",

  textPrimary:   "#edf0f7",
  textSecondary: "#7c88a3",
  textMuted:     "#404c65",
  textDisabled:  "#2a3347",

  fontDisplay:   "'Syne', sans-serif",
  fontBody:      "'DM Sans', sans-serif",
  fontMono:      "'JetBrains Mono', monospace",

  radius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", pill: "999px" },

  shadowSm:   "0 2px 8px rgba(0,0,0,0.3)",
  shadowMd:   "0 4px 20px rgba(0,0,0,0.4)",
  shadowLg:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowGlow: (color) => `0 0 24px ${color}`,
};
