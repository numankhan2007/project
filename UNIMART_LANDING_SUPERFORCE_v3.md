# ╔══════════════════════════════════════════════════════════════════╗
# ║         UNIMART LANDING PAGE — SUPER FORCE PROMPT v3.0          ║
# ║   Marvel-Style Intro · Cycling Game Video BG · Transparent Footer║
# ╚══════════════════════════════════════════════════════════════════╝

## CRITICAL RULES — READ BEFORE TOUCHING ANY FILE
# 1. NO skip button. NO skip logic. NO escape key handler. NOTHING skips the intro.
# 2. The intro plays EVERY time the page loads. Full sequence. Always.
# 3. Do NOT import framer-motion or any animation library for the intro.
#    Use ONLY pure CSS keyframes + vanilla JS timers. This is why the
#    previous prompt failed — animation libraries conflict with each other.
# 4. Do NOT use React.StrictMode — it double-fires useEffect and breaks timers.
# 5. Every timer must be stored and cleared in useEffect cleanup.
# 6. Read every section fully before writing a single line of code.

---

## SECTION 1 — DEPENDENCIES & SETUP

### 1A — Install packages
```bash
cd frontend
npm install framer-motion   # only for portal button hover — NOT for intro
pip install yt-dlp          # to download trailers
# ffmpeg install:
# Windows → winget install --id=Gyan.FFmpeg -e
# Mac     → brew install ffmpeg
# Ubuntu  → sudo apt install ffmpeg -y
```

### 1B — Add fonts to frontend/index.html inside <head>
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

### 1C — Disable StrictMode
Open `frontend/src/main.jsx`. Change:
```jsx
// BEFORE (causes double useEffect firing — breaks all timers)
<React.StrictMode><App /></React.StrictMode>

// AFTER
<App />
```

### 1D — Create output folder
```bash
mkdir -p frontend/public/gameplay
```

---

## SECTION 2 — DOWNLOAD & PROCESS GAME TRAILERS

### 2A — Official Trailer Links (verified publisher channels)

| # | Game             | YouTube URL                                      | Channel              | Best Moment  |
|---|------------------|--------------------------------------------------|----------------------|--------------|
| 1 | Cyberpunk 2077   | https://www.youtube.com/watch?v=xYxt7cwDk4E     | @CyberpunkGame       | 0:10 – 0:20  |
| 2 | GTA V            | https://www.youtube.com/watch?v=QdBZY2fkU-0     | @RockstarGames       | 0:05 – 0:15  |
| 3 | Elden Ring       | https://www.youtube.com/watch?v=E3Huy2cdih0     | @BandaiNamcoEnt      | 0:00 – 0:10  |
| 4 | Valorant         | https://www.youtube.com/watch?v=e_E9W2vsRbQ     | @VALORANT            | 0:08 – 0:18  |
| 5 | Minecraft        | https://www.youtube.com/watch?v=MmB9b5njVbA     | @Minecraft           | 0:03 – 0:13  |
| 6 | Witcher 3        | https://www.youtube.com/watch?v=c0i88t0Kacs     | @CDProjektRed        | 0:00 – 0:10  |
| 7 | Red Dead 2       | https://www.youtube.com/watch?v=eaW0tYpxyp0     | @RockstarGames       | 0:05 – 0:15  |

### 2B — Download ALL trailers (run each command separately)
```bash
# 1. Cyberpunk 2077
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/cyberpunk_raw.mp4" \
  "https://www.youtube.com/watch?v=xYxt7cwDk4E"

# 2. GTA V
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/gta_raw.mp4" \
  "https://www.youtube.com/watch?v=QdBZY2fkU-0"

# 3. Elden Ring
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/eldring_raw.mp4" \
  "https://www.youtube.com/watch?v=E3Huy2cdih0"

# 4. Valorant
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/valorant_raw.mp4" \
  "https://www.youtube.com/watch?v=e_E9W2vsRbQ"

# 5. Minecraft
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/minecraft_raw.mp4" \
  "https://www.youtube.com/watch?v=MmB9b5njVbA"

# 6. Witcher 3
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/witcher_raw.mp4" \
  "https://www.youtube.com/watch?v=c0i88t0Kacs"

# 7. Red Dead 2
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio/best" \
  --merge-output-format mp4 \
  -o "frontend/public/gameplay/rdr2_raw.mp4" \
  "https://www.youtube.com/watch?v=eaW0tYpxyp0"
```

### 2C — CRITICAL: Create ONE seamless concatenated background video
# Instead of switching clips in JS (which causes flicker/delay),
# join all 7 clips into a SINGLE seamless mp4 using ffmpeg.
# Each clip = exactly 10 seconds. Total = 70 seconds looping seamlessly.

```bash
# Step 1: Trim each raw clip to exactly 10 seconds from its best moment
ffmpeg -ss 00:00:10 -i frontend/public/gameplay/cyberpunk_raw.mp4 -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c1.mp4
ffmpeg -ss 00:00:05 -i frontend/public/gameplay/gta_raw.mp4       -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c2.mp4
ffmpeg -ss 00:00:00 -i frontend/public/gameplay/eldring_raw.mp4   -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c3.mp4
ffmpeg -ss 00:00:08 -i frontend/public/gameplay/valorant_raw.mp4  -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c4.mp4
ffmpeg -ss 00:00:03 -i frontend/public/gameplay/minecraft_raw.mp4 -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c5.mp4
ffmpeg -ss 00:00:00 -i frontend/public/gameplay/witcher_raw.mp4   -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c6.mp4
ffmpeg -ss 00:00:05 -i frontend/public/gameplay/rdr2_raw.mp4      -t 10 -vf "scale=1920:1080,setsar=1" -c:v libx264 -crf 23 -preset fast -an -pix_fmt yuv420p frontend/public/gameplay/c7.mp4

# Step 2: Create concat list file
echo "file 'c1.mp4'
file 'c2.mp4'
file 'c3.mp4'
file 'c4.mp4'
file 'c5.mp4'
file 'c6.mp4'
file 'c7.mp4'" > frontend/public/gameplay/list.txt

# Step 3: Concatenate into ONE seamless file + add crossfade transitions
# This uses the xfade filter to create smooth 1-second blends between clips
ffmpeg \
  -i frontend/public/gameplay/c1.mp4 \
  -i frontend/public/gameplay/c2.mp4 \
  -i frontend/public/gameplay/c3.mp4 \
  -i frontend/public/gameplay/c4.mp4 \
  -i frontend/public/gameplay/c5.mp4 \
  -i frontend/public/gameplay/c6.mp4 \
  -i frontend/public/gameplay/c7.mp4 \
  -filter_complex "
    [0:v]trim=duration=10,setpts=PTS-STARTPTS[v0];
    [1:v]trim=duration=10,setpts=PTS-STARTPTS[v1];
    [2:v]trim=duration=10,setpts=PTS-STARTPTS[v2];
    [3:v]trim=duration=10,setpts=PTS-STARTPTS[v3];
    [4:v]trim=duration=10,setpts=PTS-STARTPTS[v4];
    [5:v]trim=duration=10,setpts=PTS-STARTPTS[v5];
    [6:v]trim=duration=10,setpts=PTS-STARTPTS[v6];
    [v0][v1]xfade=transition=fade:duration=1:offset=9[x1];
    [x1][v2]xfade=transition=fade:duration=1:offset=18[x2];
    [x2][v3]xfade=transition=fade:duration=1:offset=27[x3];
    [x3][v4]xfade=transition=fade:duration=1:offset=36[x4];
    [x4][v5]xfade=transition=fade:duration=1:offset=45[x5];
    [x5][v6]xfade=transition=fade:duration=1:offset=54[out]
  " \
  -map "[out]" \
  -c:v libx264 -crf 24 -preset fast -an \
  -movflags +faststart \
  frontend/public/gameplay/bg_combined.mp4

# Step 4: Clean up temp files
rm frontend/public/gameplay/c1.mp4 frontend/public/gameplay/c2.mp4 \
   frontend/public/gameplay/c3.mp4 frontend/public/gameplay/c4.mp4 \
   frontend/public/gameplay/c5.mp4 frontend/public/gameplay/c6.mp4 \
   frontend/public/gameplay/c7.mp4 frontend/public/gameplay/list.txt \
   frontend/public/gameplay/*_raw.mp4

# Step 5: Verify output
ls -lh frontend/public/gameplay/bg_combined.mp4
# Expected size: 30–60MB. If larger, increase -crf to 28.
```

### 2D — Also create the UNIMART letter clips (for the Marvel intro)
# These are the same clips cut differently — used as video textures inside
# each letter of U-N-I-M-A-R-T during the intro sequence.
# 1 clip per letter, 3 seconds each, no audio.

```bash
# Re-download just one raw file if you deleted them, OR use the combined file
# These are thumbnail-sized so quality can be lower (crf 32 is fine)
# Each clip is offset by game index so each letter shows a different game

ffmpeg -ss 00:00:10 -i frontend/public/gameplay/cyberpunk_raw.mp4 -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_U.mp4
ffmpeg -ss 00:00:05 -i frontend/public/gameplay/gta_raw.mp4       -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_N.mp4
ffmpeg -ss 00:00:00 -i frontend/public/gameplay/eldring_raw.mp4   -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_I.mp4
ffmpeg -ss 00:00:08 -i frontend/public/gameplay/valorant_raw.mp4  -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_M.mp4
ffmpeg -ss 00:00:03 -i frontend/public/gameplay/minecraft_raw.mp4 -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_A.mp4
ffmpeg -ss 00:00:00 -i frontend/public/gameplay/witcher_raw.mp4   -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_R.mp4
ffmpeg -ss 00:00:05 -i frontend/public/gameplay/rdr2_raw.mp4      -t 3 -vf "scale=320:180" -c:v libx264 -crf 32 -preset ultrafast -an frontend/public/gameplay/letter_T.mp4
```

### 2E — Final file list (verify all exist before coding)
```
frontend/public/gameplay/
  bg_combined.mp4    ← single seamless 63s background video
  letter_U.mp4       ← 3s clip shown inside U during intro
  letter_N.mp4       ← 3s clip shown inside N during intro
  letter_I.mp4       ← 3s clip shown inside I during intro
  letter_M.mp4       ← 3s clip shown inside M during intro
  letter_A.mp4       ← 3s clip shown inside A during intro
  letter_R.mp4       ← 3s clip shown inside R during intro
  letter_T.mp4       ← 3s clip shown inside T during intro
```

---

## SECTION 3 — GLOBAL CSS

# Create this file: frontend/src/landing.css
# Import it at the top of Landing.jsx: import "./landing.css";

```css
/* ══════════════════════════════════════════
   UNIMART LANDING — GLOBAL CSS
   Pure CSS animations only. No library deps.
   ══════════════════════════════════════════ */

/* ── Fonts ── */
/* Already loaded in index.html */

/* ── Reset ── */
.lnd * { box-sizing: border-box; margin: 0; padding: 0; }
.lnd { font-family: 'Rajdhani', sans-serif; }

/* ════════════════════════════════
   MARVEL INTRO KEYFRAMES
   ════════════════════════════════ */

/* 1. Black bg fades in from pure white flash */
@keyframes lnd-flash {
  0%   { background-color: #ffffff; }
  100% { background-color: #0a0a0a; }
}

/* 2. Each letter panel flips in from 90deg on Y axis — like a page flip */
@keyframes lnd-panel-flip {
  0%   { transform: perspective(600px) rotateY(90deg); opacity: 0; }
  45%  { transform: perspective(600px) rotateY(-8deg); opacity: 1; }
  65%  { transform: perspective(600px) rotateY(4deg);  opacity: 1; }
  100% { transform: perspective(600px) rotateY(0deg);  opacity: 1; }
}

/* 3. Video shimmer inside each panel */
@keyframes lnd-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* 4. Logo zoom-out — starts huge and settles to 1x */
@keyframes lnd-zoom-out {
  0%   { transform: scale(2.8); opacity: 0; letter-spacing: 0.3em; }
  30%  { opacity: 1; }
  100% { transform: scale(1);   opacity: 1; letter-spacing: -2px;  }
}

/* 5. Logo color wipe — clip-path sweeps left to right */
/* Applied via inline style (JS-controlled width) — see Landing.jsx */

/* 6. UNIMART text video fill shimmer after wipe completes */
@keyframes lnd-text-shimmer {
  0%   { background-position: 0%   50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0%   50%; }
}

/* 7. Studios/tagline slides up */
@keyframes lnd-slide-up {
  0%   { opacity: 0; transform: translateY(16px); letter-spacing: 0.6em; }
  100% { opacity: 1; transform: translateY(0);    letter-spacing: 0.24em; }
}

/* 8. Entire intro fades out */
@keyframes lnd-intro-out {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}

/* ════════════════════════════════
   MAIN LANDING KEYFRAMES
   ════════════════════════════════ */

/* Main content reveal after intro */
@keyframes lnd-main-in {
  0%   { opacity: 0; transform: scale(0.96) translateY(20px); filter: blur(8px); }
  100% { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0);   }
}

/* Title gradient animation */
@keyframes lnd-title-gradient {
  0%,100% { background-position: 0%   50%; }
  50%     { background-position: 100% 50%; }
}

/* Title glow pulse */
@keyframes lnd-title-glow {
  0%,100% { text-shadow: 0 0 20px var(--gc), 0 0 50px var(--gc-dim); }
  50%     { text-shadow: 0 0 40px var(--gc), 0 0 100px var(--gc-dim); }
}

/* Glitch effect A */
@keyframes lnd-glitch-a {
  0%,88%,100% { clip-path: inset(0 0 100% 0); transform: translate(0,0);        color: #0ff; }
  89%         { clip-path: inset(10% 0 58% 0); transform: translate(-5px, 2px);  }
  91%         { clip-path: inset(55% 0 12% 0); transform: translate( 5px,-2px);  }
  93%         { clip-path: inset(32% 0 34% 0); transform: translate(-3px, 0);    }
}

/* Glitch effect B */
@keyframes lnd-glitch-b {
  0%,85%,100% { clip-path: inset(0 0 100% 0); transform: translate(0,0);        color: #f0f; }
  86%         { clip-path: inset(18% 0 50% 0); transform: translate( 4px, 1px);  }
  88%         { clip-path: inset(52% 0 10% 0); transform: translate(-4px,-1px);  }
}

/* Portal button glow pulse */
@keyframes lnd-portal-pulse {
  0%,100% { box-shadow: 0 0 22px var(--pc), 0 0 60px var(--pc-dim), inset 0 0 22px var(--pc-dim); }
  50%     { box-shadow: 0 0 42px var(--pc), 0 0 110px var(--pc-dim), inset 0 0 40px var(--pc-dim); }
}

/* Portal ring expand */
@keyframes lnd-ring {
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(2.3); opacity: 0;    }
}

/* Icon float */
@keyframes lnd-float {
  0%,100% { transform: translateY(0)    rotate(0deg); }
  50%     { transform: translateY(-8px) rotate(5deg); }
}

/* HUD dot blink */
@keyframes lnd-blink {
  0%,100% { opacity: 1; } 50% { opacity: 0.2; }
}

/* Scanline drift */
@keyframes lnd-scan {
  from { top: -2px; } to { top: 100vh; }
}

/* Fade slide up (for subtitle, footer) */
@keyframes lnd-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ════════════════════════════════
   PORTAL BUTTON HOVER
   ════════════════════════════════ */
.lnd-portal-btn {
  transition: transform 0.2s cubic-bezier(0.34,1.5,0.64,1),
              box-shadow 0.25s ease,
              border-color 0.2s ease;
  cursor: pointer;
}
.lnd-portal-btn:hover  { transform: scale(1.10) translateY(-7px) !important; }
.lnd-portal-btn:active { transform: scale(0.93) !important; }

/* Scanline texture overlay */
.lnd-scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0,0,0,0.055) 3px,
    rgba(0,0,0,0.055) 4px
  );
  pointer-events: none;
}

/* Footer link hover */
.lnd-footer-link {
  color: rgba(255,255,255,0.38);
  text-decoration: none;
  transition: color 0.18s ease;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.05em;
}
.lnd-footer-link:hover { color: rgba(255,255,255,0.82); }
```

---

## SECTION 4 — FULL Landing.jsx

# Replace the entire contents of frontend/src/pages/Landing.jsx
# with EXACTLY the following code. No modifications.

```jsx
/**
 * UNIMART Landing Page
 * Marvel-style intro → seamless video background → portal buttons → transparent footer
 *
 * Architecture:
 *   phase "intro"  → MarvelIntro component (pure CSS + JS timers, no libraries)
 *   phase "main"   → MainLanding (video bg + content + footer)
 *
 * NO skip button. NO skip logic. Intro always plays in full.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./landing.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const LETTERS = [
  { char: "U", video: "/gameplay/letter_U.mp4", color: "#e8162c" },
  { char: "N", video: "/gameplay/letter_N.mp4", color: "#c91224" },
  { char: "I", video: "/gameplay/letter_I.mp4", color: "#b00f1e" },
  { char: "M", video: "/gameplay/letter_M.mp4", color: "#e8162c" },
  { char: "A", video: "/gameplay/letter_A.mp4", color: "#c91224" },
  { char: "R", video: "/gameplay/letter_R.mp4", color: "#b00f1e" },
  { char: "T", video: "/gameplay/letter_T.mp4", color: "#e8162c" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MARVEL INTRO
// How it works (matches the real Marvel intro exactly):
//   t=0ms    : Pure white flash (50ms)
//   t=50ms   : Background snaps to near-black #0a0a0a
//   t=50ms   : Letter panels begin flipping in, one per 90ms
//              Each panel shows a game video clip inside it
//              Panel flip = perspective rotateY 90→0deg with bounce
//   t=680ms  : All 7 letters visible. Brief 200ms pause.
//   t=880ms  : Logo zooms out from scale(2.8) → scale(1), 500ms
//   t=880ms  : Simultaneously: clip-path sweeps left→right revealing gradient
//   t=1380ms : Wipe completes. Logo glows. Tagline slides up.
//   t=2000ms : Hold for 400ms
//   t=2400ms : Entire intro fades to black, 400ms
//   t=2800ms : onComplete() called → main landing fades in
// ─────────────────────────────────────────────────────────────────────────────
function MarvelIntro({ onComplete }) {
  // Each state drives a CSS class or inline style change
  const [flash, setFlash]             = useState(true);    // white flash active
  const [visibleCount, setVisible]    = useState(0);       // how many panels shown
  const [logoVisible, setLogoVisible] = useState(false);   // logo zoom-out started
  const [wipe, setWipe]               = useState(0);       // 0–100 clip-path wipe %
  const [tagline, setTagline]         = useState(false);   // tagline slide up
  const [exiting, setExiting]         = useState(false);   // fade-out started
  const timerRefs                     = useRef([]);

  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  };

  useEffect(() => {
    // t=0: white flash
    addTimer(() => setFlash(false), 50);

    // t=50: flip panels in, one every 90ms
    LETTERS.forEach((_, i) => {
      addTimer(() => setVisible(i + 1), 50 + i * 90);
    });

    // t=680: all panels shown (50 + 6*90 = 590ms + some buffer)
    addTimer(() => setLogoVisible(true), 880);

    // t=880: start clip-path wipe — sweep from 0 to 100 over 500ms
    let w = 0;
    const wipeStart = 880;
    const wipeInterval = setInterval(() => {
      w = Math.min(w + 5, 100);   // +5 every 25ms = 500ms to reach 100
      setWipe(w);
      if (w >= 100) clearInterval(wipeInterval);
    }, 25);
    addTimer(() => {}, 0); // register for cleanup via interval reference
    timerRefs.current.push(wipeInterval); // store interval id for cleanup

    // t=1450: tagline
    addTimer(() => setTagline(true), 1450);

    // t=2200: begin exit fade
    addTimer(() => setExiting(true), 2200);

    // t=2700: call onComplete
    addTimer(onComplete, 2700);

    return () => {
      timerRefs.current.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
    };
  }, []);

  return (
    <div
      className="lnd"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: flash ? "#ffffff" : "#0a0a0a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        opacity: exiting ? 0 : 1,
        transition: exiting
          ? "opacity 0.5s ease"
          : flash ? "background-color 0.05s" : "none",
      }}
    >
      {/* ── SCANLINES overlay ── */}
      <div className="lnd-scanlines" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} />

      {/* ── LETTER PANELS ── */}
      {!flash && (
        <div style={{
          width: "100%", maxWidth: "100vw",
          height: "clamp(72px, 14vw, 152px)",
          display: "flex", gap: 3,
          overflow: "hidden", zIndex: 3,
        }}>
          {LETTERS.map((letter, i) => {
            const shown = i < visibleCount;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: shown ? letter.color : "#111",
                  borderRight: "2px solid rgba(0,0,0,0.3)",
                  /* The flip animation */
                  animation: shown
                    ? `lnd-panel-flip 0.32s cubic-bezier(0.22,1,0.36,1) both`
                    : "none",
                  transformOrigin: "center center",
                }}
              >
                {/* Game video clip playing INSIDE this panel */}
                {shown && (
                  <video
                    src={letter.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%",
                      objectFit: "cover",
                      opacity: 0.55,       /* video shows through the color */
                      mixBlendMode: "luminosity",
                    }}
                  />
                )}

                {/* Color overlay on top of video */}
                {shown && (
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundColor: letter.color,
                    opacity: 0.45,
                    mixBlendMode: "multiply",
                  }} />
                )}

                {/* Shimmer sweep over panel */}
                {shown && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.14) 50%, transparent 70%)",
                    backgroundSize: "250% 100%",
                    animation: "lnd-shimmer 1.8s linear infinite",
                  }} />
                )}

                {/* Scanlines inside panel */}
                {shown && (
                  <div
                    className="lnd-scanlines"
                    style={{ position: "absolute", inset: 0 }}
                  />
                )}

                {/* The letter itself on top of everything */}
                {shown && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(28px, 6vw, 78px)",
                    color: "#ffffff",
                    textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 30px rgba(255,255,255,0.2)",
                    zIndex: 5,
                    userSelect: "none",
                  }}>
                    {letter.char}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOGO ZOOM-OUT + COLOR WIPE ── */}
      {logoVisible && (
        <div style={{
          marginTop: 24,
          position: "relative",
          userSelect: "none",
          zIndex: 4,
          animation: "lnd-zoom-out 0.5s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Ghost / base text (dark, always visible as underlay) */}
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(42px, 10vw, 128px)",
            letterSpacing: "-2px",
            color: "#1a1a1a",
            display: "block",
            lineHeight: 1,
          }}>
            UNIMART
          </span>

          {/* Gradient color layer — revealed by clip-path wipe */}
          <span style={{
            position: "absolute", inset: 0,
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(42px, 10vw, 128px)",
            letterSpacing: "-2px",
            display: "block",
            lineHeight: 1,
            /* THIS IS THE KEY: background gradient shows as text fill */
            background: "linear-gradient(90deg, #ff2d55 0%, #ff6b00 18%, #ffd700 38%, #00d4ff 65%, #a855f7 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: wipe >= 100
              ? "lnd-text-shimmer 4s ease infinite"
              : "none",
            /* clip-path sweeps from left: inset(0 RIGHT 0 0) */
            /* When wipe=0: fully hidden (right=100%). When wipe=100: fully visible (right=0%) */
            clipPath: `inset(0 ${100 - wipe}% 0 0)`,
            transition: "clip-path 0.025s linear",
          }}>
            UNIMART
          </span>

          {/* Metallic sheen highlight line (appears when wipe reaches 100%) */}
          {wipe >= 100 && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)",
              backgroundSize: "300% 300%",
              animation: "lnd-shimmer 2.5s ease infinite",
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }} />
          )}

          {/* Scanlines on logo */}
          <div className="lnd-scanlines" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        </div>
      )}

      {/* ── TAGLINE "STUDENT MARKETPLACE" ── */}
      {tagline && (
        <div style={{
          marginTop: 12, zIndex: 4,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "clamp(10px, 1.5vw, 13px)",
          color: "rgba(232,22,44,0.85)",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          animation: "lnd-slide-up 0.5s ease both",
        }}>
          STUDENT MARKETPLACE SYSTEM
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function PortalButton({ label, icon, sublabel, color, dim, onClick }) {
  const [ring, setRing] = useState(false);

  return (
    <button
      className="lnd-portal-btn"
      onClick={onClick}
      onMouseEnter={() => setRing(true)}
      onMouseLeave={() => setRing(false)}
      style={{
        "--pc":     color,
        "--pc-dim": dim,
        position: "relative",
        width:  "clamp(145px, 20vw, 222px)",
        height: "clamp(145px, 20vw, 222px)",
        borderRadius: 18,
        border: `2px solid ${color}77`,
        background: `radial-gradient(circle at center, ${dim} 0%, transparent 68%)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 7,
        animation: "lnd-portal-pulse 3s ease-in-out infinite",
        backdropFilter: "blur(12px)",
        overflow: "visible",
      }}
    >
      {/* Expanding ring on hover */}
      {ring && (
        <div style={{
          position: "absolute", inset: -12, borderRadius: 28,
          border: `2px solid ${color}55`,
          animation: "lnd-ring 0.8s ease-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* HUD corner brackets */}
      {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
        <div key={`${v}${h}`} style={{
          position: "absolute",
          [v]: 10, [h]: 10,
          width: 16, height: 16,
          borderTop:    v === "top"    ? `2.5px solid ${color}` : "none",
          borderBottom: v === "bottom" ? `2.5px solid ${color}` : "none",
          borderLeft:   h === "left"   ? `2.5px solid ${color}` : "none",
          borderRight:  h === "right"  ? `2.5px solid ${color}` : "none",
        }} />
      ))}

      {/* Label — large and at top */}
      <span style={{
        fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
        fontSize: "clamp(17px, 2.8vw, 27px)",
        color: "#fff",
        letterSpacing: "0.1em",
        textShadow: `0 0 16px ${color}, 0 0 36px ${color}88`,
      }}>
        {label}
      </span>

      {/* Icon */}
      <span style={{
        fontSize: "clamp(28px, 4.2vw, 46px)",
        animation: "lnd-float 2.4s ease-in-out infinite",
        filter: `drop-shadow(0 0 10px ${color})`,
      }}>
        {icon}
      </span>

      {/* Sublabel */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "clamp(8px, 1vw, 11px)",
        color: `${color}bb`,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}>
        {sublabel}
      </span>

      {/* Inner scanlines */}
      <div className="lnd-scanlines" style={{ position: "absolute", inset: 0, borderRadius: 16 }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPARENT FOOTER
// !! IMPORTANT: Replace FOOTER_LINKS below with your actual Home.jsx footer links !!
// Open Home.jsx → find your footer → copy each link's label and href here
// ─────────────────────────────────────────────────────────────────────────────
const FOOTER_LINKS = [
  // ↓↓ REPLACE THESE with your exact Home.jsx footer links ↓↓
  { label: "About",        href: "/about"        },
  { label: "How It Works", href: "/how-it-works"  },
  { label: "Safety",       href: "/safety"        },
  { label: "Contact",      href: "/contact"       },
  { label: "Terms",        href: "/terms"         },
  { label: "Privacy",      href: "/privacy"       },
  // ↑↑ REPLACE THESE with your exact Home.jsx footer links ↑↑
];

function TransparentFooter({ visible }) {
  return (
    <footer style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      zIndex: 20, padding: "16px 32px 20px",
      background: "linear-gradient(to top, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.0) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      opacity: visible ? 1 : 0,
      transition: "opacity 0.8s ease 1s",
      pointerEvents: visible ? "auto" : "none",
    }}>
      {/* Footer nav links */}
      <nav style={{
        display: "flex", flexWrap: "wrap",
        justifyContent: "center", gap: "4px 22px",
      }}>
        {FOOTER_LINKS.map(({ label, href }) => (
          <a key={label} href={href} className="lnd-footer-link"
            style={{ fontSize: "clamp(11px, 1.3vw, 13px)" }}>
            {label}
          </a>
        ))}
      </nav>

      {/* Divider */}
      <div style={{
        width: 40, height: 1,
        background: "rgba(255,255,255,0.12)",
      }} />

      {/* Copyright */}
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "clamp(9px, 1vw, 10px)",
        color: "rgba(255,255,255,0.20)",
        letterSpacing: "0.14em",
        textAlign: "center",
      }}>
        © 2026 UNIMART — BUILT FOR STUDENTS, BY STUDENTS
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LANDING
// ─────────────────────────────────────────────────────────────────────────────
function MainLanding({ visible }) {
  const navigate   = useNavigate();
  const videoRef   = useRef(null);
  const [ready, setReady] = useState(false);

  // Start video playback when main landing becomes visible
  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.play().catch(() => {});
      // Slight delay so reveal animation and video start feel synchronized
      const t = setTimeout(() => setReady(true), 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div
      className="lnd"
      style={{
        position: "relative", minHeight: "100vh", width: "100%",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.9s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* ── VIDEO BACKGROUND ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* Main looping combined video */}
        <video
          ref={videoRef}
          src="/gameplay/bg_combined.mp4"
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: ready ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        />

        {/* Dark gradient overlay — keeps text readable */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.26) 50%, rgba(0,0,0,0.72) 100%)",
          zIndex: 1,
        }} />

        {/* Scanlines texture on video */}
        <div className="lnd-scanlines" style={{ position: "absolute", inset: 0, zIndex: 2 }} />

        {/* Drifting scanline highlight */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2, zIndex: 3,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
          animation: "lnd-scan 9s linear infinite",
        }} />
      </div>

      {/* ── HUD: top-left game indicator ── */}
      <div style={{
        position: "absolute", top: 20, left: 24, zIndex: 20,
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 11, color: "rgba(0,212,255,0.8)",
        letterSpacing: "0.16em",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.6s ease 0.5s",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#00d4ff",
          boxShadow: "0 0 10px #00d4ff",
          animation: "lnd-blink 1.4s ease-in-out infinite",
        }} />
        LIVE GAMEPLAY
      </div>

      {/* ── HUD: top-right status ── */}
      <div style={{
        position: "absolute", top: 20, right: 24, zIndex: 20,
        textAlign: "right",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.6s ease 0.7s",
      }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(0,255,65,0.55)", letterSpacing: "0.16em" }}>
          SYS: ONLINE
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em", marginTop: 3 }}>
          SECURE · VERIFIED · OTP-ARMED
        </div>
      </div>

      {/* ── VIEWPORT CORNER BRACKETS ── */}
      {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
        <div key={`${v}${h}`} style={{
          position: "absolute",
          [v]: 14, [h]: 14,
          width: 22, height: 22, zIndex: 20,
          borderTop:    v === "top"    ? "1.5px solid rgba(255,255,255,0.18)" : "none",
          borderBottom: v === "bottom" ? "1.5px solid rgba(255,255,255,0.18)" : "none",
          borderLeft:   h === "left"   ? "1.5px solid rgba(255,255,255,0.18)" : "none",
          borderRight:  h === "right"  ? "1.5px solid rgba(255,255,255,0.18)" : "none",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.5s ease 1s",
        }} />
      ))}

      {/* ── CENTRE CONTENT ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        gap: "clamp(12px, 2.5vh, 26px)",
        padding: "0 20px",
        animation: ready ? "lnd-main-in 0.9s cubic-bezier(0.34,1.2,0.64,1) both" : "none",
      }}>

        {/* ── UNIMART TITLE ── */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <h1 style={{
            "--gc":     "#ff2d55",
            "--gc-dim": "rgba(255,45,85,0.35)",
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
            fontSize: "clamp(52px, 11.5vw, 144px)",
            lineHeight: 0.9, letterSpacing: "-2px", margin: 0,
            background: "linear-gradient(135deg, #ff2d55 0%, #ff6b00 20%, #ffd700 42%, #00d4ff 66%, #a855f7 100%)",
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            animation: "lnd-title-gradient 5s ease infinite, lnd-title-glow 3s ease-in-out infinite",
          }}>
            UNIMART
          </h1>

          {/* Glitch A — cyan */}
          <h1 aria-hidden style={{
            position: "absolute", inset: 0, margin: 0,
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
            fontSize: "clamp(52px, 11.5vw, 144px)",
            lineHeight: 0.9, letterSpacing: "-2px",
            animation: "lnd-glitch-a 10s ease-in-out infinite",
            pointerEvents: "none", userSelect: "none",
          }}>UNIMART</h1>

          {/* Glitch B — magenta */}
          <h1 aria-hidden style={{
            position: "absolute", inset: 0, margin: 0,
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
            fontSize: "clamp(52px, 11.5vw, 144px)",
            lineHeight: 0.9, letterSpacing: "-2px",
            animation: "lnd-glitch-b 7.5s ease-in-out infinite",
            pointerEvents: "none", userSelect: "none",
          }}>UNIMART</h1>
        </div>

        {/* ── SUBTITLE ── */}
        <div style={{ textAlign: "center", maxWidth: 440, animation: ready ? "lnd-fade-up 0.7s ease 0.3s both" : "none" }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "clamp(10px, 1.7vw, 15px)",
            color: "rgba(255,255,255,0.72)",
            letterSpacing: "0.13em", marginBottom: 7,
          }}>
            THE SECURE STUDENT-TO-STUDENT MARKETPLACE
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(12px, 1.5vw, 15px)",
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.65, letterSpacing: "0.03em",
          }}>
            Verified students only · OTP-secured deliveries · Zero scams
          </div>
        </div>

        {/* ── PORTAL BUTTONS ── */}
        <div style={{
          display: "flex",
          gap: "clamp(16px, 4vw, 50px)",
          flexWrap: "wrap", justifyContent: "center",
          marginTop: 4,
          animation: ready ? "lnd-fade-up 0.7s ease 0.5s both" : "none",
        }}>
          <PortalButton
            label="USER"
            icon="🎓"
            sublabel="Student Portal"
            color="#00d4ff"
            dim="rgba(0,212,255,0.13)"
            onClick={() => navigate("/login")}
          />
          <PortalButton
            label="ADMIN"
            icon="🛡️"
            sublabel="Control Center"
            color="#ff2d55"
            dim="rgba(255,45,85,0.13)"
            onClick={() => navigate("/admin")}
          />
        </div>
      </div>

      {/* ── TRANSPARENT FOOTER ── */}
      <TransparentFooter visible={ready} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — ORCHESTRATES PHASES
// phase "intro" : MarvelIntro renders, MainLanding is mounted but opacity 0
// phase "main"  : MainLanding fades in, MarvelIntro unmounts
// ─────────────────────────────────────────────────────────────────────────────
export default function Landing() {
  const [phase, setPhase] = useState("intro");

  return (
    <>
      {phase === "intro" && (
        <MarvelIntro onComplete={() => setPhase("main")} />
      )}
      <MainLanding visible={phase === "main"} />
    </>
  );
}
```

---

## SECTION 5 — COPY FOOTER LINKS FROM Home.jsx

Open `frontend/src/pages/Home.jsx` (or wherever your existing footer is).
Find every `<a>` or `<Link>` tag in the footer section.
Copy EACH link's text and href into the `FOOTER_LINKS` array in Landing.jsx.

Example — if your Home.jsx footer has:
```jsx
<Link to="/about">About</Link>
<Link to="/faq">FAQ</Link>
<Link to="/contact">Contact</Link>
<a href="/terms">Terms of Service</a>
<a href="/privacy">Privacy Policy</a>
```

Then update Landing.jsx FOOTER_LINKS to:
```js
const FOOTER_LINKS = [
  { label: "About",            href: "/about"   },
  { label: "FAQ",              href: "/faq"     },
  { label: "Contact",          href: "/contact" },
  { label: "Terms of Service", href: "/terms"   },
  { label: "Privacy Policy",   href: "/privacy" },
];
```

---

## SECTION 6 — ROUTING (AppRoutes.jsx)

```jsx
// The "/" route must be PUBLIC — no ProtectedRoute wrapper
<Route path="/"         element={<Landing />}  />
<Route path="/login"    element={<Login />}    />
<Route path="/register" element={<Register />} />
// ... rest of routes

// USER button → navigate("/login")
// ADMIN button → navigate("/admin")   ← adjust to "/admin/login" if needed
```

---

## SECTION 7 — IMPLEMENTATION ORDER (follow exactly)

```
PHASE A — ENVIRONMENT
  1.  npm install framer-motion
  2.  pip install yt-dlp
  3.  Install ffmpeg for your OS
  4.  Add Google Fonts to index.html
  5.  Disable React.StrictMode in main.jsx
  6.  mkdir frontend/public/gameplay

PHASE B — VIDEO ASSETS
  7.  Download all 7 trailers (Section 2B — one by one)
  8.  Run all 7 ffmpeg trim commands (Section 2C Step 1)
  9.  Run ffmpeg concat command to create bg_combined.mp4 (Section 2C Step 3)
  10. Run all 7 letter clip commands (Section 2D)
  11. Delete all *_raw.mp4 files
  12. Verify: ls frontend/public/gameplay/ shows exactly 8 files
      → bg_combined.mp4 + letter_U/N/I/M/A/R/T.mp4

PHASE C — CODE
  13. Create frontend/src/landing.css with all CSS from Section 3
  14. Replace entire frontend/src/pages/Landing.jsx with Section 4 code
  15. Copy your actual footer links into FOOTER_LINKS array (Section 5)
  16. Verify routing in AppRoutes.jsx (Section 6)

PHASE D — TEST
  17. npm run dev
  18. Open localhost:5173
  19. Verify: white flash appears for ~50ms
  20. Verify: 7 letter panels flip in sequentially (each shows game video inside)
  21. Verify: UNIMART logo zooms out from large and color-wipes left to right
  22. Verify: tagline "STUDENT MARKETPLACE SYSTEM" slides up
  23. Verify: entire intro fades to black
  24. Verify: video background starts playing (bg_combined.mp4)
  25. Verify: USER and ADMIN portal buttons visible with glow animation
  26. Verify: footer links visible and semi-transparent at bottom
  27. Verify: USER button → navigates to /login
  28. Verify: ADMIN button → navigates to /admin
  29. Verify: NO skip button exists anywhere on the page
  30. Open DevTools Console → zero red errors
  31. Resize to 375px width → verify mobile layout works
  32. npm run build → must complete with zero errors
  33. git add -A
  34. git commit -m "feat: marvel-style intro, seamless game video bg, portal buttons, transparent footer"
  35. git push origin main
```

---

## SECTION 8 — TROUBLESHOOTING

| Problem | Cause | Fix |
|---|---|---|
| White screen, nothing happens | StrictMode firing useEffect twice | Remove `<React.StrictMode>` from main.jsx |
| Letter panels don't flip | CSS animation name typo | Verify `lnd-panel-flip` is in landing.css AND class is applied in JSX |
| Video inside panels black/not showing | Browser autoplay policy | Ensure `muted` + `autoPlay` + `playsInline` are all on `<video>` |
| Logo wipe doesn't animate | setInterval not updating state | Check wipeInterval is started AFTER logoVisible becomes true |
| bg_combined.mp4 doesn't play | Video not preloaded | Add `preload="auto"` to the video element — already in code |
| bg_combined.mp4 is too large (>80MB) | ffmpeg crf too low | Re-run concat command with `-crf 28` instead of `24` |
| xfade filter error in ffmpeg | ffmpeg version too old | Run: `ffmpeg -version` — must be 4.3+. Update if older |
| yt-dlp error "Sign in required" | YouTube blocking | Add `--cookies-from-browser chrome` to yt-dlp command |
| Footer links missing | FOOTER_LINKS not updated | Manually copy from Home.jsx — see Section 5 |
| Fonts not loading | Google Fonts blocked | Check network tab — fonts must return 200 |
| navigate is not defined | useNavigate not imported | Add `import { useNavigate } from "react-router-dom"` |
| Build error on landing.css | Wrong import path | Change to `import "../landing.css"` if file is in src root |
