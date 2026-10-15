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
  x: '<svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m2 2 10 10M12 2 2 12"/></svg>',
  ok: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
};

const STORE = "Zoo Corner"; // merchant found through Shop
// age: puppy | adult | senior, kg: [min, max] of the dog's weight the food is for
// Photos hotlinked from Unsplash (Unsplash License): Rafael Rodrigues, Ayla Verschueren, Michael G. Not matched to the product text on purpose.
const U = ["1764249453874-46864677b10e", "1714068691210-073dc52c6c1d", "1632236568054-12f36ecee2f6", "1632236568025-1256513514b7", "1714068691256-cd3d65f97795", "1649923625461-2638b4a86d8b"]
  .map((id) => `https://images.unsplash.com/photo-${id}?w=640&q=70&auto=format&fit=crop`);
// ppk = price per kg (zł), sizes = bag sizes in kg
const PRODUCTS = [
  { name: "Nordic Paws Puppy", img: U[5], flavour: "Kurczak", ppk: 15.9, sizes: [3, 10, 15], tag: "Szczenięta", age: "puppy", kg: [8, 40], bg: "var(--color-green-3)" },
  { name: "Nordic Paws Puppy Large", img: U[3], flavour: "Łosoś", ppk: 16.6, sizes: [3, 12, 15], tag: "Duże rasy", age: "puppy", kg: [20, 90], bg: "var(--color-canary-yellow-5)" },
  { name: "Nordic Paws Puppy Mini", img: U[4], flavour: "Kurczak", ppk: 23, sizes: [1, 3], tag: "Małe rasy", age: "puppy", kg: [1, 10], bg: "var(--color-blue-3)" },
  { name: "Nordic Paws Mini", img: U[4], flavour: "Kaczka i ryż", ppk: 26.3, sizes: [1.5, 3, 7], tag: "Małe rasy", age: "adult", kg: [1, 10], bg: "var(--color-blue-3)" },
  { name: "Wild Trail Small Grain Free", img: U[1], flavour: "Indyk", ppk: 38, sizes: [1.5, 5], tag: "Bez zbóż", age: "adult", kg: [1, 12], bg: "var(--color-green-3)" },
  { name: "Nordic Paws Medium", img: U[3], flavour: "Kurczak i ryż", ppk: 16.1, sizes: [3, 8, 12], tag: "Średnie rasy", age: "adult", kg: [8, 25], bg: "var(--color-orange-3)" },
  { name: "Nordic Paws Adult Large", img: U[0], flavour: "Łosoś i ryż", ppk: 15.75, sizes: [3, 12, 15], tag: "Ostatnio kupowana", age: "adult", kg: [20, 90], bg: "var(--color-canary-yellow-5)" },
  { name: "Nordic Paws Active", img: U[1], flavour: "Kurczak i ryż", ppk: 14.1, sizes: [3, 12, 15], tag: "Taniej", age: "adult", kg: [10, 90], bg: "var(--color-blue-3)" },
  { name: "Wild Trail Grain Free", img: U[2], flavour: "Jagnięcina", ppk: 22.9, sizes: [2, 10, 12], tag: "Bez zbóż", age: "adult", kg: [10, 90], bg: "var(--color-green-3)" },
  { name: "Nordic Paws Senior", img: U[5], flavour: "Indyk i ryż", ppk: 14.9, sizes: [3, 12], tag: "Na stawy", age: "senior", kg: [10, 90], bg: "var(--color-orange-3)" },
  { name: "Nordic Paws Senior Light", img: U[2], flavour: "Kurczak", ppk: 14.1, sizes: [3, 12, 15], tag: "Mniej kalorii", age: "senior", kg: [1, 90], bg: "var(--color-blue-3)" },
  { name: "Wild Trail Senior Mini", img: U[4], flavour: "Kaczka", ppk: 31.7, sizes: [1.5, 3], tag: "Małe rasy", age: "senior", kg: [1, 10], bg: "var(--color-green-3)" },
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
  return { name: p.name, img: p.img, flavour: p.flavour, tag: p.tag, bg: p.bg, size, qty, price: Math.round(p.ppk * size * qty),
    note: `${qty > 1 ? qty + " × " : ""}${String(size).replace(".", ",")} kg · starczy na ~${covers} tyg.` };
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
  // label -> "Boski is working" line (grey mark + shimmering text); no label -> typing dots
  const t = add(label ? el(`<i class="mark"></i><span class="txt">${label}</span>`, "think") : el("<i></i><i></i><i></i>", "typing"));
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
function showOptions(labels, onPick, hint = true) {
  opIn.innerHTML = `<div class="op-card"><div class="op-head">Wybierz odpowiedź</div>
    ${labels.map((l, i) => `<button class="opt-row" data-i="${i}"><kbd>${i + 1}</kbd><span>${l}</span>${ARROW}</button>`).join("")}
    ${hint ? '<div class="op-hint">Albo wpisz własną odpowiedź poniżej</div>' : ""}</div>`;
  opIn.querySelectorAll(".opt-row").forEach((b) => (b.onclick = () => onPick(+b.dataset.i)));
  optpanel.classList.add("on");
}
function hideOptions() { optpanel.classList.remove("on"); }
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

// Food carousel: swipe / drag, tap "Wybierz". Resolves with the product.
function pickProduct(list) {
  return new Promise((resolve) => {
    const wrap = el(list.map((p, i) => `<article class="pcard" data-i="${i}">
      <div class="pimg"><img src="${p.img}" alt="" draggable="false"><span class="ptag">${p.tag}</span>${i === 0 ? '<span class="best">Najlepsze dopasowanie</span>' : ""}<span class="chk">${ICON.ok.replace('width="26" height="26"', 'width="16" height="16"')}</span></div>
      <div class="pbody"><div class="pn">${p.name}</div><div class="pf">${p.flavour}</div><div class="pnote">${p.note}</div><div class="pprice">${zl(p.price)}</div>
      <button class="cta">Wybierz</button></div></article>`).join(""), "carousel");
    let down = false, sx = 0, sl = 0;
    wrap.onpointerdown = (e) => { if (e.pointerType === "mouse") { down = true; sx = e.clientX; sl = wrap.scrollLeft; wrap.style.scrollSnapType = "none"; } };
    wrap.onpointermove = (e) => { if (down) wrap.scrollLeft = sl - (e.clientX - sx); };
    wrap.onpointerup = wrap.onpointerleave = () => { down = false; wrap.style.scrollSnapType = ""; };
    wrap.querySelectorAll(".cta").forEach((b) => (b.onclick = () => {
      pickIt(+b.closest(".pcard").dataset.i);
    }));
    const pickIt = (i, text) => {
      unregister();
      const p = list[i];
      wrap.querySelectorAll(".cta").forEach((x) => (x.disabled = true));
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

// ---------- Shop connect flow (mirrors the Shop OAuth screens: interstitial -> permissions -> connected) ----------
const PERMS = [
  ["🧺", "Prepare checkouts", "Pre-fill with contact information, phone and address"],
  ["🏠", "View your addresses", null],
  ["💳", "Use wallet for payment", "Use an eligible saved payment method at checkout"],
];
// Integrations that share the same connect screens (only the logo and a few strings change).
const SHOP = { key: "shop", name: "Shop", pay: "Shop Pay", acct: "Shop account", logo: '<span class="shoplogo">shop</span>', cta: "Połącz Shop",
  lead: "Żebym mógł zamawiać za Ciebie, potrzebuję dostępu do Twojego konta Shop.",
  bullets: [["🧺", "Przygotuję koszyk z Twoimi danymi"], ["🏠", "Zobaczę Twoje zapisane adresy"], ["💳", "Zapłacę kartą z portfela Shop"]] };
const INPOST = { key: "inpost", name: "InPost Pay", pay: "InPost Pay", acct: "InPost Pay account", logo: '<span class="shoplogo inpost"><img src="inpost-icon.png" alt="InPost Pay"></span>', brand: '<img class="ipword" src="inpost-logo.png" alt="InPost">', cta: "Połącz InPost Pay",
  lead: "Z InPost Pay znajdę tę samą karmę w większej liczbie sklepów i dopilnuję lepszej ceny.",
  bullets: [["🏪", "Przeszukam więcej sklepów naraz"], ["💸", "Porównam ceny i znajdę taniej"], ["🛒", "Przygotuję koszyk, Ty tylko potwierdzisz w InPost Pay"]] };
const logos = (p) => `<div class="sf-logos">${p.logo}<span class="dotgrid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="applogo"><img src="boski-logo-black.svg" alt="Boski"></span></div>`;
// Card that asks to connect an integration. Resolves true on the CTA, false on "Nie teraz".
function shopCard(p = SHOP) {
  return new Promise((resolve) => {
    const node = el(`${logos(p)}
      <h4>${p.cta}</h4>
      <p class="lead">${p.lead}</p>
      <ul>${p.bullets.map(([i, t]) => `<li><span>${i}</span>${t}</li>`).join("")}</ul>
      <button class="go">${p.cta}</button><button class="no">Nie teraz</button>`, "card connect");
    node.dataset.p = p.key;
    const finish = (ok, text) => { unregister(); node.querySelectorAll("button").forEach((b) => (b.disabled = true)); you(text || (ok ? p.cta : "Nie teraz")); resolve(ok); };
    node.querySelector(".go").onclick = () => finish(true);
    node.querySelector(".no").onclick = () => finish(false);
    wait(900).then(() => { add(node); register((text) => finish(true, text)); }).catch(() => {});
  });
}

const BRAND = '<img class="sf-brand" src="boski-logo-black.svg" alt="Boski">';
const interstitial = (title, sub, extra, brand = BRAND, top = "", noCancel = false) => `<div class="sf-inter">${brand}<div class="sf-mid">${top}<h3>${title}</h3><p>${sub}</p>${extra}</div>${noCancel ? '<span class="sf-cancel ghost">Cancel</span>' : '<button class="sf-cancel" data-cancel>Cancel</button>'}</div>`;
function showFlow(html) { flow.innerHTML = html; flow.classList.add("on"); screen.classList.add("light"); }
function hideFlow() { flow.classList.remove("on"); screen.classList.remove("light"); }

// resolves true when connected, false when cancelled
function connectShop(p = SHOP) {
  return new Promise(async (resolve) => {
    flow.dataset.p = p.key;
    flow.onclick = (e) => { if (e.target.closest("[data-cancel]")) { hideFlow(); resolve(false); } };
    try {
      showFlow(interstitial(`Connecting ${p.pay}`, `Taking you to ${p.name} to sign in.`, '<i class="dotline"></i>', p.brand, logos(p)));
      await wait(1900);
      showFlow(`<div class="sf-perm">
        ${logos(p)}
        <h3>Connect Boski</h3><p class="lead">Review permissions before continuing</p>
        <span class="mail"><i></i>dawid@example.com</span>
        <ul class="perms">${PERMS.map(([i, t, d]) => `<li><span class="pi">${i}</span><span><b>${t}</b><em>${d || `All addresses saved to your ${p.acct}`}</em></span></li>`).join("")}</ul>
        <button class="sf-go" id="sfgo">Continue</button>
        <button class="sf-no" data-cancel>Cancel</button>
        <p class="legal">By continuing, you agree that ${p.name} will give Boski the access described above. <u>Learn more</u>.</p></div>`);
      await new Promise((r) => { $("#sfgo").onclick = r; });
      showFlow(interstitial(`Connecting ${p.pay}`, `Linking your ${p.acct} to Boski.`, '<i class="dotline"></i>', p.brand, logos(p)));
      await wait(1500);
      showFlow(interstitial(`${p.name} connected`, "Taking you back to Boski.", '<i class="bar"></i>', p.brand, `<div class="okring"><span class="okmark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.500 12.500 4.200 4.200L18.500 8" pathLength="1"/></svg></span></div>`, true));
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
const NAMES = { 1: "Shop", 2: "InPost Pay", 3: "Zaufana osoba" };
let scn = [1, 2, 3].includes(+new URLSearchParams(location.search).get("s")) ? +new URLSearchParams(location.search).get("s") : 1;
function setScenario(n) {
  scn = n;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === n));
  try { history.replaceState(null, "", n === 1 ? location.pathname : `?s=${n}`); } catch (e) { /* file:// */ }
  play();
}

async function endOfScenario(cur) {
  const nx = (cur % 3) + 1;
  const pick = await choose(["Zagraj jeszcze raz", `Scenariusz ${nx}: ${NAMES[nx]}`]);
  setScenario(pick === 1 ? nx : cur);
}

// Scenario 3: add a Trusted person (partner) -> invite -> confirmed -> shared calendar event -> restaurant offer
const parseEmail = (t) => (t.match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/) || [])[0] || null;
async function scenario3() {
  add(el("Fri 16 Oct at 8:05", "stamp"));
  await wait(400);
  await say("Cześć Dawid! Lepiej zaplanuję Ci czas, jeśli będę wiedzieć, co ustalasz z kimś bliskim.");
  await say("Dodajmy Zaufaną osobę. Widzę tylko to, co wspólnie ustawicie, np. wspólny kalendarz. Kim jest dla Ciebie ta osoba?");
  const rels = ["Partner", "Rodzina", "Przyjaciel"];
  const relation = rels[await choose(rels)];

  let email = null;
  if (relation === "Partner") {
    // the agent recognises the person in the user's contacts and only asks to confirm
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

  // time passes: the invited person confirms
  await wait(2200);
  add(el("Fri 16 Oct at 8:21", "stamp"));
  showPush("Boski", "Justyna potwierdziła zaproszenie.", { boski: true });
  inv.querySelector(".av").firstChild.textContent = "J";
  inv.querySelector(".who").textContent = "Justyna";
  const st = inv.querySelector(".status"); st.textContent = "Połączono"; st.classList.replace("wait", "ok");
  await say(`Justyna potwierdziła zaproszenie. Od teraz jest Twoją Zaufaną osobą (${relation.toLowerCase()}), a ja widzę Wasz wspólny kalendarz.`, 1200);

  // later: the agent notices a new shared-calendar event
  await wait(1200);
  add(el("Fri 16 Oct at 19:40", "stamp"));
  await say("Justyna dodała do wspólnego kalendarza wyjazd na grzyby na Mazury na weekend.", 2600, "Sprawdzam wspólny kalendarz");
  await card(`
    <div class="row"><span class="cal"><b>24</b><small>PAŹ</small></span><span><div class="v">Grzybobranie na Mazurach 🍄</div><div class="k">Sob–Nie, 24–25 października</div></div></div>
    <div class="row"><span class="av sm">J</span><span class="k">Dodała Justyna · wspólny kalendarz</span></div>`, 500);
  await say("Chcesz, żebym zaplanował jakąś knajpę blisko?");
  if ((await choose(["Tak, poszukaj knajpy", "Nie, dzięki"])) === 0) {
    await say("Znalazłem kilka dobrych miejsc blisko Mazur. Wysyłam Ci jako link, kliknij później, żeby otworzyć w Google Maps.", 2400, "Szukam knajp w okolicy wyjazdu");
    await card(`<a class="row linkrow" href="https://www.google.com/maps/search/?api=1&query=restauracje+Mazury" target="_blank" rel="noopener"><span class="pin">📍</span><span><div class="v">Knajpy blisko Mazur</div><div class="k">google.com/maps</div></span><span class="go-ico ml-auto">${ARROW}</span></a>`, 500);
  } else {
    await say("Okej, daj znać, jeśli zmienisz zdanie.");
  }
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
    add(el(`<div class="row"><span class="pin">💰</span><span><div class="k">Zapisano w pamięci Boski</div><div class="v">Budżet miesięczny ${zl0(budget)}</div></span></div>`, "card"));
    await wait(600);

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
      add(el(`<div class="row"><span class="pin">${ICON.pin}</span><span><div class="k">Zapisano w pamięci Boski</div><div class="v">Paczkomat ${picked.id}</div></span></div>`, "card"));
      await wait(600);

      ship = { price: DELIVERY, label: `InPost ${picked.id} (z pamięci)`,
        confirm: `Zamówione. Paczka będzie w Paczkomacie ${picked.id} jutro do 14:00.`,
        steps: ["Zamówienie przyjęte", "Paczka nadana", "W drodze do Paczkomatu", "Gotowa do odbioru"],
        push: [`Paczka czeka w ${picked.id}.<br>Kod odbioru: 482 913`],
        final: "Paczka już czeka, kod masz w powiadomieniu. Dam znać za jakieś 6 tygodni, że karma znowu będzie się kończyć, i już nie będę pytać o paczkomat." };
    } else {
      await say("Okej, kurier. Biorę adres z Twojego konta w Shopie: ul. Puławska 10, Warszawa. Dobrze?", 1700, "Czytam adres z Shopa");
      await choose(["Tak, ten adres"]);
      await say("Zapisane. Przy zamówieniach z kurierem będę wysyłać na ten adres.", 700);
      add(el(`<div class="row"><span class="pin">${ICON.pin}</span><span><div class="k">Zapisano w pamięci Boski</div><div class="v">Kurier: ul. Puławska 10, Warszawa</div></span></div>`, "card"));
      await wait(600);
      ship = { price: DELIVERY_COURIER, label: "Kurier InPost, ul. Puławska 10 (z pamięci)",
        confirm: "Zamówione. Kurier dowiezie paczkę pod Twoje drzwi jutro między 10:00 a 14:00.",
        steps: ["Zamówienie przyjęte", "Paczka nadana", "Kurier w drodze", "Doręczona"],
        push: ["Kurier jest w drodze.<br>Dostawa dziś między 10:00 a 14:00"],
        final: "Kurier już jedzie, szczegóły masz w powiadomieniu. Dam znać za jakieś 6 tygodni, że karma znowu będzie się kończyć, i już nie będę pytać o sposób dostawy." };
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
    const steps = ship.steps;
    const trk = await card(`<ul class="track">${steps.map((t) => `<li><i></i>${t}</li>`).join("")}</ul>`, 500);
    const items = trk.querySelectorAll("li");
    for (const li of items) { await wait(1300); li.classList.add("done"); }

    showPush("InPost", ship.push[0]);
    await wait(900);
    await say(ship.final);
    await choose(["Dzięki!"]);
    await say("Nie ma sprawy.", 700);
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
    <div class="row"><div class="thumb"><img src="${U[0]}" alt=""></div><div><div class="v">Nordic Paws Adult Large</div><div class="k">Łosoś i ryż · 12 kg</div></div><span class="v ml-auto">${zl(171)}</span></div>
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
    const trk = await card(`<ul class="track">${["Zamówienie opłacone", "Paczka nadana", "W drodze do Paczkomatu", "Gotowa do odbioru"].map((t) => `<li><i></i>${t}</li>`).join("")}</ul>`, 500);
    const items = trk.querySelectorAll("li");
    for (const li of [items[0], items[1]]) { await wait(1000); li.classList.add("done"); }
  } else {
    you("Zignoruj"); btn.textContent = "Zignorowano";
    await say("Jasne, koszyk zostaje w InPost Pay. Dam znać, jeśli cena jeszcze spadnie.");
  }
  await endOfScenario(2);
}

async function play() {
  const id = ++run;
  thread.innerHTML = ""; hideOptions(); hideFlow(); closeChrome(); waiter = null; queued = null; resetInput(); $("#ipshot").classList.remove("on"); $("#ipshot").onclick = null; faceid.classList.remove("on"); push.classList.remove("on", "tap"); push.onclick = null;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === scn));
  try { await ({ 1: scenario1, 2: scenario2, 3: scenario3 }[scn])(); } catch (e) { if (e !== CANCEL) throw e; }
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
play();
