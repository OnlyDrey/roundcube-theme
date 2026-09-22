import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("mail workspace retains folder, list, search, and reader contracts", async () => {
  const mail = await read("templates/mail.html");
  for (const contract of [
    'name="mailboxlist"',
    'id="mailboxlist"',
    'id="folderlist-content"',
    'name="messages"',
    'id="messagelist"',
    'data-list="message_list"',
    'name="searchform"',
    'id="mailsearchform"',
    'id="searchmenu"',
    'name="contentframe"',
    'id="messagecontframe"',
    'name="listcontrols"',
    'name="mailboxoptions"',
    'name="listoptions"',
  ]) {
    assert.ok(mail.includes(contract), `missing mail contract: ${contract}`);
  }
});

test("mail workspace preserves selection, thread, paging, and drag actions", async () => {
  const mail = await read("templates/mail.html");
  for (const contract of [
    'id="dragmessage-menu"',
    'command="move"',
    'command="copy"',
    'id="list-toggle-button"',
    'command="select-all"',
    'command="select-none"',
    'command="expand-unread"',
    'command="collapse-all"',
    "includes/pagenav.html",
  ]) {
    assert.ok(mail.includes(contract), `missing list behavior: ${contract}`);
  }
});

test("reader retains sanitized body, headers, attachments, and extension points", async () => {
  const message = await read("templates/message.html");
  for (const contract of [
    'name="messageSummary"',
    'name="messageHeaders"',
    'name="messageObjects"',
    'name="messageBody"',
    'id="messagebody"',
    'name="messageAttachments"',
    'id="attachment-list"',
    'name="headerlinks"',
    'name="attachmentmenu"',
    'name="mailtomenu"',
  ]) {
    assert.ok(
      message.includes(contract),
      `missing reader contract: ${contract}`,
    );
  }
});

test("mail toolbar preserves contextual actions and plugin menus", async () => {
  const toolbar = await read("templates/includes/mail-menu.html");
  for (const contract of [
    'id="mailtoolbar"',
    'command="reply"',
    'command="reply-all"',
    'command="forward"',
    'command="delete"',
    'command="mark"',
    'command="move"',
    'command="copy"',
    'name="toolbar"',
    'name="forwardmenu"',
    'name="replyallmenu"',
    'name="messagemenu"',
    'name="markmenu"',
  ]) {
    assert.ok(
      toolbar.includes(contract),
      `missing toolbar contract: ${contract}`,
    );
  }
});

test("mail styles define non-color states and responsive single-pane transition", async () => {
  const css = await read("src/styles/mail.css");
  for (const state of [
    "tr.unread",
    "tr.selected",
    "tr.flagged",
    "span.attachment",
    ".listing-info",
    ".iframe-loader",
    "forced-colors: active",
    "width <= 48rem",
  ]) {
    assert.ok(css.includes(state), `missing mail state style: ${state}`);
  }
  assert.match(css, /font-weight: var\(--ak-weight-semibold\)/);
  assert.match(css, /box-shadow: inset 3px/);
});
