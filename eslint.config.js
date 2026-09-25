import js from "@eslint/js";

export default [
  {
    ignores: ["build/**", "dist/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: [
      "src/**/*.js",
      "scripts/**/*.mjs",
      "tests/**/*.mjs",
      "preview/**/*.js",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        CustomEvent: "readonly",
        document: "readonly",
        fetch: "readonly",
        matchMedia: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
  },
];
