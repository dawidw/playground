// Boski avatar: the Boski brandmark as a living avatar with four states.
//   idle      subtle breathing, glances, blinks
//   thinking  eye circles up while it ponders, head tilts back, a sheen sweeps the mark, three dots orbit
//   speaking  turns toward you (eye to front + a little hop), jaw opens with the voice, sound waves from the mouth
//   listening eye opens wider, leans in, a ring breathes with your voice
// Geometry: the official brandmark (boski.com/brand/brandmark/boski-brandmark-black.svg, viewBox 0 0 1200 1200),
// split into the head (outer contour) and the eye (the hole, now a moving mask). The mouth sits
// at the chin corner (719, 678), where the beak meets the jaw: speaking opens a slit there.
//
// Usage: const a = BoskiAvatar.create(el, { size: 120, tone: "dark" | "light" });
//        a.setState("thinking"); a.setAmplitude(0..1) (optional: drives speaking/listening instead of the fake voice)

(function () {
  const HEAD = "M834.739 445.525C810.729 363.308 767.646 279.218 690.931 243.982C600.508 202.533 488.374 246.025 426.219 324.753C364.063 403.481 344.055 508.848 343.033 609.79C341.926 728.605 368.576 855.08 451.591 938.574C484.457 971.598 529.243 997.471 574.965 991.003C644.442 981.13 683.694 904.53 700.212 834.994C712.387 783.672 718.688 730.988 718.773 678.219C753.001 677.964 821.116 677.709 855.344 677.453C855.344 677.453 861.73 537.956 834.654 445.44Z";
  const EYE = { cx: 631.841, cy: 536.169, rx: 72.54, ry: 73.88 };
  const MOUTH = { x: 719, y: 678.2 };      // chin corner of the brandmark
  const BASE = { x: 600, y: 992 };         // feet of the mark: breathing and hops scale from here
  const VB = "170 180 860 860";
  const NS = "http://www.w3.org/2000/svg";
  const STATES = ["idle", "thinking", "speaking", "listening"];
  let uid = 0;

  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Fake voice: syllables (fast attack, soft release) grouped into words with pauses.
  function makeVoice() {
    let next = 0, target = 0, level = 0, word = 0;
    return function (t, dt) {
      if (t >= next) {
        if (word <= 0) { word = 2 + Math.floor(Math.random() * 5); target = 0; next = t + 0.12 + Math.random() * 0.28; }
        else { word--; target = 0.35 + Math.random() * 0.65; next = t + 0.08 + Math.random() * 0.14; }
      }
      const k = target > level ? 28 : 11;            // attack vs release
      level += (target - level) * Math.min(1, k * dt);
      if (t > next - 0.04 && word > 0) target *= 0.6; // close the mouth between syllables
      return Math.max(0, Math.min(1, level));
    };
  }

  const all = new Set();
  let last = 0, running = false;
  function frame(now) {
    const t = now / 1000, dt = last ? Math.min(0.05, t - last) : 0.016;
    last = t;
    all.forEach((a) => a._tick(t, dt));
    if (all.size) requestAnimationFrame(frame); else { running = false; last = 0; }
  }

  function create(host, opts = {}) {
    const id = "bsk" + (++uid);
    const size = opts.size || 120;
    const svg = svgEl("svg", { viewBox: VB, width: size, height: size, class: "boski-avatar", role: "img", "aria-label": "Boski" });
    svg.style.overflow = "visible";
    svg.dataset.tone = opts.tone || "light";
    const defs = svgEl("defs", {}, svg);

    // Eye = hole in the head
    const mask = svgEl("mask", { id: id + "-m", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1200, height: 1200 }, defs);
    svgEl("rect", { x: 0, y: 0, width: 1200, height: 1200, fill: "#fff" }, mask);
    const eye = svgEl("ellipse", { cx: EYE.cx, cy: EYE.cy, rx: EYE.rx, ry: EYE.ry, fill: "#000" }, mask);
    const mouth = svgEl("path", { d: "", fill: "#000" }, mask);

    const cHead = svgEl("clipPath", { id: id + "-h", clipPathUnits: "userSpaceOnUse" }, defs);
    svgEl("path", { d: HEAD }, cHead);

    const grad = svgEl("linearGradient", { id: id + "-g", x1: 0, y1: 0, x2: 1, y2: 0.35 }, defs);
    [[0, 0], [0.42, 0], [0.5, 1], [0.58, 0], [1, 0]].forEach(([o, a]) =>
      svgEl("stop", { offset: o, "stop-color": "var(--boski-sheen, #fff)", "stop-opacity": a }, grad));

    const body = svgEl("g", {}, svg);                       // pose: hop, breathe, tilt, turn
    // Listening rings: the head outline, breathing outward (behind the head, leaning with it)
    const ring = svgEl("path", { d: HEAD, fill: "none", stroke: "var(--boski-ink, #202020)", "stroke-width": 3, "vector-effect": "non-scaling-stroke", opacity: 0 }, body);
    const ring2 = svgEl("path", { d: HEAD, fill: "none", stroke: "var(--boski-ink, #202020)", "stroke-width": 2, "vector-effect": "non-scaling-stroke", opacity: 0 }, body);
    const masked = svgEl("g", { mask: `url(#${id}-m)` }, body);
    const fill = "var(--boski-ink, #202020)";
    svgEl("path", { d: HEAD, fill }, masked);
    const sheenWrap = svgEl("g", { "clip-path": `url(#${id}-h)`, opacity: 0 }, masked);
    const sheen = svgEl("rect", { x: -400, y: 180, width: 900, height: 900, fill: `url(#${id}-g)`, opacity: 0.32 }, sheenWrap);

    // Sound waves from the mouth (beak corner ~ 862, 678)
    const waves = svgEl("g", { fill: "none", stroke: fill, "stroke-width": 24, "stroke-linecap": "round" }, body);
    const wave = [0, 1, 2].map((i) => {
      const r = 60 + i * 48;
      return svgEl("path", { d: `M ${880 + r * Math.cos(-0.62)} ${690 + r * Math.sin(-0.62)} A ${r} ${r} 0 0 1 ${880 + r * Math.cos(0.62)} ${690 + r * Math.sin(0.62)}`, opacity: 0 }, waves);
    });

    // Thinking dots orbit the head
    const DOTS = [[868, 352, 15], [922, 296, 20], [984, 232, 26]];
    const dots = DOTS.map(([cx, cy, r]) => svgEl("circle", { cx, cy, r, fill, opacity: 0 }, svg));

    host.appendChild(svg);

    const voice = makeVoice();
    const w = { idle: 1, thinking: 0, speaking: 0, listening: 0 };
    const p = { ex: 0, ey: 0, es: 1, jaw: 0, tilt: 0, sc: 1, sy: 1, ty: 0, turn: 1 };
    let state = opts.state || "idle", ext = null, extT = 0, amp = 0;
    let blinkAt = 1 + Math.random() * 2, blinkT = -1, enteredSpeak = -9, enteredAny = -9;
    let glance = { x: 0, y: 0, at: 0 };
    w.idle = 0; w[state] = 1;

    const api = {
      el: svg,
      get state() { return state; },
      setState(s) {
        if (!STATES.includes(s) || s === state) return;
        state = s; svg.dataset.state = s;
        enteredAny = performance.now() / 1000;
        if (s === "speaking") { enteredSpeak = enteredAny; blinkT = enteredAny + 0.02; }
      },
      setAmplitude(v) { ext = Math.max(0, Math.min(1, v)); extT = performance.now() / 1000; },
      destroy() { all.delete(api); svg.remove(); },
      _tick(t, dt) {
        const rm = reduced() ? 0.25 : 1;
        // state weights ease toward the target: every pose blends, nothing jumps
        for (const s of STATES) w[s] += ((s === state ? 1 : 0) - w[s]) * Math.min(1, dt * 6);

        // amplitude: external (mic / TTS) if fresh, else the fake voice
        const useExt = ext !== null && t - extT < 0.3;
        const raw = useExt ? ext : (state === "speaking" ? voice(t, dt) : 0);
        amp += (raw - amp) * Math.min(1, dt * (raw > amp ? 30 : 12));
        const a = amp * rm;

        // idle: breathe + occasional glances
        if (t > glance.at) glance = { x: (Math.random() - 0.4) * 34, y: (Math.random() - 0.5) * 22, at: t + 1.6 + Math.random() * 2.6 };
        const br = Math.sin(t * Math.PI * 2 / 4.2);
        const I = { ex: glance.x * rm, ey: glance.y * rm, es: 1, jaw: 0, tilt: 1.2 * Math.sin(t * 0.55) * rm, sc: 1 + 0.014 * br * rm, sy: 1 + 0.01 * br * rm, ty: 0, turn: 1 };

        // thinking: eye circles up-right, head tilts back and sways
        const ph = t * 2.4;
        const T = { ex: (14 + 22 * Math.cos(ph) * rm), ey: (-26 + 14 * Math.sin(ph) * rm), es: 0.86 + 0.04 * Math.sin(ph * 2) * rm,
          jaw: 0, tilt: -4 + 2.2 * Math.sin(t * 1.3) * rm, sc: 1 + 0.018 * Math.sin(t * 2.6) * rm, sy: 1, ty: -6 * rm, turn: 1 };

        // speaking: turned toward you, jaw and bob follow the voice; hop on entry
        const since = t - enteredSpeak, hop = since < 0.9 ? Math.sin(Math.min(1, since / 0.9) * Math.PI) * Math.exp(-since * 2.2) : 0;
        const S = { ex: -24, ey: 6 - 6 * a, es: 1.04 + 0.1 * a, jaw: 58 * a, tilt: -1.5 * a + 2 * hop * rm,
          sc: 1 + 0.025 * a + 0.07 * hop * rm, sy: 1 - 0.018 * a, ty: -16 * a - 34 * hop * rm, turn: 0.955 + 0.045 * (1 - hop) };

        // listening: eye wide, leaning in, slow nod
        const L = { ex: 4, ey: 2, es: 1.13 + 0.05 * a, jaw: 0, tilt: 3.5 + 1.2 * Math.sin(t * 1.6) * rm, sc: 1.01 + 0.012 * Math.sin(t * 2) * rm, sy: 1, ty: 0, turn: 1 };

        const tw = w.idle + w.thinking + w.speaking + w.listening || 1;
        for (const k in p) p[k] = (I[k] * w.idle + T[k] * w.thinking + S[k] * w.speaking + L[k] * w.listening) / tw;

        // blinks: random in idle/listening, one on entering speaking; none while thinking
        if (t > blinkAt && w.thinking < 0.5) { blinkT = t; blinkAt = t + 2.6 + Math.random() * 3.6; }
        const bt = (t - blinkT) / 0.16, blink = bt >= 0 && bt <= 1 ? 1 - 0.92 * Math.sin(bt * Math.PI) : 1;

        eye.setAttribute("cx", EYE.cx + p.ex);
        eye.setAttribute("cy", EYE.cy + p.ey);
        eye.setAttribute("rx", EYE.rx * p.es);
        eye.setAttribute("ry", EYE.ry * p.es * blink);
        // mouth: a "<" slit that opens at the chin corner, where the beak meets the jaw
        const h = Math.max(0, p.jaw);
        mouth.setAttribute("d", h < 0.4 ? "" :
          `M ${MOUTH.x - 92 - h * 1.4} ${MOUTH.y + h * 0.18} Q ${MOUTH.x - 40} ${MOUTH.y - h * 0.34} ${MOUTH.x + 10} ${MOUTH.y - h * 0.26} Q ${MOUTH.x + 90} ${MOUTH.y - h * 0.16} ${MOUTH.x + 160} ${MOUTH.y + 2} L ${MOUTH.x + 160} ${MOUTH.y + h} L ${MOUTH.x + 10} ${MOUTH.y + h} Q ${MOUTH.x - 40} ${MOUTH.y + h * 0.95} ${MOUTH.x - 92 - h * 1.4} ${MOUTH.y + h * 0.18} Z`);
        body.setAttribute("transform",
          `translate(${BASE.x} ${BASE.y + p.ty}) scale(${p.sc * p.turn} ${p.sc * p.sy}) translate(${-BASE.x} ${-BASE.y}) rotate(${p.tilt} 600 760)`);

        sheenWrap.setAttribute("opacity", (w.thinking * 1).toFixed(3));
        const sx = ((t * 0.55) % 1.6) - 0.3;                   // sweep left to right, then rest
        sheen.setAttribute("x", -500 + sx * 900);

        waves.setAttribute("opacity", w.speaking.toFixed(3));
        wave.forEach((n, i) => {
          const lv = Math.max(0, Math.min(1, a * 1.6 - i * 0.35));
          n.setAttribute("opacity", lv.toFixed(3));
          n.setAttribute("transform", `translate(${(1 - lv) * -18} 0)`);
        });

        const listenA = w.listening * (0.18 + 0.5 * a);
        const rp = (t * 0.6) % 1;
        ring.setAttribute("opacity", (listenA * (1 - rp) * 1.4).toFixed(3));
        ring.setAttribute("transform", `translate(600 617) scale(${1.05 + rp * 0.2 + a * 0.06}) translate(-600 -617)`);
        ring2.setAttribute("opacity", (w.listening * (0.18 + 0.5 * a)).toFixed(3));
        ring2.setAttribute("transform", `translate(600 617) scale(${1.06 + a * 0.06}) translate(-600 -617)`);

        dots.forEach((d, i) => {
          // a wave runs up the trail: small dot first, then the bigger ones
          const k = (Math.sin(t * 4.2 - i * 0.9) + 1) / 2;
          const on = rm < 1 ? 0.75 : 0.35 + 0.65 * k;
          d.setAttribute("opacity", (w.thinking * on).toFixed(3));
          const [cx, cy] = DOTS[i];
          d.setAttribute("transform", `translate(${cx} ${cy - 10 * k * rm}) scale(${0.8 + 0.25 * k * rm}) translate(${-cx} ${-cy})`);
        });
      },
    };
    svg.dataset.state = state;
    all.add(api);
    if (!running) { running = true; requestAnimationFrame(frame); }
    return api;
  }

  window.BoskiAvatar = { create, STATES };
})();
