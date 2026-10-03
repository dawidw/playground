# playground

A place for experiments. Plain HTML/CSS/JS, no build.

- `theme.css`: style tokens (`:root`), `tailwind-config.js`: maps them to Tailwind classes (CDN)
- `experiments/<name>/`: one experiment per folder, start by copying `example`
- add the new experiment to the list in `index.html`

Preview locally: `python3 -m http.server`
- component screenshot on the card: `experiments/<name>/preview.png` (16:10), a placeholder shows without the file
