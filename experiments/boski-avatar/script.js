// Boski avatar showcase: state switcher, auto play, a chat that uses the avatar, sizes, mic input.
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const hero = BoskiAvatar.create($("hero"), { size: 380 });
const head = BoskiAvatar.create($("headAvatar"), { size: 26 });
const minis = [...document.querySelectorAll(".sz")].map((el) => BoskiAvatar.create(el, { size: +el.dataset.size }));

const CAPTIONS = {
  idle: "Breathing, glancing around, blinking now and then.",
  thinking: "Eye circles up while it ponders, head tilts back, a sheen sweeps the mark.",
  speaking: "Turns toward you with a little hop, the mouth opens with the voice.",
  listening: "Eye opens wide, leans in, a ring breathes with your voice.",
};
const tabs = [...document.querySelectorAll(".seg button")];
function setState(s) {
  hero.setState(s); minis.forEach((m) => m.setState(s));
  tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.state === s));
  $("caption").textContent = CAPTIONS[s];
}
tabs.forEach((b) => b.addEventListener("click", () => { $("auto").checked = false; setState(b.dataset.state); }));
document.addEventListener("keydown", (e) => {
  const i = "1234".indexOf(e.key);
  if (i >= 0 && !e.metaKey && !e.ctrlKey) { $("auto").checked = false; setState(BoskiAvatar.STATES[i]); }
});

// Auto play: listening → thinking → speaking → idle
let autoRun = 0;
async function auto() {
  const run = ++autoRun;
  const seq = [["listening", 2600], ["thinking", 3000], ["speaking", 3600], ["idle", 2200]];
  while ($("auto").checked && run === autoRun) {
    for (const [s, ms] of seq) { if (!$("auto").checked || run !== autoRun) return; setState(s); await wait(ms); }
  }
}
$("auto").addEventListener("change", () => $("auto").checked && auto());

// Chat: thinking while Boski works, speaking while its reply types in
const SCRIPT = [
  { you: "Is there a cheaper charger than the one I bought?" },
  { think: "Comparing 4 stores…", ms: 2200 },
  { boski: "Found the same Anker 65W for 119 zł, 30 zł less, with a parcel locker by your place tomorrow. Want it?" },
  { you: "Yes, go" },
  { think: "Paying with BLIK…", ms: 1600 },
  { boski: "Done. Parcel locker WAW214M, pickup tomorrow after 10:00." },
];
const thread = $("thread");
function row(cls, html, withAvatar) {
  const r = document.createElement("div");
  r.className = "row " + cls;
  if (withAvatar) { const av = document.createElement("span"); av.className = "av"; r.appendChild(av); }
  const b = document.createElement("div"); b.className = "bubble"; b.innerHTML = html; r.appendChild(b);
  thread.appendChild(r);
  while (thread.children.length > 6) { thread.firstChild._av?.destroy(); thread.firstChild.remove(); }
  return r;
}
async function chat() {
  for (;;) {
    [...thread.children].forEach((r) => r._av?.destroy());
    thread.innerHTML = "";
    let av = null;
    for (const step of SCRIPT) {
      if (step.you) { row("out", step.you); await wait(900); }
      if (step.think) {
        const r = row("in", `<span class="status">${step.think}</span>`, true);
        r.querySelector(".bubble").style.background = "transparent";
        r.querySelector(".bubble").style.padding = "4px 2px";
        av = r._av = BoskiAvatar.create(r.querySelector(".av"), { size: 26 });
        av.setState("thinking"); head.setState("thinking");
        $("headStatus").textContent = "thinking…"; $("headStatus").classList.add("live");
        await wait(step.ms);
        // the thinking row becomes the reply: avatar stays, bubble types in while it speaks
        const b = r.querySelector(".bubble"); b.style.background = ""; b.style.padding = ""; b.textContent = "";
        r._b = b; av._row = r;
      }
      if (step.boski) {
        av.setState("speaking"); head.setState("speaking");
        $("headStatus").textContent = "typing…";
        const words = step.boski.split(" ");
        for (let i = 0; i < words.length; i++) { av._row._b.textContent = words.slice(0, i + 1).join(" "); await wait(70 + Math.random() * 60); }
        await wait(500);
        av.setState("idle"); head.setState("idle");
        $("headStatus").textContent = "online"; $("headStatus").classList.remove("live");
        await wait(1100);
      }
    }
    await wait(2500);
  }
}

// Microphone: your voice drives listening (ring) and speaking (mouth)
let micStream = null, micRAF = 0;
$("mic").addEventListener("click", async () => {
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop()); micStream = null; cancelAnimationFrame(micRAF);
    $("mic").setAttribute("aria-pressed", "false"); $("mic").textContent = "Use microphone"; return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext(), an = ctx.createAnalyser(); an.fftSize = 1024;
    ctx.createMediaStreamSource(micStream).connect(an);
    const buf = new Float32Array(an.fftSize);
    $("mic").setAttribute("aria-pressed", "true"); $("mic").textContent = "Mic on";
    if (hero.state === "idle" || hero.state === "thinking") { $("auto").checked = false; setState("listening"); }
    (function loop() {
      an.getFloatTimeDomainData(buf);
      let s = 0; for (const v of buf) s += v * v;
      const rms = Math.sqrt(s / buf.length);
      hero.setAmplitude(Math.min(1, Math.max(0, (rms - 0.01) * 9)));
      micRAF = requestAnimationFrame(loop);
    })();
  } catch (e) { $("mic").textContent = "Mic blocked"; }
});

// ?state=thinking starts in a state, ?preview renders the hero alone at 16:10 (preview.png)
if (params.has("preview")) document.body.classList.add("preview");
setState(BoskiAvatar.STATES.includes(params.get("state")) ? params.get("state") : "idle");
if (params.has("auto")) { $("auto").checked = true; auto(); }
if (!params.has("nochat")) chat();
