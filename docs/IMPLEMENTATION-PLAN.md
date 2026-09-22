# Implementation plan

## Operating rules

Each phase ends with a reviewable, runnable increment. Compatibility, security,
and accessibility failures block visual polish. Roundcube core is always an
external test dependency and is never vendored or patched in this repository.
Phase 1 must not start until the decisions and limitations in the other Phase 0
documents are accepted.

## Phase 0 — research (complete)

### Evidence reviewed

- Official Roundcube release history established 1.7.4 as the current stable
  release on 2026-09-21, with 1.6.19 also published as the maintained older line.
- The official Skins and Skin Markup wiki pages established template structure,
  inheritance, metadata, objects, buttons, containers, conditions, plugin skin
  locations, and packaging conventions.
- The complete Elastic skin at tag 1.7.4 was inspected, including its templates,
  includes, metadata, styles, responsive behavior, dark mode, frame handling,
  compose disclosure, plugin containers, print views, and UI event integration.
- Roundcube 1.7.4 output/config code was checked to confirm template/asset lookup,
  inheritance, plugin path precedence, localization, metadata, forced skin
  config, logo variants, layout preferences, and `skin_include_php` behavior.
- Core action code and the official hook list were checked to map mail, compose,
  contact, settings, and plugin extension capabilities.
- Official Roundcube Docker documentation confirmed `/var/www/html` as the
  installation root and `/var/roundcube/config` as the additional-config path.

### Gate result

All requested major features map to supported mechanisms or have an explicit
limitation in `COMPATIBILITY.md`. The proposed architecture is internally
consistent: a standalone skin package, supported Elastic inheritance fallback,
independently authored core templates, build-time-only Tailwind, local assets,
presentation-only JS, and optional separate plugins for server persistence.

**Stop point:** no Phase 1 implementation is included in this change.

## Phase 1 — foundation (complete)

### Deliverables

1. Add package metadata, exact dependency lockfile, license/third-party notices,
   `.editorconfig`, ignore rules, and release artifact policy.
2. Add source `meta.json` and Composer metadata for a `roundcube-skin` package;
   declare Elastic inheritance and the tested Roundcube range.
3. Implement the deterministic build: clean, Tailwind/PostCSS compile, JS
   bundle/minify, font/icon copy, template copy, manifest/checksum generation.
4. Acquire checksum-pinned Inter files during the build and vendor only the
   required Lucide SVGs; package both licenses.
5. Define complete light/dark semantic tokens, spacing/type/layout tokens,
   Tailwind prefix/safelist, no Preflight, print and editor/embed entrypoints.
6. Create independently authored shared layout/footer/menu includes with all
   required Roundcube objects and containers.
7. Implement early theme initialization and accessible System/Light/Dark state,
   including same-origin frames, system-change listener, and reduced motion.
8. Add linting, template inventory comparison, external-resource rejection,
   deterministic-build check, and a minimal Roundcube fixture harness.

### Exit criteria

- `npm ci`, dev, build, lint, and tests work from a clean checkout.
- `dist/akio` installs beside Elastic on Roundcube 1.7.4 without PHP/core edits.
- Base/error/dialog/print pages render with no console errors or external calls.
- Both themes pass token-level contrast tests and 200% zoom shell smoke tests.

### Gate result

The repository now produces deterministic development and production skin
directories, uses supported Elastic inheritance, and includes the shared layout,
semantic tokens, checksum-verified Inter acquisition, local runtime assets,
three-state theme controller, validation scripts, component specimen, tests, and
deployment documentation. Generated distribution and font-cache files are
ignored rather than source-controlled. Static contrast checks cover primary
token pairs, and the login page was smoke-tested with the official Roundcube
1.7.4 complete package. Browser zoom and assistive-technology checks remain part
of the later full integration matrix.

**Stop point:** no Phase 2 templates or application-shell interactions are
included in this phase.

## Phase 2 — login and application shell

### Deliverables

- Login, error, watermark, navigation, account menu, quota, folder tree, search
  shell, responsive panel navigation, and loading/empty/error foundations.
- Configurable logo/product/favicons and documented neutral branding override.
- Keyboard/focus management for drawers, menus, pane changes, and task rail.

### Exit criteria

- Successful/failed login, logout, expired session, full-address username, and
  administrator support link are tested without altering auth behavior.
- Folder nesting, counts, long names, drag/drop fallback, quota, all breakpoints,
  theme modes, keyboard, reduced motion, and screen reader landmarks pass.

## Phase 3 — mail

### Deliverables

- Dense scan-friendly message list with selection, unread, flag, attachment,
  priority, reply/forward, date, and supported thread states.
- Reader/preview/full-window/print templates, header disclosure, action menus,
  attachments, safe-content notices, and coherent frame styling.
- Bulk action, search/filter/options, paging, drag/drop, and empty/error/loading
  states. Body snippets remain absent unless a supported API is approved.

### Exit criteria

- Test long senders/subjects, thousands-of-message paging, selection variants,
  threading on/off, all system folders, plain/HTML mail, blocked remote content,
  RTL/localization, attachments, keyboard commands, and narrow/wide layouts.
- Sanitization and remote-content behavior match unmodified Roundcube.

## Phase 4 — composer

### Deliverables

- One composer with minimal default and accessible advanced disclosure.
- To/Cc/Bcc/Reply-To/Followup-To, identities, subject, rich/plain body,
  attachments/drop area, sent folder, priority, receipts, signatures/responses,
  spellcheck, draft state, external window, and plugin containers.
- Local disclosure preference with a documented optional preference-plugin path.

### Exit criteria

- New/reply/reply-all/forward/bounce/draft flows, autocomplete, autosave, uploads,
  validation/error recovery, editor modes, identities, and supported encryption
  integration pass on desktop and mobile layouts.

## Phase 5 — contacts, settings, and plugin adapters

### Deliverables

- Contacts sources/groups/search/list/detail/create/edit/import/export/print.
- Preferences, identities, folders, responses, about, and generic plugin views.
- First-party adapters and a maintained matrix for bundled plugins including
  archive, markasjunk, managesieve, password, enigma, and jqueryui surfaces.

### Exit criteria

- CRUD and failure/readonly states pass for contacts and groups where supported.
- Every core settings screen and matrix plugin is usable with keyboard, zoom,
  long/localized content, both themes, and plugin-added fields/actions.

## Phase 6 — accessibility and responsive polish

### Deliverables

- Automated axe/contrast suite and documented manual audit protocol.
- Keyboard and focus maps, NVDA/Firefox and VoiceOver/Safari smoke results,
  forced-colors verification, 200%/400% zoom findings, target-size checks.
- Cross-browser responsive and performance budget results; visual regression
  fixtures for major states in both themes.

### Exit criteria

- No known skin-owned WCAG 2.2 A/AA blocker; exceptions caused by upstream or
  message/plugin content are documented with issue/reference and mitigation.
- No horizontal page overflow at required widths/zoom except documented
  intrinsic content, and no essential animation under reduced motion.

## Phase 7 — release

### Deliverables

- Clean production artifact, checksums, changelog, semantic version, source and
  third-party licenses, compatibility declaration, and upgrade notes.
- Standard install, Composer install if published, official Docker bind-mount,
  custom-image, and Docker Compose instructions tested against pinned images.
- Configuration guide for skin selection, branding, theme, rollback, and cache
  invalidation; screenshots/examples generated from non-sensitive fixtures.

### Exit criteria

- A clean Roundcube 1.7.4 installation can install, select, use, upgrade, and
  remove the skin without modifying core.
- Rebuilding the same commit produces byte-equivalent files where practical.
- Full quality checklist passes and known limitations are release-noted.

## Cross-phase test strategy

### Static/automated

- JSON validation; template tag/inventory/ID/container checks; HTML fragments;
  ESLint; Stylelint; Prettier; Tailwind build warnings; license inventory.
- Reject `http://`/`https://` runtime assets, inline event handlers not required
  by Roundcube, PHP in templates, core files, unexpected generated files, and
  unpinned packages.
- Playwright interaction, responsive screenshots, keyboard paths, axe, console
  errors, failed requests, theme persistence, and reduced-motion assertions.

### Integration/manual

Use disposable unmodified Roundcube instances backed by test IMAP/SMTP accounts.
Fixture mail must cover plain/HTML/multipart, remote images, malformed markup,
large/zero attachments, signed/encrypted plugin cases, long/RTL/international
headers, threads, and security notices. Never commit real credentials or mail.

Manual passes cover assistive technology, actual editors, drag/drop, touch,
browser/password manager behavior, plugin screens, message content fidelity, and
Docker persistence across container recreation.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Upstream template/JS contract changes | Pin tested versions, inventory/diff every tag, CI matrix, Elastic fallback. |
| Overcoupling to Elastic internals | Author core templates from public objects; isolate compatibility adapters. |
| Tailwind resets/plugin collisions | Disable Preflight, prefix utilities, token/component layers, plugin fixtures. |
| Plugin diversity | Preserve containers, generic semantic styles, explicit adapter matrix and limitations. |
| Theme flash/frame mismatch | Local pre-paint script, shared tokens, theme media listener in every document. |
| Dark mode harms email content | Theme chrome, not arbitrary message HTML; retain security/fidelity boundaries. |
| Icon/font supply chain or bloat | Pin exact versions/URLs, verify font checksums, package only selected assets, retain licenses, audit size. |
| Accessibility regressions in dynamic UI | Stable native controls, keyboard/focus tests, axe plus manual AT gates. |
| Fragile composer customization | One form, preserve DOM objects and public events, progressive disclosure only. |
| Security regression | No core patches, no sanitizer/remote-content changes, CSP/external-request tests. |
| Docker upgrade hides mounted files | Mount only skin/config paths or build a pinned derived image; recreation test. |

## Upgrade review checklist

For a new Roundcube tag, record release date/security relevance, diff Elastic and
core template inventories, compare objects/IDs/commands/containers/events, check
`meta.json` behavior and plugin lookup, rebuild, run the full matrix, and publish
the supported range. If a security release arrives first, recommend upgrading
Roundcube and temporarily selecting Elastic rather than running vulnerable core.
