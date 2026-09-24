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
  assert.match(styles, /#compose-content[\s\S]*width: min\(100%, 68rem\)/);
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
