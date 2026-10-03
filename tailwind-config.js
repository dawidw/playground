// Mapuje tokeny z theme.css na klasy Tailwinda, np. bg-surface, text-muted, bg-cta, bg-gray-0-5.
// Ładuj PO skrypcie Tailwinda z CDN.
const STEPS = ["0","0-5","1","1-5","2","3","4","5","6","7","8","8-5","9","9-5","10"];

tailwind.config = {
  theme: {
    // Zastępuje domyślną paletę Tailwinda: dostępne są tylko kolory z biblioteki.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",
      "green": Object.fromEntries(STEPS.map(s => [s, `var(--color-green-${s})`])),
      "red": Object.fromEntries(STEPS.map(s => [s, `var(--color-red-${s})`])),
      "carbon-black": Object.fromEntries(STEPS.map(s => [s, `var(--color-carbon-black-${s})`])),
      "canary-yellow": Object.fromEntries(STEPS.map(s => [s, `var(--color-canary-yellow-${s})`])),
      "blue": Object.fromEntries(STEPS.map(s => [s, `var(--color-blue-${s})`])),
      "orange": Object.fromEntries(STEPS.map(s => [s, `var(--color-orange-${s})`])),
      "gray": Object.fromEntries(STEPS.map(s => [s, `var(--color-gray-${s})`])),
      bg: "var(--bg)",
      surface: "var(--surface)",
      ink: "var(--text)",
      muted: "var(--muted)",
      line: "var(--border)",
      accent: "var(--accent)",
      "accent-ink": "var(--accent-text)",
      cta: "var(--color-cta)",
      success: "var(--color-success)",
      danger: "var(--color-danger)",
      info: "var(--color-info)",
      warning: "var(--color-warning)",
    },
    extend: {
      fontFamily: { sans: "var(--font)" },
      borderRadius: { card: "var(--radius)" },
      boxShadow: { card: "var(--shadow)" },
    },
  },
};
