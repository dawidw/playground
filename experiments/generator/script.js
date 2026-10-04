// Generator UI. The generator itself is gen.js (the same file ships with the poster-bg skill).
// The stage is #stage in index.html.
const stage = document.getElementById("stage");

const $ = id => document.getElementById(id);
const MOTIF_LABEL = { stripes: "Stripes", rings: "Rings and towers", mosaic: "Mosaic", blob: "Halo blob", diagonals: "Triangles", steps: "Steps" };
const PALETTE_LABEL = {
  baron: "Baron", zloto: "Gold", roger: "King Roger", marek: "Father Marek", brasilia: "Brasília", anima: "Anima", wesoft: "Wesoft",
  mazur: "Mazur", jesien: "Autumn", moda: "Moda", cyrk: "Circus",
  fangor: "Red and blue", fangor_blue: "Blue", fangor_green: "Green", fangor_sunset: "Sunset", fangor_mint: "Mint", fangor_mono: "Mono",
  soft_flame: "Flame", soft_tricolor: "Tricolor", soft_violet: "Violet", soft_orchard: "Orchard", soft_candy: "Candy", soft_navy: "Navy", soft_cobalt: "Cobalt",
  soft_ochre: "Ochre", soft_orchid: "Orchid", soft_redcore: "Red core", soft_lagoon: "Lagoon", soft_ember: "Ember", soft_mono: "Mono", soft_blush: "Blush", soft_lilac: "Lilac",
  dream_navy: "Navy and crimson", dream_sun: "Sun", dream_flag: "Flag", dream_azure: "Azure", dream_spectrum: "Spectrum", dream_candy: "Candy", dream_lagoon: "Lagoon", dream_rose: "Rose",
};
const SIZES = [["Portrait", 1200, 1600], ["Square", 1200, 1200], ["Landscape", 1440, 900], ["Card 16:10", 1280, 800], ["Banner", 1600, 500]];
const POSTER_MOTIFS = Object.keys(MOTIF_LABEL);
const VARIANT_MOTIF = { random: "fangor", ring: "ring", dream: "dream" };
const PREFIX = { random: "fangor", ring: "soft_", dream: "dream_" };
const clone = o => JSON.parse(JSON.stringify(o));
const pick = a => a[Math.floor(Math.random() * a.length)];
const uri = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);

// group: poster | fangor. variant (fangor only): random | ring | dream
const S = { group: "poster", variant: "random", motif: "stripes", palette: "baron", seed: 7, w: 1200, h: 1600, work: clone(PALETTES.baron), modified: false, size: null, cx: null, cy: null, grain: null };
let hist = [], lastSig = "", toastT;

const kind = () => (S.group === "poster" ? "poster" : S.variant);
const motifName = () => (S.group === "poster" ? S.motif : VARIANT_MOTIF[S.variant]);
const palettesOf = k => Object.keys(PALETTES).filter(n => (k === "poster" ? !/^(fangor|soft_|dream_)/.test(n) : n.startsWith(PREFIX[k])));
const opts = () => ({ size: S.size ?? undefined, x: S.cx ?? undefined, y: S.cy ?? undefined, grain: S.grain ?? undefined });
const svg = () => generate(motifName(), S.work, S.seed, S.w, S.h, opts());
const minInks = () => (S.variant === "ring" && S.group === "fangor" ? 3 : 2);

function fillSelects() {
  $("motif").innerHTML = POSTER_MOTIFS.map(m => `<option value="${m}">${MOTIF_LABEL[m]}</option>`).join("");
  $("palette").innerHTML = palettesOf(kind()).map(k => `<option value="${k}">${PALETTE_LABEL[k]}</option>`).join("");
  $("motif").value = S.motif;
  $("palette").value = S.palette;
  $("motif-field").hidden = S.group !== "poster";
  $("variant-field").hidden = S.group === "poster";
  $("size-field").hidden = S.group === "poster";
}
function fillSizes() {
  $("sizes").innerHTML = SIZES.map(([n, w, h]) => `<button type="button" data-w="${w}" data-h="${h}" aria-pressed="${S.w === w && S.h === h}">${n}</button>`).join("");
}
function fillSwatches() {
  const named = [["paper", "Paper"], ["dark", "Dark"], ["light", "Light"], ["accent", "Accent"]];
  const one = (key, idx, label) => {
    const v = idx == null ? S.work[key] : S.work.inks[idx];
    return `<label style="background:${v}" title="${label}"><input type="color" value="${v}" data-key="${key}" ${idx == null ? "" : `data-idx="${idx}"`} aria-label="${label}"></label>`;
  };
  const canRemove = S.work.inks.length > minInks();
  const ink = i => `<span class="inkwrap">${one("inks", i, "Ink " + (i + 1))}${canRemove ? `<button type="button" class="rm" data-rm="${i}" aria-label="Remove ink ${i + 1}">×</button>` : ""}</span>`;
  $("swatches").innerHTML = named.map(([k, l]) => one(k, null, l)).join("") + '<span class="break"></span>' + S.work.inks.map((_, i) => ink(i)).join("") + '<button type="button" class="add" id="addInk" aria-label="Add a color">+</button>';
  $("resetColors").hidden = !S.modified;
}
function toast(t) { $("toast").textContent = t; clearTimeout(toastT); toastT = setTimeout(() => ($("toast").textContent = ""), 2400); }

function render(push = true) {
  $("preview").src = uri(svg());
  $("preview").width = S.w;
  $("preview").height = S.h;
  $("preview").style.cursor = S.group === "poster" ? "" : "grab";
  $("recipe").textContent = `${motifName()} · ${S.palette} · ${S.seed} · ${S.w}×${S.h}`;
  $("csize").value = S.size ?? 1;
  $("csizeVal").textContent = S.size == null ? "Auto" : S.size.toFixed(2) + "×";
  $("cx").value = S.cx ?? .5; $("cxVal").textContent = S.cx == null ? "Auto" : Math.round(S.cx * 100) + "%";
  $("cy").value = S.cy ?? .5; $("cyVal").textContent = S.cy == null ? "Auto" : Math.round(S.cy * 100) + "%";
  $("grain-field").hidden = !(S.group === "poster" && S.motif === "mosaic");
  $("grain").value = S.grain ?? 11; $("grainVal").textContent = S.grain == null ? "Auto" : S.grain + " across";
  $("seed").value = S.seed; $("w").value = S.w; $("h").value = S.h;
  $("g-poster").setAttribute("aria-pressed", S.group === "poster");
  $("g-fangor").setAttribute("aria-pressed", S.group === "fangor");
  for (const v of Object.keys(VARIANT_MOTIF)) $("v-" + v).setAttribute("aria-pressed", S.variant === v);
  document.querySelectorAll("#sizes button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.w === S.w && +b.dataset.h === S.h));
  const sig = [motifName(), S.palette, S.seed, S.w, S.h, S.size, S.cx, S.cy, S.grain, JSON.stringify(S.work)].join("|");
  if (push && sig !== lastSig) {
    lastSig = sig;
    hist.unshift({ sig, state: clone(S), thumb: uri(generate(motifName(), S.work, S.seed, Math.round(S.w / 4), Math.round(S.h / 4), opts())) });
    hist = hist.slice(0, 10);
    drawHist();
  }
}
function drawHist() {
  $("hist").innerHTML = hist.map((h, i) => `<button type="button" data-i="${i}" ${h.sig === lastSig ? 'aria-current="true"' : ""} aria-label="Back to version ${i + 1}"><img alt="" src="${h.thumb}"></button>`).join("");
}

function resetPalette(name) {
  S.palette = name || palettesOf(kind())[0];
  S.work = clone(PALETTES[S.palette]);
  S.modified = false;
}
function setGroup(g) {
  if (S.group === g) return;
  S.group = g;
  resetPalette();
  fillSelects(); fillSwatches(); render();
}
function setVariant(v) {
  if (S.variant === v && S.group === "fangor") return;
  S.variant = v;
  resetPalette();
  fillSelects(); fillSwatches(); render();
}
function setPalette(k) { resetPalette(k); fillSwatches(); render(); }
function rollColors() {
  S.work = randomPalette(kind(), Math.random);
  S.modified = true;
  fillSwatches(); render();
}
function rollAll() {
  if (!$("lockMotif").checked && S.group === "poster") S.motif = pick(POSTER_MOTIFS);
  if (S.group === "fangor" && !$("lockMotif").checked) S.variant = pick(Object.keys(VARIANT_MOTIF));
  if ($("randColors").checked) { S.work = randomPalette(kind(), Math.random); S.modified = true; S.palette = palettesOf(kind())[0]; }
  else if (!$("lockPalette").checked || !palettesOf(kind()).includes(S.palette)) resetPalette(pick(palettesOf(kind())));
  S.seed = Math.floor(Math.random() * 100000);
  S.size = null; S.cx = null; S.cy = null; S.grain = null;
  fillSelects(); fillSwatches(); render();
}
function addInk() {
  const c = hsl(Math.random() * 360, 55 + Math.random() * 30, 40 + Math.random() * 20);
  S.work.inks.splice(S.variant === "ring" && S.group === "fangor" ? S.work.inks.length - 1 : S.work.inks.length, 0, c);
  S.modified = true;
  fillSwatches(); render();
}

function save(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fileName = ext => `${motifName()}-${S.palette}-${S.seed}.${ext}`;

$("g-poster").onclick = () => setGroup("poster");
$("g-fangor").onclick = () => setGroup("fangor");
for (const v of Object.keys(VARIANT_MOTIF)) $("v-" + v).onclick = () => setVariant(v);
$("motif").onchange = e => { S.motif = e.target.value; render(); };
$("palette").onchange = e => setPalette(e.target.value);
$("seed").oninput = e => { S.seed = Math.max(0, Math.min(999999, Math.floor(+e.target.value || 0))); render(); };
$("seedPrev").onclick = () => { S.seed = Math.max(0, S.seed - 1); render(); };
$("seedNext").onclick = () => { S.seed = Math.min(999999, S.seed + 1); render(); };
$("seedRand").onclick = () => { S.seed = Math.floor(Math.random() * 100000); render(); };
$("rollAll").onclick = rollAll;
$("rollColors").onclick = rollColors;
$("csize").oninput = e => { S.size = +e.target.value; render(); };
$("cx").oninput = e => { S.cx = +e.target.value; render(); };
$("cy").oninput = e => { S.cy = +e.target.value; render(); };
$("grain").oninput = e => { S.grain = +e.target.value; render(); };
$("grainAuto").onclick = () => { S.grain = null; render(); };
$("csizeAuto").onclick = () => { S.size = null; S.cx = null; S.cy = null; render(); };
$("sizes").onclick = e => { const b = e.target.closest("button"); if (!b) return; S.w = +b.dataset.w; S.h = +b.dataset.h; render(); };
const dim = (id, key) => ($(id).onchange = e => { S[key] = Math.max(200, Math.min(4000, Math.round(+e.target.value || S[key]))); render(); });
dim("w", "w"); dim("h", "h");

// drag the circle (or the wave pattern) on the preview
let drag = false;
const dragTo = e => {
  const b = $("preview").getBoundingClientRect();
  S.cx = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
  S.cy = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height));
  render(false);
};
$("preview").style.touchAction = "none";
$("preview").addEventListener("pointerdown", e => { if (S.group === "poster") return; drag = true; e.target.setPointerCapture(e.pointerId); e.preventDefault(); dragTo(e); });
$("preview").addEventListener("pointermove", e => { if (drag) dragTo(e); });
$("preview").addEventListener("pointerup", () => { if (drag) { drag = false; render(true); } });

$("swatches").oninput = e => {
  const t = e.target;
  if (t.type !== "color") return;
  if (t.dataset.idx != null) S.work.inks[+t.dataset.idx] = t.value; else S.work[t.dataset.key] = t.value;
  t.parentElement.style.background = t.value;
  S.modified = true;
  $("resetColors").hidden = false;
  render(false);
};
$("swatches").onchange = () => render(true);
$("swatches").onclick = e => {
  const rm = e.target.closest("[data-rm]");
  if (rm) { S.work.inks.splice(+rm.dataset.rm, 1); S.modified = true; fillSwatches(); render(); }
  else if (e.target.closest("#addInk")) addInk();
};
$("resetColors").onclick = () => setPalette(S.palette);
$("hist").onclick = e => {
  const b = e.target.closest("button");
  if (!b) return;
  const h = hist[+b.dataset.i];
  Object.assign(S, clone(h.state));
  fillSelects(); fillSwatches();
  lastSig = h.sig;
  render(false); drawHist();
};

$("dlSvg").onclick = () => { save(new Blob([svg()], { type: "image/svg+xml" }), fileName("svg")); toast("Saved " + fileName("svg")); };
$("dlPng").onclick = () => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = S.w; c.height = S.h;
    c.getContext("2d").drawImage(img, 0, 0, S.w, S.h);
    c.toBlob(b => { save(b, fileName("png")); toast("Saved " + fileName("png")); }, "image/png");
  };
  img.src = uri(svg());
};
$("copyCmd").onclick = () => {
  const cmd = `node scripts/gen.js --motif ${motifName()} --palette ${S.palette} --seed ${S.seed} --size ${S.w}x${S.h}` +
    (S.size != null ? ` --circle ${S.size.toFixed(2)}` : "") + (S.cx != null ? ` --x ${S.cx.toFixed(2)}` : "") + (S.cy != null ? ` --y ${S.cy.toFixed(2)}` : "") + (S.grain != null ? ` --grain ${S.grain}` : "") + " --out bg.svg";
  const note = S.modified ? " Custom colors are not part of the command." : "";
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cmd).then(() => toast("Command copied." + note), () => toast(cmd));
  else toast(cmd);
};
document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target.tagName;
  if (t === "INPUT" || t === "SELECT" || t === "TEXTAREA" || t === "BUTTON") return;
  if (e.key === " ") { e.preventDefault(); rollAll(); }
  else if (e.key === "c") rollColors();
  else if (e.key === "ArrowRight") { S.seed = Math.min(999999, S.seed + 1); render(); }
  else if (e.key === "ArrowLeft") { S.seed = Math.max(0, S.seed - 1); render(); }
});

fillSelects(); fillSizes(); fillSwatches(); render();
