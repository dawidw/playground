// Isometric "how it works" illustration: one request travels a loop through five illustrated stations.
// Interface (monitor) > data (disc stack) > sheet (prompt / rules) > model (layers) > checks (gates + code), then back.
// A plate carries the command, query or message of the current step. Each experiment passes its own config.
// Usage: Flow.mount(element, config). See experiments/<name>/flow.js. All data in configs is made up (the repo is public).
(() => {
const C = Math.cos(Math.PI / 6), S = Math.sin(Math.PI / 6), OX = 421, OY = 190;
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

const RAIL = { x1: 65, y1: 155, x2: 605, y2: 330 };
const GATE_X = [545, 475, 405];
// Fixed geometry of the eight steps. Experiments only supply the words.
const FIX = [
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
const STATIONS = ["ui", "db", "pr", "api", "code"];

function uiObj(x, y, c) {
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
}

function dbObj(x, y) {
  const cx = x + 65, cy = y + 65, R = 52, rx = 1.2247 * R, ry = 0.7071 * R;
  let s = `<g class="obj" data-o="db">`;
  [0, 1, 2].forEach((i) => {
    const z = i * 34, h = 26, sx = P(cx, cy, z)[0], sb = P(cx, cy, z)[1], st = P(cx, cy, z + h)[1], mid = (st + sb) / 2;
    s += `<path class="face" d="M${sx - rx} ${st} L${sx - rx} ${sb} A${rx} ${ry} 0 0 0 ${sx + rx} ${sb} L${sx + rx} ${st} Z"/>`;
    s += `<ellipse class="face top" cx="${sx}" cy="${st}" rx="${rx}" ry="${ry}"/>`;
    s += `<ellipse class="detail glow" cx="${sx}" cy="${st}" rx="${rx * 0.72}" ry="${ry * 0.72}"/>`;
    s += `<rect class="detail glow" x="${sx - 30}" y="${mid + ry * 0.9 - 2}" width="38" height="4" rx="2"/><circle class="detail glow" cx="${sx + rx * 0.55}" cy="${mid + ry * 0.84}" r="2.4"/>`;
  });
  return s + "</g>";
}

function sheetObj(x, y, c) {
  const sh = c.sheet, ys = [31, 62, 98];
  let s = `<g class="obj" data-o="pr">`;
  s += box(x + 40, y + 84, 0, 50, 26, 6, 2) + box(x + 15, y + 90, 0, 100, 8, 120, 3);
  s += `<g transform="${FRONT(x + 15, y + 98, 120)}">`;
  s += T(8, 14, 8, sh.title, "hot") + `<line class="detail" x1="8" x2="92" y1="19" y2="19"/>`;
  sh.blocks.forEach((b, i) => {
    const y0 = ys[i];
    s += `<g class="reveal" style="--d:${i}">${T(8, y0, 7.5, b.tag, "", ` style="fill:${b.color}"`)}</g>`;
    b.bars.forEach((w, k) => { s += `<rect class="reveal" style="--d:${i};fill:${b.color}" opacity=".55" x="8" y="${y0 + 5 + k * 7}" width="${w}" height="3" rx="1.5"/>`; });
  });
  (sh.chips || []).forEach((ch, i) => { s += `<rect class="reveal chip" style="--d:${3 + i * 0.3}" x="${ch[0]}" y="${ch[1]}" width="${ch[2]}" height="5" rx="2"/>`; });
  s += `<g class="reveal" style="--d:4">${T(92, 14, 7, sh.meta, "hot", ' text-anchor="end"')}</g>`;
  return s + "</g></g>";
}

function modelObj(x, y, c) {
  const zs = [0, 36, 72], N = [22, 49, 76, 103], pairs = [[0, 1], [1, 1], [2, 2], [3, 2], [1, 3], [2, 0]];
  let s = `<g class="obj" data-o="api">`, th = "";
  zs.forEach((z, k) => {
    s += box(x, y, z, 130, 130, 16, 4);
    s += `<g transform="${TOP(x, y, z + 16)}">${N.map((n) => `<circle class="detail glow" cx="${n}" cy="65" r="3.6"/>`).join("")}</g>`;
    if (k < 2) pairs.forEach((p, i) => {
      const a = P(x + N[p[0]], y + 65, z + 16), b = P(x + N[p[1]], y + 65, zs[k + 1] + 16);
      th += `<line class="th" style="--d:${k * 3 + i * 0.4}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    });
  });
  s += th + `<g transform="${FRONT(x, y + 130, 16)}">${T(10, 12, 9, c.model.caption, "hot")}</g>`;
  return s + "</g>";
}

function gateObj(gx, label, i) {
  const yA = 300, yB = 352, p = P(gx + 4, 331, 92);
  let s = `<g class="gate" data-g="${i}">`;
  s += box(gx, yA, 0, 8, 8, 54, 2) + box(gx, yB, 0, 8, 8, 54, 2) + box(gx, yA, 54, 8, 60, 10, 2);
  s += `<text x="${p[0]}" y="${p[1]}" text-anchor="middle" font-size="12" class="live">${label}</text>`;
  s += `<text class="chk" x="${p[0]}" y="${p[1] - 15}" text-anchor="middle" font-size="15">✓</text></g>`;
  return s;
}

function codeObj(x, y, c) {
  let s = `<g class="obj" data-o="code">` + box(x, y, 0, 120, 10, 100, 4) + `<g transform="${FRONT(x, y + 10, 100)}">`;
  s += T(8, 14, 8, c.code.file, "hot") + `<line class="detail" x1="8" x2="112" y1="19" y2="19"/>`;
  c.code.lines.forEach((t, i) => { const yy = 33 + i * 11.5; s += `<rect class="hlbar" data-hl="${i}" x="4" y="${yy - 8}" width="112" height="11" rx="2"/>` + T(10, yy, 8.2, t, i === 0 ? "hot" : ""); });
  return s + "</g></g>";
}

function sceneSvg(c) {
  let s = `<g transform="${TOP(0, 0, 0)}"><rect class="rail" x="${RAIL.x1}" y="${RAIL.y1}" width="${RAIL.x2 - RAIL.x1}" height="${RAIL.y2 - RAIL.y1}" rx="22"/></g>`;
  s += uiObj(0, 0, c) + dbObj(270, 0) + sheetObj(540, 0, c) + codeObj(270, 395, c);
  s += gateObj(GATE_X[2], c.gates[2], 2) + gateObj(GATE_X[1], c.gates[1], 1) + gateObj(GATE_X[0], c.gates[0], 0);
  s += modelObj(650, 255, c);
  [["ui", c.ui.label || "INTERFACE", 65, 65, 158], ["db", c.db.label, 335, 65, 150], ["pr", c.sheet.label, 605, 92, 152], ["api", c.model.label || "MODEL", 715, 320, 170], ["code", c.code.label, 330, 400, 124]].forEach((l) => {
    const p = P(l[2], l[3], l[4]);
    s += `<text class="lab" data-l="${l[0]}" x="${p[0]}" y="${p[1]}">${l[1]}</text>`;
  });
  s += `<g class="tile" opacity="0"><g transform="${TOP(-104, -18, 3)}"><rect class="face top" width="208" height="36" rx="4"/><text class="t1" x="9" y="15" font-size="9.5"></text><text class="t2" x="9" y="28" font-size="9.5"></text></g></g>`;
  return s;
}

const FMAP = { face: 1, top: 1, glass: 1, detail: 1, glow: 1, rail: 1, live: 1, hot: 1, lab: 1, th: 1, chip: 1, press: 1, go: 1, reveal: 1, gate: 1, chk: 1, hlbar: 1, tile: 1, obj: 1, readout: 1, more: 1, n: 1, tt: 1, fl: 1 };
const fc = (html) => html.replace(/class="([^"]*)"/g, (m, c) => 'class="' + c.split(" ").map((t) => (FMAP[t] ? "f-" + t : t)).join(" ") + '"');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const figs = [];
let current = null;
const FR = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let fi = 0;
setInterval(() => { fi = (fi + 1) % FR.length; document.querySelectorAll(".flow-spin").forEach((e) => { e.textContent = FR[fi] + " " + e.dataset.label; }); }, 90);

function mount(root, c, opts) {
  opts = opts || {};
  if (root._flow) root._flow.destroy();
  const steps = FIX.map((f, i) => Object.assign({}, f, c.steps[i]));
  root.classList.add("flow");
  root.classList.toggle("flow-compact", !!opts.compact);
  root.innerHTML = fc(`<div class="flow-fig"><div class="flow-row"><span>${c.fig}</span><span class="flow-cap">${c.caption}</span></div>` +
    `<svg viewBox="170 70 740 720" role="img" tabindex="0" aria-label="${c.alt}">${sceneSvg(c)}</svg>` +
    `<div class="flow-row"><span>button or enter plays · space steps · r resets</span><span class="readout"></span></div></div>` +
    `<ol class="flow-steps">${steps.slice(1).map((s, i) => `<li data-i="${i + 1}"><button type="button"><span class="n">${i + 1}</span><span class="tt">${s.title}</span><span class="fl">${s.flow}</span></button><div class="more"><div><p>${s.desc}</p><pre>${s.out.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></div></div></li>`).join("")}</ol>`);
  const q = (sel) => root.querySelector(sel), qa = (sel) => [...root.querySelectorAll(sel)];
  q(".flow-spin").dataset.label = c.ui.spinner;
  let cur = 0, runId = 0, anim = 0, playing = false, token = 0, lit = 0, visible = false, userPaused = false;
  const tile = q(".f-tile"), ui = q('[data-o="ui"]');

  const place = (x, y) => { const p = P(x, y, 0); tile.style.transform = `translate(${p[0] - OX}px,${p[1] - OY}px)`; };
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
      if (d <= sg || i === p.length - 1) { const k = Math.min(1, d / sg); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k]; }
      d -= sg;
    }
    return p[p.length - 1];
  };

  function show(n, animate) {
    cancelAnimationFrame(anim);
    cur = Math.max(0, Math.min(steps.length - 1, n));
    const s = steps[cur], mine = ++runId, going = !!(animate && s.ms && !reduce);
    STATIONS.forEach((k) => { q(`[data-o="${k}"]`).classList.toggle("on", k === s.at); q(`[data-l="${k}"]`).classList.toggle("on", k === s.at); });
    ui.setAttribute("data-ui", cur === 8 && going ? "b" : s.ui);
    q('[data-o="pr"]').classList.toggle("on", cur >= 4);
    q('[data-o="api"]').classList.toggle("on", cur === 5 || cur === 6);
    q('[data-o="code"]').classList.toggle("on", cur >= 7);
    if (cur < 7) setGates(0); else if (!going) setGates(3); else if (lit === 3) setGates(0);
    tile.setAttribute("opacity", cur === 0 ? 0 : 1);
    q(".t1").textContent = s.t[0]; q(".t2").textContent = s.t[1];
    const prev = cur > 0 ? steps[cur - 1].at : null;
    q(".f-readout").textContent = cur === 0 ? "ready" : `step ${cur} of 8 · ${s.flow}`;
    qa(".flow-steps li").forEach((li) => { const on = +li.dataset.i === cur; li.classList.toggle("on", on); li.querySelector("button").setAttribute("aria-expanded", on); });
    const ul = q(".flow-steps"), act = ul.querySelector("li.on");
    if (act && ul.scrollHeight > ul.clientHeight + 2) ul.scrollTo({ top: Math.max(0, act.offsetTop - 8), behavior: reduce ? "auto" : "smooth" });
    setCode();
    const p = s.path;
    if (!going) { const e = p[p.length - 1]; place(e[0], e[1]); return; }
    const L = len(p), t0 = performance.now();
    (function frame(now) {
      if (mine !== runId) return;
      const k = Math.min(1, (now - t0) / s.ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, pt = along(p, L * e);
      place(pt[0], pt[1]);
      if (cur === 7) { const n2 = GATE_X.filter((gx) => pt[0] <= gx).length; if (n2 !== lit) setGates(n2); }
      if (k < 1) anim = requestAnimationFrame(frame); else if (cur === 8) ui.setAttribute("data-ui", "c");
    })(performance.now());
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
    destroy() { stop(); cancelAnimationFrame(anim); const i = figs.indexOf(api); if (i >= 0) figs.splice(i, 1); io.unobserve(root); root._flow = null; root.innerHTML = ""; },
    visible: (v) => { visible = v; if (v && !userPaused && !playing) play(); if (!v && playing) stop(); },
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

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { const f = figs.find((x) => x.el === e.target); if (f) f.visible(e.isIntersecting && e.intersectionRatio >= 0.35); });
}, { threshold: [0, 0.35, 0.7] });
window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || !current || !current.el.matches(":hover, :focus-within")) return;
  if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
  current.key(e);
});

window.Flow = { mount, configs: window.FlowConfigs = window.FlowConfigs || {} };
})();
