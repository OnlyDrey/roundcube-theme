import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyFontFile } from "../scripts/acquire-fonts.mjs";

const previewPages = [
  "index.html",
  "login.html",
  "inbox.html",
  "message.html",
  "compose.html",
  "contacts.html",
  "settings.html",
  "states.html",
];

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("skin metadata keeps the supported compatibility baseline", async () => {
  const metadata = JSON.parse(await readFile("meta.json", "utf8"));
  assert.equal(metadata.extends, "elastic");
  assert.equal(metadata.config.dark_mode_support, true);
  assert.deepEqual(metadata.config.supported_layouts, ["widescreen"]);
});

test("the pre-paint theme script is loaded before styles", async () => {
  const layout = await readFile("templates/includes/layout.html", "utf8");
  assert.ok(
    layout.indexOf("/scripts/theme.js") < layout.indexOf("/styles/akio.css"),
  );
});

test("the layout requests the compiled Elastic baseline and Akio assets", async () => {
  const layout = await readFile("templates/includes/layout.html", "utf8");
  assert.match(layout, /href="\/styles\/styles\.min\.css"/);
  assert.match(layout, /href="\/styles\/akio\.css"/);
  assert.doesNotMatch(layout, /href="\/styles\/styles\.css"/);
});

test("login styles center responsively and integrate input icons", async () => {
  const styles = await readFile("src/styles/login.css", "utf8");
  assert.match(styles, /#login-form[\s\S]*width: min\(100%, 22rem\)/);
  assert.match(styles, /#layout[\s\S]*height: 100dvh/);
  assert.match(
    styles,
    /#layout-content[\s\S]*env\(safe-area-inset-top\)[\s\S]*overflow: hidden auto/,
  );
  assert.match(
    styles,
    /#logo[\s\S]*width: min\(100%, 14rem\)[\s\S]*max-height: 6rem[\s\S]*margin: auto auto/,
  );
  assert.match(styles, /td\.input\.input-group[\s\S]*flex-wrap: nowrap/);
  assert.match(styles, /\.icon\.user::before[\s\S]*users\.svg/);
  assert.match(styles, /\.icon\.pass::before[\s\S]*lock\.svg/);
  assert.match(
    styles,
    /\.input-group > :where\(input, select, \.form-control\)[\s\S]*flex: 1 1 0/,
  );
  assert.match(styles, /#rcmloginsubmit[\s\S]*width: 100%/);
  assert.match(
    styles,
    /@media \(height < 38rem\)[\s\S]*margin-top: 0[\s\S]*margin-bottom: 0/,
  );
});

test("compose workspace and editor use production-sized responsive surfaces", async () => {
  const entrypoint = await readFile("src/styles/akio.css", "utf8");
  const styles = await readFile("src/styles/compose.css", "utf8");
  const fixture = await readFile("preview/compose.html", "utf8");

  assert.match(entrypoint, /@import url\("\.\/compose\.css"\)/);
  assert.match(styles, /#compose-content[\s\S]*width: min\(100%, 96rem\)/);
  assert.match(styles, /min-height: clamp\(24rem, 48vh, 38rem\)/);
  assert.match(styles, /\.compose-headers[\s\S]*minmax\(0, 1fr\)/);
  assert.match(styles, /\.tox-toolbar__primary/);
  assert.match(styles, /\.attachmentslist > li/);
  assert.doesNotMatch(
    fixture,
    /compose-workspace[^>]*\bscroller\b|\bpreview-detail\b/,
  );
});

test("authenticated UI uses compact geometry and local core icons", async () => {
  const tokens = await readFile("src/styles/tokens.css", "utf8");
  const inbox = await readFile("src/styles/inbox.css", "utf8");
  const icons = await readFile("src/styles/icons.css", "utf8");
  const components = await readFile("src/styles/components.css", "utf8");
  const fixtures = await Promise.all(
    ["inbox", "compose", "message", "contacts", "settings"].map((page) =>
      readFile(`preview/${page}.html`, "utf8"),
    ),
  );

  assert.match(tokens, /--ak-radius-xs: 0\.125rem/);
  assert.match(tokens, /--ak-radius-control: 0\.375rem/);
  assert.match(inbox, /#layout-menu[\s\S]*border-radius: 0/);
  assert.match(
    inbox,
    /\.selected[\s\S]*box-shadow: inset 3px 0 0 var\(--ak-color-selected-border\)/,
  );
  for (const name of ["mail", "users", "settings", "house"]) {
    assert.match(
      icons,
      new RegExp(`ak-icon-${name}[\\s\\S]*?images/icons/${name}\\.svg`),
    );
  }
  assert.match(components, /fieldset[\s\S]*border: 0/);
  assert.doesNotMatch(fixtures.join("\n"), /[✉♙⚙⌂★☆📎×‹›]/u);
});

test("Tailwind stays scoped and does not reset Roundcube markup", async () => {
  const config = (await import("../tailwind.config.js")).default;
  assert.equal(config.prefix, "ak-");
  assert.equal(config.corePlugins.preflight, false);
});

test("primary text and interactive colors meet WCAG AA token targets", () => {
  const pairs = [
    ["light foreground", "#18202b", "#ffffff", 4.5],
    ["light secondary", "#465363", "#ffffff", 4.5],
    ["light muted", "#687588", "#ffffff", 4.5],
    ["light accent", "#2563a5", "#ffffff", 4.5],
    ["dark foreground", "#e6edf7", "#172033", 4.5],
    ["dark secondary", "#c2ccda", "#172033", 4.5],
    ["dark muted", "#9baabd", "#172033", 4.5],
    ["dark inactive icon", "#9baabd", "#111827", 3],
    ["dark active icon", "#7dbcf2", "#152940", 3],
    ["dark control border", "#64748b", "#172033", 3],
    ["dark primary button", "#0b2035", "#7dbcf2", 4.5],
    ["dark danger", "#ff9ca5", "#4a2027", 4.5],
    ["dark warning", "#f0c36c", "#443316", 4.5],
    ["dark focus", "#8bc5ff", "#0b1120", 3],
  ];

  for (const [name, foreground, background, minimum] of pairs) {
    assert.ok(
      contrast(foreground, background) >= minimum,
      `${name} contrast is below ${minimum}:1`,
    );
  }
});

test("primary controls keep explicit accessible interactive states", async () => {
  const components = await readFile("src/styles/components.css", "utf8");
  const primary =
    /:is\(\.btn-primary, input\.button\.mainaction, button\.mainaction\)/;

  assert.match(components, primary);
  for (const state of ["hover", "active", "focus-visible", "disabled"]) {
    assert.match(
      components,
      new RegExp(
        `${primary.source}:${state}[\\s\\S]*?color: var\\(--ak-color-accent-contrast\\)`,
      ),
    );
  }
  assert.ok(
    components.indexOf(":is(.btn-primary") >
      components.indexOf(":hover:not(:disabled)"),
    "primary states must follow generic control states in the cascade",
  );
});

test("Elastic's mailbox compose action uses the primary state system", async () => {
  const inbox = await readFile("src/styles/inbox.css", "utf8");
  const fixture = await readFile("preview/inbox.html", "utf8");

  assert.match(fixture, /class="button compose"/);
  for (const state of [
    "",
    ":hover",
    ":active",
    ":focus-visible",
    ".disabled",
  ]) {
    assert.ok(
      inbox.includes(`.task-mail .toolbar .compose${state}`),
      `missing compose${state || " default"} state`,
    );
  }
  assert.match(inbox, /\.header > \.toolbar[\s\S]*?background: transparent/);
});

test("mailbox actions and notifications retain toolbar hierarchy", async () => {
  const styles = await readFile("src/styles/inbox.css", "utf8");

  assert.match(
    styles,
    /a\.compose:link,[\s\S]*a\.compose:visited,[\s\S]*a\.compose:focus-visible[\s\S]*text-decoration: none/,
  );
  assert.match(
    styles,
    /\.mailbox-notification-region[\s\S]*padding: var\(--ak-space-3\)/,
  );
  assert.match(
    styles,
    /\.mailbox-notification-region[\s\S]*width: 100%[\s\S]*max-width: none/,
  );
});

test("mailbox menu and compose use generated semantic icons", async () => {
  const fixture = await readFile("preview/inbox.html", "utf8");
  const icons = await readFile("src/styles/icons.css", "utf8");
  const inbox = await readFile("src/styles/inbox.css", "utf8");

  for (const name of ["mail-open", "folder-input", "trash"]) {
    assert.match(fixture, new RegExp(`ak-icon-${name}`));
  }
  assert.match(inbox, /\.compose::before[\s\S]*icons\/pencil\.svg/);
  assert.match(icons, /ak-icon-mail-open[\s\S]*mail-open\.svg/);
  assert.match(icons, /ak-icon-folder-input[\s\S]*folder-input\.svg/);
  assert.match(
    inbox,
    /grid-template-columns: var\(--ak-icon-size\) minmax\(0, 1fr\)/,
  );
  assert.doesNotMatch(fixture, /[✉📂🗑✎]/u);
});

test("contacts and settings ship production responsive layers", async () => {
  const entrypoint = await readFile("src/styles/akio.css", "utf8");
  const contacts = await readFile("src/styles/contacts.css", "utf8");
  const settings = await readFile("src/styles/settings.css", "utf8");

  assert.match(entrypoint, /@import url\("\.\/contacts\.css"\)/);
  assert.match(entrypoint, /@import url\("\.\/settings\.css"\)/);
  assert.match(contacts, /#contacts-table[\s\S]*\.contactfieldgroup/);
  assert.match(contacts, /@media \(width <= 48rem\)/);
  assert.match(settings, /\.propform[\s\S]*fieldset[\s\S]*border: 0/);
  assert.match(settings, /@media \(width <= 48rem\)/);
});

test("message and compose cover production reading and editor states", async () => {
  const message = await readFile("src/styles/message.css", "utf8");
  const compose = await readFile("src/styles/compose.css", "utf8");
  const messageFixture = await readFile("preview/message.html", "utf8");
  const composeFixture = await readFile("preview/compose.html", "utf8");

  assert.match(message, /#message-header[\s\S]*#messagebody/);
  assert.match(message, /\.attachmentslist > li/);
  assert.match(message, /@media \(width <= 48rem\)/);
  assert.match(compose, /\.tox-toolbar__primary/);
  assert.match(compose, /#composebody/);
  assert.match(compose, /\.recipient-input[\s\S]*min-width: 0/);
  assert.match(compose, /\.attachment-item\.is-uploading/);
  assert.match(compose, /\.attachment-item\.is-failed/);
  assert.match(messageFixture, /ak-icon-(reply|forward|trash|printer)/);
  assert.match(
    composeFixture,
    /aria-describedby="to-error"[\s\S]*id="to-error" class="invalid-feedback" hidden/,
  );
  assert.match(compose, /\.recipients-input\)\.is-invalid/);
  assert.doesNotMatch(messageFixture + composeFixture, /[📎🖨❌]/u);
});

test("shared overlays retain bounded geometry and generated close icon", async () => {
  const components = await readFile("src/styles/components.css", "utf8");
  const inbox = await readFile("src/styles/inbox.css", "utf8");

  assert.match(components, /\.ui-dialog[\s\S]*var\(--ak-radius-dialog\)/);
  assert.match(components, /\.ui-dialog-titlebar-close[\s\S]*icons\/x\.svg/);
  assert.match(
    components,
    /\.ui-autocomplete[\s\S]*max-width: calc\(100vw - 2rem\)/,
  );
  assert.match(
    inbox,
    /grid-template-columns: var\(--ak-icon-size\) minmax\(0, 1fr\)/,
  );
});

test("mobile mail workflows prioritize writing and reading content", async () => {
  const compose = await readFile("src/styles/compose.css", "utf8");
  const message = await readFile("src/styles/message.css", "utf8");
  const contacts = await readFile("src/styles/contacts.css", "utf8");
  const settings = await readFile("src/styles/settings.css", "utf8");

  assert.match(compose, /@media \(width <= 37\.5rem\)/);
  assert.match(compose, /#messagetoolbar > \.send[\s\S]*position: absolute/);
  assert.match(compose, /#messagetoolbar > \.cancel[\s\S]*display: none/);
  assert.match(compose, /\.optional-recipient[\s\S]*display: none/);
  assert.match(message, /\.mobile-overflow-action[\s\S]*display: none/);
  assert.match(message, /\.remote-images-notice[\s\S]*grid-template-columns/);
  assert.match(contacts, /\.mobile-contact-title[\s\S]*display: inline/);
  assert.match(settings, /\.settings-form \.confirmation[\s\S]*width: 100%/);
});

test("mobile polish keeps compact mail controls and generated formatting icons", async () => {
  const icons = JSON.parse(await readFile("src/icons/icons.json", "utf8"));
  const compose = await readFile("src/styles/compose.css", "utf8");
  const message = await readFile("src/styles/message.css", "utf8");
  const contacts = await readFile("src/styles/contacts.css", "utf8");
  const components = await readFile("src/styles/components.css", "utf8");
  const shell = await readFile("src/styles/shell.css", "utf8");
  const composeFixture = await readFile("preview/compose.html", "utf8");
  const messageFixture = await readFile("preview/message.html", "utf8");
  const contactsFixture = await readFile("preview/contacts.html", "utf8");

  assert.ok(
    ["bold", "italic", "list", "link"].every((icon) => icons.includes(icon)),
  );
  assert.match(composeFixture, /ak-icon-italic/);
  assert.doesNotMatch(composeFixture, /aria-label="Italic"[^]*<em>/);
  assert.match(compose, /recipients-input\)[^]*min-height: 2\.25rem/);
  assert.match(compose, /recipient-token\)[^]*flex: 0 1 auto/);
  assert.match(compose, /recipient-token\)[^]*max-width: 100%/);
  assert.match(compose, /recipient-token\) > span[^]*min-width: 0/);
  assert.match(compose, /recipient-remove[^]*flex: 0 0 1\.5rem/);
  assert.doesNotMatch(compose, /max-width: min\(100%, 14rem\)/);
  assert.doesNotMatch(compose, /max-width: 42%/);
  assert.match(
    compose,
    /#compose-attachments h2[^]*font-size: var\(--ak-font-size-sm\)/,
  );
  assert.match(
    compose,
    /attachmentslist > li[^]*border: var\(--ak-border-width\) solid[^]*background: var\(--ak-color-sidebar\)/,
  );
  assert.match(
    compose,
    /#compose-attachments[^]*margin-block-start: var\(--ak-space-4\)/,
  );
  assert.match(compose, /#compose-attachments[^]*gap: var\(--ak-space-2\)/);
  assert.match(messageFixture, /<details class="message-details">/);
  assert.doesNotMatch(messageFixture, /<footer class="toolbar">/);
  assert.match(
    message,
    /message-attachments h2[^]*font-size: var\(--ak-font-size-sm\)/,
  );
  assert.match(
    message,
    /message-attachment[^]*border: var\(--ak-border-width\) solid/,
  );
  assert.match(message, /message-attachments[^]*gap: var\(--ak-space-2\)/);
  assert.doesNotMatch(contactsFixture, /btn-primary contact-compose/);
  assert.match(contactsFixture, /action-label">Compose/);
  assert.match(
    contacts,
    /contact-compose[^]*width: 44px[^]*height: 44px[^]*padding: 0[^]*place-items: center/,
  );
  assert.match(
    components,
    /not\([^)]*\.compose,[^)]*\.send[^)]*\)[^}]*border-color: transparent/,
  );
  assert.match(
    components,
    /focus-visible[^}]*border-color: var\(--ak-color-border-strong\)[^}]*background: var\(--ak-color-hover\)/,
  );
  assert.match(
    shell,
    /button:not\(\.btn-primary, \.mainaction\):is\(:hover, :focus-visible\)[^}]*border-color: var\(--ak-color-border-strong\)/,
  );
});

test("desktop workspaces, anchored menus, and mobile settings navigation ship together", async () => {
  const components = await readFile("src/styles/components.css", "utf8");
  const compose = await readFile("src/styles/compose.css", "utf8");
  const message = await readFile("src/styles/message.css", "utf8");
  const settings = await readFile("src/styles/settings.css", "utf8");
  const settingsFixture = await readFile("preview/settings.html", "utf8");
  const messageFixture = await readFile("preview/message.html", "utf8");
  const theme = await readFile("src/js/theme.js", "utf8");
  const settingsList =
    settingsFixture.match(
      /<section id="layout-list">([\s\S]*?)<\/section>/,
    )?.[1] ?? "";

  assert.match(
    components,
    /:has\(> \.popupmenu, > \.dropdown-menu\)[^]*inset: calc\(100% \+ var\(--ak-space-1\)\)/,
  );
  assert.match(
    components,
    /max-width: calc\(100vw - \(2 \* var\(--ak-space-3\)\)\)/,
  );
  assert.match(theme, /function positionContextMenu/);
  assert.match(theme, /const gap = 6/);
  assert.match(theme, /window\.innerWidth - menuRect\.width - edge/);
  assert.match(theme, /triggerRect\.top - menuRect\.height - gap/);
  assert.doesNotMatch(
    components,
    /:active[^}]*border-radius|:hover[^}]*border-radius/,
  );
  assert.match(
    settings,
    /@media \(width <= 37\.5rem\)[^]*\.settings-section-nav/,
  );
  assert.match(settings, /settings-section-nav summary[^]*min-height: 44px/);
  assert.equal(
    [...settingsList.matchAll(/<li(?: class="selected")?><a href="#">/g)]
      .length,
    5,
  );
  assert.match(theme, /function initializeSettingsSectionNav/);
  assert.match(theme, /sourceLink\.cloneNode\(true\)/);
  assert.match(theme, /aria-current/);
  assert.match(compose, /width: min\(100%, 96rem\)/);
  assert.match(
    compose,
    /@media \(width > 48rem\)[^]*margin-inline-start: 7rem/,
  );
  assert.match(compose, /grid-template-columns: repeat\(auto-fit/);
  assert.match(message, /max-width: 76rem/);
  assert.match(message, /message-attachments[^]*order: 3/);
  assert.match(message, /message-part, #messagebody\)[^]*order: 4/);
  assert.match(message, /grid-template-columns: repeat\(auto-fit/);
  assert.match(messageFixture, /message-workspace/);
});

test("the pinned Inter manifest covers required Phase 1 styles and weights", async () => {
  const manifest = JSON.parse(
    await readFile("assets/fonts/inter-4.1.json", "utf8"),
  );
  assert.equal(manifest.version, "4.1");
  assert.deepEqual(
    manifest.files.map(({ name, style, weight }) => ({ name, style, weight })),
    [
      { name: "InterVariable.woff2", style: "normal", weight: "400 600" },
      {
        name: "InterVariable-Italic.woff2",
        style: "italic",
        weight: "400",
      },
    ],
  );
  for (const font of manifest.files) {
    assert.match(
      font.url,
      /^https:\/\/raw\.githubusercontent\.com\/rsms\/inter\/v4\.1\//,
    );
    assert.match(font.sha256, /^[a-f0-9]{64}$/);
  }
});

test("font verification rejects bytes that do not match the pinned checksum", async () => {
  const directory = await mkdtemp(join(tmpdir(), "akio-font-test-"));
  const fixture = join(directory, "font.tmp");
  await writeFile(fixture, "verified fixture");
  assert.equal(
    await verifyFontFile(
      fixture,
      "f9adb7d924ed98c558040c910600d7363d749e7d20e8d355626edd53b4fb929f",
    ),
    true,
  );
  assert.equal(await verifyFontFile(fixture, "0".repeat(64)), false);
  await rm(directory, { recursive: true });
});

test("static preview pages use generated skin assets without network endpoints", async () => {
  for (const page of previewPages) {
    const content = await readFile(join("preview", page), "utf8");
    assert.match(content, /\.\.\/build\/dev\/akio\/styles\/akio\.css/);
    assert.doesNotMatch(content, /(?:src|href|action)=["']https?:\/\//i);
    assert.doesNotMatch(content, /(?:imap|smtp):\/\//i);
  }
});

test("preview infrastructure stays outside the production build inputs", async () => {
  const build = await readFile("scripts/build.mjs", "utf8");
  assert.doesNotMatch(build, /["']preview["']/);
  assert.match(
    await readFile("preview/README.md", "utf8"),
    /visual presentation only/i,
  );
});

test("mailbox polish is shipped by the production skin", async () => {
  const entrypoint = await readFile("src/styles/akio.css", "utf8");
  const inbox = await readFile("src/styles/inbox.css", "utf8");
  const preview = await readFile("preview/preview.css", "utf8");

  assert.match(entrypoint, /@import url\("\.\/inbox\.css"\)/);
  for (const selector of [
    "#layout-menu",
    "#layout-sidebar",
    ".messagelist",
    ".message-snippet",
    ".empty-state",
    ".ui-dialog",
  ]) {
    assert.ok(inbox.includes(selector), `${selector} is not production CSS`);
  }
  assert.doesNotMatch(preview, /\.preview-page \.messagelist/);
});
