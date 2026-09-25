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

function controlledMenu(trigger) {
  const selector =
    trigger.dataset.previewTarget ||
    trigger.dataset.target ||
    (trigger.getAttribute("aria-controls")
      ? `#${window.CSS.escape(trigger.getAttribute("aria-controls"))}`
      : "");
  if (selector) return document.querySelector(selector);

  const sibling = trigger.nextElementSibling;
  if (sibling?.matches(".popupmenu, .dropdown-menu, [role='menu']")) {
    return sibling;
  }
  return null;
}

function positionContextMenu(trigger, menu) {
  if (!menu || menu.hidden || window.getComputedStyle(menu).display === "none")
    return;

  const gap = 6;
  const edge = 12;
  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let left = triggerRect.right - menuRect.width;
  let top = triggerRect.bottom + gap;

  left = Math.min(
    Math.max(edge, left),
    Math.max(edge, window.innerWidth - menuRect.width - edge),
  );
  if (top + menuRect.height > window.innerHeight - edge) {
    top = Math.max(edge, triggerRect.top - menuRect.height - gap);
  }

  menu.dataset.akioAnchored = "true";
  menu.style.setProperty("position", "fixed", "important");
  menu.style.setProperty("inset", "auto", "important");
  menu.style.setProperty("left", `${Math.round(left)}px`, "important");
  menu.style.setProperty("top", `${Math.round(top)}px`, "important");
}

function initializeContextMenus() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.(
      "[aria-haspopup='menu'], [data-preview-target], [data-target]",
    );
    if (!trigger) return;
    const menu = controlledMenu(trigger);
    if (!menu) return;
    window.requestAnimationFrame(() => positionContextMenu(trigger, menu));
  });

  const reposition = () => {
    for (const menu of document.querySelectorAll(
      "[data-akio-anchored='true']",
    )) {
      const trigger = document.querySelector(
        `[aria-controls="${window.CSS.escape(menu.id)}"], [data-preview-target="#${window.CSS.escape(menu.id)}"], [data-target="#${window.CSS.escape(menu.id)}"]`,
      );
      if (trigger) positionContextMenu(trigger, menu);
    }
  };
  window.addEventListener("resize", reposition);
  document.addEventListener("scroll", reposition, true);
}

function initializeSettingsSectionNav() {
  if (!document.body.classList.contains("task-settings")) return;
  const content = document.querySelector("#layout-content");
  const source = document.querySelector("#layout-list .listing");
  const form = content?.querySelector(".propform, .settings-form");
  if (
    !content ||
    !source ||
    !form ||
    content.querySelector(".settings-section-nav")
  )
    return;

  const links = [...source.querySelectorAll("li > a")];
  if (!links.length) return;
  const current = source.querySelector("li.selected > a") || links[0];
  const details = document.createElement("details");
  details.className = "settings-section-nav";
  details.innerHTML = `<summary><span><small>Preferences</small>${current.textContent.trim()}</span><span class="ak-icon ak-icon-chevron-down" aria-hidden="true"></span></summary><nav class="popupmenu" aria-label="Preference sections"></nav>`;
  const navigation = details.querySelector("nav");
  for (const sourceLink of links) {
    const link = sourceLink.cloneNode(true);
    if (sourceLink === current) link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
  content.insertBefore(details, form);
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
  initializeContextMenus();
  initializeSettingsSectionNav();
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
