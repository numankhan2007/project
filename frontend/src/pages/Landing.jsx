import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// ── Landing page video background ─────────────────────────────────────────
// Set to a publicly accessible .mp4 / .webm URL, or leave empty ("") to
// fall back to the existing gradient + floating game-title animation.
const VIDEO_SRC = "";

const PC_GAMES = [
  "COUNTER-STRIKE 2", "CYBERPUNK 2077", "ELDEN RING", "VALORANT",
  "MINECRAFT", "GTA V", "RED DEAD REDEMPTION 2", "WITCHER 3",
  "HALF-LIFE: ALYX", "APEX LEGENDS", "FORTNITE", "BALDUR'S GATE 3",
  "STARFIELD", "DOOM ETERNAL", "PORTAL 2", "SEKIRO",
];

// ──────────────────────────────────────────────
// 3-D floating game titles background
// ──────────────────────────────────────────────
function GameBackground() {
  const tiles = useRef([]);
  if (tiles.current.length === 0) {
    for (let i = 0; i < 28; i++) {
      tiles.current.push({
        id: i,
        game: PC_GAMES[i % PC_GAMES.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 400 - 200,
        duration: 12 + Math.random() * 18,
        delay: Math.random() * -20,
        opacity: 0.06 + Math.random() * 0.12,
        size: 11 + Math.random() * 10,
        rotate: Math.random() * 30 - 15,
      });
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      perspective: "900px", pointerEvents: "none", zIndex: 0,
    }}>
      {tiles.current.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, z: t.z, x: `${t.x}vw`, y: `${t.y}vh`, rotate: t.rotate }}
          animate={{
            opacity: [0, t.opacity, t.opacity, 0],
            y: [`${t.y}vh`, `${t.y - 25}vh`],
            z: [t.z, t.z + 180],
          }}
          transition={{
            duration: t.duration,
            delay: t.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            fontFamily: "'Inter', sans-serif",
            fontSize: t.size,
            fontWeight: 700,
            color: "#ffffff",
            whiteSpace: "nowrap",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            transformStyle: "preserve-3d",
          }}
        >
          {t.game}
        </motion.div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Full-screen video background
// ──────────────────────────────────────────────
function VideoBackground({ videoRef }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fallback, setFallback] = useState(!VIDEO_SRC);

  if (fallback) return null;

  return (
    <>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
        onError={() => setFallback(true)}
        style={{
          position: "fixed", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0, pointerEvents: "none",
          opacity: videoLoaded ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />
      {/* Dark overlay to keep text readable over the video */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "rgba(0,0,0,0.55)",
      }} />
    </>
  );
}

// ──────────────────────────────────────────────
// Marvel-style intro animation
// ──────────────────────────────────────────────
function MarvelIntro({ onDone }) {
  const allGames = [...PC_GAMES, ...PC_GAMES].slice(0, 24);
  const [phase, setPhase] = useState(0);
  // phase 0: rapid game flashes  phase 1: UNIMART title slam  phase 2: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2200);
    const t2 = setTimeout(() => setPhase(2), 4000);
    const t3 = setTimeout(onDone, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      animate={phase === 2 ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Phase 0 — rapid game name flicker */}
      {phase === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {allGames.map((game, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{ opacity: [0, 1, 0], scale: [1.4, 1, 0.8] }}
              transition={{ delay: i * 0.09, duration: 0.16, ease: "easeOut" }}
              style={{
                position: "absolute",
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(18px, 4vw, 44px)",
                fontWeight: 900,
                color: i % 3 === 0 ? "#fff" : i % 3 === 1 ? "#a78bfa" : "#f472b6",
                letterSpacing: "0.15em",
                textAlign: "center",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              {game}
            </motion.div>
          ))}
        </div>
      )}

      {/* Phase 1 — UNIMART title slam */}
      {phase >= 1 && (
        <div style={{ textAlign: "center", position: "relative" }}>
          {/* Flash burst */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: "-50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          {/* Game labels ring */}
          {PC_GAMES.slice(0, 8).map((game, i) => (
            <motion.div
              key={game}
              initial={{ opacity: 0, y: i % 2 === 0 ? -80 : 80, x: (i - 4) * 60 }}
              animate={{ opacity: [0, 0.5, 0], y: i % 2 === 0 ? -160 : 160, x: (i - 4) * 80 }}
              transition={{ duration: 1.2, delay: 0.1 + i * 0.06 }}
              style={{
                position: "absolute",
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: "#6366f1",
                letterSpacing: "0.2em",
                whiteSpace: "nowrap",
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
              }}
            >
              {game}
            </motion.div>
          ))}
          <motion.div
            initial={{ scaleX: 20, scaleY: 0.1, opacity: 0 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(52px, 12vw, 120px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              lineHeight: 1,
              textShadow: "0 0 60px rgba(99,102,241,0.9), 0 0 120px rgba(168,85,247,0.5)",
            }}
          >
            UNIMART
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(12px, 2vw, 18px)",
              fontWeight: 600,
              color: "#a78bfa",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            STUDENT MARKETPLACE
          </motion.div>

          {/* Horizontal lines Marvel effect */}
          {[-1, 1].map((dir) => (
            <motion.div
              key={dir}
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{
                position: "absolute",
                height: 2,
                background: "linear-gradient(90deg, transparent, #6366f1, #a855f7, #ec4899, transparent)",
                left: "-200%", right: "-200%",
                top: dir > 0 ? "105%" : "-5%",
              }}
            />
          ))}
        </div>
      )}

      {/* Skip intro button */}
      <button
        onClick={onDone}
        style={{
          position: "absolute", bottom: 24, right: 24,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#94a3b8",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.05em",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
      >
        Skip
      </button>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Main Landing component
// ──────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [introShown, setIntroShown] = useState(() => {
    return sessionStorage.getItem("unimart_intro_shown") === "true";
  });
  const [isMuted, setIsMuted] = useState(true);
  const [videoActive, setVideoActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/home');
  }, [isAuthenticated, navigate]);

  // Track whether the video is actually playing (non-empty src + loaded successfully)
  useEffect(() => {
    if (!VIDEO_SRC) return;
    const el = videoRef.current;
    if (!el) return;
    const onCanPlay = () => setVideoActive(true);
    const onError = () => setVideoActive(false);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("error", onError);
    };
  }, []);

  const handleIntroDone = () => {
    sessionStorage.setItem("unimart_intro_shown", "true");
    setIntroShown(true);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  return (
    <>
      {/* Marvel intro — only once per session */}
      <AnimatePresence>
        {!introShown && <MarvelIntro key="intro" onDone={handleIntroDone} />}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)" }}>

        {/* Full-screen video background (renders null when VIDEO_SRC is empty or video errors) */}
        <VideoBackground videoRef={videoRef} />

        {/* 3-D game titles floating in background */}
        <GameBackground />

        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: introShown ? 1 : 0, y: introShown ? 0 : 30 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative text-center px-6 max-w-2xl"
          style={{ zIndex: 2 }}
        >
          {/* UNIMART centered, no cap emoji */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <span className="text-6xl sm:text-7xl font-extrabold gradient-text tracking-tight">
              UNIMART
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-300 mb-4 leading-relaxed"
          >
            The <span className="text-indigo-400 font-semibold">Secure Student-to-Student</span> Marketplace
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-gray-400 mb-12 max-w-lg mx-auto"
          >
            Buy and sell textbooks, electronics, notes, and more — exclusively within your university community.
            Verified students only. Safe transactions with OTP-secured deliveries.
          </motion.p>

          {/* Buttons — icons only, no text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/login')}
              className="btn-primary text-lg px-12 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
              title="User Login"
            >
              🔐
            </button>

            <button
              onClick={() => navigate('/admin/login')}
              className="btn-secondary text-lg px-12 py-4 rounded-2xl border-gray-600 text-gray-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              title="Admin Login"
            >
              ⚙️
            </button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 text-gray-500 text-xs"
          style={{ zIndex: 2 }}
        >
          © 2026 Unimart — Built for students, by students.
        </motion.p>
      </div>

      {/* Mute / unmute toggle — only rendered when a video is actively playing */}
      {VIDEO_SRC && videoActive && (
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute video" : "Mute video"}
          style={{
            position: "fixed", bottom: 72, right: 24, zIndex: 20,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#e2e8f0",
            borderRadius: 999,
            width: 40, height: 40,
            cursor: "pointer",
            fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      )}
    </>
  );
}

