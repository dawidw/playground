// Agentic CRM #2: Compliance sweep.
// The agent walks every row. Six stay quiet. Tomas gets a chase you can send.
// Jonas is a question the agent will not answer. All data is made up (the repo is public).
// Wrapped so top-level names don't collide with tailwind-config.js (it also declares STEPS).
(() => {
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const ctl = { speed: 1, paused: false };
const sleep = (ms) => new Promise((res) => {
  let left = ms;
  (function tick() {
    if (ctl.paused) return setTimeout(tick, 60);
    if (left <= 0) return res();
    const d = Math.min(40, left);
    setTimeout(() => { left -= d * ctl.speed; tick(); }, d);
  })();
});

const people = [
  { name: "John Doe", photo: "john", supplier: "--", type: "Freelancer", country: "🇩🇪 Germany", inProject: true },
  { name: "Jaque Laurent", photo: "jaque", supplier: "Laurent, Inc", type: "Agency", country: "🇫🇷 France", inProject: true },
  { name: "Anna Weber", photo: "anna", supplier: "Kienbaum", type: "Agency", country: "🇩🇪 Germany", inProject: true },
  { name: "Marco Rossi", photo: "marco", supplier: "Northwind Digital", type: "Agency", country: "🇮🇹 Italy", inProject: false },
  { name: "Sofia Lind", photo: "sofia", supplier: "--", type: "Freelancer", country: "🇸🇪 Sweden", inProject: true },
  { name: "Tomas Novak", photo: "tomas", supplier: "Deloitte Consulting", type: "Agency", country: "🇪🇸 Spain", inProject: false },
  { name: "Priya Nair", photo: "priya", supplier: "Acme Analytics", type: "Agency", country: "🇬🇧 United Kingdom", inProject: true },
  { name: "Jonas Novak", photo: "jonas", supplier: "--", type: "Freelancer", country: "🇳🇱 Netherlands", inProject: false },
];
const TOMAS = 5, JONAS = 7;
const STEPS = [
  ["Reading documents", "Contracts, right to work, and engagement letters"],
  ["Comparing engagement patterns", "Who they work for, and for how long"],
  ["Applying the send rules", "A chase goes out only when a document is about to lapse"],
  ["Queuing exceptions", "Anything I will not decide on my own"],
];
const MESSAGE = "Hi Tomas — your right to work expires on 23 October. Please send the renewed document so we can keep you on the SAP S/4HANA rollout.";

const chip = (cls, text, extra = "") => `<span class="chip chip-sm ${cls}">${extra}${text}</span>`;
const clearChip = () => chip("chip-success", "Clear");
const checkingChip = () => chip("chip-info", "Checking…", `<span class="ascii" data-anim="breathe" aria-hidden="true">⠁</span>`);
const rows = [];
const rowsEl = $("rows");
people.forEach((p) => {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <span class="who"><img class="avatar" src="avatars/${p.photo}.jpg" alt=""><span title="${p.name}">${p.name}</span><span class="slot"></span></span>
    <span title="${p.supplier}">${p.supplier}</span>
    <span><span class="chip chip-sm ${p.type === "Agency" ? "chip-info" : "chip-light"}">${p.type}</span></span>
    <span title="${p.country}">${p.country}</span>
    <span><span class="chip chip-sm ${p.inProject ? "chip-success" : "chip-light"}">${p.inProject ? "Yes" : "No"}</span></span>
    <span class="actions"><button class="btn-light">See profile</button></span>`;
  rowsEl.appendChild(row);
  rows.push(row.querySelector(".slot"));
});

let chips = people.map(() => "");
function paint() {
  let fresh = 0;
  chips.forEach((html, i) => {
    const slot = rows[i];
    if (slot.dataset.html === html) return;
    slot.dataset.html = html;
    slot.innerHTML = html;
    const el = slot.firstElementChild;
    if (!el) return;
    el.style.animationDelay = (fresh * 50) + "ms";
    fresh++;
  });
}
function blanks() { chips = people.map(() => ""); paint(); }

$("more").innerHTML = icon("more-vert");
$("close").innerHTML = icon("xmark");

const menu = document.createElement("div");
const sub = document.createElement("div");
menu.className = "menu";
sub.className = "menu";
const item = (ic, label, id = "") => `<button type="button" class="item"${id ? ` id="${id}"` : ""}><span class="lead">${icon(ic)}${label}</span></button>`;
menu.innerHTML = `<button type="button" class="item" id="agentItem"><span class="lead">${icon("arrow-reduce-tag")}Agent</span>${icon("nav-arrow-right")}</button>`;
sub.innerHTML = item("input-search", "Find rate outliers") + item("submit-document", "Chase expiring documents") + item("task-list", "Check compliance", "checkItem");
stage.append(menu, sub);
menu.inert = true;
sub.inert = true;
const agentItem = $("agentItem"), checkItem = $("checkItem");

const fitZ = 1;
const rel = (el) => {
  const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: (r.left - s.left) / fitZ, y: (r.top - s.top) / fitZ, w: r.width / fitZ, h: r.height / fitZ };
};
function openMenu() {
  const b = rel($("more")), w = menu.offsetWidth;
  menu.style.top = (b.y + b.h + 4) + "px";
  menu.style.left = (b.x + b.w - w) + "px";
  menu.classList.add("open");
  menu.inert = false;
  $("more").classList.add("open");
}
function openSub() {
  agentItem.classList.add("hover");
  const sw = sub.offsetWidth;
  sub.style.top = menu.style.top;
  sub.style.left = (parseFloat(menu.style.left) - 4 - sw) + "px";
  sub.classList.add("open");
  sub.inert = false;
}
function closeMenus() {
  menu.classList.remove("open");
  sub.classList.remove("open");
  menu.inert = true;
  sub.inert = true;
  agentItem.classList.remove("hover");
  $("more").classList.remove("open");
}
$("more").addEventListener("click", (e) => { e.stopPropagation(); menu.classList.contains("open") ? closeMenus() : openMenu(); });
agentItem.addEventListener("mouseenter", openSub);
agentItem.addEventListener("click", (e) => { e.stopPropagation(); openSub(); });
document.addEventListener("click", (e) => {
  if (e.target.closest("#more") || menu.contains(e.target) || sub.contains(e.target)) return;
  closeMenus();
});

const sources = document.createElement("div");
sources.id = "sources";
sources.className = "flex gap-2";
sources.innerHTML = `<span class="chip chip-light chip-sm">Documents</span><span class="chip chip-light chip-sm">Contracts</span><span class="chip chip-light chip-sm">Engagement history</span>`;
$("cards").before(sources);

const pendingGlyph = LOADERS.breathe[8];
const icons = {
  pending: `<span class="ascii mute">${pendingGlyph}</span>`,
  running: `<span class="ascii" data-anim="breathe" aria-hidden="true">⠁</span>`,
  done: icon("check-circle"),
};
const stepsEl = $("steps");
const panel = $("panel");
const panelInner = $("panelInner");
panel.inert = true;
const syncPanel = () => {
  const max = stage.clientHeight - 32;
  panelInner.style.maxHeight = max + "px";
  const h = Math.min(max, panelInner.scrollHeight);
  if (panel.style.height !== h + "px") panel.style.height = h + "px";
};
new ResizeObserver(syncPanel).observe(panelInner);
let asciiI = 0;
setInterval(() => {
  asciiI++;
  document.querySelectorAll(".ascii[data-anim]").forEach((el) => {
    const fr = LOADERS[el.dataset.anim] || LOADERS.braille;
    el.textContent = fr[asciiI % fr.length];
  });
}, 90);

let flow = 0;
let toastTimer = 0;
let undoFn = null;
function setState(s) {
  const closed = s === "idle" || s === "done";
  stage.dataset.state = s;
  panel.setAttribute("aria-hidden", closed ? "true" : "false");
  panel.inert = closed;
  requestAnimationFrame(syncPanel);
}
function buildSteps(status) {
  stepsEl.innerHTML = "";
  STEPS.forEach(([label, detail]) => {
    const li = document.createElement("li");
    li.className = "step" + (status === "done" ? " show" : "");
    li.dataset.status = status;
    li.innerHTML = `<span class="ico">${icons[status]}</span><div><div class="label">${label}</div><div class="detail">${detail}</div></div>`;
    stepsEl.appendChild(li);
  });
}
function setStep(i, status) {
  const s = stepsEl.children[i];
  s.dataset.status = status;
  s.querySelector(".ico").innerHTML = icons[status];
}
function personCard(p, line, pill, cls) {
  return `<div class="person"><img class="avatar lg" src="avatars/${p.photo}.jpg" alt=""><div class="copy"><strong>${p.name}</strong><p>${line}</p></div><span class="chip chip-sm ${cls}">${pill}</span></div>`;
}
function show(el, on) { el.hidden = !on; }
function footer(left, right) {
  $("footerLeft").innerHTML = left;
  $("footerRight").innerHTML = right;
}
function hideToast() { clearTimeout(toastTimer); $("toast").classList.remove("show"); undoFn = null; }
function showToast(msg, undo) {
  $("toastMsg").textContent = msg;
  $("undo").style.display = undo ? "" : "none";
  undoFn = undo || null;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 6000);
}
function resetMessage() {
  show($("msgInput"), false);
  show($("msgBody"), true);
  $("msgBody").textContent = MESSAGE;
  $("edit").textContent = "Edit";
}

function renderSweep() {
  $("intro").textContent = "Checking 8 contractors. I only stop when something needs you.";
  buildSteps("pending");
  $("cards").innerHTML = "";
  show($("message"), false);
  show($("question"), false);
  footer("", `<button id="cancel" class="btn-light">Cancel</button>`);
}
function renderExceptions() {
  $("intro").textContent = "6 are clear. Two need you.";
  buildSteps("done");
  $("cards").innerHTML =
    personCard(people[TOMAS], "Right to work expires in 9 days. I wrote a short chase.", "Draft ready", "chip-info") +
    personCard(people[JONAS], "18 months, one client. I will not classify this.", "Needs you", "chip-warning");
  show($("message"), false);
  show($("question"), false);
  footer("", `<button id="notNow" class="btn-light">Not now</button><button id="review" class="btn-dark"><span class="btn-label">Review Tomas</span></button>`);
}
function renderDraft() {
  $("cards").innerHTML = personCard(people[TOMAS], "Right to work expires in 9 days. I wrote a short chase.", "Draft ready", "chip-info");
  resetMessage();
  show($("message"), true);
  show($("question"), false);
  footer(
    `<button id="back" class="btn-light"><span class="flip">${icon("nav-arrow-right")}</span> Back</button>`,
    `<button id="snooze" class="btn-light">Snooze</button><button id="send" class="btn-dark"><span class="btn-label">Send message</span></button>`
  );
}
function renderQuestion() {
  $("cards").innerHTML = personCard(people[JONAS], "18 months, one client. I will not classify this.", "Needs you", "chip-warning");
  show($("message"), false);
  show($("question"), true);
  footer("", "");
}
function markQuiet(except = []) {
  chips = people.map((_, i) => except.includes(i) ? chips[i] : clearChip());
}
function showResultChips() {
  const next = people.map(() => "");
  next[TOMAS] = chips[TOMAS];
  next[JONAS] = chips[JONAS];
  chips = next;
  paint();
}

function dismiss() {
  flow++;
  hideToast();
  blanks();
  setState("idle");
}
async function runSweep() {
  const id = ++flow;
  closeMenus();
  hideToast();
  blanks();
  setState("sweeping");
  renderSweep();
  const alive = () => id === flow;
  const beat = async (i, during) => {
    stepsEl.children[i].classList.add("show");
    setStep(i, "running");
    during && during();
    await sleep(900);
    if (!alive()) return false;
    setStep(i, "done");
    return true;
  };
  if (!await beat(0)) return;
  if (!await beat(1, () => { chips[0] = chips[1] = chips[2] = chips[3] = clearChip(); chips[4] = checkingChip(); paint(); })) return;
  chips[4] = clearChip(); chips[6] = clearChip(); paint();
  if (!await beat(2)) return;
  if (!await beat(3, () => { chips[TOMAS] = chip("chip-warning", "Expires in 9d"); chips[JONAS] = chip("chip-warning", "Needs you"); paint(); })) return;
  await sleep(400);
  if (!alive()) return;
  markQuiet([TOMAS, JONAS]);
  paint();
  setState("exceptions");
  renderExceptions();
}
function goExceptions() {
  hideToast();
  markQuiet([TOMAS, JONAS]);
  chips[TOMAS] = chip("chip-warning", "Expires in 9d");
  chips[JONAS] = chip("chip-warning", "Needs you");
  paint();
  setState("exceptions");
  renderExceptions();
}
function goDraft() {
  hideToast();
  setState("draft");
  renderDraft();
}
function goQuestion() {
  if (!$("msgInput").hidden) $("msgBody").textContent = $("msgInput").value.trim() || MESSAGE;
  chips[TOMAS] = chip("chip-success", "Message sent");
  paint();
  setState("question");
  renderQuestion();
  showToast("Message sent to Tomas", () => goDraft());
}
function goDone(flagged) {
  if (flagged) {
    chips[JONAS] = chip("chip-warning", "Risk flagged");
    showResultChips();
    setState("done");
    showToast("Employment risk flagged · Jonas Novak", () => {
      chips[JONAS] = chip("chip-warning", "Needs you");
      markQuiet([TOMAS, JONAS]);
      chips[TOMAS] = chip("chip-success", "Message sent");
      paint();
      setState("question");
      renderQuestion();
      showToast("Message sent to Tomas", () => goDraft());
    });
  } else {
    chips[JONAS] = chip("chip-info", "Freelancer");
    showResultChips();
    setState("done");
    showToast("Left as freelancer · Jonas Novak", () => {
      chips[JONAS] = chip("chip-warning", "Needs you");
      markQuiet([TOMAS, JONAS]);
      chips[TOMAS] = chip("chip-success", "Message sent");
      paint();
      setState("question");
      renderQuestion();
      showToast("Message sent to Tomas", () => goDraft());
    });
  }
}

$("footer").addEventListener("click", (e) => {
  const id = e.target.closest("button")?.id;
  if (id === "cancel" || id === "notNow") dismiss();
  if (id === "review") goDraft();
  if (id === "back" || id === "snooze") goExceptions();
  if (id === "send") goQuestion();
});
$("close").addEventListener("click", dismiss);
$("scrim").addEventListener("click", () => {
  const s = stage.dataset.state;
  if (s === "sweeping" || s === "exceptions") dismiss();
});
checkItem.addEventListener("click", (e) => { e.stopPropagation(); runSweep(); });
sub.querySelectorAll(".item:not(#checkItem)").forEach((el) => el.addEventListener("click", closeMenus));
$("edit").addEventListener("click", () => {
  const editing = $("msgInput").hidden;
  if (editing) {
    $("msgInput").value = $("msgBody").textContent;
    show($("msgInput"), true);
    show($("msgBody"), false);
    $("edit").textContent = "Done";
    $("msgInput").focus();
  } else {
    $("msgBody").textContent = $("msgInput").value.trim() || MESSAGE;
    show($("msgInput"), false);
    show($("msgBody"), true);
    $("edit").textContent = "Edit";
  }
});
$("leave").addEventListener("click", () => goDone(false));
$("flag").addEventListener("click", () => goDone(true));
$("undo").addEventListener("click", () => { if (undoFn) undoFn(); });

function resetAll() {
  flow++;
  closeMenus();
  hideToast();
  blanks();
  resetMessage();
  setState("idle");
  $("cursor").classList.remove("on", "click");
}
$("reset").addEventListener("click", () => { demoId++; resetAll(); });

let demoId = 0;
const cursor = $("cursor");
async function moveTo(el, dx = 0.5, dy = 0.5) {
  const r = rel(el);
  cursor.style.left = r.x + r.w * dx + "px";
  cursor.style.top = r.y + r.h * dy + "px";
  await sleep(750);
}
async function click() {
  cursor.classList.add("click");
  await sleep(140);
  cursor.classList.remove("click");
  await sleep(80);
}
async function demo() {
  const id = ++demoId;
  const alive = () => id === demoId;
  resetAll();
  do {
    cursor.style.left = "46%";
    cursor.style.top = "62%";
    cursor.classList.add("on");
    await sleep(400);
    if (!alive()) return;
    await moveTo($("more"));
    if (!alive()) return;
    await click();
    openMenu();
    await sleep(350);
    await moveTo(agentItem);
    if (!alive()) return;
    openSub();
    await sleep(350);
    await moveTo(checkItem);
    if (!alive()) return;
    await click();
    await runSweep();
    if (!alive() || stage.dataset.state !== "exceptions") return;
    await sleep(700);
    await moveTo($("review"));
    if (!alive()) return;
    await click();
    goDraft();
    await sleep(800);
    await moveTo($("send"));
    if (!alive()) return;
    await click();
    goQuestion();
    await sleep(1100);
    await moveTo($("flag"));
    if (!alive()) return;
    await click();
    goDone(true);
    await sleep(1600);
    if (!alive()) return;
  } while ($("loop").checked);
  cursor.classList.remove("on");
}
$("play").addEventListener("click", demo);

const q = new URLSearchParams(location.search);
if (q.has("preview")) document.body.classList.add("preview");
if (q.has("record")) {
  document.body.classList.add("record");
  $("loop").checked = q.get("loop") !== "0";
  ctl.speed = Number(q.get("speed")) || 1;
  demo();
}
})();
