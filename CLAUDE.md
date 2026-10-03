# playground

Static HTML/CSS/JS + Tailwind via CDN, no build. Experiments live in `experiments/<name>/`.

## Figma ↔ code sync (always)

The Figma file "[AI] Library" (fileKey `QB7S0UrBUX2qVFo70nLS6Q`) holds the base primitives and design tokens. Keep it and this repo in sync in both directions:

- Change in Figma (colors, typography, spacing, tokens, styles) → update `theme.css` and `tailwind-config.js` in the same turn.
- Change to design tokens in code → update the Figma variables/styles in the library in the same turn.
- Say what was synced when done.

Rules:
- Only tokens and styles are mirrored. Do not recreate the library's base components (buttons, inputs, avatars...) in this repo.
- CSS variable names mirror Figma code syntax, e.g. `--color-gray-0-5`, `--color-cta`. Figma names can't contain dots, so step 0.5 is `0-5`.
- Font is Inter. Palette: green, red, carbon-black, canary-yellow, blue, orange, gray (steps 0 to 10). Text `#171D1C`, CTA `#FCFC62`.
- The repo is public: no company data in experiments.
