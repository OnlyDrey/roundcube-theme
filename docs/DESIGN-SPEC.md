# Design specification

## Product character

Akio Mail is a calm, compact professional workspace. It should read as a
purpose-built mail application rather than a dashboard or a decorative reskin.
Hierarchy comes from typography, alignment, surface contrast, and restrained
dividers—not gradients, floating glass cards, or oversized controls.

The brand layer is deliberately quiet. Product identity is strongest at login
and subordinate to the user's work everywhere else.

## Token model

All values are semantic CSS custom properties consumed by Tailwind and component
CSS. Raw values are defined once per color scheme; templates use semantic names.

### Typography

- Family: locally hosted Inter with system sans-serif fallback.
- Base: 14px/1.45 on desktop; browser zoom and user font preferences remain
  usable. Message bodies retain sender-intended safe typography.
- Scale: 12px metadata, 14px UI/body, 16px emphasized body, 18–20px section and
  message titles, 24px login heading.
- Weights: 400 regular, 500 controls/metadata, 600 unread and headings. Avoid
  700 except rare emphasis.
- Truncation must expose the complete value through an accessible title or
  expandable detail, and never hide the only accessible name.

### Spacing and geometry

- Four-pixel base grid: `1, 2, 3, 4, 6, 8, 12` units.
- Compact desktop rows: approximately 48–56px; touch presentation: at least
  44px actionable targets with enough separation to meet WCAG 2.2 target-size
  expectations.
- Radii: 4px small controls, 8px fields/menus, 12px dialogs; panels generally
  meet edge-to-edge and do not become cards.
- Borders: one-pixel neutral separators; selected state combines surface,
  leading marker, and text/icon treatment.
- Shadows: only elevated menus/dialogs and transient overlays. Fixed panes use
  dividers, not shadows.

### Semantic colors

Each theme defines: canvas, sidebar, panel, elevated, input, message-body,
primary/secondary/muted foreground, border/subtle border, accent/accent-hover,
accent-contrast, selection, hover, focus ring, success, warning, danger, and
informational colors. Semantic feedback includes an icon and text, never color
alone.

Light mode uses warm-neutral near-white surfaces and deep slate text. Dark mode
uses layered charcoal/slate surfaces—not inverted light tokens—with softened
borders and controlled luminance. Accent colors will be chosen only after
automated contrast checks confirm at least 4.5:1 for normal text, 3:1 for large
text and meaningful UI graphics, and 3:1 adjacent-state contrast where required.

Focus uses a two-layer ring that remains visible on canvas, accent, destructive,
and selected backgrounds. `:focus-visible` is preferred; fallback focus is not
removed.

## Responsive workspace

Breakpoints are driven by available workspace rather than device names and will
be validated under browser zoom:

| Range (initial target) | Presentation |
| --- | --- |
| `>= 1440px` | Folder rail (240–272px), message list (400–480px), flexible reader |
| `1100–1439px` | Compact folder pane (216–240px), list (360–420px), reader |
| `768–1099px` | Two panes; folder drawer plus list/reader navigation |
| `< 768px` | One active pane; persistent back/title/action affordances |

These values are starting tokens, not a reason to force three columns when
content is unusable. Container space, long translations, zoom, and plugin-added
controls can trigger the compact presentation earlier. Resizable pane support is
deferred unless it can use supported layout state without compromising keyboard
access.

The DOM follows Roundcube's proven `layout-menu`, `layout-sidebar`,
`layout-list`, and `layout-content` regions so frames, commands, and plugin UI
remain compatible. CSS Grid supplies the desktop shell. On narrow layouts the
same regions become navigable views; state changes retain focus and announce the
new pane title.

## Application shell and navigation

- A narrow global task rail exposes Mail, Contacts, Settings, Compose, account,
  and theme controls with icon plus accessible label/tooltips.
- Folder navigation shows system and custom folders using Roundcube's mailbox
  tree, preserving nesting, expansion, unread count, drag/drop, and folder
  actions. Icons are presentation only; names and counts remain text.
- Search is prominent within the active list, not a global decorative bar.
- Quota is quiet until relevant, then uses text plus a progress indicator.
- Loading, empty, offline/request-error, and disabled states reserve stable
  space to reduce layout shift.

## Login

The page is a centered, narrow form on a plain canvas: configurable logo/product
name, email-address field, password field, primary sign-in action, error/status
region, and optional administrator support link. There is no marketing panel.
Browser password managers, autocomplete configuration, validation, and
Roundcube login behavior remain intact. The username label can say “Email
address,” but the skin cannot force the server's accepted username format.

## Message list

The list favors rapid scanning:

- sender/from-to is primary, subject is secondary but visually strong, date is
  right aligned, and status icons occupy predictable positions;
- unread uses weight plus a visible marker and accessible status, not color
  alone;
- selected uses background, leading accent, and selection semantics;
- flagged, attachment, replied/forwarded, priority, and thread expansion use
  Lucide icons with labels available to assistive technology;
- bulk selection reveals a stable action bar without moving the list origin;
- hover never supplies information unavailable to keyboard/touch users;
- long names and subjects truncate visually while remaining discoverable.

Roundcube 1.7.4's standard list object exposes envelope/list columns, flags,
attachments, priority, and thread state, but **does not expose a general body
snippet column**. V1 will not fetch message bodies per row or scrape hidden
markup. A subject/sender/date-first list is the safe baseline; snippets require
a separately assessed supported plugin/API and must degrade cleanly.

## Message reader

The subject and sender are dominant. Recipients, exact timestamp, and secondary
headers sit in an accessible disclosure. Reply, reply-all, and forward are
visible primary actions, with destructive and uncommon actions in “More.”
Attachments render as compact rows with type, filename, size where supplied,
and explicit open/download actions.

Roundcube renders the inline reader in a frame. That frame is a security and
layout boundary we preserve; the parent and `message` template will share tokens
so it feels continuous. The skin may style safe surrounding content but will not
alter sanitized HTML, unblock remote resources, or impose theme transformations
that make authored email unreadable.

## Composer

V1 uses **one compose form with progressive disclosure**, not two separate
composer implementations:

- minimal state shows From only when needed, To, Subject, body, attachments,
  Send, and a compact draft/status affordance;
- “Cc/Bcc and options” reveals Cc, Bcc, Reply-To/Followup-To where Roundcube
  supplies them, priority, receipts, sent-folder target, rich/plain selector,
  signatures/responses, spellcheck, and plugin options;
- attachments remain visible whenever files exist;
- advanced controls are never removed from the DOM, so Roundcube commands and
  plugin containers continue to work.

The disclosure state can be stored locally as presentation preference. A true
server-persisted “composer mode” would require a supported preferences plugin;
the skin cannot add a Roundcube preference by itself. Drafting, autosave,
recipient autocomplete, editor initialization, upload, encryption plugins, and
send validation remain core/plugin responsibilities.

## Contacts and settings

Contacts use source/group navigation, a scan-friendly contact list, and a clean
detail/editor pane. Existing address books, groups, saved searches, import,
export, contact photos, move/copy, and plugin actions remain conditional on what
Roundcube exposes.

Settings use a section list plus readable form pane. Labels align consistently,
descriptions sit close to controls, validation is explicit, and checkboxes are
not restyled into switches unless the semantic state is truly binary and the
native input remains operable. Unknown plugin fieldsets, tables, notices, and
buttons receive generic styles without assuming their internal markup.

## Theme control

A three-option control—System, Light, Dark—uses radio/menuitemradio semantics,
shows the current choice in text, and is keyboard reachable. “System” tracks
live OS changes. Theme switching updates all same-origin framed views and browser
theme color without motion or a white flash.

## Accessibility acceptance criteria

- WCAG 2.2 AA is the target for skin-owned markup and colors.
- Landmarks have unique names; headings follow a logical hierarchy.
- Every icon-only action has an accessible name and visible tooltip where useful.
- Native buttons/inputs are preferred; custom widgets implement the relevant
  WAI-ARIA keyboard pattern and state.
- Tab order follows visual/task order; panes do not trap focus. Opening overlays
  moves focus appropriately and closing restores it.
- Status/error updates use restrained live regions; routine list updates do not
  create announcement noise.
- At 200% zoom and 320 CSS px width, content reflows without two-dimensional
  page scrolling except intrinsically tabular/editor content.
- Pointer targets meet WCAG 2.2 AA sizing or spacing exceptions.
- `prefers-reduced-motion: reduce` removes panel/menu animation and nonessential
  transitions. Default transitions stay below roughly 160ms and animate only
  opacity/transform when useful.
- Windows High Contrast/forced colors preserves borders, focus, selection, and
  status meaning.
- Automated axe/contrast checks supplement, not replace, keyboard and screen
  reader testing.

## PWA position

V1 may ship a local manifest, icons, display metadata, and theme colors through
`meta.json` link/meta support. It will not register a custom service worker or
cache mail, credentials, authenticated pages, or attachments. Installability is
secondary to safe webmail behavior.
