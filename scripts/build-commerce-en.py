#!/usr/bin/env python3
"""Translate agent-commerce-en and patch for multi-folder entry points."""
import pathlib
import re

ROOT = pathlib.Path("/workspace/experiments/agent-commerce-en")
s = (ROOT / "script.js").read_text()

# --- asset base ---
s = s.replace(
    "const $ = (s) => document.querySelector(s);",
    'const ASSET = (p) => `${window.COMMERCE_ASSET_BASE || ""}${p}`;\nconst $ = (s) => document.querySelector(s);',
)
s = s.replace(
    'const F = (n) => `food/${String(n).padStart(2, "0")}.jpg`;',
    'const F = (n) => ASSET(`food/${String(n).padStart(2, "0")}.jpg`);',
)
s = s.replace('src="inpost-icon.png"', 'src="${ASSET(\'inpost-icon.png\')}"')
s = s.replace('src="inpost-logo.png"', 'src="${ASSET(\'inpost-logo.png\')}"')

# --- identifiers ---
s = s.replace("async function boskiBusy", "async function agentBusy")
s = s.replace("await boskiBusy", "await agentBusy")
s = s.replace("opts.boski", "opts.agent")
s = s.replace("{ boski: true", "{ agent: true")
s = s.replace('? "boski" :', '? "agent" :')
s = s.replace("boski-av", "agent-av")
s = s.replace(".app.boski", ".app.agent")
s = s.replace(' + " zł"', ' + " PLN"')
s = s.replace('.replace(".", ",") + " zł"', '.replace(".", ",") + " PLN"')

s = re.sub(
    r"const NAMES = \{[^}]+\};",
    'const NAMES = { 1: "Shop", 2: "InPost Pay", 3: "Trusted person", 4: "Orders & returns" };',
    s,
    count=1,
)
s = s.replace(
    '["Zagraj jeszcze raz", `Scenariusz ${nx}: ${NAMES[nx]}`]',
    '["Play again", `Scenario ${nx}: ${NAMES[nx]}`]',
)
s = s.replace("Wybierz odpowiedź", "Choose a reply")
s = s.replace("Albo wpisz własną odpowiedź poniżej", "Or type your own answer below")
s = s.replace("Najlepsze dopasowanie", "Best match")
s = s.replace('"Wybierz"', '"Choose"')
s = s.replace('"Zamknij"', '"Close"')
s = s.replace("<em>Skład</em>", "<em>Ingredients</em>")
for pl, en in [
    ("Białko", "Protein"),
    ("Tłuszcz", "Fat"),
    ("Błonnik", "Fibre"),
    ("Dla", "For"),
    ("Dostawa", "Delivery"),
    ("Zamówiono", "Ordered"),
]:
    s = s.replace(f'["{pl}",', f'["{en}",')

s = re.sub(
    r"const AGES = \[\[.*?\]\];",
    'const AGES = [["puppy", "Puppy", "under 1 year"], ["adult", "Adult", "1–7 years"], ["senior", "Senior", "7+ years"]];',
    s,
    count=1,
)
s = s.replace('p.tag === "Ostatnio kupowana"', 'p.tag === "Recently purchased"')
s = s.replace('"Ostatnio kupowana"', '"Recently purchased"')
s = re.sub(
    r'note: `\$\{qty > 1 \? qty \+ " × " : ""\}\$\{String\(size\)\.replace\("\.", ","\)\} kg · starczy na ~\$\{covers\} tyg\.`',
    'note: `${qty > 1 ? qty + " × " : ""}${size} kg · lasts ~${covers} wk`',
    s,
)

# PERMS & SHOP
s = s.replace(
    '["Koszyk", "Wypełnię dane kontaktowe, telefon i adres"]',
    '["Cart", "I will fill contact details, phone, and address"]',
)
s = s.replace(
    '["Adresy", "Zobaczę zapisane adresy dostawy"]',
    '["Addresses", "I will read saved delivery addresses"]',
)
s = s.replace(
    '["Portfel", "Użyję zapisanej karty przy płatności"]',
    '["Wallet", "I will use a saved card at checkout"]',
)

shop_en = '''const SHOP = {
  key: "shop", name: "Shop", pay: "Shop Pay", acct: "your Shop account",
  logo: '<span class="shoplogo">shop</span>', cta: "Connect Shop",
  lead: "To order on your behalf, I need access to your Shop account.",
  bullets: [
    ["Cart", "I will prepare it with your details"],
    ["Addresses", "I will read saved locations"],
    ["Payment", "I will pay with a card from Shop Wallet"],
  ],
};
const INPOST = {
  key: "inpost", name: "InPost Pay", pay: "InPost Pay", acct: "your InPost Pay account",
  logo: '<span class="shoplogo inpost"><img src="${ASSET(\'inpost-icon.png\')}" alt="InPost Pay"></span>',
  brand: '<img class="ipword" src="${ASSET(\'inpost-logo.png\')}" alt="InPost">', cta: "Connect InPost Pay",
  lead: "With InPost Pay I can find the same food in more stores and get a better price.",
  bullets: [
    ["Stores", "I will search more places at once"],
    ["Price", "I will compare offers and pick the cheaper one"],
    ["Cart", "You only confirm in InPost Pay"],
  ],
};'''
s = re.sub(r"const SHOP = \{.*?^const LINK", shop_en + "\nconst LINK", s, count=1, flags=re.M | re.S)

s = s.replace('aria-label="Boski"', 'aria-label="Shopping agent"')
s = s.replace("Boski", "Agent")
s = s.replace("// Agent shopping agent:", "// Shopping agent demo:")
s = s.replace("Your agent → Agent Justyny", "Your agent → Justyna's agent")
s = s.replace("Agentego Justyny", "Justyna's agent")
s = s.replace("Łączę z Agentm Justyny", "Connecting to Justyna's agent")
s = s.replace("Linking się z Agentm Justyny", "Connecting to Justyna's agent")

pairs = [
    ("Anuluj", "Cancel"),
    ("Kontynuuj", "Continue"),
    ("Połącz z Agent", "Connect your agent"),
    ("Połącz Shop", "Connect Shop"),
    ("Połącz InPost Pay", "Connect InPost Pay"),
    ("udostępni Agentemu dostęp opisany powyżej", "will grant your agent the access described above"),
    ("Więcej", "Learn more"),
    ("Łączenie z", "Connecting to"),
    ("Przekierowuję do", "Redirecting to"),
    ("Łączę", "Linking"),
    (" z Agent…", " to your agent…"),
    (" połączony", " connected"),
    ("Wracam do Agent…", "Returning to chat…"),
    ("Nie teraz", "Not now"),
    ("Integracja", "Integration"),
    ("Sprawdź uprawnienia przed kontynuacją", "Review permissions before you continue"),
    ("Zapłacono", "Paid"),
    ("teraz", "now"),
    ("najbliżej", "nearest"),
    ("Dom", "Home"),
    ("Paczkomat ", "Locker "),
]
for a, b in pairs:
    s = s.replace(a, b)

# scenario init & navigation
old_init = """let scn = [1, 2, 3, 4].includes(+new URLSearchParams(location.search).get("s")) ? +new URLSearchParams(location.search).get("s") : 1;
function setScenario(n) {
  scn = n;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === n));
  try { history.replaceState(null, "", n === 1 ? location.pathname : `?s=${n}`); } catch (e) { /* file:// */ }
  play();
}"""
new_init = """const _q = +new URLSearchParams(location.search).get("s");
const _w = window.COMMERCE_START_SCENARIO;
let scn = [1, 2, 3, 4].includes(_w) ? _w : [1, 2, 3, 4].includes(_q) ? _q : 1;
function setScenario(n) {
  const links = window.COMMERCE_SCENARIO_LINKS;
  if (links?.[n] && n !== scn) {
    location.assign(links[n]);
    return;
  }
  scn = n;
  document.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", +b.dataset.s === n));
  if (!links) {
    try { history.replaceState(null, "", n === 1 ? location.pathname : `${location.pathname}?s=${n}`); } catch (e) { /* file:// */ }
  }
  play();
}"""
s = s.replace(old_init, new_init)

# PRODUCTS english block - import from separate file content
products = (ROOT / "_products_en.js").read_text() if (ROOT / "_products_en.js").exists() else None
if products:
    s = re.sub(r"const PRODUCTS = \[.*?\];", products.strip(), s, count=1, flags=re.S)

(ROOT / "script.js").write_text(s)
print("script.js patched, length", len(s))
