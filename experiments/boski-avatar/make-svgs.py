# Writes idle.svg, thinking.svg, speaking.svg, listening.svg: standalone, CSS-animated, no JS.
# Same geometry as boski-avatar.js (official Boski brandmark). Run: python3 make-svgs.py
HEAD = "M834.739 445.525C810.729 363.308 767.646 279.218 690.931 243.982C600.508 202.533 488.374 246.025 426.219 324.753C364.063 403.481 344.055 508.848 343.033 609.79C341.926 728.605 368.576 855.08 451.591 938.574C484.457 971.598 529.243 997.471 574.965 991.003C644.442 981.13 683.694 904.53 700.212 834.994C712.387 783.672 718.688 730.988 718.773 678.219C753.001 677.964 821.116 677.709 855.344 677.453C855.344 677.453 861.73 537.956 834.654 445.44Z"
INK = "#202020"
MX, MY, H = 719, 678.2, 58
MOUTH = f"M {MX-92-H*1.4:.1f} {MY+H*.18:.1f} Q {MX-40} {MY-H*.34:.1f} {MX+10} {MY-H*.26:.1f} Q {MX+90} {MY-H*.16:.1f} {MX+160} {MY+2} L {MX+160} {MY+H} L {MX+10} {MY+H} Q {MX-40} {MY+H*.95:.1f} {MX-92-H*1.4:.1f} {MY+H*.18:.1f} Z"

BASE_CSS = """
  * { transform-box: view-box; }
  .body { transform-origin: 600px 992px; }
  .lid { transform-origin: 631.8px 536.2px; animation: blink 5.2s infinite; }
  @keyframes blink { 0%, 93%, 100% { transform: scale(1, 1); } 95.5% { transform: scale(1, .08); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
"""

STATES = {
"idle": dict(css="""
  .body { animation: breathe 4.2s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.014, 1.024); } }
  .look { animation: glance 7s ease-in-out infinite; }
  @keyframes glance { 0%, 22% { transform: translate(0, 0); } 30%, 48% { transform: translate(14px, -8px); } 56%, 76% { transform: translate(-12px, 6px); } 84%, 100% { transform: translate(0, 0); } }
""", extra_mask="", extra="", eye=(0, 0, 1)),

"thinking": dict(css="""
  .lid { animation: none; transform: scale(.86); }
  .body { animation: ponder 2.6s ease-in-out infinite; }
  @keyframes ponder { 0%, 100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(-2deg) scale(1.018) translateY(-6px); } }
  .ox { animation: ox 1.3s ease-in-out infinite alternate; }
  .oy { animation: oy 1.3s ease-in-out infinite alternate; animation-delay: -.65s; }
  @keyframes ox { from { transform: translateX(-8px); } to { transform: translateX(36px); } }
  @keyframes oy { from { transform: translateY(-40px); } to { transform: translateY(-12px); } }
  .sheen { animation: sweep 2.9s cubic-bezier(.4,0,.2,1) infinite; }
  @keyframes sweep { 0% { transform: translateX(-700px); } 70%, 100% { transform: translateX(700px); } }
  .dot { animation: dot 1.5s ease-in-out infinite; opacity: .35; }
  .dot:nth-child(2) { animation-delay: .21s; } .dot:nth-child(3) { animation-delay: .42s; }
  @keyframes dot { 0%, 100% { opacity: .3; transform: translateY(0); } 45% { opacity: 1; transform: translateY(-10px); } }
""", extra_mask="", eye=(14, 0, 1),
  extra=f"""<g class="dots" fill="{INK}"><circle class="dot" cx="868" cy="352" r="15"/><circle class="dot" cx="922" cy="296" r="20"/><circle class="dot" cx="984" cy="232" r="26"/></g>""",
  inner=f"""<g clip-path="url(#h)"><rect class="sheen" x="140" y="180" width="900" height="900" fill="url(#g)" opacity=".32"/></g>"""),

"speaking": dict(css="""
  .lid { animation: blink 4.4s infinite; }
  .body { animation: bob 1.9s infinite; transform-origin: 600px 992px; }
  @keyframes bob { 0%, 100% { transform: translateY(0) scale(.955, 1); } 8% { transform: translateY(-14px) scale(.975, 1.02); } 16% { transform: translateY(-3px) scale(.958, 1); }
    26% { transform: translateY(-10px) scale(.97, 1.012); } 38% { transform: translateY(0) scale(.955, 1); } 52% { transform: translateY(-16px) scale(.978, 1.022); }
    60% { transform: translateY(-6px) scale(.962, 1.006); } 70% { transform: translateY(-12px) scale(.972, 1.016); } 82%, 92% { transform: translateY(0) scale(.955, 1); } }
  .mouth { transform-origin: 719px 678px; animation: talk 1.9s infinite; }
  @keyframes talk { 0%, 100% { transform: scale(.0, .0); } 8% { transform: scale(1, 1); } 16% { transform: scale(.55, .3); } 26% { transform: scale(.9, .75); }
    38% { transform: scale(.2, .05); } 52% { transform: scale(1, 1.05); } 60% { transform: scale(.6, .4); } 70% { transform: scale(.9, .8); } 82%, 92% { transform: scale(0, 0); } }
  .w { animation: wave 1.9s infinite; opacity: 0; }
  .w2 { animation-delay: .08s; } .w3 { animation-delay: .16s; }
  @keyframes wave { 0%, 100% { opacity: 0; transform: translateX(-16px); } 8% { opacity: 1; transform: translateX(0); } 20% { opacity: .35; } 28% { opacity: .9; } 40% { opacity: 0; transform: translateX(-10px); }
    52% { opacity: 1; transform: translateX(0); } 62% { opacity: .4; } 72% { opacity: .9; } 84% { opacity: 0; transform: translateX(-16px); } }
""", eye=(-24, 4, 1.06),
  extra_mask=f"""<path class="mouth" d="{MOUTH}" fill="#000"/>""",
  waves=True),

"listening": dict(css="""
  .lid { transform: scale(1.13); animation: blinkwide 5.6s infinite; }
  @keyframes blinkwide { 0%, 93%, 100% { transform: scale(1.13, 1.13); } 95.5% { transform: scale(1.13, .09); } }
  .body { animation: lean 2.4s ease-in-out infinite; }
  @keyframes lean { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(4.6deg) scale(1.012); } }
  .ring { transform-origin: 600px 617px; animation: ring 1.7s cubic-bezier(.2,.6,.3,1) infinite; }
  .ring2 { animation-delay: .85s; }
  @keyframes ring { 0% { transform: scale(1.04); opacity: .55; } 100% { transform: scale(1.28); opacity: 0; } }
""", eye=(4, 2, 1), extra_mask="", extra="",
  behind=f"""<path class="ring" d="{HEAD}" fill="none" stroke="{INK}" stroke-width="2.5" vector-effect="non-scaling-stroke"/><path class="ring ring2" d="{HEAD}" fill="none" stroke="{INK}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>"""),
}

for name, s in STATES.items():
    ex, ey, es = s["eye"]
    waves = ""
    if s.get("waves"):
        import math
        arcs = []
        for i in range(3):
            r = 60 + i * 48
            a0, a1 = -0.62, 0.62
            arcs.append(f'<path class="w w{i+1}" d="M {880+r*math.cos(a0):.1f} {690+r*math.sin(a0):.1f} A {r} {r} 0 0 1 {880+r*math.cos(a1):.1f} {690+r*math.sin(a1):.1f}"/>')
        waves = f'<g fill="none" stroke="{INK}" stroke-width="24" stroke-linecap="round">{"".join(arcs)}</g>'
    eye = f'<ellipse class="lid" cx="631.841" cy="536.169" rx="{72.54*es:.2f}" ry="{73.88*es:.2f}" fill="#000"/>'
    if name == "thinking":
        eye = f'<g class="ox"><g class="oy">{eye}</g></g>'
    else:
        eye = f'<g class="look">{eye}</g>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="860" height="860" viewBox="170 180 860 860" fill="none" role="img" aria-label="Boski, {name}">
<!-- Boski avatar, {name}. Geometry: official Boski brandmark (boski.com/brand/brandmark). Generated by make-svgs.py -->
<style>{BASE_CSS}{s["css"]}</style>
<defs>
  <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="1200">
    <rect width="1200" height="1200" fill="#fff"/>
    <g transform="translate({ex} {ey})">{eye}</g>
    {s.get("extra_mask","")}
  </mask>
  <clipPath id="h"><path d="{HEAD}"/></clipPath>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2=".35"><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<g class="body">
  {s.get("behind","")}
  <g mask="url(#m)"><path d="{HEAD}" fill="{INK}"/>{s.get("inner","")}</g>
  {waves}
</g>
{s.get("extra","")}
</svg>
'''
    open(f"{name}.svg", "w").write(svg)
    print("wrote", name)
