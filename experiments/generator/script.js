// Seeded poster backgrounds. The generator below is the same code as the poster-bg skill (scripts/gen.js).
// The stage is #stage in index.html.
const stage = document.getElementById("stage");

/* ---- generator (same code as skill poster-bg / scripts/gen.js, palette passed as an object) ---- */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const PALETTES={
 baron:{paper:'#efe6d6',dark:'#1d1b1c',light:'#f3d9d4',accent:'#e0484a',inks:['#2f7fb8','#2f9a62','#e0484a','#ee7f9a','#f3d9d4']},
 zloto:{paper:'#b8963a',dark:'#262a4a',light:'#c9b36f',accent:'#2f9a62',inks:['#5b56d6','#262a4a','#2f9a62','#c9b36f']},
 roger:{paper:'#17161a',dark:'#17161a',light:'#ece3cf',accent:'#d93a3a',inks:['#ece3cf','#d93a3a','#8c8576']},
 marek:{paper:'#efe6dc',dark:'#101010',light:'#efe6dc',accent:'#f0287c',inks:['#101010','#f0287c','#efe6dc']},
 brasilia:{paper:'#dfd6c4',dark:'#0f1a1c',light:'#dfd6c4',accent:'#e54b1c',inks:['#96be1e','#00a8b5','#0a86c8','#e54b1c','#e0302b','#e43f8c','#ec7a00']},
 anima:{paper:'#d9c8bc',dark:'#14252b',light:'#d9c8bc',accent:'#c4572f',inks:['#14252b','#c4572f','#d9c8bc']},
 wesoft:{paper:'#d4cfc6',dark:'#141414',light:'#d4cfc6',accent:'#f26430',inks:['#000000','#f26430','#e9a083','#d4cfc6']},
 soft_flame:{paper:'#f0efec',dark:'#f0661c',light:'#f6f3ec',accent:'#fbd51a',inks:['#f6f3ec','#fbd51a','#f0661c','#d9304e']},
 soft_tricolor:{paper:'#efeeee',dark:'#14080c',light:'#f4f1ee',accent:'#2f55d6',inks:['#f4f1ee','#2f55d6','#14080c','#d3263e']},
 soft_violet:{paper:'#e8e4d6',dark:'#5a2f9a',light:'#eeeadb',accent:'#5a2f9a',inks:['#eeeadb','#0f7a52','#5a2f9a','#d6264f']},
 soft_orchard:{paper:'#ece8cf',dark:'#4a3a58',light:'#f3eedc',accent:'#9a5a96',inks:['#f3eedc','#ee9a62','#9a5a96','#4a3a58','#3f8a52']},
 soft_candy:{paper:'#f4f3f1',dark:'#ff9a1c',light:'#f4f3f1',accent:'#ff9a1c',inks:['#f4f3f1','#8fb6df','#ff9a1c','#ff7fb0']},
 soft_navy:{paper:'#e9e3d3',dark:'#10224a',light:'#f2efe4',accent:'#10224a',inks:['#f2efe4','#7fd0f0','#10224a','#2a7fd0']},
 soft_cobalt:{paper:'#5b86e0',dark:'#10131c',light:'#7fa4ec',accent:'#10131c',inks:['#7fa4ec','#10131c','#5b86e0']},
 soft_ochre:{paper:'#9a7438',dark:'#d9132a',light:'#a07a3c',accent:'#d9132a',inks:['#a07a3c','#e08aa0','#d9132a','#e08aa0']},
 soft_orchid:{paper:'#f1f1ee',dark:'#2d86c0',light:'#f2e3e6',accent:'#c0407a',inks:['#f2e3e6','#c0407a','#10305f','#2d86c0','#9fd0e6']},
 soft_redcore:{paper:'#f3f2ee',dark:'#1c6cb0',light:'#f4102c',accent:'#f4102c',inks:['#f4102c','#0c0c14','#1c6cb0','#9ad0ea'],core:0.5},
 fangor:{paper:'#e9e1d6',dark:'#10121a',light:'#f3ede4',accent:'#e23a2e',inks:['#e23a2e','#1b3f9e','#f3ede4','#10121a','#e98aa2']},
 fangor_blue:{paper:'#dde3ea',dark:'#0b1230',light:'#eef1f6',accent:'#ff5a36',inks:['#0b1230','#2a5bd7','#9db8f0','#eef1f6','#ff5a36']},
 fangor_green:{paper:'#e6e8d8',dark:'#0f3d2e',light:'#f2efe4',accent:'#e8503a',inks:['#0f3d2e','#2f9a62','#d9e8c4','#f2efe4','#e8503a']}};
const f=n=>+n.toFixed(1);
function seq(r,list,n){const out=[];for(let i=0;i<n;i++){let c;do{c=list[Math.floor(r()*list.length)];}while(c===out[i-1]&&list.length>1);out.push(c);}return out;}
function stripes(r,p,w,h){let defs='',body='',y=-r()*20,i=0,prev='';
 while(y<h){const bh=h*(0.055+r()*0.07);let c1;do{c1=p.inks[Math.floor(r()*p.inks.length)];}while(c1===prev&&p.inks.length>1);
  const c2=r()<.45?c1:r()<.6?p.light:p.paper;prev=c1;
  const a=0.05+r()*0.4,b=0.55+r()*0.4,id='g'+i++;
  defs+=`<linearGradient id="${id}" x1="0" x2="1"><stop offset="${f(a)}" stop-color="${c1}"/><stop offset="${f(b)}" stop-color="${c2}"/></linearGradient>`;
  body+=`<rect x="${f(-20+(r()-.5)*14)}" y="${f(y+(r()-.5)*5)}" width="${f(w+40)}" height="${f(bh-6)}" fill="url(#${id})"/>`;y+=bh;}
 return{defs,body};}
function rings(r,p,w,h){const cx=w*(0.5+(r()-.5)*.1),cy=h*.5,R=Math.min(w*.36,h*.3),radii=[1,.7,.45,.25];
 const L=seq(r,p.inks,4),Rr=seq(r,p.inks,4),bars=seq(r,p.inks,2);
 const defs=`<clipPath id="L"><rect width="${f(cx)}" height="${h}"/></clipPath><clipPath id="R"><rect x="${f(cx)}" width="${f(w-cx)}" height="${h}"/></clipPath>`;
 let body=`<rect x="${f(w*.14)}" y="${f(h*.17)}" width="${f(w*.1)}" height="${f(h*.6)}" fill="${bars[0]}"/><rect x="${f(w*.24)}" y="${f(h*.21)}" width="${f(w*.28)}" height="${f(h*.56)}" fill="${bars[1]}"/>`;
 radii.forEach((k,i)=>{body+=`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R*k)}" fill="${L[i]}" clip-path="url(#L)"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R*k)}" fill="${Rr[i]}" clip-path="url(#R)"/>`;});
 body+=`<path d="M${f(w*.2)} ${f(h*.76)}H${f(w*.8)}Q${f(w*.7)} ${f(h*.85)} ${f(w*.5)} ${f(h*.87)}Q${f(w*.3)} ${f(h*.85)} ${f(w*.2)} ${f(h*.76)}Z" fill="#f7f6f2"/>`;
 return{defs,body};}
function mosaic(r,p,w,h){const cols=11,rows=15,cw=w/cols,ch=h/rows;let body='';
 for(let j=0;j<rows;j++)for(let i=0;i<=(cols-1)/2;i++){if(r()<.38)continue;const acc=r()<.07;
  for(const ii of(i===cols-1-i?[i]:[i,cols-1-i])){const s=Math.min(cw,ch)*(.55+r()*.3),cx=(ii+.5)*cw+(r()-.5)*cw*.14,cy=(j+.5)*ch+(r()-.5)*ch*.14;
   body+=`<rect x="${f(-s/2)}" y="${f(-s/2)}" width="${f(s)}" height="${f(s*(.85+r()*.2))}" rx="${f(s*.08)}" fill="${acc?p.accent:p.light}" opacity="${f(.78+r()*.22)}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f((r()-.5)*10)})"/>`;}}
 return{defs:'',body,bg:p.dark};}
function blob(r,p,w,h){const m=Math.min(w,h),cx=w*(.4+r()*.2),cy=h*(.5+r()*.1),R=m*.3*(w>h?1.2:1);
 const defs=`<radialGradient id="halo"><stop offset=".55" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`;
 let body=`<circle cx="${f(cx-R*.15)}" cy="${f(cy-R*.2)}" r="${f(R*1.1)}" fill="url(#halo)"/>`;
 for(let k=0;k<3;k++){const n=11+Math.floor(r()*5),ox=cx+(r()-.5)*R*1.1,oy=cy+(r()-.4)*R*1.2,rr=R*(k?.35+r()*.3:.85),pts=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,d=rr*(.7+r()*.45);pts.push(`${f(ox+Math.cos(a)*d)},${f(oy+Math.sin(a)*d*1.2)}`);}
  body+=`<polygon points="${pts.join(' ')}" fill="${p.dark}" stroke="${p.dark}" stroke-width="${f(rr*.04)}" stroke-linejoin="round"/>`;}
 return{defs,body};}
function diagonals(r,p,w,h){const cols=4,rows=5,cs=Math.min(w/(cols+.6),h/(rows+.6)),ox=(w-cols*cs)/2,oy=(h-rows*cs)/2;
 const tri=[[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[1,1],[0,1]],[[0,0],[1,1],[0,1]]];let body='';
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const t=r(),x=ox+i*cs,y=oy+j*cs;
  if(t<.25)body+=`<rect x="${f(x+cs*.1)}" y="${f(y+cs*.1)}" width="${f(cs*.62)}" height="${f(cs*.62)}" fill="${p.accent}"/>`;
  else if(t<.8)body+=`<polygon points="${tri[Math.floor(r()*4)].map(([a,b])=>`${f(x+a*cs)},${f(y+b*cs)}`).join(' ')}" fill="${p.dark}"/>`;}
 return{defs:'',body};}
function steps(r,p,w,h){const n=4+Math.floor(r()*3),bw=w*.7/n,x0=w*.15,base=h*.85;let defs='',body='';
 for(let i=0;i<n;i++){const hh=h*(.14+(i+1)/n*.5+r()*.05),flip=r()<.35,id='s'+i;
  const stops=flip?[p.light,p.accent,'#000']:['#000',p.accent,p.light];
  defs+=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c,k)=>`<stop offset="${k/2}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  body+=`<rect x="${f(x0+i*bw)}" y="${f(base-hh)}" width="${f(bw)}" height="${f(hh)}" fill="url(#${id})"/>`;}
 return{defs,body,bg:p.dark};}
function fangor(r,p,w,h,o={}){
  const n=4+Math.floor(r()*4),cols=seq(r,p.inks,n),[b0,b1]=seq(r,p.inks,2),m=Math.min(w,h);
  const cx=w*(.38+r()*.24),cy=h*(.38+r()*.24),rx=m*(.34+r()*.12)*(w>h?1.15:1)*(o.size??1),ry=rx*(r()<.5?1:.6+r()*.5);
  const ang=r()*Math.PI*2,ox=cx+Math.cos(ang)*rx*.55,oy=cy+Math.sin(ang)*ry*.55,k=.3+r()*.25;
  const ring=cols.map((c,i)=>`<stop offset="${f(i/n*.85)}" stop-color="${c}"/>`).join('')+
    `<stop offset=".85" stop-color="${cols[n-1]}"/><stop offset="1" stop-color="${cols[n-1]}" stop-opacity="0"/>`;
  const defs=`<linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b0}"/><stop offset="1" stop-color="${b1}"/></linearGradient>`+
    `<radialGradient id="fr">${ring}</radialGradient>`+
    `<radialGradient id="fa"><stop offset="0" stop-color="${p.accent}"/><stop offset=".45" stop-color="${p.accent}" stop-opacity=".9"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`;
  const body=`<rect width="${w}" height="${h}" fill="url(#fb)"/>`+
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#fr)"/>`+
    `<ellipse cx="${f(ox)}" cy="${f(oy)}" rx="${f(rx*k)}" ry="${f(ry*k)}" fill="url(#fa)"/>`;
  return{defs,body};}
// one soft-edged ring on a flat ground. inks run from the centre out: [hole, band, band, ..., halo];
// neighbouring inks blend, the halo fades into the paper
function ring(r, p, w, h, o = {}) {
  const n = p.inks.length, m = Math.min(w, h), bands = n - 2;
  const cx = w * (.5 + (r() - .5) * .08), cy = h * (.5 + (r() - .5) * .08), rs = r(), R = m * .41 * (o.size ?? (.7 + rs * .7));
  const hs = p.core || (.1 + r() * .12), lo = hs + .12, hi = p.core ? .84 : .78, stops = [[0, p.inks[0], 1], [hs, p.inks[0], 1]];
  for (let i = 0; i < bands; i++) {
    const c = lo + (i + .5) * (hi - lo) / bands;
    stops.push([c - .03, p.inks[1 + i], 1], [c + .03, p.inks[1 + i], 1]);
  }
  stops.push([hi + .1, p.inks[n - 1], .95], [1, p.inks[n - 1], 0]);
  const g = stops.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  return { defs: `<radialGradient id="ring">${g}</radialGradient>`, body: `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 1.15)}" fill="url(#ring)"/>` };
}

// random harmonious palettes: kind is 'poster', 'fangor' or 'soft' (soft = ring, inks run hole, bands..., halo)
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), g = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + x(g(0)) + x(g(8)) + x(g(4));
}
function randomPalette(kind, rnd = Math.random) {
  const R = (a, b) => a + rnd() * (b - a), h0 = R(0, 360), step = R(40, 140) * (rnd() < .5 ? 1 : -1);
  if (kind === 'soft') {
    const n = 2 + Math.floor(rnd() * 2), core = rnd() < .22;
    const paper = hsl(h0 + R(-20, 20), R(5, 25), R(90, 97));
    const inks = [core ? hsl(h0, R(80, 95), R(48, 56)) : hsl(h0 + R(-20, 20), R(10, 35), R(92, 98))];
    for (let i = 0; i < n; i++) inks.push(hsl(h0 + step * (i + 1) + R(-12, 12), R(55, 90), i === n - 1 && rnd() < .6 ? R(12, 28) : R(32, 62)));
    inks.push(hsl(h0 + step * (n + 1) + R(-15, 15), R(65, 90), R(55, 70)));
    return { paper, dark: inks[inks.length - 2], light: inks[0], accent: inks[1], inks, core: core ? .5 : undefined };
  }
  const gap = R(35, 90), inks = Array.from({ length: 5 }, (_, i) => hsl(h0 + i * gap, R(45, 85), R(38, 62)));
  return { paper: hsl(h0, R(10, 30), R(84, 93)), dark: hsl(h0 + 180, R(25, 45), R(8, 16)), light: hsl(h0, R(30, 60), R(86, 94)), accent: hsl(h0 + R(150, 210), R(70, 90), R(50, 58)), inks };
}

const MOTIFS={stripes,rings,mosaic,blob,diagonals,steps,fangor,ring};
function generate(motif,p,seed,w,h,o={}){const r=rng(seed),m=MOTIFS[motif](r,p,w,h,o);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${m.defs||''}</defs><rect width="${w}" height="${h}" fill="${m.bg||p.paper}"/>${m.body}</svg>`;}

/* ---- UI ---- */
const MOTIF_LABEL = { stripes: "Stripes", rings: "Rings and towers", mosaic: "Mosaic", blob: "Halo blob", diagonals: "Triangles", steps: "Steps" };
const PALETTE_LABEL = { baron: "Baron", zloto: "Gold", roger: "King Roger", marek: "Father Marek", brasilia: "Brasília", anima: "Anima", wesoft: "Wesoft", fangor: "Fangor red", fangor_blue: "Fangor blue", fangor_green: "Fangor green", soft_flame: "Flame", soft_tricolor: "Tricolor", soft_violet: "Violet", soft_orchard: "Orchard", soft_candy: "Candy", soft_navy: "Navy", soft_cobalt: "Cobalt", soft_ochre: "Ochre", soft_orchid: "Orchid", soft_redcore: "Red core" };
const SIZES = [["Portrait", 1200, 1600], ["Square", 1200, 1200], ["Landscape", 1440, 900], ["Banner", 1600, 500]];
const POSTER_MOTIFS = Object.keys(MOTIF_LABEL);
const prefix = { poster: null, fangor: "fangor", soft: "soft_" };
const palettesOf = g => Object.keys(PALETTES).filter(k => (g === "poster") ? !k.startsWith("fangor") && !k.startsWith("soft_") : k.startsWith(prefix[g]));
const $ = id => document.getElementById(id);
const clone = o => JSON.parse(JSON.stringify(o));
const pick = a => a[Math.floor(Math.random() * a.length)];
const uri = s => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);

const S = { group: "poster", motif: "stripes", palette: "baron", seed: 7, w: 1200, h: 1600, work: clone(PALETTES.baron), modified: false, size: null };
let hist = [], lastSig = "", toastT;

const motifName = () => (S.group === "fangor" ? "fangor" : S.group === "soft" ? "ring" : S.motif);
const svg = () => generate(motifName(), S.work, S.seed, S.w, S.h, { size: S.size ?? undefined });

function fillSelects() {
  $("motif").innerHTML = POSTER_MOTIFS.map(m => `<option value="${m}">${MOTIF_LABEL[m]}</option>`).join("");
  $("palette").innerHTML = palettesOf(S.group).map(k => `<option value="${k}">${PALETTE_LABEL[k]}</option>`).join("");
  $("motif").value = S.motif;
  $("palette").value = S.palette;
  $("motif-field").hidden = S.group !== "poster";
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
  $("swatches").innerHTML = named.map(([k, l]) => one(k, null, l)).join("") + '<span class="break"></span>' + S.work.inks.map((_, i) => one("inks", i, "Ink " + (i + 1))).join("");
  $("resetColors").hidden = !S.modified;
}
function toast(t) { $("toast").textContent = t; clearTimeout(toastT); toastT = setTimeout(() => ($("toast").textContent = ""), 2400); }

function render(push = true) {
  $("preview").src = uri(svg());
  $("preview").width = S.w;
  $("preview").height = S.h;
  $("recipe").textContent = `${motifName()} · ${S.palette} · ${S.seed} · ${S.w}×${S.h}`;
  $("csize").value = S.size ?? 1;
  $("csizeVal").textContent = S.size == null ? "Auto" : S.size.toFixed(2) + "×";
  $("seed").value = S.seed; $("w").value = S.w; $("h").value = S.h;
  $("g-poster").setAttribute("aria-pressed", S.group === "poster");
  $("g-fangor").setAttribute("aria-pressed", S.group === "fangor");
  $("g-soft").setAttribute("aria-pressed", S.group === "soft");
  document.querySelectorAll("#sizes button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.w === S.w && +b.dataset.h === S.h));
  const sig = [motifName(), S.palette, S.seed, S.w, S.h, S.size, JSON.stringify(S.work)].join("|");
  if (push && sig !== lastSig) {
    lastSig = sig;
    hist.unshift({ sig, state: clone(S), thumb: uri(generate(motifName(), S.work, S.seed, Math.round(S.w / 4), Math.round(S.h / 4), { size: S.size ?? undefined })) });
    hist = hist.slice(0, 10);
    drawHist();
  }
}
function drawHist() {
  $("hist").innerHTML = hist.map((h, i) => `<button type="button" data-i="${i}" ${h.sig === lastSig ? 'aria-current="true"' : ""} aria-label="Back to version ${i + 1}"><img alt="" src="${h.thumb}"></button>`).join("");
}

function setGroup(g) {
  if (S.group === g) return;
  S.group = g;
  S.palette = palettesOf(g)[0];
  S.work = clone(PALETTES[S.palette]);
  S.modified = false;
  fillSelects(); fillSwatches(); render();
}
function setPalette(k) { S.palette = k; S.work = clone(PALETTES[k]); S.modified = false; fillSwatches(); render(); }
function rollColors() {
  S.work = randomPalette(S.group, Math.random);
  S.modified = true;
  fillSwatches(); render();
}
function rollAll() {
  if (!$("lockMotif").checked && S.group === "poster") S.motif = pick(POSTER_MOTIFS);
  if ($("randColors").checked) { S.work = randomPalette(S.group, Math.random); S.modified = true; }
  else if (!$("lockPalette").checked) { S.palette = pick(palettesOf(S.group)); S.work = clone(PALETTES[S.palette]); S.modified = false; }
  S.seed = Math.floor(Math.random() * 100000);
  fillSelects(); fillSwatches(); render();
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
$("g-soft").onclick = () => setGroup("soft");
$("motif").onchange = e => { S.motif = e.target.value; render(); };
$("palette").onchange = e => setPalette(e.target.value);
$("seed").oninput = e => { S.seed = Math.max(0, Math.min(999999, Math.floor(+e.target.value || 0))); render(); };
$("seedPrev").onclick = () => { S.seed = Math.max(0, S.seed - 1); render(); };
$("seedNext").onclick = () => { S.seed = Math.min(999999, S.seed + 1); render(); };
$("seedRand").onclick = () => { S.seed = Math.floor(Math.random() * 100000); render(); };
$("rollAll").onclick = rollAll;
$("rollColors").onclick = rollColors;
$("csize").oninput = e => { S.size = +e.target.value; render(); };
$("csizeAuto").onclick = () => { S.size = null; render(); };
$("sizes").onclick = e => { const b = e.target.closest("button"); if (!b) return; S.w = +b.dataset.w; S.h = +b.dataset.h; render(); };
const dim = (id, key) => ($(id).onchange = e => { S[key] = Math.max(200, Math.min(4000, Math.round(+e.target.value || S[key]))); render(); });
dim("w", "w"); dim("h", "h");
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
  const cmd = `node scripts/gen.js --motif ${motifName()} --palette ${S.palette} --seed ${S.seed} --size ${S.w}x${S.h} --out bg.svg`;
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
