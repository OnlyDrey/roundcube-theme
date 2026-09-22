/** @type {import('tailwindcss').Config} */
export default {
  content: ["./templates/**/*.html", "./src/**/*.{js,css}", "./demo/**/*.html"],
  corePlugins: {
    preflight: false,
  },
  prefix: "ak-",
  theme: {
    screens: {
      phone: "480px",
      tablet: "768px",
      laptop: "1100px",
      wide: "1440px",
    },
    extend: {
      colors: {
        canvas: "var(--ak-color-canvas)",
        surface: "var(--ak-color-surface)",
        foreground: "var(--ak-color-fg)",
        accent: "var(--ak-color-accent)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        control: "var(--ak-radius-control)",
        dialog: "var(--ak-radius-dialog)",
      },
      boxShadow: {
        menu: "var(--ak-shadow-menu)",
        dialog: "var(--ak-shadow-dialog)",
      },
      spacing: {
        pane: "var(--ak-size-folder-pane)",
        list: "var(--ak-size-list-pane)",
      },
    },
  },
  plugins: [],
};
