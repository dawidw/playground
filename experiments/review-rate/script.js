// Agentic CRM #1: Review rate. Two cases in one table:
//   Anna Weber: the rate is too high, the agent proposes a cut.
//   Marco Rossi: the rate is too low, the agent proposes a raise to keep him.
// States: idle → menu → working → proposal → done (+ undo). All data is made up (the repo is public).
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => "€" + Math.round(n).toLocaleString("en-US");

const people = [
  ["John Doe", "--", "Freelancer", "🇩🇪 Germany", 900, true, "m1"],
  ["Jaque Laurent", "Laurent, Inc", "Agency", "🇫🇷 France", 1100, true, "m2"],
  ["Anna Weber", "Kienbaum", "Agency", "🇩🇪 Germany", 1250, true, "w1"],
  ["Marco Rossi", "Northwind Digital", "Agency", "🇮🇹 Italy", 880, false, "m3"],
  ["Sofia Lind", "--", "Freelancer", "🇸🇪 Sweden", 1050, true, "w2"],
  ["Tomas Novak", "Deloitte Consulting", "Agency", "🇪🇸 Spain", 1400, false, "m4"],
  ["Priya Nair", "Acme Analytics", "Agency", "🇬🇧 United Kingdom", 1150, true, "w3"],
  ["Jonas Novak", "--", "Freelancer", "🇳🇱 Netherlands", 900, false, "w4"],
];
const avatar = (f, cls = "avatar") => `<img class="${cls}" src="avatars/${f}.png" alt="">`;

// ---- Cases
const cases = [
  {
    row: 2, name: "Anna Weber", market: "Market range · Germany",
    current: 1250, suggested: 1100, limit: 1100, median: 1080, min: 900, max: 1300, band: [1000, 1160],
    steps: [
      ["Reading contract and project limit", "Max daily rate €1,100 · Project SAP S/4HANA rollout"],
      ["Searching similar profiles", "14 contractors in Germany with matching skills and seniority"],
      ["Comparing with the 14 similar profiles", "Median €1,080 · range €900–€1,300"],
      ["Checking approval rules", "Over 10% above max needs approval"],
    ],
    why: [
      "The current rate of €1,250 is 14% above the project limit (€1,100) and 16% above the market median for similar contractors in Germany (€1,080).",
      "€1,100 matches the project limit, so no exception approval is needed, and it stays within 2% of the market median.",
    ],
    sources: "Sources: contract, project SAP S/4HANA rollout, market data (14 contractors)",
  },
  {
    row: 3, name: "Marco Rossi", market: "Market range · Italy",
    current: 880, suggested: 980, limit: 1100, median: 1020, min: 800, max: 1200, band: [940, 1080],
    steps: [
      ["Reading contract and project history", "€880 since Jan 2025 · 3 projects delivered"],
      ["Searching similar profiles", "12 contractors in Italy with matching skills and seniority"],
      ["Comparing with the 12 similar profiles", "Median €1,020 · range €840–€1,200"],
      ["Checking retention risk", "2 competing requests in the last 30 days · contract ends in 6 weeks"],
    ],
    why: [
      "Marco's rate of €880 is 14% below the market median for similar contractors in Italy (€1,020) and has not changed since January 2025.",
      "He received 2 competing requests in the last 30 days and his current contract ends in 6 weeks. €980 is still below the median and within the €1,100 project limit, so no exception approval is needed, and it makes it more likely he stays available to you.",
    ],
    sources: "Sources: contract, project history, market data (12 contractors), inbound requests",
  },
];
cases.forEach((c) => { c.applied = c.current; });
let active = cases[0];

// ---- Table
const rowsEl = $("rows");
people.forEach(([name, supplier, type, country, rate, inProject, av], i) => {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <span class="who">${avatar(av)}<span title="${name}">${name}</span></span>
    <span title="${supplier}">${supplier}</span>
    <span><span class="chip chip-sm ${type === "Agency" ? "chip-info" : "chip-light"}">${type}</span></span>
    <span title="${country}">${country}</span>
    <span class="rate-cell"><b class="rate font-normal">${fmt(rate)}</b><span class="slot"></span></span>
    <span><span class="chip chip-sm ${inProject ? "chip-success" : "chip-light"}">${inProject ? "Yes" : "No"}</span></span>
    <span class="actions"><button class="btn-light">See profile</button><button class="more" aria-label="More">${icon("more-vert")}</button></span>`;
  rowsEl.appendChild(row);
});

// ---- Mobile: one card per case
const mq = matchMedia("(max-width: 720px)");
$("mcard").innerHTML = cases.map((c, i) => {
  const p = people[c.row];
  return `<div class="mc" data-case="${i}">
    <div class="top">${avatar(p[6], "avatar avatar-lg")}<div><div class="text-md font-medium">${p[0]}</div><div class="text-xs text-muted-light">${p[1]}</div></div></div>
    <div class="meta"><span class="chip chip-info">${p[2]}</span><span class="chip chip-light">${p[3]}</span><span class="chip ${p[5] ? "chip-success" : "chip-light"}">${p[5] ? "In project" : "Not in project"}</span></div>
    <div class="facts"><div><small>Daily rate</small><span class="rate-cell"><b class="rate font-normal">${fmt(p[4])}</b><span class="slot"></span></span></div><div><small>Engagement</small>${p[2]}</div></div>
    <div class="actions"><button class="btn-light">See profile</button><button class="more" aria-label="More">${icon("more-vert")}</button></div>
  </div>`;
}).join("");
function bindTargets() {
  cases.forEach((c, i) => {
    c.el = mq.matches ? $("mcard").children[i] : rowsEl.children[c.row];
    c.rateEl = c.el.querySelector(".rate"); c.slot = c.el.querySelector(".slot"); c.more = c.el.querySelector(".more");
    c.more.onclick = (e) => { e.stopPropagation(); active = c; menu.classList.contains("open") ? closeMenus() : openMenu(); };
  });
}

// ---- Menu (main + Agent submenu)
const menu = document.createElement("div"); menu.className = "menu";
const sub = document.createElement("div"); sub.className = "menu";
const it = (ic, label, extra = "") => `<div class="item"${extra}><span class="lead">${icon(ic)}${label}</span></div>`;
menu.innerHTML = it("edit", "Edit") + it("submit-document", "Request document") + it("task-list", "Worker type assessment") + it("mail-out", "Request self-assessment") + `<div class="sep"></div><div class="item" id="agentItem"><span class="lead">${icon("arrow-reduce-tag")}Agent</span>${icon("nav-arrow-right")}</div><div class="sep"></div><div class="item danger"><span class="lead">${icon("archive")}Archive</span></div>`;
sub.innerHTML = it("input-search", "Find project") + it("submit-document", "Request missing documents") + it("task-list", "Check compliance") + it("mail-out", "Review rate", ' id="reviewItem"');
stage.append(menu, sub);
const agentItem = menu.querySelector("#agentItem"), reviewItem = sub.querySelector("#reviewItem");
const rel = (el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
function openMenu() {
  const b = rel(active.more), w = menu.offsetWidth || 220;
  menu.style.left = Math.max(8, b.x + b.w - w) + "px";
  // open upwards when there is no room below
  const h = menu.offsetHeight || 280, below = b.y + b.h + 6;
  menu.style.top = (below + h > stage.clientHeight - 8 ? Math.max(8, b.y - h - 6) : below) + "px";
  menu.classList.add("open");
}
function openSub() {
  const m = rel(agentItem), sw = sub.offsetWidth || 232, sh = sub.offsetHeight || 160;
  agentItem.classList.add("hover");
  sub.style.left = mq.matches ? Math.max(8, m.x + m.w - sw) + "px" : m.x - sw - 8 + "px";
  const top = mq.matches ? m.y + m.h + 4 : m.y - 4;
  sub.style.top = Math.min(top, stage.clientHeight - sh - 8) + "px";
  sub.classList.add("open");
}
function closeMenus() { menu.classList.remove("open"); sub.classList.remove("open"); agentItem.classList.remove("hover"); reviewItem.classList.remove("hover"); }
agentItem.addEventListener("mouseenter", openSub);
agentItem.addEventListener("click", openSub);
document.addEventListener("click", (e) => { if (!menu.contains(e.target) && !sub.contains(e.target)) closeMenus(); });
reviewItem.addEventListener("click", () => runReview());
sub.querySelectorAll(".item:not(#reviewItem)").forEach((el) => el.addEventListener("click", closeMenus));

// ---- Panel
const icons = {
  pending: icon("clock"),
  running: (i = 0) => `<span class="ascii" data-anim="${stepAnims[i % stepAnims.length]}" aria-hidden="true">⠋</span>`,
  done: icon("check-circle"),
};
$("close").innerHTML = icon("xmark"); $("whyLead").innerHTML = icon("hand-brake") + "Why this rate?"; $("whyChev").innerHTML = icon("nav-arrow-down");
const panelInner = $("panelInner");
// The panel hugs its content, anchored to the bottom; its height animates as steps appear.
const syncPanel = () => {
  panelInner.style.maxHeight = stage.clientHeight - 32 + "px";
  const h = panelInner.offsetHeight + "px";
  if ($("panel").style.height !== h) $("panel").style.height = h;
};
new ResizeObserver(syncPanel).observe(panelInner);
// Braille loaders come from loaders.js (LOADERS): each agent step gets its own little animation
let asciiI = 0;
setInterval(() => { syncPanel(); asciiI++; document.querySelectorAll(".ascii").forEach((el) => { const fr = LOADERS[el.dataset.anim] || LOADERS.braille; el.textContent = fr[asciiI % fr.length]; }); }, 90);
const stepAnims = ["breathe"]; // one narrow 1-cell loader for every step, as wide as the check icon
const stepsEl = $("steps");
const PP = { proposal: $("proposal"), suggested: $("suggested"), input: $("suggestedInput"), verdict: $("verdict"), why: $("why"), whyBody: $("whyBody"), approve: $("approve"), toast: $("toast") };
const pos = (v) => `calc(${((Math.min(active.max, Math.max(active.min, v)) - active.min) / (active.max - active.min)) * 100}% - 2px)`;
let flow = 0, suggestedValue = 0, editing = false, toastTimer;

function setState(s) { stage.dataset.state = s; $("panel").setAttribute("aria-hidden", s === "idle"); }
function setStep(i, status) { const s = stepsEl.children[i]; s.dataset.status = status; const ic = icons[status]; s.querySelector(".ico").innerHTML = typeof ic === "function" ? ic(i) : ic; }
function buildSteps() {
  stepsEl.innerHTML = "";
  active.steps.forEach(([l, d]) => { const li = document.createElement("li"); li.className = "step"; li.dataset.status = "pending"; li.innerHTML = `<span class="ico">${icons.pending}</span><div><div class="label">${l}</div><div class="detail">${d}</div></div>`; stepsEl.appendChild(li); });
}
function tween(el, from, to, ms = 600) {
  const t0 = performance.now();
  const tick = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function renderLegend(v) {
  const items = [["Current", active.current], ["Suggested", v], ["Project limit", active.limit]];
  items.sort((a, b) => a[1] - b[1] || (a[0] === "Suggested" ? -1 : 1));
  $("legend").innerHTML = items.map(([l, x]) => `<span>${l} ${fmt(x)}</span>`).join("");
}
function updateVerdict(v) {
  const pct = Math.round(((v - active.current) / active.current) * 100), ok = v <= active.limit;
  // lowering the rate is red, raising it is green (orange when a raise exceeds the limit)
  PP.verdict.className = "chip " + (v < active.current ? "chip-danger" : ok ? "chip-success" : "chip-warning");
  PP.verdict.textContent = `${pct > 0 ? "+" : ""}${pct}% · ${ok ? "Within limit" : "Above limit · needs approval"}`;
  PP.approve.querySelector(".btn-label").textContent = ok ? "Approve and update" : "Request approval";
  $("mSuggested").style.left = pos(v); $("mSuggested").dataset.v = fmt(v);
  renderLegend(v);
}
function fillCase() {
  const c = active;
  $("panelTitle").textContent = "Review rate · " + c.name;
  $("current").textContent = fmt(c.current); $("marketLbl").textContent = c.market; $("medianLbl").textContent = "Median " + fmt(c.median);
  $("whyP1").textContent = c.why[0]; $("whyP2").textContent = c.why[1]; $("whySrc").textContent = c.sources;
  const band = document.querySelector(".band"), span = c.max - c.min;
  band.style.left = ((c.band[0] - c.min) / span) * 100 + "%"; band.style.width = ((c.band[1] - c.band[0]) / span) * 100 + "%";
}
function showReviewing(on) { active.slot.innerHTML = on ? `<span class="chip chip-info chip-sm"><span class="ascii" data-anim="breathe" aria-hidden="true">⠁</span>Reviewing…</span>` : ""; }

async function runReview() {
  const id = ++flow, c = active;
  closeMenus(); resetPanel(); measureProposal(); setState("working"); showReviewing(true);
  await sleep(450);
  for (let i = 0; i < c.steps.length; i++) {
    if (id !== flow) return;
    stepsEl.children[i].classList.add("show"); setStep(i, "running");
    await sleep(900);
    if (id !== flow) return;
    setStep(i, "done");
  }
  // Skeleton of the suggested rate card, only briefly after the last agent step
  await sleep(200);
  if (id !== flow) return;
  $("skeleton").classList.add("show");
  await sleep(1100);
  if (id !== flow) return;
  setState("proposal");
  PP.proposal.classList.add("pending"); await sleep(30);
  $("skeleton").classList.add("hide"); PP.proposal.classList.add("show");
  setTimeout(() => { $("skeleton").classList.remove("show", "hide"); }, 420);
  PP.verdict.classList.remove("pop"); void PP.verdict.offsetWidth; setTimeout(() => PP.verdict.classList.add("pop"), 500);
  $("mLimit").style.left = pos(c.limit); $("mCurrent").style.left = pos(c.current); $("mSuggested").style.left = pos(c.current);
  await sleep(120);
  $("mSuggested").style.left = pos(c.suggested);
  tween(PP.suggested, c.current, suggestedValue, 700);
  updateVerdict(suggestedValue);
}
function measureProposal() {
  // the skeleton takes the height of the real card (with "Why" collapsed), so nothing jumps when they swap
  const sk = $("skeleton"), wb = PP.whyBody;
  wb.style.transition = "none"; wb.classList.remove("open"); void wb.offsetHeight; // snap closed, no animation
  sk.style.minHeight = "";
  PP.proposal.classList.add("measure"); sk.style.minHeight = PP.proposal.offsetHeight + "px"; PP.proposal.classList.remove("measure");
  requestAnimationFrame(() => { wb.style.transition = ""; });
}
function resetPanel() {
  fillCase(); buildSteps(); suggestedValue = active.suggested; editing = false;
  PP.proposal.classList.remove("show", "pending"); $("skeleton").classList.remove("show", "hide"); PP.verdict.classList.remove("pop"); PP.whyBody.classList.remove("open"); PP.why.setAttribute("aria-expanded", "false");
  PP.input.classList.add("hidden"); PP.suggested.classList.remove("hidden"); PP.suggested.textContent = fmt(active.current);
  PP.approve.classList.remove("loading"); PP.approve.disabled = false; updateVerdict(suggestedValue);
}
// Drag the blue pin along the range to try other rates
(() => {
  const pin = $("mSuggested"), track = pin.parentElement;
  const set = (x) => {
    const r = track.getBoundingClientRect(), f = Math.min(1, Math.max(0, (x - r.left) / r.width));
    suggestedValue = Math.round((active.min + f * (active.max - active.min)) / 10) * 10;
    if (editing) PP.input.value = suggestedValue; else PP.suggested.textContent = fmt(suggestedValue);
    updateVerdict(suggestedValue);
  };
  pin.addEventListener("pointerdown", (e) => { e.preventDefault(); pin.setPointerCapture(e.pointerId); pin.classList.add("drag"); set(e.clientX); });
  pin.addEventListener("pointermove", (e) => { if (pin.classList.contains("drag")) set(e.clientX); });
  const end = () => pin.classList.remove("drag");
  pin.addEventListener("pointerup", end); pin.addEventListener("pointercancel", end);
})();
function closePanel() { flow++; setState("idle"); cases.forEach((c) => { if (c.slot && c.slot.querySelector(".spinner")) c.slot.innerHTML = ""; }); }
function toggleWhy() {
  const o = PP.whyBody.classList.toggle("open"); PP.why.setAttribute("aria-expanded", o);
  if (o) setTimeout(() => $("panelBody").scrollTo({ top: $("panelBody").scrollHeight, behavior: "smooth" }), 320);
}
function toggleCounter() {
  editing = !editing;
  PP.input.classList.toggle("hidden", !editing); PP.suggested.classList.toggle("hidden", editing);
  if (editing) { PP.input.value = suggestedValue; PP.input.focus(); } else { suggestedValue = Number(PP.input.value) || suggestedValue; PP.suggested.textContent = fmt(suggestedValue); }
}
PP.input.addEventListener("input", () => { suggestedValue = Number(PP.input.value) || 0; updateVerdict(suggestedValue); });

function showToast(msg, undoable = true) {
  $("toastMsg").textContent = msg; $("undo").style.display = undoable ? "" : "none";
  PP.toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => PP.toast.classList.remove("show"), 6000);
}
let lastApplied = null;
async function approve() {
  if (PP.approve.disabled) return;
  const c = active;
  if (editing) toggleCounter();
  PP.approve.classList.add("loading"); PP.approve.disabled = true;
  await sleep(750);
  const v = suggestedValue; closePanel();
  await sleep(350);
  if (v > c.limit) { c.slot.innerHTML = `<span class="chip chip-info chip-sm">Pending approval</span>`; showToast(`Approval requested · ${c.name}`, false); return; }
  const from = c.applied; c.applied = v; lastApplied = c;
  tween(c.rateEl, from, v, 700);
  c.el.classList.add("hl");
  c.slot.innerHTML = `<span class="diff chip ${v >= from ? "chip-success" : "chip-danger"} chip-sm">${v >= from ? "+" : "−"}${fmt(Math.abs(from - v))}</span>`; requestAnimationFrame(() => c.slot.firstChild && c.slot.firstChild.classList.add("show"));
  setTimeout(() => c.el.classList.remove("hl"), 1800); setTimeout(() => c.slot.firstChild && c.slot.firstChild.classList.remove("show"), 2600);
  showToast(`Rate updated to ${fmt(v)} · ${c.name}`);
}
function undo() {
  const c = lastApplied; if (!c) return;
  tween(c.rateEl, c.applied, c.current, 600); c.applied = c.current; c.slot.innerHTML = ""; PP.toast.classList.remove("show");
}
function resetAll() {
  flow++; closeMenus(); closePanel(); PP.toast.classList.remove("show"); $("cursor").classList.remove("on");
  cases.forEach((c) => { c.rateEl.textContent = fmt(c.current); c.applied = c.current; c.slot.innerHTML = ""; c.el.classList.remove("hl"); });
}

$("approve").addEventListener("click", approve);
$("dismiss").addEventListener("click", closePanel);
$("close").addEventListener("click", closePanel);
$("scrim").addEventListener("click", closePanel);
$("counter").addEventListener("click", toggleCounter);
$("why").addEventListener("click", toggleWhy);
$("undo").addEventListener("click", undo);
$("reset").addEventListener("click", () => { demoId++; resetAll(); });
bindTargets();
mq.addEventListener("change", () => { resetAll(); bindTargets(); });

// ---- Demo (with a cursor, for recording): Anna first, then on to Marco
let demoId = 0;
const cursor = $("cursor");
async function moveTo(el, dx = 0.5, dy = 0.5) { const r = rel(el); cursor.style.left = r.x + r.w * dx + "px"; cursor.style.top = r.y + r.h * dy + "px"; await sleep(800); }
async function click() { cursor.classList.add("click"); await sleep(140); cursor.classList.remove("click"); await sleep(60); }
async function demo() {
  const id = ++demoId; resetAll();
  const alive = () => id === demoId;
  do {
    cursor.style.left = "40%"; cursor.style.top = "60%"; cursor.classList.add("on"); await sleep(500);
    for (const c of cases) {
      active = c;
      await moveTo(c.more); if (!alive()) return; await click(); openMenu(); await sleep(350);
      await moveTo(agentItem, 0.3); if (!alive()) return; openSub(); await sleep(300);
      await moveTo(reviewItem, 0.4); if (!alive()) return; reviewItem.classList.add("hover"); await sleep(250);
      await click(); await runReview(); if (!alive()) return; await sleep(900);
      await moveTo(PP.why, 0.2); if (!alive()) return; await click(); toggleWhy(); await sleep(2200);
      await moveTo(PP.approve); if (!alive()) return; await click(); await approve(); if (!alive()) return;
      await moveTo(c.rateEl, 0.5, 0.5); await sleep(c === cases[cases.length - 1] ? 2800 : 1600); if (!alive()) return;
      PP.toast.classList.remove("show");
    }
    if (!$("loop").checked) break;
    resetAll(); await sleep(700);
  } while (alive());
  if (alive()) cursor.classList.remove("on");
}
$("play").addEventListener("click", demo);

// ?preview renders the proposal state at 16:10 with no chrome, zoomed on the panel (used to take preview.png)
if (new URLSearchParams(location.search).has("preview")) {
  document.body.classList.add("preview");
  active = cases[0]; resetPanel(); setState("proposal");
  stepsEl.querySelectorAll(".step").forEach((el, i) => { el.classList.add("show"); setStep(i, "done"); });
  PP.proposal.classList.add("show");
  $("mLimit").style.left = pos(active.limit); $("mCurrent").style.left = pos(active.current); $("mSuggested").style.left = pos(active.suggested);
  PP.suggested.textContent = fmt(active.suggested); updateVerdict(active.suggested);
}

// ?record: autoplay the demo in a loop on a 1280x720 stage (start your screen recording, then reload)
if (new URLSearchParams(location.search).has("record")) {
  document.body.classList.add("record"); $("loop").checked = true;
  setTimeout(demo, 1200);
}
