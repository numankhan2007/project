/**
 * TubesCursor.js — Rainbow edition
 * Full spectrum colours, thin tubes, short trail.
 * Only active on the landing page.
 */

let tubeApp = null;

// Full rainbow spectrum — all colours
const RAINBOW_COLORS = [
  "#ff0000", // red
  "#ff4500", // orange-red
  "#ff7700", // orange
  "#ffff00", // yellow
  "#00ff00", // green
  "#00ffcc", // cyan-green
  "#00d4ff", // cyan
  "#0066ff", // blue
  "#8b00ff", // violet
  "#ff00ff", // magenta
];

const RAINBOW_LIGHTS = [
  "#ff0000",
  "#ffff00",
  "#00ff00",
  "#00d4ff",
  "#8b00ff",
  "#ff00ff",
];

export async function initTubesCursor(canvasEl) {
  if (!canvasEl) return;
  try {
    const { default: TubesCursor } = await import(
      "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
    );

    tubeApp = TubesCursor(canvasEl, {
      tubes: {
        // Pick 3 random rainbow colours to start
        colors: pickRandom(RAINBOW_COLORS, 3),
        count: 3,
        radius: 0.012,    // very thin — adjust between 0.008–0.02
        length: 0.08,     // short trail — adjust between 0.05–0.15
        lights: {
          intensity: 100,
          colors: pickRandom(RAINBOW_LIGHTS, 4),
        },
      },
    });

    // Cycle through rainbow colors automatically every 2 seconds
    startRainbowCycle();

    // Also change on click
    document.addEventListener("click", handleClick);
  } catch (e) {
    console.warn("TubesCursor failed:", e);
  }
}

export function destroyTubesCursor() {
  stopRainbowCycle();
  document.removeEventListener("click", handleClick);
  tubeApp = null;
}

// Auto-cycle through rainbow spectrum
let cycleInterval = null;
let colorOffset = 0;

function startRainbowCycle() {
  cycleInterval = setInterval(() => {
    if (!tubeApp) return;
    colorOffset = (colorOffset + 1) % RAINBOW_COLORS.length;
    const colors = [
      RAINBOW_COLORS[colorOffset % RAINBOW_COLORS.length],
      RAINBOW_COLORS[(colorOffset + 3) % RAINBOW_COLORS.length],
      RAINBOW_COLORS[(colorOffset + 6) % RAINBOW_COLORS.length],
    ];
    const lights = [
      RAINBOW_LIGHTS[colorOffset % RAINBOW_LIGHTS.length],
      RAINBOW_LIGHTS[(colorOffset + 2) % RAINBOW_LIGHTS.length],
      RAINBOW_LIGHTS[(colorOffset + 4) % RAINBOW_LIGHTS.length],
      RAINBOW_LIGHTS[(colorOffset + 1) % RAINBOW_LIGHTS.length],
    ];
    tubeApp.tubes.setColors(colors);
    tubeApp.tubes.setLightsColors(lights);
  }, 1800);
}

function stopRainbowCycle() {
  if (cycleInterval) { clearInterval(cycleInterval); cycleInterval = null; }
}

function handleClick() {
  if (!tubeApp) return;
  const colors = pickRandom(RAINBOW_COLORS, 3);
  const lights = pickRandom(RAINBOW_LIGHTS, 4);
  tubeApp.tubes.setColors(colors);
  tubeApp.tubes.setLightsColors(lights);
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
