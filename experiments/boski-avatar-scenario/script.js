// Scenariusz Shop (agent-commerce #1): karma dla Luny, budżet, paczkomat vs kurier.
const $ = (s) => document.querySelector(s);
const thread = $("#thread");
const optpanel = $("#optpanel");
const opIn = optpanel.querySelector(".op-in");
const dock = $("#dock");
const heroState = $("#heroState");

let run = 0;
const CANCEL = Symbol("cancel");
const wait = (ms) => {
  const id = run;
  return new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej(CANCEL)), ms));
};
const el = (html, cls) => {
  const d = document.createElement("div");
  if (cls) d.className = cls;
  d.innerHTML = html;
  return d;
};
const scroll = () => {
  requestAnimationFrame(() => {
    thread.scrollTop = thread.scrollHeight;
  });
};
const add = (node) => {
  thread.appendChild(node);
  scroll();
  return node;
};

const hero = BoskiAvatar.create($("#heroHost"), { size: 160, tone: "dark" });
let mini = null;

function setHero(state, label) {
  hero.setState(state);
  if (mini) mini.setState(state);
  if (label) {
    heroState.textContent = label;
    heroState.classList.toggle("live", state !== "idle");
  } else if (state === "idle") {
    heroState.textContent = "online";
    heroState.classList.remove("live");
  }
}

const zl = (n) => n.toFixed(2).replace(".", ",") + " zł";
const zl0 = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " zł";

const LOCKER = { id: "WAW214M", addr: "ul. Puławska 12", dist: "120 m" };
const DELIVERY_LOCKER = 12.99;
const DELIVERY_COURIER = 18.99;
const PRODUCT_IMG = "../agent-commerce/food/07.jpg";
const PRODUCT = {
  name: "Nordic Paws Adult Large",
  flavour: "Łosoś i ryż",
  note: "12 kg · starczy na ~8 tyg.",
  price: 189,
  tag: "Ostatnio kupowana",
};

async function typeReply(text, row) {
  setHero("speaking", "mówi…");
  const bubble = row.querySelector(".bubble");
  bubble.classList.remove("think-only");
  bubble.style.background = "";
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    bubble.textContent = words.slice(0, i + 1).join(" ");
    await wait(55 + Math.random() * 45);
  }
  setHero("idle");
  heroState.textContent = "online";
  heroState.classList.remove("live");
  await wait(400);
}

async function think(label, ms = 1400) {
  setHero("thinking", "myśli…");
  const row = add(el('<span class="av"></span><div class="bubble think-only"><span class="status"></span></div>', "row-in"));
  row.querySelector(".status").textContent = label;
  mini = BoskiAvatar.create(row.querySelector(".av"), { size: 28 });
  mini.setState("thinking");
  await wait(ms);
  return row;
}

async function say(text, thinkLabel, thinkMs) {
  if (thinkLabel) {
    const row = await think(thinkLabel, thinkMs || 1500);
    await typeReply(text, row);
    return row;
  }
  setHero("speaking", "mówi…");
  const msg = add(el(text, "msg in"));
  const words = text.split(" ");
  msg.textContent = "";
  for (let i = 0; i < words.length; i++) {
    msg.textContent = words.slice(0, i + 1).join(" ");
    await wait(50 + Math.random() * 40);
  }
  setHero("idle");
  heroState.textContent = "online";
  heroState.classList.remove("live");
  await wait(350);
}

function you(text) {
  add(el(text, "msg out"));
  scroll();
}

let waiter = null;
function unregister() { waiter = null; }

function hideOptions() {
  if (!optpanel.classList.contains("on")) {
    dock.classList.remove("expanded");
    return;
  }
  optpanel.classList.remove("on");
  setTimeout(() => {
    if (!optpanel.classList.contains("on")) dock.classList.remove("expanded");
  }, 480);
}

function showOptions(labels, onPick, autoMs = 4500) {
  setHero("listening", "słucha…");
  opIn.innerHTML = `<div class="op-card"><div class="op-head">Wybierz odpowiedź</div>
    ${labels.map((l, i) => `<button type="button" class="opt-row" data-i="${i}"><i class="n">${i + 1}</i><span>${l}</span></button>`).join("")}
    <div class="op-hint">Dotknij odpowiedzi — demo wybierze pierwszą po kilku sekundach</div></div>`;
  opIn.querySelectorAll(".opt-row").forEach((b) => {
    b.onclick = () => onPick(+b.dataset.i);
  });
  dock.classList.add("expanded");
  optpanel.classList.add("on");
  scroll();
}

function choose(labels, autoMs = 4500) {
  return new Promise((resolve) => {
    let done = false;
    const pick = (i) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unregister();
      hideOptions();
      you(labels[i]);
      setHero("idle");
      heroState.textContent = "online";
      heroState.classList.remove("live");
      resolve(i);
    };
    const timer = setTimeout(() => pick(0), autoMs);
    showOptions(labels, pick, autoMs);
    waiter = { pick };
  });
}

document.addEventListener("keydown", (e) => {
  if (waiter && /^[1-9]$/.test(e.key)) {
    const i = +e.key - 1;
    if (i < 10) waiter.pick(i);
  }
});

async function scenario() {
  add(el("Czw 15 paź, 21:21", "stamp"));
  await wait(500);

  await say("Cześć Dawid! Luna ma karmy jeszcze na jakieś 4 dni.");
  await say("Chcesz, żebym zamówił nową?");
  let c = await choose(["Tak, zamów", "Przypomnij jutro"]);
  if (c === 1) {
    await say("Jasne, odezwę się jutro rano.");
    c = await choose(["Jednak zamów teraz"], 3500);
  }

  await say(
    "Najłatwiej przez Shop — poprowadzę proces, Ty tylko potwierdzisz.",
    "Przygotowuję integrację Shop",
    1600,
  );
  await cardShopConnected();

  await say("Gotowe, Shop jest połączony. Adres i karta zostały zaczytane.", "Czytam adres i kartę z Shopa", 1700);
  await say("Ile maksymalnie w miesiącu mogę wydać na zakupy?");
  await choose(["300 zł", "500 zł", "1000 zł"]);
  const budget = 500;
  await say(`Zapisane. Do ${zl0(budget)} miesięcznie kupuję sam, przy większej kwocie zapytam.`, "Zapisuję budżet", 900);

  await say("Jak wolisz dostawę: paczkomat (taniej) czy kurierem?");
  const courier = (await choose(["Paczkomat", "Kurier"])) === 1;
  let ship;
  if (!courier) {
    await say(
      `Z adresu w Shopie najbliżej jest ${LOCKER.id}, ${LOCKER.dist} (${LOCKER.addr}). Zapisać go?`,
      "Szukam paczkomatów przy Twoim adresie",
      1800,
    );
    if ((await choose([`Tak, ${LOCKER.id}`, "Zostaw domyślny"])) === 0) {
      await say(`Zapisane. Będę wybierać ${LOCKER.id} przy InPost.`, "Zapisuję paczkomat", 700);
    }
    ship = { price: DELIVERY_LOCKER, label: `InPost ${LOCKER.id} (z pamięci)` };
  } else {
    await say("Kurier na ul. Puławska 10, Warszawa — z konta Shop.", "Czytam adres z Shopa", 1500);
    await choose(["Tak, ten adres"]);
    ship = { price: DELIVERY_COURIER, label: "Kurier · ul. Puławska 10" };
  }

  await say("Podaj wiek i wagę Luny — dobieram karmę.");
  await choose(["4 lata, 28 kg", "8 lat, 32 kg"]);
  await say(`Szukam karm w Zoo Corner na 8 tygodni.`, "Szukam karm w Zoo Corner", 2000);
  await say("Liczę porcje i dobieram worki.", "Liczę porcje i wielkość worka", 1600);

  const pick = await productCard();
  await say("Dobry wybór.", null);

  const total = pick.price + ship.price;
  const sum = add(el(`
    <div class="row"><div class="thumb"><img src="${PRODUCT_IMG}" alt=""></div><div><div class="v">${pick.name}</div><div class="k">${pick.flavour} · ${pick.note}</div></div></div>
    <div class="row"><span class="k">${ship.label}</span><span class="v ml-auto">${zl(ship.price)}</span></div>
    <div class="row"><span class="k">Z budżetu ${zl0(budget)}</span><span class="v ml-auto ${budget < total ? "over" : ""}">${budget >= total ? "zostanie " + zl0(budget - total) : "przekracza o " + zl0(total - budget)}</span></div>
    <div class="row total"><span class="v">Razem</span><span class="v ml-auto">${zl(total)}</span></div>
    <button type="button" class="cta">Zatwierdź i zapłać</button>`, "card"));

  setHero("listening", "czeka na Ciebie…");
  await new Promise((resolve) => {
    const go = () => {
      hideOptions();
      you("Zatwierdź i zapłać");
      setHero("idle");
      resolve();
    };
    sum.querySelector(".cta").onclick = go;
    showOptions(["Zatwierdź i zapłać"], () => go(), 5000);
  });
  sum.querySelector(".cta").disabled = true;

  await say(
    courier ? "Zamówione. Kurier powinien być w ciągu 48 godzin." : `Zamówione. Paczka w ${LOCKER.id} w ciągu 48 godzin.`,
    "Składam zamówienie",
    1800,
  );
  await say("Dam znać, jak karma znów będzie się kończyć.");
  await wait(2200);
  await choose(["Zagraj od nowa"], 6000);
}

async function cardShopConnected() {
  const node = add(el(`
    <div class="row"><span class="v">Shop połączony</span><span class="v ml-auto" style="color:var(--color-green-3)">OK</span></div>
    <div class="row"><span class="k">Koszyk, adresy, płatność</span><span class="k ml-auto">dostęp potwierdzony</span></div>`, "card"));
  await wait(600);
  return node;
}

function productCard() {
  return new Promise((resolve) => {
    const node = add(el(`
      <div class="row"><div class="thumb"><img src="${PRODUCT_IMG}" alt=""></div><div><div class="v">${PRODUCT.name}</div><div class="k">${PRODUCT.flavour}</div><div class="k">${PRODUCT.note}</div></div><span class="v ml-auto">${zl(PRODUCT.price)}</span></div>
      <button type="button" class="cta">Wybierz tę karmę</button>`, "card"));
    const finish = () => {
      unregister();
      hideOptions();
      you(PRODUCT.name);
      node.querySelector(".cta").disabled = true;
      resolve(PRODUCT);
    };
    node.querySelector(".cta").onclick = finish;
    setHero("listening", "słucha…");
    showOptions(["Wybierz tę karmę", "Pokaż inne"], (i) => {
      if (i === 0) finish();
      else {
        hideOptions();
        you("Pokaż inne");
        setTimeout(finish, 400);
      }
    }, 5000);
  });
}

async function play() {
  run += 1;
  thread.innerHTML = "";
  hideOptions();
  unregister();
  mini?.destroy();
  mini = null;
  setHero("idle");
  heroState.textContent = "online";
  heroState.classList.remove("live");
  try {
    await scenario();
    play();
  } catch (e) {
    if (e !== CANCEL) throw e;
  }
}

$("#reset").onclick = play;
play();
