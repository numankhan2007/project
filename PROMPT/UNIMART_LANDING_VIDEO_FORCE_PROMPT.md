# UNIMART — LANDING PAGE VIDEO BACKGROUND FEATURE
### Scope: Landing page (`src/pages/Landing.jsx`) — cinematic video background
### Prerequisites: None — fully self-contained change

---

## OVERVIEW

Replace the static dark-gradient background on the Landing page with a **full-screen, auto-playing, muted, looping video background**. The existing Marvel intro animation, floating game-title tiles, UI overlay content, and footer are all preserved and layered on top of the video.

---

## REQUIREMENTS (all mandatory)

### 1 — `VideoBackground` Component (inside `Landing.jsx`)

Build a `VideoBackground` functional component that:

- Renders a `<video>` element that:
  - spans the full viewport (`position: fixed; inset: 0; width: 100%; height: 100%`)
  - uses `object-fit: cover` so it fills the screen regardless of aspect ratio
  - has `autoPlay`, `muted`, `loop`, and `playsInline` props (required for mobile autoplay)
  - `zIndex: 0` — sits behind all other page content
  - `pointerEvents: none` — never captures clicks
- Renders a **semi-transparent dark overlay** (`rgba(0,0,0,0.55)`) on top of the video to ensure text remains readable
- Falls back to the existing dark-to-purple gradient when:
  - `VIDEO_SRC` constant is empty (`""`)
  - The video element fires an `onError` event (network failure, CORS block, etc.)
  - The `canplay` event never fires within a reasonable time
- Manages a `videoLoaded` React state (`useState(false)`) — only shows the video after it fires `onCanPlay`, preventing a flash of black before the video loads
- When `fallback` state is true (video failed/empty src), renders nothing so the page background gradient shows through

### 2 — `VIDEO_SRC` Configurable Constant

Define at the top of `Landing.jsx`:

```js
// ── Landing page video background ─────────────────────────────────────────
// Set to a publicly accessible .mp4 / .webm URL, or leave empty ("") to
// fall back to the existing gradient + floating game-title animation.
const VIDEO_SRC = "";
```

Document this constant with a comment so future developers know exactly where to swap in a real video URL.

### 3 — Skip Button on `MarvelIntro`

Add a **"Skip Intro"** button inside `MarvelIntro` so users can dismiss it immediately:

- Position: `position: absolute; bottom: 24px; right: 24px`
- Style: small, ghost / translucent — `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.18)`, `color: #94a3b8`, `borderRadius: 8px`, `padding: 6px 14px`, `fontSize: 12px`, `cursor: pointer`
- Hover: `background: rgba(255,255,255,0.14)`
- On click: call `onDone()` immediately (same callback used when the intro finishes naturally)
- Label: `"Skip"` (no icon required)

### 4 — Mute / Unmute Toggle

Add a **floating mute toggle button** visible on the landing page (only when a video is playing, i.e. `VIDEO_SRC` is non-empty and the video loaded successfully):

- Position: `position: fixed; bottom: 72px; right: 24px; zIndex: 20`
- Shows a speaker icon: `🔇` when muted, `🔊` when unmuted
- Starts muted (matching the `<video muted>` attribute)
- On click: toggle the `<video>` element's `.muted` property via a React ref and flip local `isMuted` state
- Style: `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.18)`, `color: #e2e8f0`, `borderRadius: 999px` (pill), `width: 40px; height: 40px`, `cursor: pointer`, `fontSize: 18px`
- Hover: `background: rgba(255,255,255,0.16)`
- Do NOT render this button when `VIDEO_SRC` is empty

### 5 — Layer Order (z-index stack)

From bottom to top:

| Layer | z-index |
|---|---|
| `<video>` element | 0 |
| Video dark overlay | 0 (same stacking context) |
| Grid overlay div | 1 |
| `GameBackground` floating titles | 0 (fixed, behind grid) |
| Gradient orbs (existing) | 1 |
| Main content (UNIMART text, buttons) | 2 |
| Footer | 2 |
| Mute toggle button | 20 |
| `MarvelIntro` | 9999 |

### 6 — Behaviour Matrix

| Scenario | Result |
|---|---|
| `VIDEO_SRC = ""` | Gradient background + GameBackground shown, mute button hidden |
| `VIDEO_SRC` set, video loads OK | Video plays in background, dark overlay applied, mute button shown |
| `VIDEO_SRC` set, video errors | Falls back to gradient background, mute button hidden |
| Intro playing | Intro overlays everything at z-index 9999 |
| Intro skipped | Content fades in immediately (existing `introShown` logic unchanged) |

---

## IMPLEMENTATION NOTES

- Do **not** add any new npm dependencies — use only the HTML5 `<video>` API and existing React hooks (`useState`, `useRef`, `useEffect`).
- Do **not** remove the `GameBackground` component — it continues to show when the video is not playing or when `VIDEO_SRC` is empty.
- The `VideoBackground` component can be a named function defined inside `Landing.jsx` (same pattern as `GameBackground` and `MarvelIntro`).
- All state (`videoLoaded`, `fallback`, `isMuted`) lives inside `VideoBackground` or the `Landing` component as appropriate.
- Keep the existing `sessionStorage`-based "show intro only once per session" logic intact.

---

## FINAL CHECKLIST

- [ ] `VIDEO_SRC` constant at top of file, empty string default, documented comment
- [ ] `VideoBackground` component renders `<video>` with `autoPlay muted loop playsInline`
- [ ] Dark overlay (`rgba(0,0,0,0.55)`) inside `VideoBackground`
- [ ] `onCanPlay` callback sets `videoLoaded = true`; video hidden until then (opacity 0→1)
- [ ] `onError` callback sets `fallback = true`; component renders null on fallback
- [ ] `GameBackground` still renders (not removed)
- [ ] `MarvelIntro` has Skip button (bottom-right, ghost style, calls `onDone`)
- [ ] Mute toggle rendered only when `VIDEO_SRC` is non-empty and video loaded
- [ ] Mute toggle uses `videoRef` to mutate `<video>.muted` directly
- [ ] All existing animations, buttons, footer unchanged
- [ ] No new npm dependencies introduced
