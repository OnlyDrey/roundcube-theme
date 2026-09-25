document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-preview-target]");
  if (!trigger) return;

  event.preventDefault();
  const target = document.querySelector(trigger.dataset.previewTarget);
  if (!target) return;

  const opening = target.hidden;
  target.hidden = !opening;
  trigger.setAttribute("aria-expanded", String(opening));
  if (opening) target.querySelector("button, [href], input")?.focus();
});

document.addEventListener("click", (event) => {
  document
    .querySelectorAll("[data-preview-target][aria-expanded='true']")
    .forEach((trigger) => {
      const target = document.querySelector(trigger.dataset.previewTarget);
      if (trigger.contains(event.target) || target?.contains(event.target))
        return;
      if (target) target.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });

  document.querySelectorAll("details[open]").forEach((details) => {
    if (!details.contains(event.target)) details.open = false;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  document
    .querySelectorAll("[data-preview-target][aria-expanded='true']")
    .forEach((trigger) => {
      const target = document.querySelector(trigger.dataset.previewTarget);
      if (target) target.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    });
  document.querySelectorAll("details[open]").forEach((details) => {
    details.open = false;
    details.querySelector("summary")?.focus();
  });
});

document.addEventListener("submit", (event) => event.preventDefault());
