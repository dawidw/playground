# playground

Static HTML/CSS/JS + Tailwind via CDN, no build. Experiments live in `experiments/<name>/`.

## Figma ↔ code sync (always)

Always update code AND Figma together, in the same turn, and say what was synced. Files:

- "[AI] Library" (fileKey `QB7S0UrBUX2qVFo70nLS6Q`): base primitives, `Primitives`/`Semantic` variables, paint and text styles.
- "Playground" (fileKey `rwXlbiSN7hIMmWYjA5648W`): frames `Playground / Index` and `Playground / Example` mirror the pages in this repo.
- Iconoir copy (fileKey `0OlXq2gdUytl5KYDknF9Ma`): icons, `Icon color` collection (modes mirror Semantic hex values).

Rules:
- Change in Figma (colors, typography, spacing, tokens, styles, layout) → update `theme.css`, `tailwind-config.js` and the pages here.
- Change in code (tokens, layout) → update the Figma variables/styles/frames.
- Always use variables for values wherever possible. In Figma bind colors to `Primitives`/`Semantic` variables and spacing, gap, radius, width/height, font size and line height to the `TailwindCSS` variables (text via text styles). In code use CSS variables and Tailwind tokens, no literals. Hardcode only when no variable exists, and say so.
- Commit and push after code changes. The user tells me about changes they make themselves; I don't poll for them.

Rules:
- Only tokens and styles are mirrored. Do not recreate the library's base components (buttons, inputs, avatars...) in this repo.
- CSS variable names mirror Figma code syntax, e.g. `--color-gray-0-5`, `--color-cta`. Figma names can't contain dots, so step 0.5 is `0-5`.
- Font is SF Pro (system stack, no webfont). Palette: green, red, carbon-black, canary-yellow, blue, orange, gray (steps 0 to 10). Text `#171D1C`, CTA `#171D1C` (black), accent `#FCFC62` (yellow).
- The repo is public: no company data in experiments.
