import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyFontFile } from "../scripts/acquire-fonts.mjs";

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

test("login styles constrain the card, logo, fields, and submit control", async () => {
  const styles = await readFile("src/styles/login.css", "utf8");
  assert.match(styles, /#login-form[\s\S]*width: min\(100%, 22rem\)/);
  assert.match(styles, /#logo[\s\S]*object-fit: contain/);
  assert.match(styles, /#rcmloginsubmit[\s\S]*width: 100%/);
  assert.match(styles, /@media \(width < 30rem\), \(height < 38rem\)/);
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
    ["dark foreground", "#edf1f6", "#1c222c", 4.5],
    ["dark secondary", "#c0c8d4", "#1c222c", 4.5],
    ["dark muted", "#9ca8b8", "#1c222c", 4.5],
    ["dark accent", "#78b8f0", "#1c222c", 4.5],
  ];

  for (const [name, foreground, background, minimum] of pairs) {
    assert.ok(
      contrast(foreground, background) >= minimum,
      `${name} contrast is below ${minimum}:1`,
    );
  }
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
