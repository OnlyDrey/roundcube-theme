const COOKIE_NAME = "akioColorMode";
const MODES = ["system", "light", "dark"];
const THEME_COLORS = {
  light: "#f7f8fa",
  dark: "#11151b",
};

function readCookie() {
  const item = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));
  const mode = item
    ? decodeURIComponent(item.split("=").slice(1).join("="))
    : "system";
  return MODES.includes(mode) ? mode : "system";
}

function resolvedMode(mode) {
  if (mode !== "system") return mode;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode, persist = false) {
  const resolved = resolvedMode(mode);
  const root = document.documentElement;
  root.dataset.akioTheme = mode;
  root.dataset.akioThemeResolved = resolved;
  root.classList.toggle("dark-mode", resolved === "dark");
  root.style.colorScheme = resolved;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = THEME_COLORS[resolved];

  for (const control of document.querySelectorAll("[data-akio-theme-value]")) {
    const selected = control.dataset.akioThemeValue === mode;
    control.setAttribute("aria-checked", String(selected));
    control.classList.toggle("selected", selected);
  }

  if (persist) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(mode)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  window.dispatchEvent(
    new CustomEvent("akio:themechange", { detail: { mode, resolved } }),
  );
}

function currentLabel(mode) {
  const fallback = { system: "System", light: "Light", dark: "Dark" };
  const key = `akio.theme.${mode}`;
  if (window.rcmail?.gettext) {
    const translated = window.rcmail.gettext(key);
    if (translated && translated !== key) return translated;
  }
  return fallback[mode];
}

function prepareElasticToggle(toggle) {
  toggle.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const mode = readCookie();
      const nextMode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      applyTheme(nextMode, true);
      updateElasticToggle(toggle, nextMode);
    },
    true,
  );
  updateElasticToggle(toggle, readCookie());
}

function updateElasticToggle(toggle, mode) {
  const nextMode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  const label = currentLabel(mode);
  const nextLabel = currentLabel(nextMode);
  toggle.setAttribute(
    "aria-label",
    `${currentLabel("system")} theme: ${label}. ${nextLabel} next.`,
  );
  toggle.setAttribute("title", `${label} theme — switch to ${nextLabel}`);
  const text = toggle.querySelector("span");
  if (text) text.textContent = label;
}

function initializeControls() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest?.("[data-akio-theme-value]");
    if (!control) return;
    event.preventDefault();
    applyTheme(control.dataset.akioThemeValue, true);
  });

  const elasticToggle = document.querySelector("#taskmenu a.theme");
  if (elasticToggle) prepareElasticToggle(elasticToggle);
  applyTheme(readCookie());
}

applyTheme(readCookie());

const scheme = matchMedia("(prefers-color-scheme: dark)");
scheme.addEventListener("change", () => {
  if (readCookie() === "system") applyTheme("system");
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeControls, {
    once: true,
  });
} else {
  initializeControls();
}
