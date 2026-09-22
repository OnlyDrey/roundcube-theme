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

function initializeControls() {
  document.addEventListener("click", (event) => {
    const control = event.target.closest?.("[data-akio-theme-value]");
    if (!control) return;
    event.preventDefault();
    applyTheme(control.dataset.akioThemeValue, true);
    control.closest("details")?.removeAttribute("open");
  });

  document.addEventListener("keydown", (event) => {
    const popover = event.target.closest?.("[data-akio-popover]");
    if (event.key === "Escape" && popover?.open) {
      popover.open = false;
      popover.querySelector("summary")?.focus();
    }

    const option = event.target.closest?.("[data-akio-theme-value]");
    if (!option || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
      return;
    event.preventDefault();
    const options = [
      ...option.parentElement.querySelectorAll("[data-akio-theme-value]"),
    ];
    let index = options.indexOf(option);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = options.length - 1;
    else
      index =
        (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
        options.length;
    options[index].focus();
  });

  document.addEventListener("click", (event) => {
    for (const popover of document.querySelectorAll(
      "[data-akio-popover][open]",
    )) {
      if (!popover.contains(event.target)) popover.removeAttribute("open");
    }
  });

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
