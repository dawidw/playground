# playground

Miejsce na eksperymenty. Czysty HTML/CSS/JS, bez builda.

- `theme.css`: tokeny stylu (`:root`), `tailwind-config.js`: mapuje je na klasy Tailwinda (CDN)
- `experiments/<nazwa>/`: jeden eksperyment na folder, zacznij od skopiowania `example`
- dopisz nowy eksperyment do listy w `index.html`

Podgląd lokalnie: `python3 -m http.server`
- screen komponentu na karcie: `experiments/<nazwa>/preview.png` (proporcje 16:10), bez pliku widać placeholder
