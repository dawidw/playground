// Maps tokens from theme.css to Tailwind classes, e.g. bg-surface, text-muted, bg-cta, bg-gray-0-5.
// Load AFTER the Tailwind CDN script.
const STEPS = ["0","0-5","1","1-5","2","3","4","5","6","7","8","8-5","9","9-5","10"];

tailwind.config = {
  theme: {
    // Replaces Tailwind's default palette: only colors from the library are available.
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
      light: "var(--color-bg-light)",
      "ink-light": "var(--color-text-primary)",
      "muted-light": "var(--color-text-muted)",
      success: "var(--color-success)",
      danger: "var(--color-danger)",
      info: "var(--color-info)",
      warning: "var(--color-warning)",
    },
    // Scale from the AI Library text styles (name -> [size, line height]). Replaces Tailwind's default scale.
    fontSize: {
      "2xs": ["10px", "16px"], xs: ["12px", "18px"], base: ["14px", "20px"], md: ["16px", "24px"],
      lg: ["18px", "28px"], xl: ["20px", "30px"], "2xl": ["24px", "30px"], "3xl": ["28px", "34px"],
      "4xl": ["32px", "38px"], "5xl": ["40px", "48px"], "6xl": ["60px", "74px"], "7xl": ["72px", "88px"],
      header: ["24px", "28px"],
      // Button/Text styles (line height = font size so text stays centered in pills and buttons)
      "btn-sm": ["12px", "12px"], "btn-2xs": ["10px", "10px"],
    },
    extend: {
      fontFamily: { sans: "var(--font)" },
      borderRadius: { card: "var(--radius)" },
      boxShadow: { card: "var(--shadow)", "2xl": "var(--shadow-2xl)" },
    },
  },
};
