// Shopping agent demo: scripted scenario (chat -> Shop setup -> order to an InPost locker).
// Everything is mock data. Edit COPY / the `play()` flow below to change the script.

const ASSET = (p) => `${window.COMMERCE_ASSET_BASE || ""}${p}`;
const $ = (s) => document.querySelector(s);
const thread = $("#thread"), flow = $("#shopflow"), screen = $("#screen"), faceid = $("#faceid"), push = $("#push");

let run = 0;
const CANCEL = Symbol("cancel");
const wait = (ms) => { const id = run; return new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(CANCEL)), ms)); };
const el = (html, cls) => { const d = document.createElement("div"); d.className = cls || ""; d.innerHTML = html; return d; };
const add = (node) => { thread.appendChild(node); requestAnimationFrame(() => (thread.scrollTop = thread.scrollHeight)); return node; };

const ICON = {
  bag: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l2 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7l2-4Z"/><path d="M5 7h14M9.500 12.500c0 1.400 1.100 2.500 2.500 2.500s2.500-1.100 2.500-2.500"/></svg>',
  pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.100 7-11.500a7 7 0 1 0-14 0C5 14.900 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/></svg>',
  wallet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z"/><path d="M3 10h18M16 14.5h2"/></svg>',
  truck: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7V10Z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m2 2 10 10M12 2 2 12"/></svg>',
  ok: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
};
const TRAIL_CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

/* Transitions.dev — Matrix dot loader: only for process-step cards */
const MATRIX_CYCLE = 1200;
const MATRIX_RING = [1, 2, 7, 11, 14, 13, 8, 4];
const MATRIX_INNER = [5, 6, 9, 10];
const MATRIX_TWINKLE = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4];
const MATRIX_VARIANTS = ["scan", "twinkle", "orbit", "pulse"];

function matrixDelay(variant, idx, cycle = MATRIX_CYCLE) {
  if (variant === "scan") return Math.round((idx % 4) * (cycle / 10));
  if (variant === "twinkle") return Math.round(MATRIX_TWINKLE[idx] * (cycle / 16));
  if (variant === "orbit") {
    const k = MATRIX_RING.indexOf(idx);
    return k === -1 ? null : Math.round(k * (cycle / 8));
  }
  if (variant === "pulse") return Math.round((MATRIX_INNER.includes(idx) ? 0 : 1) * (cycle * 0.16));
  return 0;
}

function matrixHTML(variant = "scan") {
  const dots = Array.from({ length: 16 }, (_, idx) => {
    const d = matrixDelay(variant, idx);
    if (d === null) return '<i style="animation:none"></i>';
    return `<i style="--d:${d}"></i>`;
  }).join("");
  return `<span class="t-matrix" data-variant="${variant}" aria-hidden="true">${dots}</span>`;
}

function freezeMatrix(root) {
  root?.querySelectorAll?.(".t-matrix").forEach((m) => m.classList.add("is-frozen"));
}

function trailStep(kind, label, iconHtml) {
  const ico = kind === "think" ? matrixHTML("twinkle") : kind === "done" ? TRAIL_CHECK : iconHtml;
  return el(`
    <span class="tr-ico" aria-hidden="true"><span class="tr-ring"></span><span class="tr-glyph">${ico}</span></span>
    <span class="tr-txt" data-text="${label}">${label}</span>
  `, `tr-step ${kind === "done" ? "done" : kind === "think" ? "think" : "run"}`);
}

async function memSave(iconHtml, value) {
  const trail = add(el("", "trail"));
  trail.appendChild(trailStep("think", "Thinking..."));
  await wait(900);
  const save = trailStep("run", `memory · ${value}`, iconHtml);
  trail.appendChild(save);
  await wait(1600);
  freezeMatrix(save);
  save.className = "tr-step done";
  save.querySelector(".tr-glyph").innerHTML = TRAIL_CHECK;
  const txt = save.querySelector(".tr-txt");
  txt.textContent = `memory · ${value}`;
  txt.dataset.text = `memory · ${value}`;
  await wait(700);
  trail.classList.add("collapse");
  await wait(280);
  trail.innerHTML = `<span class="tr-sum"><i class="tr-mark" aria-hidden="true"></i>memory · ${value}</span>`;
  trail.classList.remove("collapse");
  trail.classList.add("sum");
}

const STORE = "Zoo Corner"; // merchant found through Shop
// Local photos in ./food (Unsplash License). age: puppy|adult|senior, kg: [min,max]
const F = (n) => ASSET(`food/${String(n).padStart(2, "0")}.jpg`);
// ppk = price per kg (zł), sizes = bag sizes in kg
const PRODUCTS = [
  { name: "Nordic Paws Puppy", img: F(1), flavour: "Chicken", ppk: 15.9, sizes: [3, 10, 15], tag: "Puppies", age: "puppy", kg: [8, 40],
    about: "Complete food for medium and large breed puppies. Supports bone and muscle growth with extra protein and calcium.",
    protein: "28%", fat: "16%", fibre: "2.5%", forWhom: "Puppies 2–12 mo., 8–40 kg",
    ingredients: "Fresh chicken 28%, dried chicken 18%, rice, chicken fat, beet pulp, salmon oil, glucosamine." },
  { name: "Nordic Paws Puppy Large", img: F(2), flavour: "Salmon", ppk: 16.6, sizes: [3, 12, 15], tag: "Large breeds", age: "puppy", kg: [20, 90],
    about: "For large-breed puppies: controlled growth with balanced calcium to phosphorus and omega-3 from salmon.",
    protein: "27%", fat: "14%", fibre: "2.8%", forWhom: "Large-breed puppies, 20–90 kg",
    ingredients: "Fresh salmon 30%, dried salmon 16%, potato, salmon fat, peas, flaxseed, chondroitin." },
  { name: "Nordic Paws Puppy Mini", img: F(3), flavour: "Chicken", ppk: 23, sizes: [1, 3], tag: "Small breeds", age: "puppy", kg: [1, 10],
    about: "Small kibble for toy-breed puppies. High energy in a small portion for a fast metabolism.",
    protein: "30%", fat: "18%", fibre: "2%", forWhom: "Small-breed puppies, up to 10 kg",
    ingredients: "Chicken 42%, rice, poultry fat, protein hydrolysate, apple, vitamins A/D3/E." },
  { name: "Nordic Paws Mini", img: F(4), flavour: "Duck & rice", ppk: 26.3, sizes: [1.5, 3, 7], tag: "Small breeds", age: "adult", kg: [1, 10],
    about: "Daily food for adult small breeds. Duck as a gentle protein source with easy-to-digest rice.",
    protein: "26%", fat: "15%", fibre: "2.4%", forWhom: "Adult small breeds, 1–10 kg",
    ingredients: "Duck 34%, rice 22%, duck fat, beet pulp, salmon oil, FOS prebiotics." },
  { name: "Wild Trail Small Grain Free", img: F(5), flavour: "Turkey", ppk: 38, sizes: [1.5, 5], tag: "Grain free", age: "adult", kg: [1, 12],
    about: "Grain-free turkey formula. Good for sensitive digestion and food allergies.",
    protein: "32%", fat: "17%", fibre: "3%", forWhom: "Adult dogs 1–12 kg, grain-free diet",
    ingredients: "Turkey 40%, sweet potato, peas, turkey fat, apple, cranberry, herbs." },
  { name: "Nordic Paws Medium", img: F(6), flavour: "Chicken & rice", ppk: 16.1, sizes: [3, 8, 12], tag: "Medium breeds", age: "adult", kg: [8, 25],
    about: "Balanced food for active medium breeds. Keeps condition without excess calories.",
    protein: "25%", fat: "13%", fibre: "3%", forWhom: "Adult dogs 8–25 kg",
    ingredients: "Chicken 36%, rice, barley, poultry fat, carrot, beet pulp, taurine." },
  { name: "Nordic Paws Adult Large", img: F(7), flavour: "Salmon & rice", ppk: 15.75, sizes: [3, 12, 15], tag: "Recently purchased", age: "adult", kg: [20, 90],
    about: "Luna’s previous food. Salmon supports skin and coat; larger kibble slows eating.",
    protein: "24%", fat: "12%", fibre: "3.2%", forWhom: "Adult large breeds, 20–90 kg",
    ingredients: "Salmon 33%, rice 20%, salmon fat, beet pulp, glucosamine, chondroitin, MSM." },
  { name: "Nordic Paws Active", img: F(8), flavour: "Chicken & rice", ppk: 14.1, sizes: [3, 12, 15], tag: "Value", age: "adult", kg: [10, 90],
    about: "More energy per PLN. Good for daily walks and moderate activity.",
    protein: "26%", fat: "15%", fibre: "2.8%", forWhom: "Active adult dogs, from 10 kg",
    ingredients: "Chicken 30%, rice, corn, poultry fat, vegetable oil, vitamins." },
  { name: "Wild Trail Grain Free", img: F(9), flavour: "Lamb", ppk: 22.9, sizes: [2, 10, 12], tag: "Grain free", age: "adult", kg: [10, 90],
    about: "Single-protein lamb without grains. For dogs with allergies or elimination diets.",
    protein: "29%", fat: "16%", fibre: "3%", forWhom: "Adult dogs from 10 kg, grain free",
    ingredients: "Lamb 38%, sweet potato, peas, lamb fat, apple, rosemary." },
  { name: "Nordic Paws Senior", img: F(10), flavour: "Turkey & rice", ppk: 14.9, sizes: [3, 12], tag: "Joint care", age: "senior", kg: [10, 90],
    about: "For older dogs: fewer calories, more joint support (glucosamine + chondroitin).",
    protein: "22%", fat: "10%", fibre: "4%", forWhom: "Dogs 7+, from 10 kg",
    ingredients: "Turkey 28%, rice, barley, glucosamine, chondroitin, salmon oil, L-carnitine." },
  { name: "Nordic Paws Senior Light", img: F(11), flavour: "Chicken", ppk: 14.1, sizes: [3, 12, 15], tag: "Lower calories", age: "senior", kg: [1, 90],
    about: "Light formula for seniors prone to weight gain. High satiety at lower calories.",
    protein: "23%", fat: "8%", fibre: "5%", forWhom: "Older overweight dogs",
    ingredients: "Chicken 26%, rice, cellulose, beet pulp, L-carnitine, vitamin E." },
  { name: "Wild Trail Senior Mini", img: F(12), flavour: "Duck", ppk: 31.7, sizes: [1.5, 3], tag: "Small breeds", age: "senior", kg: [1, 10],
    about: "Small kibble for senior toy breeds. Duck plus joint and dental support.",
    protein: "25%", fat: "11%", fibre: "3.5%", forWhom: "Senior small breeds, up to 10 kg",
    ingredients: "Duck 32%, rice, peas, glucosamine, green tea extract." },
];
const GRAMS_PER_KG = { puppy: 35, adult: 15, senior: 13 }; // daily portion = body weight x this (g)
// 3 best matches: right life stage first, then weight inside the food's range, then closest range
const pick3 = (age, kg) => PRODUCTS
  .map((p) => ({ p, score: (p.age === age ? 100 : 0) - Math.max(0, p.kg[0] - kg, kg - p.kg[1]) + (p.tag === "Recently purchased" ? 5 : 0) }))
  .sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.p);
// Bag size x count that covers `weeks` with little surplus and few bags (1.5 kg penalty per bag).
function plan(p, dailyG, weeks) {
  const need = (dailyG * 7 * weeks) / 1000;
  let best = null;
  for (const sz of p.sizes) for (let n = 1; n <= 8; n++) {
    const total = sz * n, cost = total - need + 1.5 * n;
    if (total >= need && (!best || cost < best.cost)) best = { size: sz, qty: n, cost };
  }
  if (!best) { const sz = Math.max(...p.sizes); best = { size: sz, qty: Math.ceil(need / sz) }; }
  const { size, qty } = best;
  const covers = Math.floor((size * qty * 1000) / dailyG / 7);
  return {
    name: p.name, img: p.img, flavour: p.flavour, tag: p.tag, size, qty,
    price: Math.round(p.ppk * size * qty),
    note: `${qty > 1 ? qty + " × " : ""}${size} kg · lasts ~${covers} wk`,
    about: p.about, protein: p.protein, fat: p.fat, fibre: p.fibre, forWhom: p.forWhom, ingredients: p.ingredients,
  };
}
const zl0 = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " PLN";
function parseBudget(text) {
  const m = text.toLowerCase().replace(/(\d)\s(?=\d{3}\b)/g, "$1").match(/(\d+(?:[.,]\d+)?)\s*(tys|k)?/);
  if (!m) return null;
  const n = Math.round(parseFloat(m[1].replace(",", ".")) * (m[2] ? 1000 : 1));
  return n >= 20 && n <= 100000 ? n : null;
}
function parseWeeks(text) {
  const t = text.toLowerCase(), m = t.match(/(\d+)/);
  if (!m) return null;
  const n = /mies|msc/.test(t) ? Math.round(+m[1] * 4.3) : +m[1];
  return n >= 1 && n <= 52 ? n : null;
}
const AGES = [["puppy", "Puppy", "under 1 year"], ["adult", "Adult", "1–7 years"], ["senior", "Senior", "7+ years"]];
// x / y: position on the inline mock map (%). Home is at 46 / 56.
const LOCKERS = [
  { id: "WAW214M", addr: "12 Puławska St", dist: "120 m", x: 56, y: 40 },
  { id: "WAW087N", addr: "3 Madalińskiego St", dist: "340 m", x: 24, y: 70 },
  { id: "WAW152P", addr: "8 Rakowiecka St", dist: "410 m", x: 78, y: 24 },
];
const DELIVERY = 12.99, DELIVERY_COURIER = 18.99; // paczkomat vs kurier
const zl = (n) => n.toFixed(2).replace(".", ",") + " PLN";

// ---------- chat primitives ----------
function thinkHTML(label) {
  return `${matrixHTML("twinkle")}<span class="txt" data-text="${label}">${label}</span>`;
}

async function say(text, ms = 900, label) {
  // label -> matrix loader + shimmer; no label -> typing dots
  const t = add(label ? el(thinkHTML(label), "think") : el("<i></i><i></i><i></i>", "typing"));
  await wait(ms);
  t.remove();
  add(el(text, "msg in"));
  await wait(250);
}

// Inline step loader (same timing/animation as liveFetchCard live-steps).
async function thinkSteps(steps) {
  const node = add(el(`<ul class="live-steps think-steps">${steps.map((s, i) => {
    const v = MATRIX_VARIANTS[i % MATRIX_VARIANTS.length];
    return `<li class="live-step" data-i="${i}">${matrixHTML(v)}<span class="live-txt" data-text="${s}">${s}</span></li>`;
  }).join("")}</ul>`, "think-block"));
  const items = [...node.querySelectorAll(".live-step")];
  for (let i = 0; i < items.length; i++) {
    const step = items[i];
    step.classList.add("now");
    await wait(i === items.length - 1 ? 1400 : 1100);
    freezeMatrix(step);
    step.classList.remove("now");
    step.classList.add("done");
  }
  node.remove();
}

const PREP_SHOP = [
  "Preparing Shop integration",
  "Loading Shop Pay permissions",
  "Opening connection flow",
];
const PREP_INPOST = [
  "Preparing InPost Pay integration",
  "Checking InPost Pay stores",
  "Opening connection flow",
];
function you(text) { add(el(text, "msg out")); }
// What the scenario is waiting for right now. Whatever the user types goes to the main path of that step;
// text typed while Agent is busy is queued and used at the next step.
let waiter = null, queued = null;
const unregister = () => { waiter = null; };
function register(take, keys) {
  waiter = { take, keys };
  if (queued !== null) { const t = queued; queued = null; setTimeout(() => waiter && waiter.take(t), 350); }
}
function submitText() {
  const v = input.value.trim();
  if (!v) return;
  input.value = ""; syncSend();
  if (waiter) waiter.take(v); else queued = v;
}
// Options panel: slides up above the message box across the full width of the app.
const optpanel = $("#optpanel"), opIn = optpanel.querySelector(".op-in");
// Keep the thread pinned to the bottom while the panel resizes it (only when the user was already at the bottom).
let stick = true;
thread.addEventListener("scroll", () => { stick = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140; });
new ResizeObserver(() => { if (stick) { thread.style.scrollBehavior = "auto"; thread.scrollTop = thread.scrollHeight; thread.style.scrollBehavior = ""; } }).observe(thread);
const ARROW = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h8M7.500 3.500 11 7l-3.500 3.500"/></svg>';
const dock = $("#dock");
function showOptions(labels, onPick, hint = true) {
  opIn.innerHTML = `<div class="op-card"><div class="op-head">Choose a reply</div>
    ${labels.map((l, i) => `<button class="opt-row" data-i="${i}"><i class="n">${i + 1}</i><span>${l}</span></button>`).join("")}
    ${hint ? '<div class="op-hint">Or type your own answer below</div>' : ""}</div>`;
  opIn.querySelectorAll(".opt-row").forEach((b) => (b.onclick = () => onPick(+b.dataset.i)));
  dock.classList.add("expanded"); // 28px radius while tall — keep until collapse ends
  optpanel.classList.add("on");
}
function hideOptions() {
  if (!optpanel.classList.contains("on")) {
    dock.classList.remove("expanded");
    return;
  }
  optpanel.classList.remove("on");
  // radius stays 28 until height finishes collapsing, else Safari U-clips the bottom
  const done = (e) => {
    if (e && e.target !== optpanel) return;
    if (e && e.propertyName && e.propertyName !== "grid-template-rows") return;
    optpanel.removeEventListener("transitionend", done);
    if (!optpanel.classList.contains("on")) dock.classList.remove("expanded");
  };
  optpanel.addEventListener("transitionend", done);
  setTimeout(done, 520); // fallback if transitionend doesn't fire
}
document.addEventListener("keydown", (e) => {   // 1-9 picks an option when the message box is not focused
  if (waiter && waiter.keys && document.activeElement !== input && /^[1-9]$/.test(e.key)) waiter.keys(+e.key - 1);
});
function choose(labels) {
  return new Promise((resolve) => {
    const pick = (i, text) => { unregister(); hideOptions(); you(text); resolve(i); };
    showOptions(labels, (i) => pick(i, labels[i]));
    register((text) => pick(0, text), (i) => i < labels.length && pick(i, labels[i]));   // typed text = the first (main) option
  });
}
async function card(html, ms = 700) { await wait(ms); return add(el(html, "card")); }
// ---------- typing in the message box ----------
const input = $("#msgInput"), sendBtn = $("#sendBtn");
const syncSend = () => sendBtn.classList.toggle("send", input.value.trim() !== "");
function resetInput() { input.value = ""; input.placeholder = "Message"; syncSend(); }
input.oninput = syncSend;
input.onkeydown = (e) => { if (e.key === "Enter") submitText(); };
sendBtn.onclick = submitText;
// Shows suggestion chips + a hint in the input; resolves with the typed (or tapped) text.
function typed(placeholder, suggestions = []) {
  return new Promise((resolve) => {
    const done = (text) => { unregister(); hideOptions(); input.placeholder = "Message"; you(text); resolve(text); };
    if (suggestions.length) showOptions(suggestions, (i) => done(suggestions[i]));
    input.placeholder = placeholder;
    register(done, (i) => i < suggestions.length && done(suggestions[i]));
  });
}
// "4 lata, 28 kg", "Luna is 8 years old and weighs 32 kg", "6 months 9kg" -> { age: puppy|adult|senior, kg }
function parseDog(text) {
  const t = text.toLowerCase().replace(/(\d),(\d)/g, "$1.$2");
  const num = (m) => (m ? parseFloat(m[1]) : null);
  const kgM = t.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/);
  const monM = t.match(/(\d+(?:\.\d+)?)\s*(?:mies|msc|m\b)/);
  const yrM = t.match(/(\d+(?:\.\d+)?)\s*(?:lat|lata|latka|rok|roku|l\b)/);
  let kg = num(kgM), months = monM ? num(monM) : yrM ? num(yrM) * 12 : null;
  if (kg === null || months === null) {            // bare numbers: first = age (years), second = kg
    const n = (t.match(/\d+(?:\.\d+)?/g) || []).map(parseFloat);
    if (n.length >= 2) { if (months === null) months = n[0] * 12; if (kg === null) kg = n[n.length - 1]; }
  }
  if (kg === null || months === null || kg < 1 || kg > 90 || months < 1 || months > 300) return null;
  return { age: months < 12 ? "puppy" : months < 84 ? "adult" : "senior", kg: Math.round(kg) };
}

// Product detail sheet: FLIP from the tapped card to fullscreen, then pick or dismiss.
const psheet = $("#psheet"), psPanel = psheet.querySelector(".ps-panel");
let psOrigin = null, psDragY = 0;
function fillSheet(p) {
  psheet.dataset.mode = "product";
  const hero = psheet.querySelector(".ps-hero");
  hero.classList.remove("plain");
  hero.querySelector("img").src = p.img;
  hero.querySelector(".ps-emoji").textContent = "";
  psheet.querySelector(".ps-meta").innerHTML = `<span>${p.tag}</span>${p.note ? `<span>${p.note}</span>` : ""}`;
  psheet.querySelector(".ps-title").textContent = p.name;
  psheet.querySelector(".ps-flavour").textContent = p.flavour;
  psheet.querySelector(".ps-about").textContent = p.about || "";
  psheet.querySelector(".ps-facts").innerHTML = [
    ["Protein", p.protein], ["Fat", p.fat], ["Fibre", p.fibre], ["For", p.forWhom],
  ].filter(([, v]) => v).map(([k, v]) => `<li><em>${k}</em><b>${v}</b></li>`).join("");
  psheet.querySelector(".ps-track").innerHTML = "";
  psheet.querySelector(".ps-ings").innerHTML = p.ingredients ? `<em>Ingredients</em>${p.ingredients}` : "";
  psheet.querySelector(".ps-price").textContent = zl(p.price);
  psheet.querySelector(".ps-pick").textContent = "Choose";
}
function fillOrderSheet(o) {
  psheet.dataset.mode = "order";
  const hero = psheet.querySelector(".ps-hero");
  if (o.img) {
    hero.classList.remove("plain");
    hero.querySelector("img").src = o.img;
    hero.querySelector(".ps-emoji").textContent = "";
  } else {
    hero.classList.add("plain");
    hero.querySelector("img").removeAttribute("src");
    hero.querySelector(".ps-emoji").textContent = o.emoji || "📦";
  }
  psheet.querySelector(".ps-meta").innerHTML = `<span>${o.store}</span><span>${o.who}</span>`;
  psheet.querySelector(".ps-title").textContent = o.name;
  psheet.querySelector(".ps-flavour").textContent = o.sub;
  psheet.querySelector(".ps-about").textContent = o.note || "";
  psheet.querySelector(".ps-facts").innerHTML = [
    ["Delivery", o.dest], ["Status", o.status], ["Ordered", o.when],
  ].map(([k, v]) => `<li><em>${k}</em><b>${v}</b></li>`).join("");
  psheet.querySelector(".ps-track").innerHTML = trackHtml(o.steps, o.done);
  psheet.querySelector(".ps-ings").innerHTML = "";
  psheet.querySelector(".ps-price").textContent = o.price != null ? zl(o.price) : "";
  psheet.querySelector(".ps-pick").textContent = "Close";
}
function openOrderSheet(origin, o) {
  fillOrderSheet(o);
  const r = origin.getBoundingClientRect(), s = screen.getBoundingClientRect();
  psOrigin = origin; origin.style.opacity = "0";
  const panel = psPanel;
  panel.style.transition = "none";
  panel.style.left = `${r.left - s.left}px`; panel.style.top = `${r.top - s.top}px`;
  panel.style.width = `${r.width}px`; panel.style.height = `${r.height}px`; panel.style.borderRadius = "16px";
  psheet.classList.add("on"); psheet.setAttribute("aria-hidden", "false");
  psheet.querySelector(".ps-pick").onclick = () => closeSheet(false);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.transition = "left .55s var(--spring), top .55s var(--spring), width .55s var(--spring), height .55s var(--spring), border-radius .55s var(--spring)";
    panel.style.left = "0"; panel.style.top = "0"; panel.style.width = "100%"; panel.style.height = "100%"; panel.style.borderRadius = "0";
    psheet.classList.add("expanded");
  }));
}
function closeSheet(restore) {
  if (!psheet.classList.contains("on")) return;
  const panel = psPanel;
  if (psOrigin && restore !== false) {
    const r = psOrigin.getBoundingClientRect(), s = screen.getBoundingClientRect();
    panel.style.transition = "left .45s var(--spring), top .45s var(--spring), width .45s var(--spring), height .45s var(--spring), border-radius .45s var(--spring)";
    panel.style.left = `${r.left - s.left}px`; panel.style.top = `${r.top - s.top}px`;
    panel.style.width = `${r.width}px`; panel.style.height = `${r.height}px`; panel.style.borderRadius = "24px";
    psheet.classList.remove("expanded");
    setTimeout(() => {
      psheet.classList.remove("on"); psheet.setAttribute("aria-hidden", "true");
      if (psOrigin) psOrigin.style.opacity = "";
      panel.style.cssText = ""; psOrigin = null;
    }, 420);
  } else {
    psheet.classList.remove("on", "expanded"); psheet.setAttribute("aria-hidden", "true");
    if (psOrigin) psOrigin.style.opacity = "";
    panel.style.cssText = ""; psOrigin = null;
  }
}
function openSheet(card, p, onPick) {
  fillSheet(p);
  const r = card.getBoundingClientRect(), s = screen.getBoundingClientRect();
  psOrigin = card; card.style.opacity = "0";
  const panel = psPanel;
  panel.style.transition = "none";
  panel.style.left = `${r.left - s.left}px`; panel.style.top = `${r.top - s.top}px`;
  panel.style.width = `${r.width}px`; panel.style.height = `${r.height}px`; panel.style.borderRadius = "24px";
  psheet.classList.add("on"); psheet.setAttribute("aria-hidden", "false");
  psheet.querySelector(".ps-pick").onclick = () => { closeSheet(false); onPick(); };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.style.transition = "left .55s var(--spring), top .55s var(--spring), width .55s var(--spring), height .55s var(--spring), border-radius .55s var(--spring)";
    panel.style.left = "0"; panel.style.top = "0"; panel.style.width = "100%"; panel.style.height = "100%"; panel.style.borderRadius = "0";
    psheet.classList.add("expanded");
  }));
}
psheet.addEventListener("click", (e) => { if (e.target.closest("[data-ps-close]")) closeSheet(); });
// swipe down on the hero to dismiss
psheet.querySelector(".ps-hero").addEventListener("pointerdown", (e) => {
  if (!psheet.classList.contains("expanded")) return;
  psDragY = e.clientY;
  const move = (ev) => {
    const dy = Math.max(0, ev.clientY - psDragY);
    psPanel.style.transition = "none";
    psPanel.style.transform = `translateY(${dy}px)`;
    psheet.style.setProperty("--scrim", String(Math.max(0.2, 1 - dy / 320)));
  };
  const up = (ev) => {
    screen.removeEventListener("pointermove", move); screen.removeEventListener("pointerup", up);
    const dy = Math.max(0, ev.clientY - psDragY);
    if (dy > 110) { psPanel.style.transform = ""; psheet.style.removeProperty("--scrim"); closeSheet(); }
    else { psPanel.style.transition = "transform .35s var(--spring)"; psPanel.style.transform = ""; psheet.style.removeProperty("--scrim"); }
  };
  screen.addEventListener("pointermove", move); screen.addEventListener("pointerup", up);
});

// Food carousel: swipe / drag, tap card → details, "Choose" → pick.
function pickProduct(list) {
  return new Promise((resolve) => {
    const wrap = el(list.map((p, i) => `<article class="pcard" data-i="${i}">
      <div class="pimg"><img src="${p.img}" alt="" draggable="false"><span class="ptag">${p.tag}</span>${i === 0 ? '<span class="best">Best match</span>' : ""}<span class="chk">${ICON.ok.replace('width="26" height="26"', 'width="16" height="16"')}</span></div>
      <div class="pbody"><div class="pn">${p.name}</div><div class="pf">${p.flavour}</div><div class="pnote">${p.note}</div><div class="pprice">${zl(p.price)}</div>
      <button class="cta">Choose</button></div></article>`).join(""), "carousel");
    let down = false, sx = 0, sl = 0, moved = false;
    wrap.addEventListener("scroll", () => { moved = true; }, { passive: true });
    wrap.onpointerdown = (e) => {
      moved = false;
      if (e.pointerType === "mouse") { down = true; sx = e.clientX; sl = wrap.scrollLeft; wrap.style.scrollSnapType = "none"; }
    };
    wrap.onpointermove = (e) => { if (down) { wrap.scrollLeft = sl - (e.clientX - sx); if (Math.abs(e.clientX - sx) > 6) moved = true; } };
    wrap.onpointerup = wrap.onpointerleave = () => { down = false; wrap.style.scrollSnapType = ""; };
    wrap.querySelectorAll(".cta").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); pickIt(+b.closest(".pcard").dataset.i); }));
    wrap.querySelectorAll(".pcard").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".cta") || moved) { moved = false; return; }
        const i = +card.dataset.i;
        openSheet(card, list[i], () => pickIt(i));
      });
    });
    const pickIt = (i, text) => {
      unregister(); closeSheet(false);
      const p = list[i];
      wrap.querySelectorAll(".cta").forEach((x) => (x.disabled = true));
      wrap.querySelectorAll(".pcard").forEach((c) => c.style.opacity = "");
      wrap.querySelectorAll(".pcard")[i].classList.add("picked");
      you(text || p.name); resolve(p);
    };
    wait(700).then(() => { add(wrap); register((text) => pickIt(0, text)); }).catch(() => {});
  });
}

// Locker picker: mini map with the 3 nearest lockers, list underneath. Pin tap highlights, a row picks.
function pickOnMap() {
  return new Promise((resolve) => {
    let hi = 0;
    const node = el(`<div class="mapcard">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-5 84 C 25 66, 55 96, 105 64" class="river"/>
          <rect x="4" y="30" width="16" height="14" rx="2" class="park"/>
          <path d="M0 46 H100 M0 18 H100 M0 82 H100 M14 0 V100 M40 0 V100 M64 0 V100 M88 0 V100" class="road"/>
          <path d="M0 62 L100 48 M30 0 L74 100" class="road main"/>
        </svg>
        <span class="st" style="left:58%;top:20%;transform:rotate(-8deg)">Rakowiecka</span><span class="st" style="left:6%;top:50%;transform:rotate(-7deg)">Madalińskiego</span><span class="st" style="left:62%;top:78%">Puławska</span>
        <span class="homepin" style="left:46%;top:56%"><i></i>Home</span>
        ${LOCKERS.map((l, i) => `<button class="mpin" data-i="${i}" style="left:${l.x}%;top:${l.y}%" aria-label="${l.id}"><svg class="shape" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 38C15 38 2 26 2 14.500a13 13 0 0 1 26 0C28 26 15 38 15 38Z"/></svg><i>${ICON.bag}</i><em>${l.id}</em></button>`).join("")}
      </div>
      ${LOCKERS.map((l, i) => `<button class="row lk" data-i="${i}"><span class="pin">${ICON.pin}</span><span><div class="v">${l.id}${i === 0 ? ' <small>nearest</small>' : ""}</div><div class="k">${l.addr}</div></span><span class="k ml-auto">${l.dist}</span></button>`).join("")}`, "card map");
    const mark = () => {
      node.querySelectorAll(".mpin").forEach((p) => p.classList.toggle("on", +p.dataset.i === hi));
      node.querySelectorAll(".lk").forEach((r) => r.classList.toggle("hi", +r.dataset.i === hi));
    };
    node.querySelectorAll(".mpin").forEach((p) => (p.onclick = () => { hi = +p.dataset.i; mark(); }));
    node.querySelectorAll(".lk").forEach((r) => {
      r.onmouseenter = () => { hi = +r.dataset.i; mark(); };
      r.onclick = () => pickL(LOCKERS[+r.dataset.i]);
    });
    const pickL = (l, text) => {
      unregister();
      node.querySelectorAll("button").forEach((b) => (b.disabled = true));
      you(text || `Locker ${l.id}`); resolve(l);
    };
    mark();
    wait(700).then(() => { add(node); register((text) => pickL(LOCKERS[0], text)); }).catch(() => {});
  });
}

// ---------- Shop connect flow (interstitial -> permissions -> connected) ----------
const PERMS = [
  ["Cart", "I will fill contact details, phone, and address"],
  ["Addresses", "I will read saved delivery addresses"],
  ["Wallet", "I will use a saved card at checkout"],
];
const SHOP = {
  key: "shop", name: "Shop", pay: "Shop Pay", acct: "your Shop account",
  logo: '<span class="shoplogo">shop</span>', cta: "Connect Shop",
  lead: "To order on your behalf, I need access to your Shop account.",
  bullets: [
    ["Cart", "I will prepare it with your details"],
    ["Addresses", "I will read saved locations"],
    ["Payment", "I will pay with a card from Shop Wallet"],
  ],
};
const INPOST = {
  key: "inpost", name: "InPost Pay", pay: "InPost Pay", acct: "your InPost Pay account",
  logo: `<span class="shoplogo inpost"><img src="${ASSET("inpost-icon.png")}" alt="InPost Pay"></span>`,
  brand: `<img class="ipword" src="${ASSET("inpost-logo.png")}" alt="InPost">`, cta: "Connect InPost Pay",
  lead: "With InPost Pay I can find the same food in more stores and get a better price.",
  bullets: [
    ["Stores", "I will search more places at once"],
    ["Price", "I will compare offers and pick the cheaper one"],
    ["Cart", "You only confirm in InPost Pay"],
  ],
};
const LINK = '<span class="sf-link" aria-hidden="true"><i></i><i></i><i></i></span>';
const logos = (p) => `<div class="sf-logos">${p.logo}${LINK}<span class="applogo" aria-label="Shopping agent"><i></i></span></div>`;
function shopCard(p = SHOP) {
  return new Promise((resolve) => {
    const node = el(`${logos(p)}
      <p class="cn-eye">Integration</p>
      <h4>${p.cta}</h4>
      <p class="lead">${p.lead}</p>
      <ul class="cn-list">${p.bullets.map(([k, d]) => `<li><b>${k}</b><em>${d}</em></li>`).join("")}</ul>
      <div class="cn-actions"><button class="go">${p.cta}</button><button class="no">Not now</button></div>`, "card connect");
    node.dataset.p = p.key;
    const finish = (ok, text) => { unregister(); node.querySelectorAll("button").forEach((b) => (b.disabled = true)); you(text || (ok ? p.cta : "Not now")); resolve(ok); };
    node.querySelector(".go").onclick = () => finish(true);
    node.querySelector(".no").onclick = () => finish(false);
    wait(400).then(() => { add(node); register((text) => finish(true, text)); }).catch(() => {});
  });
}

const BRAND = '<span class="sf-brand" aria-label="Shopping agent"><i></i></span>';
const interstitial = (title, sub, extra, brand = BRAND, top = "", noCancel = false) =>
  `<div class="sf-inter">${brand}<div class="sf-mid">${top}<h3>${title}</h3><p>${sub}</p>${extra}</div>${noCancel ? '<span class="sf-cancel ghost">Cancel</span>' : '<button class="sf-cancel" data-cancel>Cancel</button>'}</div>`;
function showFlow(html) { flow.innerHTML = html; flow.classList.add("on"); }
function hideFlow() { flow.classList.remove("on"); }

function connectShop(p = SHOP) {
  return new Promise(async (resolve) => {
    flow.dataset.p = p.key;
    flow.onclick = (e) => { if (e.target.closest("[data-cancel]")) { hideFlow(); resolve(false); } };
    try {
      showFlow(interstitial(`Connecting to ${p.pay}`, `Redirecting to ${p.name}…`, '<i class="dotline"></i>', p.brand || BRAND, logos(p)));
      await wait(1900);
      showFlow(`<div class="sf-perm">
        ${logos(p)}
        <h3>Connect your agent</h3>
        <p class="lead">Review permissions before you continue</p>
        <span class="mail"><i></i>dawid@example.com</span>
        <ul class="perms">${PERMS.map(([t, d]) => `<li><span><b>${t}</b><em>${d}</em></span></li>`).join("")}</ul>
        <button class="sf-go" id="sfgo">Continue</button>
        <button class="sf-no" data-cancel>Cancel</button>
        <p class="legal">${p.name} will grant your agent the access described above. <u>Learn more</u></p>
      </div>`);
      await new Promise((r) => { $("#sfgo").onclick = r; });
      showFlow(interstitial(`Connecting to ${p.pay}`, `Linking ${p.acct} to your agent…`, '<i class="dotline"></i>', p.brand || BRAND, logos(p)));
      await wait(1500);
      showFlow(interstitial(`${p.name} connected`, "Returning to chat…", '<i class="bar"></i>', p.brand || BRAND, `<div class="okring"><span class="okmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.500 12.500 4.200 4.200L18.500 8" pathLength="1"/></svg></span></div>`, true));
      await wait(1200);
      hideFlow();
      await wait(450);
      resolve(true);
    } catch (e) { /* cancelled by restart */ }
  });
}

// ---------- Face ID + push ----------
// Full-screen screenshot of the InPost Pay cart. Resolves when the user taps it.
function showShot() {
  return new Promise((resolve) => {
    const shot = $("#ipshot");
    shot.classList.add("on");
    shot.onclick = () => { shot.classList.remove("on"); shot.onclick = null; setTimeout(resolve, 350); };
  });
}
async function payWithFaceId() {
  faceid.classList.remove("ok"); $("#faceidLabel").textContent = "Face ID"; faceid.classList.add("on");
  await wait(1100);
  faceid.classList.add("ok"); $("#faceidLabel").textContent = "Paid";
  await wait(650);
  faceid.classList.remove("on");
}
// Push banner. opts.agent -> Agent icon; opts.sticky -> stays until tapped, returns a promise that resolves on tap.
function showPush(title, body, opts = {}) {
  push.innerHTML = `<span class="app ${opts.agent ? "agent" : ""}">${opts.agent ? '<i></i>' : "IN"}</span><span><b>${title}<em>now</em></b><span>${body}</span></span>`;
  push.classList.toggle("tap", !!opts.sticky);
  push.classList.add("on");
  if (!opts.sticky) { setTimeout(() => push.classList.remove("on"), 4200); return Promise.resolve(); }
  return new Promise((resolve) => {
    const tap = () => { unregister(); push.classList.remove("on", "tap"); push.onclick = null; resolve(); };
    push.onclick = tap;
    register((text) => { queued = text; tap(); });   // typing instead of tapping: open the chat, send the text at the next step
  });
}

// ---------- the scenario ----------
const NAMES = { 1: "Shop", 2: "InPost Pay", 3: "Trusted person", 4: "Orders & returns" };
const _q = +new URLSearchParams(location.search).get("s");
const _w = window.COMMERCE_START_SCENARIO;
let scn = [1, 2, 3, 4].includes(_w) ? _w : [1, 2, 3, 4].includes(_q) ? _q : 1;
function setScenario(n) {
  const links = window.COMMERCE_SCENARIO_LINKS;
  const href = links?.[n] ?? links?.[String(n)];
  if (href && n !== scn) {
    location.assign(href);
    return;
  }
  scn = n;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === n));
  if (!links) {
    try { history.replaceState(null, "", n === 1 ? location.pathname : `${location.pathname}?s=${n}`); } catch (e) { /* file:// */ }
  }
  play();
}

async function endOfScenario(cur) {
  const nx = (cur % 4) + 1;
  const pick = await choose(["Play again", `Scenario ${nx}: ${NAMES[nx]}`]);
  setScenario(pick === 1 ? nx : cur);
}

function trackHtml(steps, done) {
  return `<ul class="track">${steps.map((t, i) => {
    const cls = i < done ? "done" : i === done ? "now" : "";
    return `<li class="${cls}"><i></i>${t}</li>`;
  }).join("")}</ul>`;
}

// Scenario 3: trusted person -> shared calendar (Kopernik) -> ask Justyna's Agent for tickets -> interactive qty card
const parseEmail = (t) => (t.match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/) || [])[0] || null;
const TICKET_ADULT = 42, TICKET_CHILD = 28;
const ticketTotal = (a, c) => a * TICKET_ADULT + c * TICKET_CHILD;

// Each step gets a different ASCII vibe
async function liveFetchCard({ steps, resultTitle, resultSub, resultTone = "empty" }) {
  const node = await card(`
    <div class="live-top">
      <div class="live-agents" aria-hidden="true">
        <span class="av sm agent-av"><i></i></span>
        <span class="live-link">${ARROW}</span>
        <span class="av sm">J</span>
      </div>
      <div class="live-top-copy">
        <div class="v">Your agent → Justyna's agent</div>
        <div class="k">Ticket check · inbox + calendar</div>
      </div>
    </div>
    <ul class="live-steps">
      ${steps.map((s, i) => {
        const v = MATRIX_VARIANTS[i % MATRIX_VARIANTS.length];
        return `<li class="live-step" data-i="${i}">${matrixHTML(v)}<span class="live-txt" data-text="${s}">${s}</span></li>`;
      }).join("")}
    </ul>
    <div class="live-result ${resultTone}" hidden>
      <b class="live-result-title"></b>
      <em class="live-result-sub"></em>
    </div>`, 350);
  node.classList.add("live");
  const items = [...node.querySelectorAll(".live-step")];
  for (let i = 0; i < items.length; i++) {
    const step = items[i];
    step.classList.add("now");
    await wait(i === items.length - 1 ? 1400 : 1100);
    freezeMatrix(step);
    step.classList.remove("now");
    step.classList.add("done");
  }
  const res = node.querySelector(".live-result");
  res.hidden = false;
  res.querySelector(".live-result-title").textContent = resultTitle;
  res.querySelector(".live-result-sub").textContent = resultSub;
  node.classList.add("ready");
  await wait(280);
  return node;
}

function ticketQtyCard(adults0 = 2, kids0 = 0) {
  const node = el(`
    <div class="tr-head">Tickets · Copernicus Science Centre</div>
    <div class="qty-row" data-kind="adults">
      <span class="qty-meta"><b>Adults</b><em>${zl(TICKET_ADULT)} each</em></span>
      <div class="qty-ctrl">
        <button type="button" class="qty-btn" data-d="-1" aria-label="Fewer adults">−</button>
        <span class="qty-n">${adults0}</span>
        <button type="button" class="qty-btn" data-d="1" aria-label="More adults">+</button>
      </div>
    </div>
    <div class="qty-row" data-kind="kids">
      <span class="qty-meta"><b>Children</b><em>${zl(TICKET_CHILD)} each · under 18</em></span>
      <div class="qty-ctrl">
        <button type="button" class="qty-btn" data-d="-1" aria-label="Fewer children">−</button>
        <span class="qty-n">${kids0}</span>
        <button type="button" class="qty-btn" data-d="1" aria-label="More children">+</button>
      </div>
    </div>
    <div class="row qty-fetch"><span class="k">Price from CSC rate card</span><span class="v ml-auto qty-price">${zl(ticketTotal(adults0, kids0))}</span></div>
    <button class="cta qty-go" type="button">Buy tickets</button>`, "card qty");
  let adults = adults0, kids = kids0;
  const priceEl = node.querySelector(".qty-price");
  const fetchRow = node.querySelector(".qty-fetch .k");
  const sync = (flash) => {
    node.querySelector('[data-kind="adults"] .qty-n').textContent = adults;
    node.querySelector('[data-kind="kids"] .qty-n').textContent = kids;
    priceEl.textContent = zl(ticketTotal(adults, kids));
    if (flash) {
      fetchRow.textContent = "Fetching price…";
      priceEl.classList.add("pulse");
      clearTimeout(sync._t);
      sync._t = setTimeout(() => {
        fetchRow.textContent = "Price from CSC rate card";
        priceEl.classList.remove("pulse");
      }, 420);
    }
  };
  node.querySelectorAll(".qty-row").forEach((row) => {
    const kind = row.dataset.kind;
    row.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.onclick = () => {
        const d = +btn.dataset.d;
        if (kind === "adults") adults = Math.max(1, Math.min(8, adults + d));
        else kids = Math.max(0, Math.min(8, kids + d));
        sync(true);
      };
    });
  });
  return { node, get: () => ({ adults, kids, total: ticketTotal(adults, kids) }) };
}

async function scenario3() {
  add(el("Fri 16 Oct at 8:05", "stamp"));
  await wait(400);
  await say("Hi Dawid! I can plan your time better if I know what you arrange with someone close to you.");
  await say("Let's add a trusted person. I only see what you set up together, like a shared calendar. Who is this person for you?");
  const rels = ["Partner", "Family", "Friend"];
  const relation = rels[await choose(rels)];

  let email = null;
  if (relation === "Partner") {
    await say("In your contacts I have Justyna with the note “Babe” — is that her?", 1700, "Checking your contacts");
    await card(`<div class="row"><span class="av">J</span><span><div class="v">Justyna <em class="nick">Babe</em></div><div class="k">Contacts · justyna@example.com</div></span></div>`, 400);
    if ((await choose(["Yes, that's her", "No, I'll give another email"])) === 0) email = "justyna@example.com";
  }
  if (!email) {
    await say(`OK. Send this person's email (${relation.toLowerCase()}), and I'll send an invite.`);
    email = parseEmail(await typed("e.g. justyna@example.com", ["justyna@example.com"])) || "justyna@example.com";
  }

  await say(`Sending an invite to ${email}.`, 1700, "Sending invite");
  const inv = await card(`
    <div class="row"><span class="av">${email[0].toUpperCase()}</span><span><div class="v who">${email}</div><div class="k">Trusted person · ${relation}</div></span><span class="status wait ml-auto">Pending</span></div>
    <div class="row"><span class="k">What they will see</span><span class="v ml-auto">Shared calendar</span></div>`, 500);
  await say("Invite sent. I'll let you know when it's confirmed.");

  await wait(2200);
  add(el("Fri 16 Oct at 8:21", "stamp"));
  showPush("Agent", "Justyna confirmed the invite.", { agent: true });
  inv.querySelector(".av").firstChild.textContent = "J";
  inv.querySelector(".who").textContent = "Justyna";
  const st = inv.querySelector(".status"); st.textContent = "Connected"; st.classList.replace("wait", "ok");
  await say(`Justyna confirmed. She is now your trusted person (${relation.toLowerCase()}), and I can see your shared calendar.`, 1200);

  await wait(1200);
  add(el("Fri 16 Oct at 19:40", "stamp"));
  await say("Justyna added a Copernicus Science Centre visit to your shared calendar.", 2400, "Checking shared calendar");
  await card(`
    <div class="row"><span class="cal"><b>26</b><small>OCT</small></span><span><div class="v">Copernicus Science Centre</div><div class="k">Sunday, 26 October · 11:00</div></div></div>
    <div class="row"><span class="av sm">J</span><span class="k">Added by Justyna · shared calendar</span></div>`, 500);

  await say("Checking whether you already have tickets. I'll also ask Justyna's agent if anything landed in her inbox.", 1600, "Connecting to Justyna's agent");
  await liveFetchCard({
    steps: [
      "Connecting to Justyna's agent",
      "Searching mail for CSC / Copernicus",
      "Checking attachments and confirmations",
    ],
    resultTitle: "No tickets",
    resultSub: "Nothing about Copernicus in Justyna's inbox. The calendar only has the event, no booking.",
    resultTone: "empty",
  });

  await say("You don't have tickets yet. Want me to buy them now?");
  if ((await choose(["Yes, buy tickets", "No thanks"])) !== 0) {
    await say("OK. Message me if you change your mind.");
    await endOfScenario(3);
    return;
  }

  await say("How many people are going? Set it on the card. Price updates live from the CSC rate card.");
  const { node: qty, get } = ticketQtyCard(2, 1);
  add(qty);
  const go = qty.querySelector(".qty-go");
  const bought = new Promise((resolve) => {
    go.onclick = () => { unregister(); hideOptions(); go.disabled = true; resolve(get()); };
  });
  await wait(500);

  // User corrects via chat — agent updates the card, then taps buy
  you("make it 3 adults, we're bringing grandma");
  await wait(400);
  const updating = add(el(thinkHTML("Updating booking"), "think"));
  await wait(900);
  const plus = qty.querySelector('[data-kind="adults"] [data-d="1"]');
  while (get().adults < 3) {
    plus.click();
    await wait(320);
  }
  await wait(450);
  go.click();
  const counts = await bought;
  updating.remove();

  const kidsLabel = counts.kids === 1 ? "1 child" : counts.kids ? `${counts.kids} children` : "";
  const kidsShort = counts.kids === 1 ? "1× child" : counts.kids ? `${counts.kids}× children` : "";
  await say(`Great family outing. I'm taking ${counts.adults}× adult${kidsShort ? ` and ${kidsShort}` : ""}, ${zl(counts.total)} total.`, 1400, "Connecting to CSC checkout");

  await card(`
    <div class="row"><span class="pin">🎟️</span><span><div class="v">CSC tickets · 26 Oct, 11:00</div><div class="k">${counts.adults} adults${kidsLabel ? ` · ${kidsLabel}` : ""} · ${zl(counts.total)}</div></span><span class="status ok ml-auto">Reserved</span></div>
    <div class="row"><span class="k">Sent to Justyna</span><span class="v ml-auto">Calendar + email</span></div>`, 500);
  await say("Done. Justyna gets email confirmation, and the calendar already shows your tickets.");
  await endOfScenario(3);
}

// Scenario 1: reorder through Shop (connect Shop, remember a locker, pick food by age/weight/weeks)
async function scenario1() {
    add(el("Thu 15 Oct at 21:21", "stamp"));
    await wait(500);
    await say("Hi Dawid! Luna has about four days of food left.");
    await say("Want me to order more?");
    let c = await choose(["Yes, order", "Remind me tomorrow"]);
    while (c === 1) {
      await say("Sure, I'll ping you tomorrow morning.");
      c = await choose(["Order now instead"]);
    }

    await say("Shop is the easiest, hands-off option on your side. I'll run the whole flow; you just confirm. I'll suggest it:", 1300);
    let connected = false;
    while (!connected) {
      await thinkSteps(PREP_SHOP);
      if (await shopCard()) connected = await connectShop();
      if (!connected) await say("Without Shop I can't place the order, but we can come back whenever you want.");
    }

    await say("Shop is connected. Address and card are loaded.", 1800, "Reading address and card from Shop");
    await say("What's the most I can spend per month on purchases? Type an amount or pick one.");
    const budget = parseBudget(await typed("e.g. 500 PLN", ["300 PLN", "500 PLN", "1000 PLN"])) || 500;
    await say(`Saved. Up to ${zl0(budget)} per month I buy on my own; above that I always ask.`, 900);
    await memSave(ICON.wallet, `Monthly budget ${zl0(budget)}`);

    await say("Delivery preference: parcel locker (usually cheaper) or courier (usually pricier)?");
    const courier = (await choose(["Parcel locker", "Courier"])) === 1;
    let picked = null, ship;
    if (!courier) {
      await say("One thing: Shop Pay can't set a default locker — you pick it at checkout. I'll ask once and remember.");
      await say(`From your Shop address (10 Puławska St, Warsaw) the nearest locker is ${LOCKERS[0].id}, ${LOCKERS[0].dist} from home (${LOCKERS[0].addr}). Save it?`, 1800, "Finding lockers near your address");
      picked = LOCKERS[0];
      if ((await choose([`Yes, ${LOCKERS[0].id}`, "Pick on map"])) === 1) {
        await say("Three nearest lockers. Pick from the list or tap a pin on the map:", 800);
        picked = await pickOnMap();
      }

      await say(`Saved. For InPost orders I'll use ${picked.id} (${picked.addr}).`, 700);
      await memSave(ICON.pin, `Locker ${picked.id}`);

      ship = {
        price: DELIVERY,
        label: `InPost ${picked.id} (saved)`,
        confirm: `Ordered. The parcel should be in locker ${picked.id} within 48 hours.`,
      };
    } else {
      await say("Courier it is. I'll use your Shop address: 10 Puławska St, Warsaw. OK?", 1700, "Reading address from Shop");
      await choose(["Yes, that address"]);
      await say("Saved. Courier orders will go to this address.", 700);
      await memSave(ICON.truck, "Courier · 10 Puławska St, Warsaw");
      ship = {
        price: DELIVERY_COURIER,
        label: "InPost courier, 10 Puławska St (saved)",
        confirm: "Ordered. The parcel should reach you within 48 hours.",
      };
    }

    await say("To pick food I need Luna's age and weight. Type it in a message.");
    const dog = parseDog(await typed("e.g. 4 years, 28 kg", ["4 years, 28 kg", "8 years, 32 kg"])) || { age: "adult", kg: 25 };
    await say(`Saved: ${AGES.find((a) => a[0] === dog.age)[1].toLowerCase()}, ${dog.kg} kg. Searching ${STORE}.`, 2000, `Searching ${STORE}`);
    await say("How many weeks should the food last? Type weeks or pick one.");
    const weeks = parseWeeks(await typed("e.g. 8 weeks", ["4 weeks", "8 weeks", "12 weeks"])) || 8;
    const dailyG = Math.round((dog.kg * GRAMS_PER_KG[dog.age]) / 5) * 5;
    const needKg = Math.round((dailyG * 7 * weeks) / 100) / 10;
    await say(`Luna eats about ${dailyG} g per day, so for ${weeks} weeks you need roughly ${needKg} kg. Picking bag sizes.`, 2000, "Calculating portions and bag size");
    const list = pick3(dog.age, dog.kg).map((p) => plan(p, dailyG, weeks));
    await say("Here are three foods, each in a bag sized for your weeks. The first is the best match. Swipe and choose:");
    const product = await pickProduct(list);
    await say("Good choice.", 600);

    const preTotal = product.price + ship.price;
    await say(preTotal > budget ? `Summary. This exceeds your monthly budget by ${zl0(preTotal - budget)}, so I'll order only after your OK:` : "Summary. I'll order only after your OK:", 1500, "Adding delivery to total");
    const total = product.price + ship.price;
    const sum = await card(`
      <div class="row"><div class="thumb"><img src="${product.img}" alt=""></div><div><div class="v">${product.name}</div><div class="k">${product.flavour} · ${product.note}</div></div></div>
      <div class="row"><span class="k">${ship.label}</span><span class="v ml-auto">${zl(ship.price)}</span></div>
      <div class="row"><span class="k">Payment</span><span class="v ml-auto">Visa ••4242</span></div>
      <div class="row"><span class="k">From budget ${zl0(budget)}</span><span class="v ml-auto ${budget < total ? "over" : ""}">${budget >= total ? "left " + zl0(budget - total) : "over by " + zl0(total - budget)}</span></div>
      <div class="row total"><span class="v">Total</span><span class="v ml-auto">${zl(total)}</span></div>
      <button class="cta" style="margin-top:8px">Approve and pay</button>`);
    await new Promise((resolve) => {
      sum.querySelector(".cta").onclick = () => { unregister(); resolve(); };
      register((text) => { unregister(); you(text); resolve(); });
    });
    sum.querySelector(".cta").disabled = true;
    await payWithFaceId();

    await say(ship.confirm, 1600, "Placing order");
    await choose(["Thanks!"]);
    await say("No problem. I'll let you know when food is running low again.", 700);
    await endOfScenario(1);
}

// Scenario 2: Agent ships InPost Pay -> push -> connect -> ready cart, only a pay card
async function scenario2() {
  add(el("Thu 15 Oct at 21:21", "stamp"));
  add(el("Ordered. The parcel will be in locker WAW214M tomorrow by 2:00 p.m.", "msg in"));
  add(el("Thanks!", "msg out"));
  add(el("No problem.", "msg in"));
  await wait(1200);
  await showPush("Agent", "We shipped InPost Pay integration. See what it changes for your shopping.", { agent: true, sticky: true });

  add(el("Fri 16 Oct at 9:41", "stamp"));
  await say("Hi Dawid! News: we just shipped InPost Pay integration.");
  await say("We last bought Luna's food through Shop. With InPost Pay I can search more stores and find cheaper prices.");
  let connected = false;
  while (!connected) {
    await thinkSteps(PREP_INPOST);
    if (await shopCard(INPOST)) connected = await connectShop(INPOST);
    if (!connected) await say("OK, we can revisit later. I can still buy food through Shop.");
  }

  await say("Done — InPost Pay is connected.", 1400, "Connecting to InPost Pay");
  await say("Found the same food cheaper: PetHub has it for 171 PLN vs 189 PLN at Zoo Corner. Cart is ready with locker WAW214M. Just confirm in InPost Pay.", 2800, "Comparing InPost Pay store prices");
  const cart = await card(`
    <div class="row"><span class="ipicon"><img src="${ASSET('inpost-icon.png')}" alt=""></span><span><div class="v">Cart ready</div><div class="k">PetHub · InPost Pay</div></span><span class="save ml-auto">−18 PLN</span></div>
    <div class="row"><div class="thumb"><img src="${F(7)}" alt=""></div><div><div class="v">Nordic Paws Adult Large</div><div class="k">Salmon & rice · 12 kg</div></div><span class="v ml-auto">${zl(171)}</span></div>
    <div class="row"><span class="pin">${ICON.pin}</span><span><div class="k">Delivery</div><div class="v">Locker WAW214M</div></span><span class="k ml-auto">saved</span></div>
    <button class="cta pay">Open in InPost Pay</button>`, 700);
  const opened = new Promise((r) => {   // live as soon as the card is shown
    cart.querySelector(".pay").onclick = () => r("open");
    register((text) => { you(text); r("open"); });
  });
  await say("This is how the cart looks in InPost Pay. Open it to pay, or ignore this card.", 900);

  const choice = await Promise.race([opened, new Promise((r) => showOptions(["Ignore"], () => r("ignore"), false))]);
  hideOptions(); unregister();
  const btn = cart.querySelector(".pay"); btn.disabled = true;
  if (choice === "open") {
    await showShot();   // the InPost Pay cart (screenshot); a tap brings the user back to Agent
    btn.textContent = "Opened in InPost Pay"; btn.classList.add("paid");
    await say("Payment went through in InPost Pay. Parcel is heading to WAW214M — I'll update you when it's ready.", 3200, "Checking order status in InPost Pay");
    const steps = ["Order paid", "Parcel dispatched", "On the way to locker", "Ready for pickup"];
    const trk = await card(`<div class="tr-head">Parcel status</div>${trackHtml(steps, 0)}`, 500);
    const items = [...trk.querySelectorAll(".track li")];
    for (let i = 0; i < 2; i++) {
      await wait(1000);
      items[i].classList.remove("now");
      items[i].classList.add("done");
      if (items[i + 1]) items[i + 1].classList.add("now");
    }
  } else {
    you("Ignore"); btn.textContent = "Ignored";
    await say("Sure, the cart stays in InPost Pay. I'll tell you if the price drops again.");
  }
  await endOfScenario(2);
}

function bindOrdersCard(node, list) {
  node.classList.add("orders");
  node.querySelectorAll(".ord-row").forEach((btn) => {
    btn.onclick = () => openOrderSheet(btn, list[+btn.dataset.i]);
  });
  return node;
}
function ordersListHtml(title, list, tall) {
  return `
    <div class="ord-head">${title}</div>
    <div class="ord-list${tall ? " tall" : ""}">
      ${list.map((o, i) => `
        <button type="button" class="ord-row" data-i="${i}">
          ${o.img ? `<span class="thumb"><img src="${o.img}" alt=""></span>` : `<span class="thumb th-plain">${o.emoji}</span>`}
          <span><div class="v">${o.name}</div><div class="k">${o.status}${o.store ? ` · ${o.store}` : ""}</div></span>
          <span class="ord-go" aria-hidden="true">${ARROW}</span>
        </button>`).join("")}
    </div>`;
}

async function claimSweaterFlow(sweater, reason) {
  await say(`OK. Opening a claim with ${sweater.store} and I won't drop it until it's closed.`, 1600, `Opening claim · ${sweater.store}`);
  const claimCard = await card(`
    <div class="row"><span class="thumb th-plain">${sweater.emoji}</span><span><div class="v">${sweater.name}</div><div class="k">${sweater.store} · ${zl(sweater.price)}</div></span><span class="status wait ml-auto">In progress</span></div>
    <div class="row"><span class="k">Reason</span><span class="v ml-auto">${reason}</span></div>`, 400);

  await say(`I wrote to ${sweater.store}: “${reason}. Please replace or refund.” Waiting for a reply.`, 2000, `Writing to ${sweater.store}`);
  await wait(1600);
  add(el("Sat 18 Oct at 14:22", "stamp"));
  await say(`${sweater.store} replied: they need a photo of the defect. Sending from your gallery.`, 1800, "Sending defect photo");
  await choose(["OK, send the photo"]);

  await say("Photo sent. I'm following up — not leaving this at “we'll get back to you.”", 1600, `Follow-up · ${sweater.store}`);
  await wait(1800);
  add(el("Sat 18 Oct at 16:05", "stamp"));
  await say(`${sweater.store} called it “normal wear.” I replied with policy and post-wash photos. Keeping the case open.`, 2400, "Appealing store decision");
  await wait(1600);
  add(el("Sat 18 Oct at 17:40", "stamp"));
  await say("They relented. Refund 289 PLN to your card or exchange for size L.", 1400, "Closing negotiation");
  const refund = (await choose(["Take the 289 PLN refund", "Exchange for size L"])) === 0;
  await say(refund
    ? "Refund accepted. Funds should return in 3–5 business days. I'll confirm when they land."
    : "Exchange for L ordered. Parcel should be in a locker within 48 hours.", 1800, `Closing claim · ${sweater.store}`);

  const st = claimCard.querySelector(".status");
  if (st) { st.textContent = "Resolved"; st.classList.replace("wait", "ok"); }
  await memSave(ICON.ok, refund ? "Claim · Sweater · refund" : "Claim · Sweater · exchange");
  await say("Resolved. Skipping Answear. If the store stalls on a return again, I'll pick the thread back up.");
}

// Scenario 4: status + returns/claims (last 10, sweater complaint until resolved)
async function scenario4() {
  const stepsLocker = ["Order received", "Parcel dispatched", "On the way to locker", "Ready for pickup"];
  const stepsCourier = ["Order received", "Parcel dispatched", "Courier en route", "Delivered"];
  const stepsDone = ["Order received", "Parcel dispatched", "In transit", "Delivered"];
  const sweater = {
    name: "Merino wool sweater", sub: "Navy · M", store: "Answear", who: "You",
    emoji: "🧶", dest: "Locker WAW214M", status: "Delivered", when: "2 Oct",
    steps: stepsDone, done: 4, price: 289,
    note: "Delivered 2 October. You can file a claim — the agent will handle it with the store.",
    claimable: true,
  };
  const last10 = [
    { name: "Nordic Paws Adult Large", sub: "12 kg", store: "Zoo Corner", emoji: "🐕", img: F(7), dest: "WAW214M", status: "In transit", when: "15 Oct", steps: stepsLocker, done: 2, price: 189, note: "Luna's food." },
    { name: "Oral-B iO Series 7", sub: "Black", store: "MediaExpert", emoji: "🪥", dest: "Courier", status: "Dispatched", when: "16 Oct", steps: stepsCourier, done: 1, price: 649, note: "On the way to you." },
    sweater,
    { name: "Ethiopia coffee 1 kg", sub: "Whole bean", store: "CoffeeDesk", emoji: "☕", dest: "Courier", status: "Delivered", when: "28 Sep", steps: stepsDone, done: 4, price: 78, note: "" },
    { name: "Ortho bed L", sub: "Graphite", store: "Zoo Corner", emoji: "🛏️", dest: "WAW214M", status: "Delivered", when: "20 Sep", steps: stepsDone, done: 4, price: 219, note: "" },
    { name: "Sony WH-1000XM5", sub: "Black", store: "MediaExpert", emoji: "🎧", dest: "Courier", status: "Delivered", when: "12 Sep", steps: stepsDone, done: 4, price: 1299, note: "" },
    { name: "Salmon oil 1 L", sub: "For dogs", store: "Zoo Corner", emoji: "🧴", dest: "WAW214M", status: "Delivered", when: "5 Sep", steps: stepsDone, done: 4, price: 64, note: "" },
    { name: "Nike Pegasus 41", sub: "42", store: "Sizeer", emoji: "👟", dest: "Courier", status: "Delivered", when: "28 Aug", steps: stepsDone, done: 4, price: 549, note: "" },
    { name: "Anker 20K power bank", sub: "Black", store: "Amazon", emoji: "🔋", dest: "WAW214M", status: "Delivered", when: "18 Aug", steps: stepsDone, done: 4, price: 159, note: "" },
    { name: "Sencha tea 100 g", sub: "Organic", store: "Pekala", emoji: "🍵", dest: "Courier", status: "Delivered", when: "10 Aug", steps: stepsDone, done: 4, price: 42, note: "" },
  ];
  const hers = [{
    name: "Frosch cleaning bundle", sub: "All-purpose + bathroom", store: "Rossmann", who: "Justyna",
    emoji: "🧴", dest: "Locker WAW214M", status: "Ready for pickup", when: "17 Oct",
    steps: stepsLocker, done: 3, price: 67.9,
    note: "Ordered by Justyna because Oksana reported cleaning supply shortages.",
  }];

  add(el("Sat 18 Oct at 11:04", "stamp"));
  await wait(400);
  you("Show my last 10 orders");
  await wait(500);
  await say("Here are your last 10. Tap a row for details.", 1600, "Loading order history");
  bindOrdersCard(await card(ordersListHtml("Last 10 orders", last10, true), 500), last10);

  await wait(600);
  you("This Answear sweater fell apart after one wash. Remember not to order from there");
  await wait(500);
  await memSave(ICON.bag, "Avoid · Answear");
  await say("Noted: no more Answear orders. Want me to open a return and handle it with the store?");
  if ((await choose(["Yes, handle the return", "No, just remember"])) === 0) {
    await claimSweaterFlow(sweater, "Fell apart after the first wash");
  } else {
    await say("OK. Skipping Answear. If you change your mind about the claim, let me know.");
  }

  await say("Show Justyna's orders too?");
  if ((await choose(["Yes, show them", "No, that's enough"])) === 0) {
    await say("Justyna ordered cleaning supplies because Oksana reported shortages.", 1500, "Checking Justyna's orders");
    bindOrdersCard(await card(ordersListHtml("Justyna's orders", hers, false), 500), hers);
  } else {
    await say("OK.");
  }

  await endOfScenario(4);
}

async function play() {
  ++run;
  thread.innerHTML = ""; hideOptions(); hideFlow(); closeChrome(); closeSheet(false); waiter = null; queued = null; resetInput(); $("#ipshot").classList.remove("on"); $("#ipshot").onclick = null; faceid.classList.remove("on"); push.classList.remove("on", "tap"); push.onclick = null;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === scn));
  try { await ({ 1: scenario1, 2: scenario2, 3: scenario3, 4: scenario4 }[scn])(); } catch (e) { if (e !== CANCEL) throw e; }
}

// ---------- app chrome: menu drawer, Settings, "Add Agent" sheet, attach popover ----------
const drawer = $("#drawer"), settings = $("#settings"), addsheet = $("#addsheet"), dim = $("#dim"), attach = $("#attach");
const openDrawer = () => { drawer.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); };
const closeDrawer = () => { drawer.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); };
const openAdd = () => { dim.classList.add("on"); addsheet.classList.add("on"); addsheet.setAttribute("aria-hidden", "false"); };
const closeAdd = () => { dim.classList.remove("on"); addsheet.classList.remove("on"); addsheet.setAttribute("aria-hidden", "true"); };
function closeChrome() { closeDrawer(); closeAdd(); attach.classList.remove("on"); settings.classList.remove("on"); }
function go(where) {
  settings.classList.toggle("on", where === "settings");
  document.querySelectorAll(".dr-item").forEach((b) => b.classList.toggle("on", b.dataset.go === where));
  closeDrawer();
}
$("#menuBtn").onclick = openDrawer;
document.querySelectorAll("[data-menu]").forEach((b) => (b.onclick = openDrawer));
drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });
$("#addBtn").onclick = openAdd;
dim.onclick = closeAdd;
const addClose = addsheet.querySelector(".close");
if (addClose) addClose.onclick = closeAdd;
const addimsg = addsheet.querySelector(".addimsg");
if (addimsg) addimsg.onclick = closeAdd;
$("#plusBtn").onclick = (e) => { e.stopPropagation(); attach.classList.toggle("on"); };
attach.onclick = () => attach.classList.remove("on");
screen.addEventListener("click", (e) => { if (!e.target.closest("#attach, #plusBtn")) attach.classList.remove("on"); });
settings.querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => {
  settings.querySelectorAll("[data-ch]").forEach((x) => { const on = x === b; x.textContent = on ? "Primary" : "Make primary"; x.classList.toggle("dim", on); });
}));

// Keep the iPhone proportions fixed (402 x 874 pt screen) and scale the whole device to the window.
function fit() {
  const z = innerWidth <= 640 ? 1 : Math.max(0.4, Math.min(1.3, (innerHeight - 48) / 896));
  document.documentElement.style.setProperty("--zoom", z);
}
addEventListener("resize", fit); fit();

$("#reset").onclick = play;
document.querySelectorAll("[data-restart]").forEach((b) => (b.onclick = play));
document.querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => setScenario(+b.dataset.s)));
// Web-only "why this scenario" tips next to the page-head list
document.querySelectorAll(".page-head .scn-info").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = btn.getAttribute("aria-expanded") === "true";
    document.querySelectorAll(".page-head .scn-info").forEach((x) => x.setAttribute("aria-expanded", "false"));
    btn.setAttribute("aria-expanded", open ? "false" : "true");
  });
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".page-head .scn-info")) {
    document.querySelectorAll(".page-head .scn-info").forEach((x) => x.setAttribute("aria-expanded", "false"));
  }
});
play();
