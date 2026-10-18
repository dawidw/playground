// Boski shopping agent: scripted scenario (chat -> Shop setup -> order to an InPost locker).
// Everything is mock data. Edit COPY / the `play()` flow below to change the script.

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
const F = (n) => `food/${String(n).padStart(2, "0")}.jpg`;
// ppk = price per kg (zł), sizes = bag sizes in kg
const PRODUCTS = [
  { name: "Nordic Paws Puppy", img: F(1), flavour: "Kurczak", ppk: 15.9, sizes: [3, 10, 15], tag: "Szczenięta", age: "puppy", kg: [8, 40],
    about: "Kompletna karma dla szczeniąt średnich i dużych ras. Wspiera wzrost kości i mięśni dzięki podwyższonej ilości białka i wapnia.",
    protein: "28%", fat: "16%", fibre: "2,5%", forWhom: "Szczenięta 2–12 mies., 8–40 kg",
    ingredients: "Kurczak świeży 28%, kurczak suszony 18%, ryż, tłuszcz z kurczaka, burak cukrowy, olej z łososia, glukozamina." },
  { name: "Nordic Paws Puppy Large", img: F(2), flavour: "Łosoś", ppk: 16.6, sizes: [3, 12, 15], tag: "Duże rasy", age: "puppy", kg: [20, 90],
    about: "Dla szczeniąt ras dużych: kontrolowany wzrost dzięki zbilansowanemu stosunkowi wapnia do fosforu i omega-3 z łososia.",
    protein: "27%", fat: "14%", fibre: "2,8%", forWhom: "Szczenięta dużych ras, 20–90 kg",
    ingredients: "Łosoś świeży 30%, łosoś suszony 16%, ziemniak, tłuszcz z łososia, groszek, siemię lniane, chondroityna." },
  { name: "Nordic Paws Puppy Mini", img: F(3), flavour: "Kurczak", ppk: 23, sizes: [1, 3], tag: "Małe rasy", age: "puppy", kg: [1, 10],
    about: "Małe granulki dla szczeniąt ras miniaturowych. Wysoka energia w małej porcji, dopasowana do szybkiego metabolizmu.",
    protein: "30%", fat: "18%", fibre: "2%", forWhom: "Szczenięta małych ras, do 10 kg",
    ingredients: "Kurczak 42%, ryż, tłuszcz drobiowy, hydrolizat białka, jabłko, witaminy A/D3/E." },
  { name: "Nordic Paws Mini", img: F(4), flavour: "Kaczka i ryż", ppk: 26.3, sizes: [1.5, 3, 7], tag: "Małe rasy", age: "adult", kg: [1, 10],
    about: "Dzienna karma dla dorosłych psów małych ras. Kaczka jako delikatne źródło białka, łatwostrawny ryż.",
    protein: "26%", fat: "15%", fibre: "2,4%", forWhom: "Dorosłe psy małych ras, 1–10 kg",
    ingredients: "Kaczka 34%, ryż 22%, tłuszcz z kaczki, burak, olej z łososia, prebiotyki FOS." },
  { name: "Wild Trail Small Grain Free", img: F(5), flavour: "Indyk", ppk: 38, sizes: [1.5, 5], tag: "Bez zbóż", age: "adult", kg: [1, 12],
    about: "Bezzbożowa formuła z indykiem. Idealna przy wrażliwym układzie pokarmowym i alergiach pokarmowych.",
    protein: "32%", fat: "17%", fibre: "3%", forWhom: "Dorosłe psy 1–12 kg, dieta bez zbóż",
    ingredients: "Indyk 40%, batat, groch, tłuszcz z indyka, jabłko, żurawina, zioła." },
  { name: "Nordic Paws Medium", img: F(6), flavour: "Kurczak i ryż", ppk: 16.1, sizes: [3, 8, 12], tag: "Średnie rasy", age: "adult", kg: [8, 25],
    about: "Zrównoważona karma dla aktywnych psów średnich ras. Utrzymuje kondycję bez nadmiaru kalorii.",
    protein: "25%", fat: "13%", fibre: "3%", forWhom: "Dorosłe psy 8–25 kg",
    ingredients: "Kurczak 36%, ryż, jęczmień, tłuszcz drobiowy, marchew, burak, tauryna." },
  { name: "Nordic Paws Adult Large", img: F(7), flavour: "Łosoś i ryż", ppk: 15.75, sizes: [3, 12, 15], tag: "Ostatnio kupowana", age: "adult", kg: [20, 90],
    about: "Twoja poprzednia karma Luny. Łosoś wspiera skórę i sierść, a większe granulki spowalniają jedzenie.",
    protein: "24%", fat: "12%", fibre: "3,2%", forWhom: "Dorosłe psy dużych ras, 20–90 kg",
    ingredients: "Łosoś 33%, ryż 20%, tłuszcz z łososia, burak, glukozamina, chondroityna, MSM." },
  { name: "Nordic Paws Active", img: F(8), flavour: "Kurczak i ryż", ppk: 14.1, sizes: [3, 12, 15], tag: "Taniej", age: "adult", kg: [10, 90],
    about: "Więcej energii w niższej cenie za kilogram. Dobra na codzienne spacery i umiarkowaną aktywność.",
    protein: "26%", fat: "15%", fibre: "2,8%", forWhom: "Dorosłe psy aktywne, od 10 kg",
    ingredients: "Kurczak 30%, ryż, kukurydza, tłuszcz drobiowy, olej roślinny, witaminy." },
  { name: "Wild Trail Grain Free", img: F(9), flavour: "Jagnięcina", ppk: 22.9, sizes: [2, 10, 12], tag: "Bez zbóż", age: "adult", kg: [10, 90],
    about: "Monobiałkowa jagnięcina bez zbóż. Dla psów z alergiami i wymagających diety eliminacyjnej.",
    protein: "29%", fat: "16%", fibre: "3%", forWhom: "Dorosłe psy od 10 kg, bez zbóż",
    ingredients: "Jagnięcina 38%, batat, groch, tłuszcz jagnięcy, jabłko, rozmaryn." },
  { name: "Nordic Paws Senior", img: F(10), flavour: "Indyk i ryż", ppk: 14.9, sizes: [3, 12], tag: "Na stawy", age: "senior", kg: [10, 90],
    about: "Dla starszych psów: mniej kalorii, więcej wsparcia stawów (glukozamina + chondroityna).",
    protein: "22%", fat: "10%", fibre: "4%", forWhom: "Psy 7+, od 10 kg",
    ingredients: "Indyk 28%, ryż, jęczmień, glukozamina, chondroityna, olej z łososia, L-karnityna." },
  { name: "Nordic Paws Senior Light", img: F(11), flavour: "Kurczak", ppk: 14.1, sizes: [3, 12, 15], tag: "Mniej kalorii", age: "senior", kg: [1, 90],
    about: "Light dla seniorów z tendencją do nadwagi. Wysoka sytość przy obniżonej kaloryczności.",
    protein: "23%", fat: "8%", fibre: "5%", forWhom: "Starsze psy z nadwagą",
    ingredients: "Kurczak 26%, ryż, celuloza, burak, L-karnityna, witamina E." },
  { name: "Wild Trail Senior Mini", img: F(12), flavour: "Kaczka", ppk: 31.7, sizes: [1.5, 3], tag: "Małe rasy", age: "senior", kg: [1, 10],
    about: "Małe granulki dla starszych psów miniaturowych. Kaczka + wsparcie stawów i zębów.",
    protein: "25%", fat: "11%", fibre: "3,5%", forWhom: "Seniorzy małych ras, do 10 kg",
    ingredients: "Kaczka 32%, ryż, groszek, glukozamina, ekstrakt z zielonej herbaty." },
];
const GRAMS_PER_KG = { puppy: 35, adult: 15, senior: 13 }; // daily portion = body weight x this (g)
// 3 best matches: right life stage first, then weight inside the food's range, then closest range
const pick3 = (age, kg) => PRODUCTS
  .map((p) => ({ p, score: (p.age === age ? 100 : 0) - Math.max(0, p.kg[0] - kg, kg - p.kg[1]) + (p.tag === "Ostatnio kupowana" ? 5 : 0) }))
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
    note: `${qty > 1 ? qty + " × " : ""}${String(size).replace(".", ",")} kg · starczy na ~${covers} tyg.`,
    about: p.about, protein: p.protein, fat: p.fat, fibre: p.fibre, forWhom: p.forWhom, ingredients: p.ingredients,
  };
}
const zl0 = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " zł";
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
const AGES = [["puppy", "Szczeniak", "do 1 roku"], ["adult", "Dorosły", "1–7 lat"], ["senior", "Senior", "7+ lat"]];
// x / y: position on the inline mock map (%). Home is at 46 / 56.
const LOCKERS = [
  { id: "WAW214M", addr: "ul. Puławska 12", dist: "120 m", x: 56, y: 40 },
  { id: "WAW087N", addr: "ul. Madalińskiego 3", dist: "340 m", x: 24, y: 70 },
  { id: "WAW152P", addr: "ul. Rakowiecka 8", dist: "410 m", x: 78, y: 24 },
];
const DELIVERY = 12.99, DELIVERY_COURIER = 18.99; // paczkomat vs kurier
const zl = (n) => n.toFixed(2).replace(".", ",") + " zł";

// ---------- chat primitives ----------
async function say(text, ms = 900, label) {
  // label -> Boski mark + shimmer; no label -> typing dots
  const t = add(label
    ? el(`<i class="mark"></i><span class="txt" data-text="${label}">${label}</span>`, "think")
    : el("<i></i><i></i><i></i>", "typing"));
  await wait(ms);
  t.remove();
  add(el(text, "msg in"));
  await wait(250);
}
function you(text) { add(el(text, "msg out")); }
// What the scenario is waiting for right now. Whatever the user types goes to the main path of that step;
// text typed while Boski is busy is queued and used at the next step.
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
  opIn.innerHTML = `<div class="op-card"><div class="op-head">Wybierz odpowiedź</div>
    ${labels.map((l, i) => `<button class="opt-row" data-i="${i}"><i class="n">${i + 1}</i><span>${l}</span></button>`).join("")}
    ${hint ? '<div class="op-hint">Albo wpisz własną odpowiedź poniżej</div>' : ""}</div>`;
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
// "4 lata, 28 kg", "Luna ma 8 lat i waży 32 kg", "6 miesięcy 9kg" -> { age: puppy|adult|senior, kg }
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
    ["Białko", p.protein], ["Tłuszcz", p.fat], ["Błonnik", p.fibre], ["Dla", p.forWhom],
  ].filter(([, v]) => v).map(([k, v]) => `<li><em>${k}</em><b>${v}</b></li>`).join("");
  psheet.querySelector(".ps-track").innerHTML = "";
  psheet.querySelector(".ps-ings").innerHTML = p.ingredients ? `<em>Skład</em>${p.ingredients}` : "";
  psheet.querySelector(".ps-price").textContent = zl(p.price);
  psheet.querySelector(".ps-pick").textContent = "Wybierz";
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
    ["Dostawa", o.dest], ["Status", o.status], ["Zamówiono", o.when],
  ].map(([k, v]) => `<li><em>${k}</em><b>${v}</b></li>`).join("");
  psheet.querySelector(".ps-track").innerHTML = trackHtml(o.steps, o.done);
  psheet.querySelector(".ps-ings").innerHTML = "";
  psheet.querySelector(".ps-price").textContent = o.price != null ? zl(o.price) : "";
  psheet.querySelector(".ps-pick").textContent = "Zamknij";
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

// Food carousel: swipe / drag, tap card → details, "Wybierz" → pick.
function pickProduct(list) {
  return new Promise((resolve) => {
    const wrap = el(list.map((p, i) => `<article class="pcard" data-i="${i}">
      <div class="pimg"><img src="${p.img}" alt="" draggable="false"><span class="ptag">${p.tag}</span>${i === 0 ? '<span class="best">Najlepsze dopasowanie</span>' : ""}<span class="chk">${ICON.ok.replace('width="26" height="26"', 'width="16" height="16"')}</span></div>
      <div class="pbody"><div class="pn">${p.name}</div><div class="pf">${p.flavour}</div><div class="pnote">${p.note}</div><div class="pprice">${zl(p.price)}</div>
      <button class="cta">Wybierz</button></div></article>`).join(""), "carousel");
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
        <span class="homepin" style="left:46%;top:56%"><i></i>Dom</span>
        ${LOCKERS.map((l, i) => `<button class="mpin" data-i="${i}" style="left:${l.x}%;top:${l.y}%" aria-label="${l.id}"><svg class="shape" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 38C15 38 2 26 2 14.500a13 13 0 0 1 26 0C28 26 15 38 15 38Z"/></svg><i>${ICON.bag}</i><em>${l.id}</em></button>`).join("")}
      </div>
      ${LOCKERS.map((l, i) => `<button class="row lk" data-i="${i}"><span class="pin">${ICON.pin}</span><span><div class="v">${l.id}${i === 0 ? ' <small>najbliżej</small>' : ""}</div><div class="k">${l.addr}</div></span><span class="k ml-auto">${l.dist}</span></button>`).join("")}`, "card map");
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
      you(text || `Paczkomat ${l.id}`); resolve(l);
    };
    mark();
    wait(700).then(() => { add(node); register((text) => pickL(LOCKERS[0], text)); }).catch(() => {});
  });
}

// ---------- Shop connect flow (interstitial -> permissions -> connected) ----------
const PERMS = [
  ["Koszyk", "Wypełnię dane kontaktowe, telefon i adres"],
  ["Adresy", "Zobaczę zapisane adresy dostawy"],
  ["Portfel", "Użyję zapisanej karty przy płatności"],
];
const SHOP = {
  key: "shop", name: "Shop", pay: "Shop Pay", acct: "konta Shop",
  logo: '<span class="shoplogo">shop</span>', cta: "Połącz Shop",
  lead: "Żebym mógł zamawiać za Ciebie, potrzebuję dostępu do Twojego konta Shop.",
  bullets: [
    ["Koszyk", "Przygotuję go z Twoimi danymi"],
    ["Adresy", "Odczytam zapisane lokalizacje"],
    ["Płatność", "Zapłacę kartą z portfela Shop"],
  ],
};
const INPOST = {
  key: "inpost", name: "InPost Pay", pay: "InPost Pay", acct: "konta InPost Pay",
  logo: '<span class="shoplogo inpost"><img src="inpost-icon.png" alt="InPost Pay"></span>',
  brand: '<img class="ipword" src="inpost-logo.png" alt="InPost">', cta: "Połącz InPost Pay",
  lead: "Z InPost Pay znajdę tę samą karmę w większej liczbie sklepów i dopilnuję lepszej ceny.",
  bullets: [
    ["Sklepy", "Przeszukam więcej miejsc naraz"],
    ["Cena", "Porównam oferty i wybiorę taniej"],
    ["Koszyk", "Ty tylko potwierdzisz w InPost Pay"],
  ],
};
const LINK = '<span class="sf-link" aria-hidden="true"><i></i><i></i><i></i></span>';
const logos = (p) => `<div class="sf-logos">${p.logo}${LINK}<span class="applogo" aria-label="Boski"><i></i></span></div>`;
function shopCard(p = SHOP) {
  return new Promise((resolve) => {
    const node = el(`${logos(p)}
      <p class="cn-eye">Integracja</p>
      <h4>${p.cta}</h4>
      <p class="lead">${p.lead}</p>
      <ul class="cn-list">${p.bullets.map(([k, d]) => `<li><b>${k}</b><em>${d}</em></li>`).join("")}</ul>
      <div class="cn-actions"><button class="go">${p.cta}</button><button class="no">Nie teraz</button></div>`, "card connect");
    node.dataset.p = p.key;
    const finish = (ok, text) => { unregister(); node.querySelectorAll("button").forEach((b) => (b.disabled = true)); you(text || (ok ? p.cta : "Nie teraz")); resolve(ok); };
    node.querySelector(".go").onclick = () => finish(true);
    node.querySelector(".no").onclick = () => finish(false);
    wait(900).then(() => { add(node); register((text) => finish(true, text)); }).catch(() => {});
  });
}

const BRAND = '<span class="sf-brand" aria-label="Boski"><i></i></span>';
const interstitial = (title, sub, extra, brand = BRAND, top = "", noCancel = false) =>
  `<div class="sf-inter">${brand}<div class="sf-mid">${top}<h3>${title}</h3><p>${sub}</p>${extra}</div>${noCancel ? '<span class="sf-cancel ghost">Anuluj</span>' : '<button class="sf-cancel" data-cancel>Anuluj</button>'}</div>`;
function showFlow(html) { flow.innerHTML = html; flow.classList.add("on"); }
function hideFlow() { flow.classList.remove("on"); }

function connectShop(p = SHOP) {
  return new Promise(async (resolve) => {
    flow.dataset.p = p.key;
    flow.onclick = (e) => { if (e.target.closest("[data-cancel]")) { hideFlow(); resolve(false); } };
    try {
      showFlow(interstitial(`Łączenie z ${p.pay}`, `Przekierowuję do ${p.name}…`, '<i class="dotline"></i>', p.brand || BRAND, logos(p)));
      await wait(1900);
      showFlow(`<div class="sf-perm">
        ${logos(p)}
        <h3>Połącz z Boski</h3>
        <p class="lead">Sprawdź uprawnienia przed kontynuacją</p>
        <span class="mail"><i></i>dawid@example.com</span>
        <ul class="perms">${PERMS.map(([t, d]) => `<li><span><b>${t}</b><em>${d}</em></span></li>`).join("")}</ul>
        <button class="sf-go" id="sfgo">Kontynuuj</button>
        <button class="sf-no" data-cancel>Anuluj</button>
        <p class="legal">${p.name} udostępni Boskiemu dostęp opisany powyżej. <u>Więcej</u></p>
      </div>`);
      await new Promise((r) => { $("#sfgo").onclick = r; });
      showFlow(interstitial(`Łączenie z ${p.pay}`, `Łączę ${p.acct} z Boski…`, '<i class="dotline"></i>', p.brand || BRAND, logos(p)));
      await wait(1500);
      showFlow(interstitial(`${p.name} połączony`, "Wracam do Boski…", '<i class="bar"></i>', p.brand || BRAND, `<div class="okring"><span class="okmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.500 12.500 4.200 4.200L18.500 8" pathLength="1"/></svg></span></div>`, true));
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
  faceid.classList.add("ok"); $("#faceidLabel").textContent = "Zapłacono";
  await wait(650);
  faceid.classList.remove("on");
}
// Push banner. opts.boski -> Boski icon; opts.sticky -> stays until tapped, returns a promise that resolves on tap.
function showPush(title, body, opts = {}) {
  push.innerHTML = `<span class="app ${opts.boski ? "boski" : ""}">${opts.boski ? '<i></i>' : "IN"}</span><span><b>${title}<em>teraz</em></b><span>${body}</span></span>`;
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
const NAMES = { 1: "Shop", 2: "InPost Pay", 3: "Zaufana osoba", 4: "Status i zwrot" };
let scn = [1, 2, 3, 4].includes(+new URLSearchParams(location.search).get("s")) ? +new URLSearchParams(location.search).get("s") : 1;
function setScenario(n) {
  scn = n;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === n));
  try { history.replaceState(null, "", n === 1 ? location.pathname : `?s=${n}`); } catch (e) { /* file:// */ }
  play();
}

async function endOfScenario(cur) {
  const nx = (cur % 4) + 1;
  const pick = await choose(["Zagraj jeszcze raz", `Scenariusz ${nx}: ${NAMES[nx]}`]);
  setScenario(pick === 1 ? nx : cur);
}

function trackHtml(steps, done) {
  return `<ul class="track">${steps.map((t, i) => {
    const cls = i < done ? "done" : i === done ? "now" : "";
    return `<li class="${cls}"><i></i>${t}</li>`;
  }).join("")}</ul>`;
}

// Scenario 3: trusted person -> shared calendar (Kopernik) -> ask Justyna's Boski for tickets -> interactive qty card
const parseEmail = (t) => (t.match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/) || [])[0] || null;
const TICKET_ADULT = 42, TICKET_CHILD = 28;
const ticketTotal = (a, c) => a * TICKET_ADULT + c * TICKET_CHILD;

// Each step gets a different ASCII vibe
async function liveFetchCard({ steps, resultTitle, resultSub, resultTone = "empty" }) {
  const node = await card(`
    <div class="live-top">
      <div class="live-agents" aria-hidden="true">
        <span class="av sm boski-av"><i></i></span>
        <span class="live-link">${ARROW}</span>
        <span class="av sm">J</span>
      </div>
      <div class="live-top-copy">
        <div class="v">Boski → Boski Justyny</div>
        <div class="k">Zapytanie o bilety · skrzynka + kalendarz</div>
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
    <div class="tr-head">Bilety · Centrum Nauki Kopernik</div>
    <div class="qty-row" data-kind="adults">
      <span class="qty-meta"><b>Dorośli</b><em>${zl(TICKET_ADULT)} / os.</em></span>
      <div class="qty-ctrl">
        <button type="button" class="qty-btn" data-d="-1" aria-label="Mniej dorosłych">−</button>
        <span class="qty-n">${adults0}</span>
        <button type="button" class="qty-btn" data-d="1" aria-label="Więcej dorosłych">+</button>
      </div>
    </div>
    <div class="qty-row" data-kind="kids">
      <span class="qty-meta"><b>Dzieci</b><em>${zl(TICKET_CHILD)} / os. · do 18 lat</em></span>
      <div class="qty-ctrl">
        <button type="button" class="qty-btn" data-d="-1" aria-label="Mniej dzieci">−</button>
        <span class="qty-n">${kids0}</span>
        <button type="button" class="qty-btn" data-d="1" aria-label="Więcej dzieci">+</button>
      </div>
    </div>
    <div class="row qty-fetch"><span class="k">Cena z cennika CNK</span><span class="v ml-auto qty-price">${zl(ticketTotal(adults0, kids0))}</span></div>
    <button class="cta qty-go" type="button">Kup bilety</button>`, "card qty");
  let adults = adults0, kids = kids0;
  const priceEl = node.querySelector(".qty-price");
  const fetchRow = node.querySelector(".qty-fetch .k");
  const sync = (flash) => {
    node.querySelector('[data-kind="adults"] .qty-n').textContent = adults;
    node.querySelector('[data-kind="kids"] .qty-n').textContent = kids;
    priceEl.textContent = zl(ticketTotal(adults, kids));
    if (flash) {
      fetchRow.textContent = "Pobieram cenę…";
      priceEl.classList.add("pulse");
      clearTimeout(sync._t);
      sync._t = setTimeout(() => {
        fetchRow.textContent = "Cena z cennika CNK";
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
  await say("Cześć Dawid! Lepiej zaplanuję Ci czas, jeśli będę wiedzieć, co ustalasz z kimś bliskim.");
  await say("Dodajmy Zaufaną osobę. Widzę tylko to, co wspólnie ustawicie, np. wspólny kalendarz. Kim jest dla Ciebie ta osoba?");
  const rels = ["Partner", "Rodzina", "Przyjaciel"];
  const relation = rels[await choose(rels)];

  let email = null;
  if (relation === "Partner") {
    await say("W Twoich kontaktach mam Justyna z dopiskiem „Bejbe”, czy to ona?", 1700, "Przeglądam Twoje kontakty");
    await card(`<div class="row"><span class="av">J</span><span><div class="v">Justyna <em class="nick">Bejbe</em></div><div class="k">Kontakty · justyna@example.com</div></span></div>`, 400);
    if ((await choose(["Tak, to ona", "Nie, podam inny e-mail"])) === 0) email = "justyna@example.com";
  }
  if (!email) {
    await say(`Okej. Podaj adres e-mail tej osoby (${relation.toLowerCase()}), wyślę zaproszenie.`);
    email = parseEmail(await typed("np. justyna@example.com", ["justyna@example.com"])) || "justyna@example.com";
  }

  await say(`Wysyłam zaproszenie na ${email}.`, 1700, "Wysyłam zaproszenie");
  const inv = await card(`
    <div class="row"><span class="av">${email[0].toUpperCase()}</span><span><div class="v who">${email}</div><div class="k">Zaufana osoba · ${relation}</div></span><span class="status wait ml-auto">Oczekuje</span></div>
    <div class="row"><span class="k">Co zobaczy ta osoba</span><span class="v ml-auto">Wspólny kalendarz</span></div>`, 500);
  await say("Zaproszenie wysłane. Dam znać, gdy zostanie potwierdzone.");

  await wait(2200);
  add(el("Fri 16 Oct at 8:21", "stamp"));
  showPush("Boski", "Justyna potwierdziła zaproszenie.", { boski: true });
  inv.querySelector(".av").firstChild.textContent = "J";
  inv.querySelector(".who").textContent = "Justyna";
  const st = inv.querySelector(".status"); st.textContent = "Połączono"; st.classList.replace("wait", "ok");
  await say(`Justyna potwierdziła zaproszenie. Od teraz jest Twoją Zaufaną osobą (${relation.toLowerCase()}), a ja widzę Wasz wspólny kalendarz.`, 1200);

  await wait(1200);
  add(el("Fri 16 Oct at 19:40", "stamp"));
  await say("Justyna dodała do wspólnego kalendarza wyjście do Centrum Nauki Kopernik.", 2400, "Sprawdzam wspólny kalendarz");
  await card(`
    <div class="row"><span class="cal"><b>26</b><small>PAŹ</small></span><span><div class="v">Centrum Nauki Kopernik</div><div class="k">Niedziela, 26 października · 11:00</div></div></div>
    <div class="row"><span class="av sm">J</span><span class="k">Dodała Justyna · wspólny kalendarz</span></div>`, 500);

  await say("Sprawdzam, czy macie już bilety. Zapytam też Boskiego Justyny, czy coś wpadło na jej skrzynkę.", 1600, "Łączę się z Boskim Justyny");
  await liveFetchCard({
    steps: [
      "Łączę z Boskim Justyny",
      "Przeszukuję mail pod kątem CNK / Kopernik",
      "Sprawdzam załączniki i potwierdzenia",
    ],
    resultTitle: "Brak biletów",
    resultSub: "W skrzynce Justyny nic o Koperniku. Kalendarz ma tylko event, bez rezerwacji.",
    resultTone: "empty",
  });

  await say("Nie macie jeszcze biletów. Mogę od razu ogarnąć kupno?");
  if ((await choose(["Tak, ogarnij bilety", "Nie, dzięki"])) !== 0) {
    await say("OK. Jak zmienisz zdanie, napisz.");
    await endOfScenario(3);
    return;
  }

  await say("Ile osób idzie? Ustaw w karcie. Cena dociąga się na żywo z cennika CNK.");
  const { node: qty, get } = ticketQtyCard(2, 1);
  add(qty);
  const go = qty.querySelector(".qty-go");
  const bought = new Promise((resolve) => {
    go.onclick = () => { unregister(); hideOptions(); go.disabled = true; resolve(get()); };
  });
  await wait(500);

  // User corrects via chat — agent updates the card, then taps buy
  you("daj 3 dorosłych, weźmiemy babcię");
  await wait(400);
  const updating = add(el(`<i class="mark"></i><span class="txt" data-text="Aktualizuję rezerwację">Aktualizuję rezerwację</span>`, "think"));
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

  const kidsLabel = counts.kids === 1 ? "1 dziecko" : counts.kids ? `${counts.kids} dzieci` : "";
  const kidsShort = counts.kids === 1 ? "1× dziecko" : counts.kids ? `${counts.kids}× dziecko` : "";
  await say(`Ok, fajnie, że rodzinny wypad. Biorę ${counts.adults}× dorosły${kidsShort ? ` i ${kidsShort}` : ""}, razem ${zl(counts.total)}.`, 1400, "Łączę się z kasą CNK");

  await card(`
    <div class="row"><span class="pin">🎟️</span><span><div class="v">Bilety CNK · 26 paź, 11:00</div><div class="k">${counts.adults} dorosłych${kidsLabel ? ` · ${kidsLabel}` : ""} · ${zl(counts.total)}</div></span><span class="status ok ml-auto">Zarezerwowane</span></div>
    <div class="row"><span class="k">Wysłane do Justyny</span><span class="v ml-auto">Kalendarz + mail</span></div>`, 500);
  await say("Gotowe. Justyna dostanie potwierdzenie na maila, a w kalendarzu macie już bilety.");
  await endOfScenario(3);
}

// Scenario 1: reorder through Shop (connect Shop, remember a locker, pick food by age/weight/weeks)
async function scenario1() {
    add(el("Thu 15 Oct at 21:21", "stamp"));
    await wait(500);
    await say("Cześć Dawid! Luna ma karmy jeszcze na jakieś 4 dni.");
    await say("Chcesz, żebym zamówił nową?");
    let c = await choose(["Tak, zamów", "Przypomnij jutro"]);
    while (c === 1) {
      await say("Jasne, odezwę się jutro rano.");
      c = await choose(["Jednak zamów teraz"]);
    }

    await say("Najłatwiejszy i kompletnie bezobsługowy z Twojej strony jest Shop. Poprowadzę cały proces sam, a Ty tylko potwierdzisz. Zaproponuję Ci go:", 1300);
    let connected = false;
    while (!connected) {
      if (await shopCard()) connected = await connectShop();
      if (!connected) await say("Bez Shopa nie zamówię, ale możemy wrócić do tego, kiedy chcesz.");
    }

    await say("Gotowe, Shop jest połączony. Adres i karta zostały zaczytane.", 1800, "Czytam adres i kartę z Shopa");
    await say("Ile maksymalnie w miesiącu mogę wydać na zakupy? Wpisz kwotę albo wybierz.");
    const budget = parseBudget(await typed("np. 500 zł", ["300 zł", "500 zł", "1000 zł"])) || 500;
    await say(`Zapisane. Do ${zl0(budget)} miesięcznie kupuję sam, a przy większej kwocie zawsze zapytam.`, 900);
    await memSave(ICON.wallet, `Budżet miesięczny ${zl0(budget)}`);

    await say("Jak wolisz dostawę: do paczkomatu (zwykle taniej) czy kurierem (zwykle drożej)?");
    const courier = (await choose(["Paczkomat", "Kurier"])) === 1;
    let picked = null, ship;
    if (!courier) {
      await say("Jedna rzecz: Shop Pay nie pozwala ustawić domyślnego paczkomatu, wybiera się go dopiero przy zamówieniu. Zapytam więc raz i zapamiętam.");
      await say(`Z Twojego adresu w Shopie (ul. Puławska 10, Warszawa) najbliżej jest ${LOCKERS[0].id}, ${LOCKERS[0].dist} od domu (${LOCKERS[0].addr}). Zapisać go?`, 1800, "Szukam paczkomatów przy Twoim adresie");
      picked = LOCKERS[0];
      if ((await choose([`Tak, ${LOCKERS[0].id}`, "Wybierz z mapy"])) === 1) {
        await say("Trzy najbliższe paczkomaty. Wybierz z listy albo dotknij pinezki na mapie:", 800);
        picked = await pickOnMap();
      }

      await say(`Zapisane. Przy zamówieniach z InPostem będę wybierać ${picked.id} (${picked.addr}).`, 700);
      await memSave(ICON.pin, `Paczkomat ${picked.id}`);

      ship = {
        price: DELIVERY,
        label: `InPost ${picked.id} (z pamięci)`,
        confirm: `Zamówione. Paczka powinna być w Twoim paczkomacie ${picked.id} w ciągu 48 godzin.`,
      };
    } else {
      await say("Okej, kurier. Biorę adres z Twojego konta w Shopie: ul. Puławska 10, Warszawa. Dobrze?", 1700, "Czytam adres z Shopa");
      await choose(["Tak, ten adres"]);
      await say("Zapisane. Przy zamówieniach z kurierem będę wysyłać na ten adres.", 700);
      await memSave(ICON.truck, "Kurier · ul. Puławska 10, Warszawa");
      ship = {
        price: DELIVERY_COURIER,
        label: "Kurier InPost, ul. Puławska 10 (z pamięci)",
        confirm: "Zamówione. Paczka powinna być u Ciebie w ciągu 48 godzin.",
      };
    }

    await say("Żeby dobrać karmę, potrzebuję dwóch rzeczy: ile Luna ma lat i ile waży? Wpisz to w wiadomości.");
    const dog = parseDog(await typed("np. 4 lata, 28 kg", ["4 lata, 28 kg", "8 lat, 32 kg"])) || { age: "adult", kg: 25 };
    await say(`Zapisane: ${AGES.find((a) => a[0] === dog.age)[1].toLowerCase()}, ${dog.kg} kg. Szukam karm w ${STORE}.`, 2000, `Szukam karm w ${STORE}`);
    await say("Na ile tygodni ma Ci starczyć karma? Wpisz liczbę tygodni albo wybierz.");
    const weeks = parseWeeks(await typed("np. 8 tygodni", ["4 tygodnie", "8 tygodni", "12 tygodni"])) || 8;
    const dailyG = Math.round((dog.kg * GRAMS_PER_KG[dog.age]) / 5) * 5;
    const needKg = Math.round((dailyG * 7 * weeks) / 100) / 10;
    await say(`Luna zje ok. ${dailyG} g dziennie, więc na ${weeks} tyg. potrzeba około ${String(needKg).replace(".", ",")} kg. Dobieram worki.`, 2000, "Liczę porcje i dobieram wielkość worka");
    const list = pick3(dog.age, dog.kg).map((p) => plan(p, dailyG, weeks));
    await say("Wybrałem 3 karmy, każda w worku na tyle tygodni, ile chcesz. Pierwsza jest najlepiej dopasowana. Przesuń i wybierz:");
    const product = await pickProduct(list);
    await say("Dobry wybór.", 600);

    const preTotal = product.price + ship.price;
    await say(preTotal > budget ? `Podsumowanie. To przekracza Twój miesięczny budżet o ${zl0(preTotal - budget)}, więc zamówię dopiero po Twoim OK:` : "Podsumowanie. Zamawiam dopiero po Twoim OK:", 1500, "Liczę koszty z dostawą");
    const total = product.price + ship.price;
    const sum = await card(`
      <div class="row"><div class="thumb"><img src="${product.img}" alt=""></div><div><div class="v">${product.name}</div><div class="k">${product.flavour} · ${product.note}</div></div></div>
      <div class="row"><span class="k">${ship.label}</span><span class="v ml-auto">${zl(ship.price)}</span></div>
      <div class="row"><span class="k">Płatność</span><span class="v ml-auto">Visa ••4242</span></div>
      <div class="row"><span class="k">Z budżetu ${zl0(budget)}</span><span class="v ml-auto ${budget < total ? "over" : ""}">${budget >= total ? "zostanie " + zl0(budget - total) : "przekracza o " + zl0(total - budget)}</span></div>
      <div class="row total"><span class="v">Razem</span><span class="v ml-auto">${zl(total)}</span></div>
      <button class="cta" style="margin-top:8px">Zatwierdź i zapłać</button>`);
    await new Promise((resolve) => {
      sum.querySelector(".cta").onclick = () => { unregister(); resolve(); };
      register((text) => { unregister(); you(text); resolve(); });
    });
    sum.querySelector(".cta").disabled = true;
    await payWithFaceId();

    await say(ship.confirm, 1600, "Składam zamówienie");
    await choose(["Dzięki!"]);
    await say("Nie ma sprawy. Dam znać, jak karma znów będzie się kończyć.", 700);
    await endOfScenario(1);
}

// Scenario 2: Boski ships InPost Pay -> push -> connect -> ready cart, only a pay card
async function scenario2() {
  add(el("Thu 15 Oct at 21:21", "stamp"));
  add(el("Zamówione. Paczka będzie w Paczkomacie WAW214M jutro do 14:00.", "msg in"));
  add(el("Dzięki!", "msg out"));
  add(el("Nie ma sprawy.", "msg in"));
  await wait(1200);
  await showPush("Boski", "Wdrożyliśmy integrację z InPost Pay. Zobacz, co to zmienia w Twoich zakupach.", { boski: true, sticky: true });

  add(el("Fri 16 Oct at 9:41", "stamp"));
  await say("Cześć Dawid! Mam nowość: wdrożyliśmy integrację z InPost Pay.");
  await say("Ostatnio kupowaliśmy karmę dla Luny przez Shop. Jeśli połączymy InPost Pay, będę mógł szukać w większej liczbie sklepów i znajdować taniej.");
  let connected = false;
  while (!connected) {
    if (await shopCard(INPOST)) connected = await connectShop(INPOST);
    if (!connected) await say("Okej, wrócimy do tego, kiedy zechcesz. Karmę nadal kupię przez Shop.");
  }

  await say("Gotowe, InPost Pay jest połączony.", 1400, "Łączę się z InPost Pay");
  await say("Znalazłem tę samą karmę taniej: PetHub ma ją za 171 zł, w Zoo Corner było 189 zł. Przygotowałem koszyk i wybrałem Twój paczkomat WAW214M. Zostało tylko potwierdzić w InPost Pay.", 2800, "Porównuję ceny w sklepach z InPost Pay");
  const cart = await card(`
    <div class="row"><span class="ipicon"><img src="inpost-icon.png" alt=""></span><span><div class="v">Koszyk gotowy</div><div class="k">PetHub · InPost Pay</div></span><span class="save ml-auto">−18 zł</span></div>
    <div class="row"><div class="thumb"><img src="${F(7)}" alt=""></div><div><div class="v">Nordic Paws Adult Large</div><div class="k">Łosoś i ryż · 12 kg</div></div><span class="v ml-auto">${zl(171)}</span></div>
    <div class="row"><span class="pin">${ICON.pin}</span><span><div class="k">Dostawa</div><div class="v">Paczkomat WAW214M</div></span><span class="k ml-auto">z pamięci</span></div>
    <button class="cta pay">Otwórz w InPost Pay</button>`, 700);
  const opened = new Promise((r) => {   // live as soon as the card is shown
    cart.querySelector(".pay").onclick = () => r("open");
    register((text) => { you(text); r("open"); });
  });
  await say("Tak będzie wyglądać koszyk w InPost Pay. Możesz go otworzyć i dokończyć płatność albo zignorować tę kartę.", 900);

  const choice = await Promise.race([opened, new Promise((r) => showOptions(["Zignoruj"], () => r("ignore"), false))]);
  hideOptions(); unregister();
  const btn = cart.querySelector(".pay"); btn.disabled = true;
  if (choice === "open") {
    await showShot();   // the InPost Pay cart (screenshot); a tap brings the user back to Boski
    btn.textContent = "Otwarto w InPost Pay"; btn.classList.add("paid");
    await say("Płatność przeszła, zamówienie jest opłacone w InPost Pay. Paczka jedzie do WAW214M, dam znać, gdy będzie gotowa.", 3200, "Sprawdzam status zamówienia w InPost Pay");
    const steps = ["Zamówienie opłacone", "Paczka nadana", "W drodze do Paczkomatu", "Gotowa do odbioru"];
    const trk = await card(`<div class="tr-head">Status paczki</div>${trackHtml(steps, 0)}`, 500);
    const items = [...trk.querySelectorAll(".track li")];
    for (let i = 0; i < 2; i++) {
      await wait(1000);
      items[i].classList.remove("now");
      items[i].classList.add("done");
      if (items[i + 1]) items[i + 1].classList.add("now");
    }
  } else {
    you("Zignoruj"); btn.textContent = "Zignorowano";
    await say("Jasne, koszyk zostaje w InPost Pay. Dam znać, jeśli cena jeszcze spadnie.");
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
  await say(`OK. Otwieram reklamację w ${sweater.store} i nie odpuszczę, aż zamkną sprawę.`, 1600, `Otwieram reklamację · ${sweater.store}`);
  const claimCard = await card(`
    <div class="row"><span class="thumb th-plain">${sweater.emoji}</span><span><div class="v">${sweater.name}</div><div class="k">${sweater.store} · ${zl(sweater.price)}</div></span><span class="status wait ml-auto">W toku</span></div>
    <div class="row"><span class="k">Powód</span><span class="v ml-auto">${reason}</span></div>`, 400);

  await say(`Napisałem do ${sweater.store}: „${reason}. Proszę o wymianę albo zwrot.” Czekam na odpowiedź.`, 2000, `Piszę do ${sweater.store}`);
  await wait(1600);
  add(el("Sat 18 Oct at 14:22", "stamp"));
  await say(`${sweater.store} odpisał: potrzebują zdjęcia wady. Wysyłam z Twojej galerii.`, 1800, "Wysyłam zdjęcie wady");
  await choose(["OK, wyślij zdjęcie"]);

  await say("Zdjęcie poszło. Dopinam wątek, nie zostawiam tego na „odezwiemy się”.", 1600, `Follow-up · ${sweater.store}`);
  await wait(1800);
  add(el("Sat 18 Oct at 16:05", "stamp"));
  await say(`${sweater.store} napisał, że to „normalne zużycie”. Odpisałem z regulaminem i zdjęciami po praniu. Trzymam sprawę otwartą.`, 2400, "Odwołuję decyzję sklepu");
  await wait(1600);
  add(el("Sat 18 Oct at 17:40", "stamp"));
  await say("Ustąpili. Do wyboru: zwrot 289 zł na kartę albo wymiana na rozmiar L.", 1400, "Negocjuję zamknięcie");
  const refund = (await choose(["Weź zwrot 289 zł", "Wymiana na L"])) === 0;
  await say(refund
    ? "Przyjąłem zwrot. Środki mają wrócić w 3–5 dni roboczych. Potwierdzę, jak wejdą."
    : "Zamówiłem wymianę na L. Paczka powinna być w paczkomacie w ciągu 48 godzin.", 1800, `Zamykam reklamację · ${sweater.store}`);

  const st = claimCard.querySelector(".status");
  if (st) { st.textContent = "Załatwione"; st.classList.replace("wait", "ok"); }
  await memSave(ICON.ok, refund ? "Reklamacja · Sweter · zwrot" : "Reklamacja · Sweter · wymiana");
  await say("Załatwione. Answear omijamy. Jak sklep znowu będzie kręcił przy zwrocie, wrócę do wątku sam.");
}

// Scenario 4: status + returns/claims (last 10, sweater complaint until resolved)
async function scenario4() {
  const stepsLocker = ["Zamówienie przyjęte", "Paczka nadana", "W drodze do Paczkomatu", "Gotowa do odbioru"];
  const stepsCourier = ["Zamówienie przyjęte", "Paczka nadana", "Kurier w drodze", "Doręczona"];
  const stepsDone = ["Zamówienie przyjęte", "Paczka nadana", "W drodze", "Doręczona"];
  const sweater = {
    name: "Sweter wełniany merino", sub: "Granatowy · M", store: "Answear", who: "Ty",
    emoji: "🧶", dest: "Paczkomat WAW214M", status: "Doręczony", when: "2 paź",
    steps: stepsDone, done: 4, price: 289,
    note: "Doręczony 2 października. Możesz zgłosić reklamację: agent dogada sprawę ze sklepem do końca.",
    claimable: true,
  };
  const last10 = [
    { name: "Nordic Paws Adult Large", sub: "12 kg", store: "Zoo Corner", emoji: "🐕", img: F(7), dest: "WAW214M", status: "W drodze", when: "15 paź", steps: stepsLocker, done: 2, price: 189, note: "Karma dla Luny." },
    { name: "Oral-B iO Series 7", sub: "Czarna", store: "MediaExpert", emoji: "🪥", dest: "Kurier", status: "Nadana", when: "16 paź", steps: stepsCourier, done: 1, price: 649, note: "W drodze do Ciebie." },
    sweater,
    { name: "Kawa Ethiope 1 kg", sub: "Ziarnista", store: "CoffeeDesk", emoji: "☕", dest: "Kurier", status: "Doręczona", when: "28 wrz", steps: stepsDone, done: 4, price: 78, note: "" },
    { name: "Legowisko Ortho L", sub: "Grafit", store: "Zoo Corner", emoji: "🛏️", dest: "WAW214M", status: "Doręczona", when: "20 wrz", steps: stepsDone, done: 4, price: 219, note: "" },
    { name: "Słuchawki Sony WH-1000XM5", sub: "Czarne", store: "MediaExpert", emoji: "🎧", dest: "Kurier", status: "Doręczona", when: "12 wrz", steps: stepsDone, done: 4, price: 1299, note: "" },
    { name: "Olej z łososia 1 L", sub: "Dla psa", store: "Zoo Corner", emoji: "🧴", dest: "WAW214M", status: "Doręczona", when: "5 wrz", steps: stepsDone, done: 4, price: 64, note: "" },
    { name: "Buty Nike Pegasus 41", sub: "42", store: "Sizeer", emoji: "👟", dest: "Kurier", status: "Doręczona", when: "28 sie", steps: stepsDone, done: 4, price: 549, note: "" },
    { name: "Powerbank Anker 20K", sub: "Czarny", store: "Amazon", emoji: "🔋", dest: "WAW214M", status: "Doręczona", when: "18 sie", steps: stepsDone, done: 4, price: 159, note: "" },
    { name: "Herbata Sencha 100 g", sub: "Organiczna", store: "Pękala", emoji: "🍵", dest: "Kurier", status: "Doręczona", when: "10 sie", steps: stepsDone, done: 4, price: 42, note: "" },
  ];
  const hers = [{
    name: "Frosch zestawy czystości", sub: "Uniwersalny + łazienka", store: "Rossmann", who: "Justyna",
    emoji: "🧴", dest: "Paczkomat WAW214M", status: "Gotowa do odbioru", when: "17 paź",
    steps: stepsLocker, done: 3, price: 67.9,
    note: "Zamówione przez Justynę, bo Oksana zgłaszała braki środków czystości.",
  }];

  add(el("Sat 18 Oct at 11:04", "stamp"));
  await wait(400);
  you("Pokaż mi moje 10 ostatnich zamówień");
  await wait(500);
  await say("Oto 10 ostatnich. Możesz kliknąć pozycję, żeby zobaczyć szczegóły.", 1600, "Ładuję historię zamówień");
  bindOrdersCard(await card(ordersListHtml("10 ostatnich zamówień", last10, true), 500), last10);

  await wait(600);
  you("Kurde, ten sweter z Answear po pierwszym praniu do kitu. Zapamiętaj, żeby nie zamawiać z tego miejsca");
  await wait(500);
  await memSave(ICON.bag, "Unikaj · Answear");
  await say("Zapamiętane: nie zamawiam z Answear. Chcesz, żebym od razu złożył reklamację i dogadał to ze sklepem do końca?");
  if ((await choose(["Tak, ogarnij reklamację", "Nie, wystarczy zapamiętać"])) === 0) {
    await claimSweaterFlow(sweater, "Po pierwszym praniu do kitu");
  } else {
    await say("OK. Answear omijamy. Jak zmienisz zdanie w sprawie reklamacji, napisz.");
  }

  await say("Pokazać też zamówienia Justyny?");
  if ((await choose(["Tak, pokaż", "Nie, wystarczy"])) === 0) {
    await say("Justyna zamówiła środki czystości, bo Oksana zgłaszała braki.", 1500, "Sprawdzam zakupy Justyny");
    bindOrdersCard(await card(ordersListHtml("Zamówienia Justyny", hers, false), 500), hers);
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

// ---------- app chrome: menu drawer, Settings, "Add Boski" sheet, attach popover ----------
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
dim.onclick = closeAdd; addsheet.querySelector(".close").onclick = closeAdd; addsheet.querySelector(".addimsg").onclick = closeAdd;
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
