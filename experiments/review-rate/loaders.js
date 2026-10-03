// Braille "agent is thinking" loaders. A cell is a Braille character (U+2800 + dot bitmask), 2 dots wide and 4 tall.
// Each animation is a function of (x, y, frame) over a W x 4 dot grid, so any width works.
const LOADERS = (() => {
  const BIT = [[0x01, 0x02, 0x04, 0x40], [0x08, 0x10, 0x20, 0x80]]; // [column][row]
  // build `frames` strings for `cells` characters from a pixel function
  const make = (cells, frames, on) => Array.from({ length: frames }, (_, f) => {
    let out = "";
    for (let c = 0; c < cells; c++) {
      let m = 0;
      for (let dx = 0; dx < 2; dx++) for (let y = 0; y < 4; y++) if (on(c * 2 + dx, y, f, cells * 2)) m |= BIT[dx][y];
      out += String.fromCharCode(0x2800 + m);
    }
    return out;
  });
  const ring = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [1, 2], [1, 1], [1, 0]]; // perimeter of one cell
  let seed = 11; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const sparkle = Array.from({ length: 24 }, () => Array.from({ length: 8 * 4 }, () => rnd() < 0.28));
  const L = {};
  L.braille = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  L.orbit = make(1, 8, (x, y, f) => { const a = ring[f % 8], b = ring[(f + 4) % 8]; return (x === a[0] && y === a[1]) || (x === b[0] && y === b[1]); });
  L.breathe = make(1, 16, (x, y, f) => { const k = f < 8 ? f + 1 : 16 - f; const i = ring.findIndex((p) => p[0] === x && p[1] === y); return i >= 0 && i < k; });
  const snakePath = (W) => { const p = []; for (let x = 0; x < W; x++) for (let i = 0; i < 4; i++) p.push([x, x % 2 ? 3 - i : i]); return p; };
  L.snake = make(2, 32, (x, y, f, W) => { const p = snakePath(W); for (let k = 0; k < 4; k++) { const q = p[(f + k) % p.length]; if (q[0] === x && q[1] === y) return true; } return false; });
  L.fillsweep = make(2, 8, (x, y, f, W) => (f < W ? x <= f : x > f - W));
  L.pulse = make(2, 8, (x, y, f, W) => Math.round(Math.hypot(x - (W - 1) / 2, (y - 1.5) * 0.8)) === f % 4);
  L.columns = make(3, 8, (x, y, f) => { const h = Math.min(3, Math.abs(((f + x * 2) % 8) - 4)); return y >= 3 - h; });
  L.checkerboard = make(4, 12, (x, y, f) => (x + y + (f >> 1)) % 2 === 0);
  L.scan = make(2, 6, (x, y, f, W) => x === (f < W ? f : 2 * W - 2 - f));
  L.rain = make(4, 12, (x, y, f) => y === (f + x * 3) % 6);
  L.cascade = make(3, 12, (x, y, f) => (x + y * 2 + f) % 6 < 2);
  L.sparkle = Array.from({ length: 24 }, (_, f) => make(4, 1, (x, y) => sparkle[f][(x * 4 + y) % 32])[0]);
  L.waverows = make(4, 16, (x, y, f) => (x + f + y * 2) % 8 < 3);
  L.helix = make(4, 16, (x, y, f) => { const a = Math.round(1.5 + 1.5 * Math.sin((x + f) / 1.6)); return y === a || y === 3 - a; });
  L.diagonal = make(2, 14, (x, y, f) => { const d = x + y; return f < 7 ? d <= f : d > f - 7; });
  return L;
})();
