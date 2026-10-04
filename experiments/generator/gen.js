// poster-bg generator: seeded SVG backgrounds in the spirit of the Polish School of Posters,
// 60s/70s geometric modernism and Wojciech Fangor's soft op art. Plain JS, no dependencies.
// It runs in node (CLI below), in the browser (experiments/generator) and inside Figma's use_figma.
//   node gen.js --motif stripes --palette baron --seed 7 --size 1200x1600 --out bg.svg
//   node gen.js --poster | --fangor | --ring | --dream [--colors random] [--circle 1.2] [--x 0.4 --y 0.6] [--grain 16 (mosaic tiles across)] --out bg.svg
// In use_figma: paste everything above the CLI block, then figma.createNodeFromSvg(generate(...)).

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
 mazur:{paper:'#efe4cf',dark:'#14213d',light:'#f4ecd8',accent:'#d62828',inks:['#14213d','#d62828','#f77f00','#fcbf49','#3a7ca5']},
 jesien:{paper:'#e8dcc4',dark:'#2d1e1a',light:'#efe6d2',accent:'#c1440e',inks:['#c1440e','#e0a458','#5b7b4a','#2d1e1a','#d9c7a3']},
 moda:{paper:'#f6e8ea',dark:'#1b1b2f',light:'#fdf0f2',accent:'#ff2e63',inks:['#ff2e63','#252a34','#08d9d6','#f9f7f7']},
 cyrk:{paper:'#f2e9dc',dark:'#2b2d42',light:'#f7f1e5',accent:'#ef233c',inks:['#2b2d42','#ef233c','#8d99ae','#f2c14e']},
 fangor_sunset:{paper:'#f0e6dc',dark:'#3b1244',light:'#fbf4ea',accent:'#d62839',inks:['#d62839','#f77f00','#6a0572','#fcbf49','#2a9d8f']},
 fangor_mint:{paper:'#e8efe6',dark:'#264653',light:'#f6faf4',accent:'#e76f51',inks:['#2a9d8f','#e9c46a','#264653','#f4a261','#e76f51']},
 fangor_mono:{paper:'#e6e6e6',dark:'#111111',light:'#fafafa',accent:'#444444',inks:['#111111','#777777','#dddddd','#444444','#999999']},
 soft_lagoon:{paper:'#e8efe9',dark:'#12607a',light:'#f1f6f0',accent:'#46c2b4',inks:['#f1f6f0','#46c2b4','#12607a','#0d2f52','#6fa8dc']},
 soft_ember:{paper:'#f1ece6',dark:'#b3122e',light:'#fff3dd',accent:'#f05a1a',inks:['#fff3dd','#ffc23a','#f05a1a','#b3122e','#e8708a']},
 soft_mono:{paper:'#ecebe8',dark:'#1a1a1a',light:'#f4f3f0',accent:'#9a9a98',inks:['#f4f3f0','#9a9a98','#1a1a1a','#8e8e8c']},
 soft_blush:{paper:'#f4eeea',dark:'#7a2745',light:'#fbf6f1',accent:'#c9485b',inks:['#fbf6f1','#f2b6b0','#c9485b','#7a2745','#e9a0a8']},
 soft_lilac:{paper:'#f1eef4',dark:'#5a3d9a',light:'#f8f5fb',accent:'#b79ce2',inks:['#f8f5fb','#b79ce2','#5a3d9a','#c0398a']},
 dream_navy:{paper:'#c8284f',dark:'#1a2347',light:'#f6dadf',accent:'#1496d4',glow:'#1496d4',inks:['#c8284f','#f6dadf','#1a2347','#d8b3a4','#c8284f','#f6dadf']},
 dream_sun:{paper:'#f7c315',dark:'#ee4a24',light:'#f3e3d6',accent:'#ff8a1e',inks:['#f7c315','#f3e3d6','#ee4a24','#f3e3d6','#ff8a1e','#d9a6c8']},
 dream_flag:{paper:'#e4202a',dark:'#0f6a66',light:'#c9aeb4',accent:'#e4202a',glow:'#0b3c40',inks:['#e4202a','#c9aeb4','#0f6a66','#e4202a']},
 dream_azure:{paper:'#2aa7dd',dark:'#8d2b2b',light:'#7ecbe8',accent:'#ffb347',inks:['#2aa7dd','#8d2b2b','#ffb347','#7ecbe8','#8d2b2b','#2aa7dd']},
 dream_spectrum:{paper:'#6b2670',dark:'#2036a8',light:'#f2c230',accent:'#ff6a14',soft:1.7,inks:['#6b2670','#2036a8','#18a7a0','#f2c230','#ff6a14']},
 dream_candy:{paper:'#f3efe6',dark:'#1d7a4f',light:'#f3efe6',accent:'#e04fb3',inks:['#f3efe6','#1d7a4f','#e04fb3','#f2b705','#f3efe6']},
 dream_lagoon:{paper:'#f08a1e',dark:'#6a3a8a',light:'#f08a1e',accent:'#1d5fc0',inks:['#f08a1e','#6a3a8a','#1d5fc0','#f08a1e','#6a3a8a']},
 dream_rose:{paper:'#f2d6d6',dark:'#2a1b3d',light:'#f2d6d6',accent:'#2a8fbd',glow:'#2a8fbd',inks:['#f2d6d6','#b0264f','#2a1b3d','#f2d6d6','#b0264f']},
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
function mosaic(r,p,w,h,o={}){const cols=o.grain||11,rows=o.grain?Math.round(o.grain*h/w):15,cw=w/cols,ch=h/rows;let body='';
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
function fangor(r, p, w, h, o = {}) {
  const m = Math.min(w, h), n = 6 + Math.floor(r() * 4), jx = r(), jy = r();
  const cx = w * (o.x ?? (.4 + jx * .2)), cy = h * (o.y ?? (.4 + jy * .2));
  const rx = m * (.3 + r() * .12) * (w > h ? 1.15 : 1) * (o.size ?? 1), ry = rx * (r() < .5 ? 1 : .62 + r() * .3);
  const cyc = [0, 1, 0, 2, 1, 3].map(i => p.inks[i % p.inks.length]), last = cyc[(n - 1) % 6];
  const stops = [[0, p.light, 1], [.07, p.light, 1]];
  for (let i = 0; i < n; i++) stops.push([.14 + i * (.66 / (n - 1)), cyc[i % 6], 1]);
  stops.push([.9, last, .95], [1, last, 0]);
  const g = stops.map(([off, c, a]) => `<stop offset="${f(off)}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  const dx = rx * .07 * (r() < .5 ? -1 : 1), dy = ry * .05 * (r() < .5 ? -1 : 1);
  // a faint, slightly larger echo behind the main disc makes the edge vibrate
  const body = `<ellipse cx="${f(cx + dx)}" cy="${f(cy + dy)}" rx="${f(rx * 1.08)}" ry="${f(ry * 1.08)}" fill="url(#fr)" opacity=".22"/>` +
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#fr)"/>`;
  return { defs: `<radialGradient id="fr">${g}</radialGradient>`, body };
}
// one soft-edged ring on a flat ground. inks run from the centre out: [hole, band, band, ..., halo];
// neighbouring inks blend, the halo fades into the paper
function ring(r, p, w, h, o = {}) {
  const n = p.inks.length, m = Math.min(w, h), bands = n - 2;
  const jx = r(), jy = r(), cx = w * (o.x ?? (.5 + (jx - .5) * .08)), cy = h * (o.y ?? (.5 + (jy - .5) * .08)), rs = r(), R = m * .41 * (o.size ?? (.7 + rs * .7));
  const hs = p.core || (.1 + r() * .12), lo = hs + .12, hi = p.core ? .84 : .78, stops = [[0, p.inks[0], 1], [hs, p.inks[0], 1]];
  for (let i = 0; i < bands; i++) {
    const c = lo + (i + .5) * (hi - lo) / bands;
    stops.push([c - .03, p.inks[1 + i], 1], [c + .03, p.inks[1 + i], 1]);
  }
  stops.push([hi + .1, p.inks[n - 1], .95], [1, p.inks[n - 1], 0]);
  const g = stops.map(([o, c, a]) => `<stop offset="${f(o)}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  return { defs: `<radialGradient id="ring">${g}</radialGradient>`, body: `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 1.15)}" fill="url(#ring)"/>` };
}

// flowing wavy bands with soft edges (Fangor's wave paintings): every band is a stack of translucent strokes
// along a wavy centreline, so no filters are needed. inks run across the bands, the first and last reach the edges.
function dream(r, p, w, h, o = {}) {
  const k = o.size ?? 1, D = Math.hypot(w, h), m = Math.min(w, h), n = p.inks.length;
  const th = [-38, -22, 0, 90, 28, -62][Math.floor(r() * 6)] * Math.PI / 180, ca = Math.cos(th), sa = Math.sin(th);
  const lam = m * (.75 + r() * .7) * k, A = m * (.06 + r() * .09) * k, ph = r() * 6.28, ph2 = r() * 6.28;
  const cx = w * (o.x ?? .5), cy = h * (o.y ?? .5), widths = p.inks.map(() => .7 + r() * .8);
  const sum = widths.reduce((a, b) => a + b, 0), span = D * .9 * k, R = D / 2 + 100, N = 36, K = 24;
  const lum = c => { const x = parseInt(c.slice(1), 16); return (x >> 16) * .3 + ((x >> 8) & 255) * .59 + (x & 255) * .11; };
  const darkest = p.inks.reduce((bi, c, i) => (lum(c) < lum(p.inks[bi]) ? i : bi), 0);
  const ribbon = (v0, hw, soft, color, a) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = -R + 2 * R * i / N, v = v0 + A * Math.sin(2 * Math.PI * u / lam + ph) + A * .3 * Math.sin(2 * Math.PI * u / (lam * .43) + ph2);
      pts.push(`${f(cx + u * ca - v * sa)} ${f(cy + u * sa + v * ca)}`);
    }
    const d = 'M' + pts.join('L');
    let s = '';
    for (let j = 0; j < K; j++) s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(Math.max(1, (hw + soft * (1 - 2 * j / (K - 1))) * 2))}" stroke-opacity="${a}" stroke-linejoin="round"/>`;
    return s;
  };
  let v = -span / 2, body = '';
  p.inks.forEach((c, i) => {
    const bw = span * widths[i] / sum, hw = bw * .62, soft = Math.min(hw * .9, bw * (.25 + r() * .35) * (p.soft || 1));
    const ext = i === 0 ? -D : i === n - 1 ? D : 0, v0 = v + bw / 2 + ext, hwe = hw + Math.abs(ext);
    if (p.glow && i === darkest) body += ribbon(v0, hwe + bw * .12, soft * 1.1, p.glow, .13);
    body += ribbon(v0, hwe, soft, c, .13);
    v += bw;
  });
  return { defs: `<clipPath id="dc"><rect width="${w}" height="${h}"/></clipPath>`, body: `<g clip-path="url(#dc)">${body}</g>` };
}

// random harmonious palettes. kind: 'poster', 'random' (Fangor discs), 'ring' (inks run hole, bands..., halo) or 'dream'
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), g = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + x(g(0)) + x(g(8)) + x(g(4));
}
function randomPalette(kind, rnd = Math.random) {
  const R = (a, b) => a + rnd() * (b - a), h0 = R(0, 360), step = R(40, 140) * (rnd() < .5 ? 1 : -1);
  if (kind === 'ring') {
    const n = 2 + Math.floor(rnd() * 2), core = rnd() < .22;
    const paper = hsl(h0 + R(-20, 20), R(5, 25), R(90, 97));
    const inks = [core ? hsl(h0, R(80, 95), R(48, 56)) : hsl(h0 + R(-20, 20), R(10, 35), R(92, 98))];
    for (let i = 0; i < n; i++) inks.push(hsl(h0 + step * (i + 1) + R(-12, 12), R(55, 90), i === n - 1 && rnd() < .6 ? R(12, 28) : R(32, 62)));
    inks.push(hsl(h0 + step * (n + 1) + R(-15, 15), R(65, 90), R(55, 70)));
    return { paper, dark: inks[inks.length - 2], light: inks[0], accent: inks[1], inks, core: core ? .5 : undefined };
  }
  if (kind === 'dream') {
    const n = 4 + Math.floor(rnd() * 3), inks = [];
    for (let i = 0; i < n; i++) inks.push(hsl(h0 + i * step * .6 + R(-15, 15), R(55, 92), R(26, 66)));
    return { paper: inks[0], dark: inks[1], light: inks[2], accent: inks[3], glow: rnd() < .4 ? hsl(h0 + R(150, 210), 85, 50) : undefined, inks };
  }
  const gap = R(35, 90), inks = Array.from({ length: 5 }, (_, i) => hsl(h0 + i * gap, R(45, 85), R(38, 62)));
  return { paper: hsl(h0, R(10, 30), R(84, 93)), dark: hsl(h0 + 180, R(25, 45), R(8, 16)), light: hsl(h0, R(30, 60), R(86, 94)), accent: hsl(h0 + R(150, 210), R(70, 90), R(50, 58)), inks };
}

const MOTIFS={stripes,rings,mosaic,blob,diagonals,steps,fangor,ring,dream};
function generate(motif,palette,seed,w,h,o={}){const r=rng(seed),p=typeof palette==='string'?PALETTES[palette]:palette,m=MOTIFS[motif](r,p,w,h,o);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${m.defs||''}</defs><rect width="${w}" height="${h}" fill="${m.bg||p.paper}"/>${m.body}</svg>`;}

// ---- CLI (node only) ----
if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
  const a = process.argv.slice(2), get = k => { const i = a.indexOf('--' + k); return i < 0 ? null : a[i + 1]; };
  const pickR = arr => arr[Math.floor(Math.random() * arr.length)];
  const kindOf = m => (m === 'fangor' ? 'random' : m === 'ring' ? 'ring' : m === 'dream' ? 'dream' : 'poster');
  const palsFor = kind => Object.keys(PALETTES).filter(k => (kind === 'poster' ? !/^(fangor|soft_|dream_)/.test(k) : k.startsWith({ random: 'fangor', ring: 'soft_', dream: 'dream_' }[kind])));
  const POSTER = Object.keys(MOTIFS).filter(m => kindOf(m) === 'poster');
  const group = a.includes('--fangor') ? 'fangor' : (a.includes('--ring') || a.includes('--soft')) ? 'ring' : a.includes('--dream') ? 'dream' : a.includes('--poster') ? 'poster' : null;
  const rand = a.includes('--random') || !!group;
  const motif = get('motif') || (group === 'poster' ? pickR(POSTER) : group || (rand ? pickR(Object.keys(MOTIFS)) : 'stripes'));
  const palette = get('palette') || (rand ? pickR(palsFor(kindOf(motif))) : 'baron');
  const seed = +(get('seed') || (rand ? Math.floor(Math.random() * 9999) : 1));
  const [w, h] = (get('size') || '1200x1600').split('x').map(Number);
  const rc = get('colors') === 'random';
  if (!MOTIFS[motif] || (!PALETTES[palette] && !rc)) { console.error('motifs:', Object.keys(MOTIFS).join(' '), '| palettes:', Object.keys(PALETTES).join(' ')); process.exit(1); }
  const num = k => (get(k) ? +get(k) : undefined);
  const pal = rc ? randomPalette(kindOf(motif), rng(seed * 2 + 1)) : palette;
  const svg = generate(motif, pal, seed, w, h, { size: num('circle'), x: num('x'), y: num('y'), grain: num('grain') });
  console.error(`motif=${motif} palette=${rc ? 'random(seeded)' : palette} seed=${seed} size=${w}x${h}`);
  if (get('out')) require('fs').writeFileSync(get('out'), svg); else process.stdout.write(svg);
}
if (typeof module !== 'undefined') module.exports = { generate, PALETTES, MOTIFS, randomPalette };
