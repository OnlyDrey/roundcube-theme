import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("login retains the Roundcube authentication and extension contract", async () => {
  const source = await read("templates/login.html");
  for (const contract of [
    'name="loginform"',
    'id="login-form"',
    'name="login-form"',
    'submit="true"',
    'name="message"',
    'name="loginfooter"',
  ]) {
    assert.ok(
      source.includes(contract) ||
        (contract === 'name="message"' &&
          (await read("templates/includes/footer.html")).includes(contract)),
      `missing login contract: ${contract}`,
    );
  }
});

test("application navigation retains core commands and plugin extension point", async () => {
  const menu = await read("templates/includes/menu.html");
  for (const contract of [
    'id="taskmenu"',
    'command="compose"',
    'command="mail"',
    'command="addressbook"',
    'command="settings"',
    'command="logout"',
    'name="taskbar"',
    'id="logo"',
  ]) {
    assert.ok(menu.includes(contract), `missing shell contract: ${contract}`);
  }
});

test("explicit localized theme selector exposes every supported mode", async () => {
  const [menu, labels, script] = await Promise.all([
    read("templates/includes/menu.html"),
    read("localization/en_US/labels.inc"),
    read("src/js/theme.js"),
  ]);
  for (const mode of ["system", "light", "dark"]) {
    assert.ok(menu.includes(`data-akio-theme-value="${mode}"`));
    assert.ok(labels.includes(`$labels['akio.theme.${mode}']`));
  }
  assert.match(menu, /role="menuitemradio"/);
  assert.match(script, /prefers-color-scheme: dark/);
  assert.match(script, /Max-Age=31536000/);
  assert.match(script, /event\.key === "Escape"/);
});

test("unowned application screens retain Elastic inheritance", async () => {
  const metadata = JSON.parse(await read("meta.json"));
  assert.equal(metadata.extends, "elastic");
  await assert.rejects(read("templates/addressbook.html"), { code: "ENOENT" });
});
