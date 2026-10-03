// Mapuje tokeny z theme.css na klasy Tailwinda (bg-surface, text-muted, rounded-card, ...).
// Ładuj PO skrypcie Tailwinda z CDN.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--text)",
        muted: "var(--muted)",
        line: "var(--border)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-text)",
      },
      fontFamily: { sans: "var(--font)" },
      borderRadius: { card: "var(--radius)" },
      boxShadow: { card: "var(--shadow)" },
    },
  },
};
