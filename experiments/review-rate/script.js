// Agentic CRM #1: Review rate. Stany: idle → menu → working → proposal → done (+ undo).
// Dane są wymyślone (repo jest publiczne).
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => "€" + Math.round(n).toLocaleString("en-US");
const LIMIT = 1100, CURRENT = 1250, MEDIAN = 1080, MIN = 900, MAX = 1300;

const people = [
  ["John Doe", "--", "Freelancer", "🇩🇪 Germany", 900, true],
  ["Jaque Laurent", "Laurent, Inc", "Agency", "🇫🇷 France", 1100, true],
  ["Anna Weber", "Kienbaum", "Agency", "🇩🇪 Germany", CURRENT, true],
  ["Marco Rossi", "Northwind Digital", "Agency", "🇮🇹 Italy", 880, false],
  ["Sofia Lind", "--", "Freelancer", "🇸🇪 Sweden", 1050, true],
  ["Tomas Novak", "Deloitte Consulting", "Agency", "🇪🇸 Spain", 1400, false],
  ["Priya Nair", "Acme Analytics", "Agency", "🇬🇧 United Kingdom", 1150, true],
  ["Jonas Novak", "--", "Freelancer", "🇳🇱 Netherlands", 900, false],
];
const initials = (n) => n.split(" ").map((w) => w[0]).join("");

// ---- Tabela
const rowsEl = $("rows");
people.forEach(([name, supplier, type, country, rate, inProject], i) => {
  const row = document.createElement("div");
  row.className = "row";
  row.id = i === 2 ? "row-anna" : "";
  row.innerHTML = `
    <span class="who"><span class="avatar">${initials(name)}</span>${name}</span>
    <span>${supplier}</span>
    <span><span class="chip chip-sm ${type === "Agency" ? "chip-info" : "chip-neutral"}">${type}</span></span>
    <span>${country}</span>
    <span class="rate-cell"><b class="rate font-normal" data-rate="${rate}">${fmt(rate)}</b><span class="slot"></span></span>
    <span><span class="chip chip-sm ${inProject ? "chip-success" : "chip-neutral"}">${inProject ? "Yes" : "No"}</span></span>
    <span class="actions"><button class="btn-light">See profile</button><button class="more" aria-label="More">⋮</button></span>`;
  rowsEl.appendChild(row);
});
const annaRow = $("row-anna");
const annaRate = annaRow.querySelector(".rate");
const annaSlot = annaRow.querySelector(".slot");
const annaMore = annaRow.querySelector(".more");

// ---- Menu (główne + submenu Agent)
const menu = document.createElement("div"); menu.className = "menu";
menu.innerHTML = `<div class="item">Edit</div><div class="item">Request document</div><div class="item">Worker type assessment</div><div class="item">Request self-assessment</div><div class="sep"></div><div class="item" id="agentItem">Agent <span>›</span></div><div class="sep"></div><div class="item danger">Archive</div>`;
const sub = document.createElement("div"); sub.className = "menu";
sub.innerHTML = `<div class="item">Find project</div><div class="item">Request missing documents</div><div class="item">Check compliance</div><div class="item" id="reviewItem">Review rate</div>`;
stage.append(menu, sub);
const agentItem = menu.querySelector("#agentItem"), reviewItem = sub.querySelector("#reviewItem");

const rel = (el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
function openMenu() {
  const b = rel(annaMore);
  menu.style.left = b.x + b.w - 220 + "px"; menu.style.top = b.y + b.h + 6 + "px";
  menu.classList.add("open");
}
function openSub() {
  const m = rel(agentItem);
  agentItem.classList.add("hover");
  sub.style.left = m.x - 232 + "px"; sub.style.top = m.y - 4 + "px";
  sub.classList.add("open");
}
function closeMenus() { menu.classList.remove("open"); sub.classList.remove("open"); agentItem.classList.remove("hover"); reviewItem.classList.remove("hover"); }

annaMore.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.contains("open") ? closeMenus() : openMenu(); });
agentItem.addEventListener("mouseenter", openSub);
agentItem.addEventListener("click", openSub);
document.addEventListener("click", (e) => { if (!menu.contains(e.target) && !sub.contains(e.target)) closeMenus(); });
reviewItem.addEventListener("click", () => runReview());
sub.querySelectorAll(".item:not(#reviewItem)").forEach((el) => el.addEventListener("click", closeMenus));

// ---- Panel
const steps = [
  ["Reading contract and project limit", "Max daily rate €1,100 · Project SAP S/4HANA rollout"],
  ["Comparing with 14 similar contractors in Germany", "Median €1,080 · range €900–€1,300"],
  ["Checking approval rules", "Over 10% above max needs approval"],
];
const icons = {
  pending: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  running: `<span class="spinner"></span>`,
  done: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/></svg>`,
};
const stepsEl = $("steps");
const panelParts = { proposal: $("proposal"), suggested: $("suggested"), input: $("suggestedInput"), verdict: $("verdict"), why: $("why"), whyBody: $("whyBody"), approve: $("approve"), counter: $("counter"), lbl: $("lblSuggested"), toast: $("toast") };
const pos = (v) => `calc(${((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 100}% - 2px)`;
let flow = 0, suggestedValue = LIMIT, appliedValue = CURRENT, editing = false, toastTimer;

function setState(s) { stage.dataset.state = s; $("panel").setAttribute("aria-hidden", s === "idle"); }
function setStep(i, status) { const s = stepsEl.children[i]; s.dataset.status = status; s.querySelector(".ico").innerHTML = icons[status]; }
function buildSteps() {
  stepsEl.innerHTML = "";
  steps.forEach(([l, d]) => { const li = document.createElement("li"); li.className = "step"; li.dataset.status = "pending"; li.innerHTML = `<span class="ico">${icons.pending}</span><div><div class="label">${l}</div><div class="detail">${d}</div></div>`; stepsEl.appendChild(li); });
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
