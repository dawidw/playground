// Agentic CRM #1: Review rate. States: idle → menu → working → proposal → done (+ undo).
// All data is made up (the repo is public). Avatars and icons are exported from the Figma libraries.
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => "€" + Math.round(n).toLocaleString("en-US");
const LIMIT = 1100, CURRENT = 1250, MEDIAN = 1080, MIN = 900, MAX = 1300;

const people = [
  ["John Doe", "--", "Freelancer", "🇩🇪 Germany", 900, true, "m1"],
  ["Jaque Laurent", "Laurent, Inc", "Agency", "🇫🇷 France", 1100, true, "m2"],
  ["Anna Weber", "Kienbaum", "Agency", "🇩🇪 Germany", CURRENT, true, "w1"],
  ["Marco Rossi", "Northwind Digital", "Agency", "🇮🇹 Italy", 880, false, "m3"],
  ["Sofia Lind", "--", "Freelancer", "🇸🇪 Sweden", 1050, true, "w2"],
  ["Tomas Novak", "Deloitte Consulting", "Agency", "🇪🇸 Spain", 1400, false, "m4"],
  ["Priya Nair", "Acme Analytics", "Agency", "🇬🇧 United Kingdom", 1150, true, "w3"],
  ["Jonas Novak", "--", "Freelancer", "🇳🇱 Netherlands", 900, false, "w4"],
];
const avatar = (f, cls = "avatar") => `<img class="${cls}" src="avatars/${f}.png" alt="">`;

// ---- Tabela
const rowsEl = $("rows");
people.forEach(([name, supplier, type, country, rate, inProject, av], i) => {
  const row = document.createElement("div");
  row.className = "row";
  row.id = i === 2 ? "row-anna" : "";
  row.innerHTML = `
    <span class="who">${avatar(av)}${name}</span>
    <span>${supplier}</span>
    <span><span class="chip chip-sm ${type === "Agency" ? "chip-info" : "chip-neutral"}">${type}</span></span>
    <span>${country}</span>
    <span class="rate-cell"><b class="rate font-normal" data-rate="${rate}">${fmt(rate)}</b><span class="slot"></span></span>
    <span><span class="chip chip-sm ${inProject ? "chip-success" : "chip-neutral"}">${inProject ? "Yes" : "No"}</span></span>
    <span class="actions"><button class="btn-light">See profile</button><button class="more" aria-label="More">${icon("more-vert")}</button></span>`;
  rowsEl.appendChild(row);
});
// Mobile: the same contractor as a single card
const anna = people[2];
$("mcard").innerHTML = `
  <div class="top">${avatar(anna[6], "avatar avatar-lg")}<div><div class="text-md font-medium">${anna[0]}</div><div class="text-xs text-muted-light">${anna[1]}</div></div></div>
  <div class="meta"><span class="chip chip-info">${anna[2]}</span><span class="chip chip-neutral">${anna[3]}</span><span class="chip chip-success">In project</span></div>
  <div class="facts"><div><small>Daily rate</small><span class="rate-cell"><b class="rate font-normal">${fmt(anna[4])}</b><span class="slot"></span></span></div><div><small>Engagement</small>Agency</div></div>
  <div class="actions"><button class="btn-light">See profile</button><button class="more" aria-label="More">${icon("more-vert")}</button></div>`;
const mq = matchMedia("(max-width: 720px)");
let annaRow, annaRate, annaSlot, annaMore;
function bindTarget() {
  annaRow = mq.matches ? $("mcard") : $("row-anna");
  annaRate = annaRow.querySelector(".rate"); annaSlot = annaRow.querySelector(".slot"); annaMore = annaRow.querySelector(".more");
  annaMore.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.contains("open") ? closeMenus() : openMenu(); });
}

// ---- Menu (main + Agent submenu)
const menu = document.createElement("div"); menu.className = "menu";
const it = (ic, label, extra = "") => `<div class="item"${extra}><span class="lead">${icon(ic)}${label}</span></div>`;
menu.innerHTML = it("edit", "Edit") + it("submit-document", "Request document") + it("task-list", "Worker type assessment") + it("mail-out", "Request self-assessment") + `<div class="sep"></div><div class="item" id="agentItem"><span class="lead">${icon("arrow-reduce-tag")}Agent</span>${icon("nav-arrow-right")}</div><div class="sep"></div><div class="item danger"><span class="lead">${icon("archive")}Archive</span></div>`;
const sub = document.createElement("div"); sub.className = "menu";
sub.innerHTML = it("input-search", "Find project") + it("submit-document", "Request missing documents") + it("task-list", "Check compliance") + it("mail-out", "Review rate", ' id="reviewItem"');
stage.append(menu, sub);
const agentItem = menu.querySelector("#agentItem"), reviewItem = sub.querySelector("#reviewItem");

const rel = (el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
function openMenu() {
  const b = rel(annaMore);
  const w = menu.offsetWidth || 220;
  menu.style.left = Math.max(8, b.x + b.w - w) + "px"; menu.style.top = b.y + b.h + 6 + "px";
  menu.classList.add("open");
}
function openSub() {
  const m = rel(agentItem);
  agentItem.classList.add("hover");
  const sw = sub.offsetWidth || 232;
  sub.style.left = mq.matches ? Math.max(8, m.x + m.w - sw) + "px" : m.x - sw - 8 + "px";
  sub.style.top = mq.matches ? m.y + m.h + 4 + "px" : m.y - 4 + "px";
  sub.classList.add("open");
}
function closeMenus() { menu.classList.remove("open"); sub.classList.remove("open"); agentItem.classList.remove("hover"); reviewItem.classList.remove("hover"); }

agentItem.addEventListener("mouseenter", openSub);
agentItem.addEventListener("click", openSub);
document.addEventListener("click", (e) => { if (!menu.contains(e.target) && !sub.contains(e.target)) closeMenus(); });
reviewItem.addEventListener("click", () => runReview());
sub.querySelectorAll(".item:not(#reviewItem)").forEach((el) => el.addEventListener("click", closeMenus));

// ---- Panel
const steps = [
  ["Reading contract and project limit", "Max daily rate €1,100 · Project SAP S/4HANA rollout"],
  ["Searching similar profiles", "14 contractors in Germany with matching skills and seniority"],
  ["Comparing with the 14 similar profiles", "Median €1,080 · range €900–€1,300"],
  ["Checking approval rules", "Over 10% above max needs approval"],
];
const icons = {
  pending: icon("clock"),
  running: `<span class="spinner"></span>`,
  done: icon("check-circle"),
};
$("close").innerHTML = icon("xmark"); $("whyLead").innerHTML = icon("lock") + "Why this rate?"; $("whyChev").innerHTML = icon("nav-arrow-down");
const stepsEl = $("steps");
const panelParts = { proposal: $("proposal"), suggested: $("suggested"), input: $("suggestedInput"), verdict: $("verdict"), why: $("why"), whyBody: $("whyBody"), approve: $("approve"), counter: $("counter"), lbl: $("lblSuggested"), toast: $("toast") };
const pos = (v) => `calc(${((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 100}% - 2px)`;
let flow = 0, suggestedValue = LIMIT, appliedValue = CURRENT, editing = false, toastTimer;

function setState(s) { stage.dataset.state = s; $("panel").setAttribute("aria-hidden", s === "idle"); }
function setStep(i, status) { const s = stepsEl.children[i]; s.dataset.status = status; s.querySelector(".ico").innerHTML = icons[status]; }
function buildSteps() {
  stepsEl.innerHTML = "";
  steps.forEach(([l, d], i) => { const li = document.createElement("li"); li.className = "step" + (i === steps.length - 1 ? " final" : ""); li.dataset.status = "pending"; li.innerHTML = `<span class="ico">${icons.pending}</span><div><div class="label">${l}</div><div class="detail">${d}</div></div>`; stepsEl.appendChild(li); });
}
function tween(el, from, to, ms = 600) {
  const t0 = performance.now();
  const tick = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function updateVerdict(v) {
  const pct = Math.round(((v - CURRENT) / CURRENT) * 100), ok = v <= LIMIT;
  panelParts.verdict.className = "chip " + (ok ? "chip-success" : "chip-danger");
  panelParts.verdict.textContent = `${pct > 0 ? "+" : ""}${pct}% · ${ok ? "Within limit" : "Above limit · needs approval"}`;
  panelParts.approve.querySelector(".btn-label").textContent = ok ? "Approve and update" : "Request approval";
  panelParts.lbl.textContent = fmt(v);
  $("mSuggested").style.left = pos(v);
}
function showReviewing(on) { annaSlot.innerHTML = on ? `<span class="chip chip-info chip-sm"><span class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>Reviewing…</span>` : ""; }

async function runReview() {
  const id = ++flow;
  closeMenus(); resetPanel(); setState("working"); showReviewing(true);
  await sleep(450);
  for (let i = 0; i < steps.length; i++) {
    if (id !== flow) return;
    stepsEl.children[i].classList.add("show"); setStep(i, "running");
    await sleep(900);
    if (id !== flow) return;
    setStep(i, "done");
  }
  await sleep(250);
  if (id !== flow) return;
  setState("proposal");
  panelParts.proposal.classList.add("show");
  $("mLimit").style.left = pos(LIMIT); $("mCurrent").style.left = pos(CURRENT); $("mSuggested").style.left = pos(CURRENT);
  await sleep(120);
  $("mSuggested").style.left = pos(LIMIT);
  tween(panelParts.suggested, CURRENT, suggestedValue, 700);
  updateVerdict(suggestedValue);
}
function resetPanel() {
  buildSteps(); suggestedValue = LIMIT; editing = false;
  panelParts.proposal.classList.remove("show"); panelParts.whyBody.classList.remove("open"); panelParts.why.setAttribute("aria-expanded", "false");
  panelParts.input.classList.add("hidden"); panelParts.suggested.classList.remove("hidden"); panelParts.suggested.textContent = fmt(CURRENT);
  panelParts.approve.classList.remove("loading"); panelParts.approve.disabled = false; updateVerdict(LIMIT);
}
function closePanel() { flow++; setState("idle"); showReviewing(false); }
function toggleWhy() { const o = panelParts.whyBody.classList.toggle("open"); panelParts.why.setAttribute("aria-expanded", o); }
function toggleCounter() {
  editing = !editing;
  panelParts.input.classList.toggle("hidden", !editing); panelParts.suggested.classList.toggle("hidden", editing);
  if (editing) { panelParts.input.value = suggestedValue; panelParts.input.focus(); } else { suggestedValue = Number(panelParts.input.value) || suggestedValue; panelParts.suggested.textContent = fmt(suggestedValue); }
}
panelParts.input.addEventListener("input", () => { suggestedValue = Number(panelParts.input.value) || 0; updateVerdict(suggestedValue); });

function showToast(msg, undo = true) {
  $("toastMsg").textContent = msg; $("undo").style.display = undo ? "" : "none";
  panelParts.toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => panelParts.toast.classList.remove("show"), 6000);
}
async function approve() {
  if (panelParts.approve.disabled) return;
  if (editing) toggleCounter();
  panelParts.approve.classList.add("loading"); panelParts.approve.disabled = true;
  await sleep(750);
  const v = suggestedValue; closePanel();
  await sleep(350);
  if (v > LIMIT) { annaSlot.innerHTML = `<span class="chip chip-info chip-sm">Pending approval</span>`; showToast(`Approval requested · Anna Weber`, false); return; }
  const from = appliedValue; appliedValue = v;
  tween(annaRate, from, v, 700);
  annaRow.classList.add("hl");
  annaSlot.innerHTML = `<span class="diff chip chip-success chip-sm">−${fmt(from - v)}</span>`; requestAnimationFrame(() => annaSlot.firstChild.classList.add("show"));
  setTimeout(() => annaRow.classList.remove("hl"), 1800); setTimeout(() => annaSlot.firstChild && annaSlot.firstChild.classList.remove("show"), 2600);
  showToast(`Rate updated to ${fmt(v)} · Anna Weber`);
}
function undo() { tween(annaRate, appliedValue, CURRENT, 600); appliedValue = CURRENT; annaSlot.innerHTML = ""; panelParts.toast.classList.remove("show"); }
function resetAll() { flow++; closeMenus(); closePanel(); panelParts.toast.classList.remove("show"); annaRate.textContent = fmt(CURRENT); appliedValue = CURRENT; annaSlot.innerHTML = ""; annaRow.classList.remove("hl"); $("cursor").classList.remove("on"); }

$("approve").addEventListener("click", approve);
$("dismiss").addEventListener("click", closePanel);
$("close").addEventListener("click", closePanel);
$("scrim").addEventListener("click", closePanel);
$("counter").addEventListener("click", toggleCounter);
$("why").addEventListener("click", toggleWhy);
$("undo").addEventListener("click", undo);
bindTarget();
mq.addEventListener("change", () => { resetAll(); bindTarget(); });
$("reset").addEventListener("click", () => { demoId++; resetAll(); });

// ---- Demo (z kursorem, pod nagranie)
let demoId = 0;
const cursor = $("cursor");
async function moveTo(el, dx = 0.5, dy = 0.5) { const r = rel(el); cursor.style.left = r.x + r.w * dx + "px"; cursor.style.top = r.y + r.h * dy + "px"; await sleep(800); }
async function click() { cursor.classList.add("click"); await sleep(140); cursor.classList.remove("click"); await sleep(60); }
async function demo() {
  const id = ++demoId; resetAll();
  const alive = () => id === demoId;
  do {
    cursor.style.left = "40%"; cursor.style.top = "60%"; cursor.classList.add("on"); await sleep(500);
    await moveTo(annaMore); if (!alive()) return; await click(); openMenu(); await sleep(350);
    await moveTo(agentItem, 0.3); if (!alive()) return; openSub(); await sleep(300);
    await moveTo(reviewItem, 0.4); if (!alive()) return; reviewItem.classList.add("hover"); await sleep(250);
    await click(); await runReview(); if (!alive()) return; await sleep(900);
    await moveTo(panelParts.why, 0.2); if (!alive()) return; await click(); toggleWhy(); await sleep(2200);
    await moveTo(panelParts.approve); if (!alive()) return; await click(); await approve(); if (!alive()) return;
    await moveTo(annaRate, 0.5, 0.5); await sleep(2800); if (!alive()) return;
    if (!$("loop").checked) break;
    resetAll(); await sleep(700);
  } while (alive());
  if (alive()) cursor.classList.remove("on");
}
$("play").addEventListener("click", demo);
