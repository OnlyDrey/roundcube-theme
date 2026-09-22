# Phase 3: mail workspace

## Upstream inventory and owned templates

The Roundcube 1.7.4 complete package was inspected before replacement. Akio now
owns `mail.html`, `message.html`, and `includes/mail-menu.html`. `mail.html`
retains `mailboxlist`, `messages`, search/filter/interval objects, list options,
content frame, quota, paging include, conditionals, and the drag, mailbox,
selection, thread, and list-option menus. Its behavior-sensitive IDs include
`mailboxlist`, `messagelist`, `mailsearchform`, `searchmenu`,
`messagecontframe`, `list-toggle-button`, and every upstream popup-menu ID.

`message.html` remains the document rendered both as a framed preview and as a
standalone/extwin reader. It retains the JavaScript mailbox object, conditional
toolbar, summary and full header objects, format toggle, sanitized
`messageObjects`/`messageBody`, real `messageAttachments`, and attachment and
mailto menus. Header, attachment, and mailto plugin containers remain intact.

`includes/mail-menu.html` retains contextual command state for compose, reply,
reply-all, reply-list, forward variants, bounce, delete, print, mark, navigation,
import/export, edit, source, move/copy, and external-window actions. The toolbar,
forward, reply-all, message, and mark plugin containers and upload form remain.
Actions continue to be enabled and dispatched by Roundcube rather than skin JS.

`messagepart.html`, paging, and other generic includes remain inherited because
Akio does not need different markup to style them safely. Composer, Contacts,
Settings, and plugin-specific mail templates remain Elastic dependencies.

## Workspace and list

The wide layout presents the established app rail, dynamic folder tree, dense
message list, and isolated reader. Existing Elastic column resizers are retained
and visually reduced; no second resize implementation exists. At narrower
widths Elastic's tested pane navigation remains authoritative, so folders lead
to list and list leads to reader without squeezing permanent phone columns.

Rows use the server-provided sender/recipient, subject, date, size, unread,
flagged, attachment, deleted, selected, and thread classes. Unread state combines
weight with the existing status glyph; selection combines surface and inset
marker; focus receives an outline. No snippets, avatars, per-row listeners, or
additional requests are introduced. A density token controls the 56-pixel row
height and can support a future user-facing density preference.

Folder labels, nesting, counts, selection, drop targets, actions, quota, and
extensions all come from Roundcube's mailbox model. Standard folder names and
identifiers are never hard-coded. Search continues to use Roundcube's real
search form, reset/options controls, advanced criteria, scope, and commands.

## Reader, attachments, and security

The parent workspace keeps `messagecontframe`; the framed message then renders
its subject, sender/recipient summary, complete headers, format controls,
security notices, sanitized body, and attachments. CSS makes the surrounding
surfaces continuous but never moves arbitrary HTML into the parent, recolors
authored HTML, loads remote images, or changes CSP/sanitization behavior.

Attachments use the existing open/download actions and menu, with compact
wrapping items, filename truncation, and retained accessible text and size.
Blocked-content warnings and notification/error states keep their Roundcube
text/icons and gain a non-color border indicator.

## Accessibility, responsive behavior, and limitations

Toolbars retain translated labels and titles, popup menus retain their headings
and roles, and list/folder/reader regions retain labelled navigation and region
semantics. Focus, unread, selected, drop-target, loading, error, and forced-color
states have visible non-color cues. Reduced-motion handling remains global.

At 75rem pane bases contract, and at the Elastic 48rem layout boundary each pane
can occupy the workspace with compact reader padding and touch-sized controls.
Actual pane selection/back behavior remains in upstream `ui.js`, preserving its
keyboard and history behavior.

Roundcube provides no standard safe body snippet, so Akio intentionally displays
only envelope metadata. HTML mail may retain author-selected light surfaces in
dark mode. Automated contract/style/build tests are not WCAG certification; a
configured mail account and browser/assistive-technology matrix remain required
for message data, plugins, zoom/reflow, pointer/touch, and visual qualification.
