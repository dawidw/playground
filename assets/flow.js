// Isometric "how it works" illustrations. One shell (figure, step list, autoplay, keyboard) and two scenes:
//   loop:  one request travels a loop: interface > data > sheet (prompt) > model > checks > interface (Review rate).
//   sweep: eight contractors ride a belt into a sorter that splits them into three lanes (Compliance sweep).
// A config (see experiments/<name>/flow.js) supplies the words; the geometry lives here. All data in configs is made up.
// Usage: Flow.mount(element, config, { compact }). Configs register themselves in Flow.configs.
(() => {
// ---------- isometric kit: one set of helpers per scene origin ----------
const kit = (OX, OY) => {
  const C = Math.cos(Math.PI / 6), S = Math.sin(Math.PI / 6);
  const P = (x, y, z) => [(x - y) * C + OX, (x + y) * S - z + OY];
  const D = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const plane = (O, U, V) => { const o = P(...O), u = D(...U), v = D(...V); return `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`; };
  const TOP = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]);
  const FRONT = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]);
  const SIDE = (x, y, z) => plane([x, y, z], [0, -1, 0], [0, 0, -1]);
  const rect = (t, w, h, r = 0, cls = "face") => `<g transform="${t}"><rect class="${cls}" width="${w}" height="${h}" rx="${r}"/></g>`;
  const box = (x, y, z, w, d, h, r = 0) => {
    const rr = Math.min(r, h / 4);
    return rect(SIDE(x + w, y + d, z + h), d, h, rr) + rect(FRONT(x, y + d, z + h), w, h, rr) + rect(TOP(x, y, z + h), w, d, r, "face top");
  };
  const T = (x, y, size, str, cls = "", extra = "") => `<text x="${x}" y="${y}" font-size="${size}"${cls ? ` class="${cls}"` : ""}${extra}>${str}</text>`;
  const at = (x, y, z = 0) => { const p = P(x, y, z); return `translate(${p[0] - OX}px,${p[1] - OY}px)`; };
  return { OX, OY, P, TOP, FRONT, SIDE, rect, box, T, at };
};

// ---------- shared illustrated parts ----------
const parts = {
  ui(k, x, y, c) {
    const { box, FRONT, T } = k;
    let s = `<g class="obj" data-o="ui" data-ui="a">`;
    s += box(x + 40, y + 55, 0, 50, 50, 10, 3) + box(x + 58, y + 70, 10, 14, 14, 16) + box(x, y + 80, 26, 130, 10, 100, 5);
    s += `<g transform="${FRONT(x, y + 90, 126)}">`;
    s += `<rect class="face glass" x="6" y="6" width="118" height="88" rx="5"/>`;
    s += `<circle cx="15" cy="14" r="2.2" class="dot-r"/><circle cx="22" cy="14" r="2.2" class="dot-y"/><circle cx="29" cy="14" r="2.2" class="dot-g"/>`;
    s += T(14, 31, 9.5, c.ui.title, "live");
    [45, 59, 89].forEach((yy, i) => {
      const r = c.ui.rows[i];
      s += `<line class="detail" x1="12" x2="118" y1="${yy - 9}" y2="${yy - 9}"/><circle class="detail" cx="19" cy="${yy - 2.6}" r="3.4"/>`;
      s += T(26, yy, 7, r[0]) + T(118, yy, 7, r[1], "", ' text-anchor="end"');
    });
    s += `<g class="ui-a"><g class="press go"><rect class="face" x="74" y="63" width="44" height="14" rx="3"/>${T(96, 72.6, 7.4, c.ui.button, "live", ' text-anchor="middle"')}</g></g>`;
    s += `<g class="ui-b">${T(70, 72.4, 7.4, "⠋ " + c.ui.spinner, "live flow-spin")}</g>`;
    s += `<g class="ui-c"><rect class="face" x="18" y="34" width="94" height="56" rx="5"/>${c.ui.card}</g>`;
    return s + "</g></g>";
  },
  db(k, x, y) {
    const { P } = k, cx = x + 65, cy = y + 65, R = 52, rx = 1.2247 * R, ry = 0.7071 * R;
    let s = `<g class="obj" data-o="db">`;
    [0, 1, 2].forEach((i) => {
      const z = i * 34, h = 26, sx = P(cx, cy, z)[0], sb = P(cx, cy, z)[1], st = P(cx, cy, z + h)[1], mid = (st + sb) / 2;
      s += `<path class="face" d="M${sx - rx} ${st} L${sx - rx} ${sb} A${rx} ${ry} 0 0 0 ${sx + rx} ${sb} L${sx + rx} ${st} Z"/>`;
      s += `<ellipse class="face top" cx="${sx}" cy="${st}" rx="${rx}" ry="${ry}"/>`;
      s += `<ellipse class="detail glow" cx="${sx}" cy="${st}" rx="${rx * 0.72}" ry="${ry * 0.72}"/>`;
      s += `<rect class="detail glow" x="${sx - 30}" y="${mid + ry * 0.9 - 2}" width="38" height="4" rx="2"/><circle class="detail glow" cx="${sx + rx * 0.55}" cy="${mid + ry * 0.84}" r="2.4"/>`;
    });
    return s + "</g>";
  },
  model(k, x, y, c, size = 130) {
    const { P, TOP, FRONT, box, T } = k, sc = size / 130, zs = [0, 36, 72], N = [22, 49, 76, 103].map((n) => n * sc);
    const pairs = [[0, 1], [1, 1], [2, 2], [3, 2], [1, 3], [2, 0]];
    let s = `<g class="obj" data-o="api">`, th = "";
    zs.forEach((z, kk) => {
      s += box(x, y, z, size, size, 16, 4);
      s += `<g transform="${TOP(x, y, z + 16)}">${N.map((n) => `<circle class="detail glow" cx="${n}" cy="${size / 2}" r="3.6"/>`).join("")}</g>`;
      if (kk < 2) pairs.forEach((p, i) => {
        const a = P(x + N[p[0]], y + size / 2, z + 16), b = P(x + N[p[1]], y + size / 2, zs[kk + 1] + 16);
        th += `<line class="th" style="--d:${kk * 3 + i * 0.4}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
      });
    });
    s += th + `<g transform="${FRONT(x, y + size, 16)}">${T(10, 12, 9, c.model.caption, "hot")}</g>`;
    return s + "</g>";
  },
  gate(k, gx, label, i, yA, yB) {
    const { P, box } = k, p = P(gx + 4, (yA + yB + 8) / 2, 92);
    let s = `<g class="gate" data-g="${i}">`;
    s += box(gx, yA, 0, 8, 8, 54, 2) + box(gx, yB, 0, 8, 8, 54, 2) + box(gx, yA, 54, 8, yB - yA + 8, 10, 2);
    s += `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" font-size="12" class="live">${label}</text>`;
    s += `<text class="chk" x="${p[0]}" y="${p[1] - 15}" text-anchor="middle" font-size="15">✓</text></g>`;
    return s;
  },
  belt(k, x, y, w, d, dir) {
    const { box, TOP } = k;
    let s = box(x, y, 0, w, d, 4, 1) + `<g transform="${TOP(x, y, 4)}">`;
    if (dir === "x") for (let i = 10; i < w; i += 12) s += `<line class="detail" x1="${i}" y1="3" x2="${i}" y2="${d - 3}"/>`;
    else for (let i = 10; i < d; i += 12) s += `<line class="detail" x1="3" y1="${i}" x2="${w - 3}" y2="${i}"/>`;
    return s + "</g>";
  },
};

// ---------- scene: loop (Review rate) ----------
const GATE_X = [545, 475, 405];
const LOOP_FIX = [
  { at: null,  ui: "a", path: [[65, 155]] },
  { at: "ui",  ui: "a", path: [[65, 155], [335, 155]], ms: 1500 },
  { at: "db",  ui: "b", path: [[335, 155]] },
  { at: "db",  ui: "b", path: [[335, 155], [605, 155]], ms: 1500 },
  { at: "pr",  ui: "b", path: [[605, 155]] },
  { at: "api", ui: "b", path: [[605, 155], [605, 330]], ms: 1500 },
  { at: "api", ui: "b", path: [[605, 330]] },
  { at: "code", ui: "b", path: [[605, 330], [330, 330]], ms: 2300 },
  { at: "ui",  ui: "c", path: [[330, 330], [65, 330], [65, 155]], ms: 2200 },
];

function sheetObj(k, x, y, c) {
  const { box, FRONT, T } = k, sh = c.sheet, ys = [31, 62, 98];
  let s = `<g class="obj" data-o="pr">`;
  s += box(x + 40, y + 84, 0, 50, 26, 6, 2) + box(x + 15, y + 90, 0, 100, 8, 120, 3);
  s += `<g transform="${FRONT(x + 15, y + 98, 120)}">`;
  s += T(8, 14, 8, sh.title, "hot") + `<line class="detail" x1="8" x2="92" y1="19" y2="19"/>`;
  sh.blocks.forEach((b, i) => {
    const y0 = ys[i];
    s += `<g class="reveal" style="--d:${i}">${T(8, y0, 7.5, b.tag, "", ` style="fill:${b.color}"`)}</g>`;
    b.bars.forEach((w, kk) => { s += `<rect class="reveal" style="--d:${i};fill:${b.color}" opacity=".55" x="8" y="${y0 + 5 + kk * 7}" width="${w}" height="3" rx="1.5"/>`; });
  });
  (sh.chips || []).forEach((ch, i) => { s += `<rect class="reveal chip" style="--d:${3 + i * 0.3}" x="${ch[0]}" y="${ch[1]}" width="${ch[2]}" height="5" rx="2"/>`; });
  s += `<g class="reveal" style="--d:4">${T(92, 14, 7, sh.meta, "hot", ' text-anchor="end"')}</g>`;
  return s + "</g></g>";
}
function codeObj(k, x, y, c) {
  const { box, FRONT, T } = k;
  let s = `<g class="obj" data-o="code">` + box(x, y, 0, 120, 10, 100, 4) + `<g transform="${FRONT(x, y + 10, 100)}">`;
  s += T(8, 14, 8, c.code.file, "hot") + `<line class="detail" x1="8" x2="112" y1="19" y2="19"/>`;
  c.code.lines.forEach((t, i) => { const yy = 33 + i * 11.5; s += `<rect class="hlbar" data-hl="${i}" x="4" y="${yy - 8}" width="112" height="11" rx="2"/>` + T(10, yy, 8.2, t, i === 0 ? "hot" : ""); });
  return s + "</g></g>";
}

const loopScene = {
  ox: 421, oy: 190, viewBox: "170 70 740 720",
  steps: (c) => LOOP_FIX.map((f, i) => Object.assign({}, f, c.steps[i])),
  svg(k, c) {
    const { P, TOP } = k;
    let s = `<g transform="${TOP(0, 0, 0)}"><rect class="rail" x="65" y="155" width="540" height="175" rx="22"/></g>`;
    s += parts.ui(k, 0, 0, c) + parts.db(k, 270, 0) + sheetObj(k, 540, 0, c) + codeObj(k, 270, 395, c);
    s += parts.gate(k, GATE_X[2], c.gates[2], 2, 300, 352) + parts.gate(k, GATE_X[1], c.gates[1], 1, 300, 352) + parts.gate(k, GATE_X[0], c.gates[0], 0, 300, 352);
    s += parts.model(k, 650, 255, c);
    [["ui", c.ui.label || "INTERFACE", 65, 65, 158], ["db", c.db.label, 335, 65, 150], ["pr", c.sheet.label, 605, 92, 152], ["api", c.model.label || "MODEL", 715, 320, 170], ["code", c.code.label, 330, 400, 124]].forEach((l) => {
      const p = P(l[2], l[3], l[4]);
      s += `<text class="lab" data-l="${l[0]}" x="${p[0]}" y="${p[1]}">${l[1]}</text>`;
    });
    s += `<g class="tile" opacity="0"><g transform="${TOP(-104, -18, 3)}"><rect class="face top" width="208" height="36" rx="4"/><text class="t1" x="9" y="15" font-size="9.5"></text><text class="t2" x="9" y="28" font-size="9.5"></text></g></g>`;
    return s;
  },
  create({ k, q, qa, steps, reduce, live }) {
    const tile = q(".f-tile"), ui = q('[data-o="ui"]');
    let lit = 0, anim = 0, cur = 0;
    const place = (x, y) => { tile.style.transform = k.at(x, y, 0); };
    const setCode = () => {
      const on = {};
      if (cur === 6) on[1] = 1;
      if (cur >= 7) { on[1] = 1; if (lit >= 1 || cur >= 8) on[2] = 1; if (lit >= 2 || cur >= 8) on[3] = 1; if (lit >= 3 || cur >= 8) on[4] = 1; }
      if (cur >= 8) on[5] = 1;
      qa(".f-hlbar").forEach((e) => e.classList.toggle("on", !!on[e.dataset.hl]));
    };
    const setGates = (n) => { lit = n; qa(".f-gate").forEach((g) => g.classList.toggle("lit", +g.dataset.g < n)); setCode(); };
    const len = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; };
    const along = (p, d) => {
      for (let i = 1; i < p.length; i++) {
        const sg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (d <= sg || i === p.length - 1) { const kk = Math.min(1, d / sg); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * kk, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * kk]; }
        d -= sg;
      }
      return p[p.length - 1];
    };
    return {
      cancel() { cancelAnimationFrame(anim); },
      apply(n, animate, mine) {
        cur = n;
        const s = steps[n], going = !!(animate && s.ms && !reduce);
        ["ui", "db", "pr", "api", "code"].forEach((kk) => { q(`[data-o="${kk}"]`).classList.toggle("on", kk === s.at); q(`[data-l="${kk}"]`).classList.toggle("on", kk === s.at); });
        ui.setAttribute("data-ui", n === 8 && going ? "b" : s.ui);
        q('[data-o="pr"]').classList.toggle("on", n >= 4);
        q('[data-o="api"]').classList.toggle("on", n === 5 || n === 6);
        q('[data-o="code"]').classList.toggle("on", n >= 7);
        if (n < 7) setGates(0); else if (!going) setGates(3); else if (lit === 3) setGates(0);
        tile.setAttribute("opacity", n === 0 ? 0 : 1);
        q(".t1").textContent = s.t[0]; q(".t2").textContent = s.t[1];
        setCode();
        const p = s.path;
        if (!going) { const e = p[p.length - 1]; place(e[0], e[1]); return; }
        const L = len(p), t0 = performance.now();
        (function frame(now) {
          if (!live(mine)) return;
          const kk = Math.min(1, (now - t0) / s.ms), e = kk < .5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2, pt = along(p, L * e);
          place(pt[0], pt[1]);
          if (n === 7) { const n2 = GATE_X.filter((gx) => pt[0] <= gx).length; if (n2 !== lit) setGates(n2); }
          if (kk < 1) anim = requestAnimationFrame(frame); else if (n === 8) ui.setAttribute("data-ui", "c");
        })(performance.now());
      },
    };
  },
};

// ---------- scene: sweep (Compliance sweep) ----------
const SW_GATES = [560, 620, 680];
const QX = (i) => 286 - i * 33.5;                      // belt queue, index 0 is first in line
const TOMAS = 5, JONAS = 7;
const SLOT = { 6: [543, 26], 4: [565, 26], 3: [543, 54], 2: [587, 26], 1: [565, 54], 0: [587, 54] }; // painter-friendly slots in the bin
const SW_FIX = [
  { on: [],             ui: "a", plate: null },
  { on: ["ui"],         ui: "b", plate: [110, 92] },
  { on: ["db"],         ui: "b", plate: [235, 92] },
  { on: ["sorter"],     ui: "b", plate: [330, 100], ms: 4300 },
  { on: ["bin"],        ui: "b", plate: [565, 128] },
  { on: ["api"],        ui: "b", plate: [500, 215] },
  { on: ["api"],        ui: "b", plate: [500, 215] },
  { on: ["tray"],       ui: "b", plate: [650, 338], ms: 1900 },
  { on: ["desk", "ui"], ui: "c", plate: [640, 566] },
];
const lift = (x0) => [[x0, 40, 4], [318, 40, 4], [332, 40, 46], [358, 40, 46], [372, 40, 4]];
const tokenPath3 = (i) => {
  const a = lift(QX(i));
  if (i === TOMAS) return a.concat([[387, 40, 4], [387, 270, 4], [450, 270, 4]]);
  if (i === JONAS) return a.concat([[387, 40, 4], [387, 500, 4], [590, 500, 4], [604, 500, 30], [650, 500, 30]]);
  const s = SLOT[i];
  return a.concat([[500, 40, 4], [520, 40, 4], [532, 40, 22], [s[0], s[1], 22]]);
};
const TOMAS_PATH7 = [[450, 270, 4], [740, 270, 4], [756, 270, 14], [770, 270, 14]];
const tokenFinal = (n, i) => {
  if (n <= 0) return { vis: false, pt: [QX(i), 40, 4] };
  if (n <= 2) return { vis: true, pt: [QX(i), 40, 4] };
  const p = tokenPath3(i); let pt = p[p.length - 1];
  if (i === TOMAS && n >= 7) pt = TOMAS_PATH7[TOMAS_PATH7.length - 1];
  return { vis: true, pt };
};
const tokenCls = (n, i) => (n >= 3 ? (i === TOMAS ? "is-chase" : i === JONAS ? "is-esc" : "is-clear") : "");
const INITIALS = ["JD", "JL", "AW", "MR", "SL", "TN", "PN", "JN"];

const sweepScene = {
  ox: 150, oy: 215, viewBox: "5 5 690 830",
  steps: (c) => SW_FIX.map((f, i) => Object.assign({}, f, c.steps[i])),
  svg(k, c) {
    const { P, TOP, FRONT, box, T } = k;
    let s = "";
    s += parts.belt(k, 30, 25, 290, 30, "x") + parts.belt(k, 372, 25, 150, 30, "x") + parts.belt(k, 372, 55, 30, 460, "y") + parts.belt(k, 402, 255, 330, 30, "x") + parts.belt(k, 402, 485, 190, 30, "x");
    s += parts.ui(k, 0, -120, c) + parts.db(k, 170, -120);
    s += `<g class="obj" data-o="sorter">` + box(320, 5, 0, 52, 70, 40, 3) + `<g transform="${FRONT(320, 75, 40)}">${T(6, 15, 8, c.sorter.title, "hot")}${T(6, 27, 6.5, c.sorter.sub, "")}</g><g transform="${TOP(320, 5, 40)}">${[12, 26, 40].map((x) => `<polyline class="detail glow" points="${x},18 ${x + 8},35 ${x},52"/>`).join("")}</g></g>`;
    s += parts.model(k, 420, 300, c, 100);
    s += `<g class="obj" data-o="bin">` + box(520, 0, 0, 90, 80, 22, 3) + `<g transform="${TOP(520, 0, 22)}"><rect class="face glass" x="8" y="8" width="74" height="64" rx="4"/></g></g>`;
    s += SW_GATES.map((gx, i) => parts.gate(k, gx, c.gates[i], i, 247, 293)).join("");
    s += `<g class="obj" data-o="tray">` + box(730, 238, 0, 80, 64, 14, 3) + `<g transform="${TOP(730, 238, 14)}"><rect class="detail glow" x="12" y="12" width="56" height="40" rx="3"/><polyline class="detail glow" points="12,12 40,34 68,12"/></g></g>`;
    s += `<g class="obj" data-o="desk">` + box(600, 462, 0, 100, 56, 30, 3) + box(615, 468, 30, 70, 6, 46, 2) + `<g transform="${FRONT(615, 474, 76)}">${T(6, 13, 8, c.desk.name, "hot")}${T(6, 23, 6.3, c.desk.line, "")}<rect class="face" x="6" y="29" width="28" height="11" rx="3"/>${T(20, 36.6, 6.3, c.desk.a, "live", ' text-anchor="middle"')}<rect class="detail glow" x="38" y="29" width="26" height="11" rx="3"/>${T(51, 36.6, 6.3, c.desk.b, "", ' text-anchor="middle"')}</g></g>`;
    [["ui", c.ui.label || "INTERFACE", 65, -55, 158], ["db", c.db.label, 235, -55, 150], ["sorter", c.sorter.label, 346, 40, 72], ["bin", c.bin.label, 565, 40, 74], ["api", c.model.label || "MODEL", 470, 350, 150], ["tray", c.tray.label, 770, 270, 44], ["desk", c.desk.label, 650, 492, 112]].forEach((l) => {
      const p = P(l[2], l[3], l[4]);
      s += `<text class="lab" data-l="${l[0]}" x="${p[0]}" y="${p[1]}">${l[1]}</text>`;
    });
    for (let i = 7; i >= 0; i--) s += `<g class="tok" data-i="${i}" style="--i:${i}">${box(-10, -10, 0, 20, 20, 12, 2)}<g transform="${TOP(-10, -10, 12)}">${T(10, 14, 8.5, INITIALS[i], "", ' text-anchor="middle"')}</g></g>`;
    s += `<g class="tile glide" opacity="0"><g transform="${TOP(-85, -15, 3)}"><rect class="face top" width="170" height="30" rx="4"/><text class="t1" x="8" y="13" font-size="8.5"></text><text class="t2" x="8" y="24" font-size="8.5"></text></g></g>`;
    return s;
  },
  create({ k, q, qa, steps, reduce, live }) {
    const OBJ = ["ui", "db", "sorter", "bin", "api", "tray", "desk"];
    const tile = q(".f-tile"), ui = q('[data-o="ui"]'), toks = [...Array(8)].map((_, i) => q(`.f-tok[data-i="${i}"]`));
    let anim = 0, lit = 0;
    const setTok = (i, pt) => { toks[i].style.transform = k.at(pt[0], pt[1], pt[2]); };
    const setCls = (i, cls) => { toks[i].classList.remove("is-clear", "is-chase", "is-esc"); if (cls) toks[i].classList.add(cls); };
    const setGates = (n) => { lit = n; qa(".f-gate").forEach((g) => g.classList.toggle("lit", +g.dataset.g < n)); };
    const len3 = (p) => { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]); return L; };
    const along3 = (p, d) => {
      for (let i = 1; i < p.length; i++) {
        const sg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]);
        if (d <= sg || i === p.length - 1) { const kk = sg ? Math.min(1, d / sg) : 1; return p[i - 1].map((v, j) => v + (p[i][j] - v) * kk); }
        d -= sg;
      }
      return p[p.length - 1];
    };
    const ease = (kk) => (kk < .5 ? 2 * kk * kk : 1 - Math.pow(-2 * kk + 2, 2) / 2);
    const snap = (n) => { for (let i = 0; i < 8; i++) { const f = tokenFinal(n, i); setTok(i, f.pt); setCls(i, tokenCls(n, i)); toks[i].classList.toggle("vis", f.vis); } };
    return {
      cancel() { cancelAnimationFrame(anim); },
      apply(n, animate, mine) {
        const s = steps[n], going = !!(animate && s.ms && !reduce);
        OBJ.forEach((o) => { const on = (s.on || []).includes(o); q(`[data-o="${o}"]`).classList.toggle("on", on); q(`[data-l="${o}"]`).classList.toggle("on", on); });
        ui.setAttribute("data-ui", s.ui);
        if (n < 7) setGates(0); else if (!going) setGates(3);
        tile.setAttribute("opacity", s.plate ? 1 : 0);
        if (s.plate) tile.style.transform = k.at(s.plate[0], s.plate[1], 0);
        q(".t1").textContent = s.t[0]; q(".t2").textContent = s.t[1];
        if (!going) { snap(n); return; }
        // animated hand-overs: the sort (step 3) and Tomas through the gates (step 7)
        const t0 = performance.now(), plan = [];
        if (n === 3) { snap(2); for (let i = 0; i < 8; i++) plan.push({ i, path: tokenPath3(i), delay: i * 300, dur: 2000 }); }
        else { snap(6); plan.push({ i: TOMAS, path: TOMAS_PATH7, delay: 0, dur: 1800 }); setGates(0); }
        plan.forEach((it) => { it.L = len3(it.path); });
        (function frame(now) {
          if (!live(mine)) return;
          let done = true;
          plan.forEach((it) => {
            const p = Math.max(0, Math.min(1, (now - t0 - it.delay) / it.dur));
            if (p < 1) done = false;
            const pt = along3(it.path, it.L * ease(p));
            setTok(it.i, pt);
            if (n === 3 && p > 0.4) setCls(it.i, tokenCls(3, it.i));
            if (n === 7) { const n2 = SW_GATES.filter((gx) => pt[0] >= gx + 4).length; if (n2 !== lit) setGates(n2); }
          });
          if (!done) anim = requestAnimationFrame(frame);
        })(performance.now());
      },
    };
  },
};

const SCENES = { loop: loopScene, sweep: sweepScene };

// ---------- shell ----------
const FMAP = {};
"face top glass detail glow rail live hot lab th chip press go reveal gate chk hlbar tile obj readout more n tt fl tok glide".split(" ").forEach((t) => { FMAP[t] = 1; });
const fc = (html) => html.replace(/class="([^"]*)"/g, (m, c) => 'class="' + c.split(" ").map((t) => (FMAP[t] ? "f-" + t : t)).join(" ") + '"');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const figs = [];
let current = null;
const FR = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let fi = 0;
setInterval(() => { fi = (fi + 1) % FR.length; document.querySelectorAll(".flow-spin").forEach((e) => { e.textContent = FR[fi] + " " + e.dataset.label; }); }, 90);
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { const f = figs.find((x) => x.el === e.target); if (f) f.visible(e.isIntersecting && e.intersectionRatio >= 0.35); });
}, { threshold: [0, 0.35, 0.7] });

function mount(root, c, opts) {
  opts = opts || {};
  if (root._flow) root._flow.destroy();
  const scene = SCENES[c.scene || "loop"], k = kit(scene.ox, scene.oy), steps = scene.steps(c);
  root.classList.add("flow");
  root.classList.toggle("flow-compact", !!opts.compact);
  root.innerHTML = fc(`<div class="flow-fig"><div class="flow-row"><span>${c.fig}</span><span class="flow-cap">${c.caption}</span></div>` +
    `<svg viewBox="${scene.viewBox}" role="img" tabindex="0" aria-label="${c.alt}">${scene.svg(k, c)}</svg>` +
    `<div class="flow-row"><span>button or enter plays · space steps · r resets</span><span class="readout"></span></div></div>` +
    `<ol class="flow-steps">${steps.slice(1).map((s, i) => `<li data-i="${i + 1}"><button type="button"><span class="n">${i + 1}</span><span class="tt">${s.title}</span><span class="fl">${s.flow}</span></button><div class="more"><div><p>${s.desc}</p><pre>${s.out.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div></div></li>`).join("")}</ol>`);
  const q = (sel) => root.querySelector(sel), qa = (sel) => [...root.querySelectorAll(sel)];
  q(".flow-spin").dataset.label = c.ui.spinner;
  let cur = 0, runId = 0, playing = false, token = 0, userPaused = false;
  const sc = scene.create({ k, q, qa, steps, reduce, live: (id) => id === runId });

  function show(n, animate) {
    sc.cancel();
    cur = Math.max(0, Math.min(steps.length - 1, n));
    const s = steps[cur], mine = ++runId;
    q(".f-readout").textContent = cur === 0 ? "ready" : `step ${cur} of 8 · ${s.flow}`;
    qa(".flow-steps li").forEach((li) => { const on = +li.dataset.i === cur; li.classList.toggle("on", on); li.querySelector("button").setAttribute("aria-expanded", on); });
    const ul = q(".flow-steps"), act = ul.querySelector("li.on");
    if (act && ul.scrollHeight > ul.clientHeight + 2) ul.scrollTo({ top: Math.max(0, act.offsetTop - 8), behavior: reduce ? "auto" : "smooth" });
    sc.apply(cur, !!animate, mine);
  }
  const pressGo = () => { const b = q(".f-go"); if (b) { b.classList.add("down"); setTimeout(() => b.classList.remove("down"), 160); } };
  async function play() {
    if (playing) return;
    playing = true; const my = ++token; pressGo();
    do {
      for (let i = (cur >= 8 ? 0 : cur) + (cur === 0 ? 1 : 0); i < steps.length && my === token; i++) {
        show(i, true); await wait((steps[i].ms || 0) + (steps[i].ms ? 700 : 1900));
      }
      if (my !== token) return;
      await wait(2200); if (my !== token) return;
      show(0, false); await wait(1400); if (my !== token) return;
      pressGo();
    } while (my === token);
  }
  const stop = () => { playing = false; token++; };
  const toggle = () => { if (playing) { userPaused = true; stop(); } else { userPaused = false; if (cur >= 8) show(0, false); play(); } };
  const api = {
    el: root,
    destroy() { stop(); sc.cancel(); const i = figs.indexOf(api); if (i >= 0) figs.splice(i, 1); io.unobserve(root); root._flow = null; root.innerHTML = ""; },
    visible: (v) => { if (v && !userPaused && !playing) play(); if (!v && playing) stop(); },
    key(e) {
      if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); userPaused = true; stop(); show(cur >= 8 ? 0 : cur + 1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); userPaused = true; stop(); show(cur - 1, false); }
      else if (e.key === "Enter") { e.preventDefault(); toggle(); }
      else if (e.key === "r" || e.key === "R") { userPaused = true; stop(); show(0, false); }
    },
  };
  root.addEventListener("click", (e) => {
    if (e.target.closest(".f-go")) { e.stopPropagation(); toggle(); return; }
    const li = e.target.closest(".flow-steps li");
    if (li) { userPaused = true; stop(); show(+li.dataset.i, false); }
  });
  root.addEventListener("pointerenter", () => { current = api; });
  root.addEventListener("focusin", () => { current = api; });
  show(0, false);
  root._flow = api;
  figs.push(api);
  if ("IntersectionObserver" in window) io.observe(root); else api.visible(true);
}

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || !current || !current.el.matches(":hover, :focus-within")) return;
  if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
  current.key(e);
});

window.Flow = { mount, configs: window.FlowConfigs = window.FlowConfigs || {} };
})();
