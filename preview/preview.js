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

document.addEventListener("submit", (event) => event.preventDefault());
