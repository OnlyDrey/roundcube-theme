# Compatibility and limitations

## Baseline

| Item | Phase 0 decision |
| --- | --- |
| Current stable researched | Roundcube 1.7.4 (released 2026-09-06) |
| Primary target | 1.7.4 on supported browsers |
| Secondary line | 1.6.x only after its own test pass |
| Required base skin | Elastic, while Akio uses supported inheritance fallback |
| Provider dependency | None; all mail operations remain Roundcube IMAP/SMTP behavior |
| PHP/core changes | None |
| Runtime external assets | None |

The baseline was established from the [official release][release], the
[1.7.4 source tag][source], the [Skins guide][skins], and the
[Skin Markup reference][markup]. “Supported” below means a documented template,
configuration, or plugin mechanism—not merely something possible by DOM
mutation.

## Capability map

| Requested capability | Safe mechanism | Boundary / decision |
| --- | --- | --- |
| Login identity, fields, errors | `login.html`, `loginform`, `logo`, `productname`, message object, CSS | Skin cannot change authentication policy or require full-address login; administrator config does that. |
| App shell and panes | Templates, stable layout IDs, CSS Grid, presentation JS | Preserve core commands, frames, and object IDs. |
| IMAP folder tree/counts/nesting | `mailboxlist` object and existing commands | Depends on server capabilities and Roundcube folder config; do not synthesize folders. |
| Message list | `messages` object attributes, CSS, public list events | Available envelope columns/flags/thread state only; arbitrary body snippets are not standard output. |
| Threads | Existing thread mode and storage capability | No Gmail-style conversation model; presentation follows Roundcube/IMAP threading. |
| Reading pane | `contentframe`/message templates, CSS | It remains an iframe. Hiding or replacing it would be fragile and could weaken isolation. |
| HTML/plain mail and remote content | Core `messageBody`, `messageObjects`, `blockedObjects` | Sanitization and blocking are immutable security boundaries. |
| Message actions | `<roundcube:button>` public commands and plugin containers | Do not forge URLs or call private action endpoints. |
| Attachments | Core attachment objects and commands | Preview availability is MIME/security dependent. |
| Composer | Compose objects/buttons, existing header disclosures, CSS and public events | One progressive form. Two backend modes are not a skin capability. |
| Compose preference | Local presentation state | Server persistence needs a separate plugin using preference hooks. |
| Contacts/groups | Address-book objects, templates, commands | Backend/address-book capabilities vary; no invented sync or fields. |
| Settings/identities/folders/responses | Settings templates/objects and generic plugin styles | Plugin sections are variable and must be tested. |
| Light/dark/system | `meta.json` dark support, local CSS/JS, cookie/media query | Skin-only server preference does not exist; use local presentation persistence. |
| Branding | `product_name`, `skin_logo`, assets, token override | Per-domain selection is deployment/plugin policy and deferred. |
| PWA metadata | `meta.json` `meta`/`links`, local manifest/icons | No offline mail/service worker in V1. |
| Localization | Core labels; optional skin localization declared in `meta.json` | Avoid replacing dynamic labels with English. |
| Plugin UI | Containers, plugin-owned skin files, `skin/plugins/<id>` adapters | Unknown third-party plugins get best-effort generic styling, not guaranteed pixel parity. |

## What templates can safely change

Templates may rearrange documented objects and buttons, add semantic wrappers,
landmarks, headings, accessibility descriptions, presentation classes, local
styles/scripts, and documented conditional expressions. `meta.json` may declare
inheritance, forced skin configuration, localization, meta tags, and link tags.

Templates must preserve:

- required form objects, CSRF-bearing core forms, command/property values, and
  GUI object IDs expected by Roundcube;
- plugin containers such as toolbars, list controls, compose objects/options,
  header links, attachment menus, and settings actions;
- framed, external-window, print, error, dialog, and plugin templates;
- accessible labels and localization objects;
- asset paths resolved through the skin engine.

PHP includes will not be enabled. Although Roundcube has a
`skin_include_php` option, executable template logic increases security and
maintenance risk and is unnecessary for this design.

## What CSS can safely change

CSS controls layout, visual order, responsive panes, typography, icons,
surfaces, states, print presentation, and styling of server/plugin output.
Tailwind Preflight will be disabled and utilities prefixed. Component selectors
will be rooted in skin/task classes where practical, while stable Roundcube IDs
remain available for necessary integration styling.

CSS must not hide a required control with no accessible alternative, visually
reorder controls contrary to tab order, alter message content to conceal
security notices, or assume that plugin markup is fixed.

## What JavaScript can safely change

Skin JS may subscribe to public `rcmail` events, invoke registered commands,
manage menus/disclosures/focus, update responsive view state, and persist local
presentation choices. It must tolerate absent objects and plugin-added content.

Skin JS must not override core prototypes to change business logic, scrape
private response data, hand-build authenticated endpoints, weaken safe-content
checks, replace editor/upload/send flows, or depend on minified private
implementation details. Automated tests will fail on uncaught errors across all
major templates.

## Configuration and supported hooks

Relevant administrator/skin configuration includes `skin`, `product_name`,
`skin_logo`, `support_url`, login behavior, `layout`, and skin `meta.json`
configuration such as `supported_layouts`, `dark_mode_support`, editor/embed CSS,
and logo variants. The exact accepted options will be validated against each
target release rather than assumed from Elastic.

If presentation alone is insufficient, Roundcube's [plugin hooks][hooks] offer
documented extension points. Likely candidates include `loginform_content`,
`messages_list`, `message_objects`, `compose_objects`, `contact_form`,
`preferences_sections_list`, `preferences_list`, `preferences_save`,
`settings_actions`, `template_object_*`, `template_container`, and
`render_page`. A hook is not permission to bundle unrelated backend logic into
the skin; any plugin remains optional, separate, and narrowly documented.

## Explicit platform limitations

1. **The reading pane is a frame.** Roundcube 1.7.4 uses a content frame for
   message, contact, and settings detail views. A seamless design is possible,
   but removing the frame would mean reimplementing navigation/rendering.
2. **No standard inbox body snippet.** The normal message list provides envelope
   data and flags, not an arbitrary sanitized body preview. V1 will omit snippets
   rather than trigger N body fetches, expose private content unexpectedly, or
   scrape messages.
3. **No distinct composer backend modes in a skin.** Templates can progressively
   disclose the same supported fields. A separate minimal/advanced data model is
   not warranted.
4. **No skin-defined server preference.** Local cookie/storage can persist theme
   and disclosure state. Account-synchronized preferences need a plugin using
   official hooks.
5. **Threading is not a universal conversation model.** It depends on Roundcube
   and IMAP capabilities/configuration and will be represented only when exposed.
6. **Plugin markup is open-ended.** Core containers and generic rules support
   unknown plugins, but full visual integration requires per-plugin testing and
   sometimes a skin adapter.
7. **Branding is instance-level by default.** Per-domain branding is not a clean
   skin-only feature. It remains a deployment or optional-plugin concern.
8. **Email content cannot be safely recolored wholesale.** Authored HTML may
   retain light backgrounds in dark UI. The surrounding reader will be dark,
   while sanitized content prioritizes fidelity and readability.
9. **A skin cannot guarantee provider features.** Quotas, special-use folders,
   threading, address books, sieve, and attachment limits depend on server and
   enabled plugins.
10. **PWA metadata is not offline mail.** Manifest/icons are safe; a bespoke
    authenticated mail cache is explicitly out of scope.

These constraints are product decisions, not defects to solve with fragile DOM
or PHP patches.

## Elastic compatibility findings

Elastic 1.7.4 defines a four-region responsive shell, layout classes, same-origin
frame theme propagation, one `widescreen` supported layout in its metadata,
dark-mode logo variants, editor/embed styles, and a substantial JS adaptation
layer. It also retains Cc/Bcc/Reply-To fields in the compose DOM and reveals them
progressively. These are useful compatibility patterns, not a visual blueprint.

Akio will retain equivalent functional contracts while replacing visual design,
CSS architecture, iconography, and authored core templates. The upstream
template inventory is the upgrade checklist. Runtime inheritance is a fallback,
not an excuse to leave primary experiences styled by Elastic.

## Browser, accessibility, and test matrix

The release target follows the current Roundcube/Elastic policy of the latest
two Edge, Chrome, Firefox, and Safari versions. Additionally test:

- keyboard-only and screen reader smoke paths;
- light, dark, system, forced-colors, reduced-motion, and 200% zoom;
- 320, 480, 768, 1024, 1280, 1440, and 1920 CSS-pixel viewports;
- long localized labels, RTL where Roundcube supports it, long addresses and
  subjects, empty/large lists, nested folders, errors, and loading;
- HTML/plain messages, remote-content warning, attachments, compose variants,
  reply/reply-all/forward, contacts, settings, and supported bundled plugins.

Automated axe, HTML/template checks, JS/CSS linting, contrast tests, build
reproducibility, and upstream-inventory diffing are gates. Manual checks remain
required for reading order, screen reader output, mail content, editor behavior,
and complex plugins.

## Installation boundary and Docker finding

Standard installation copies `dist/akio` to `skins/akio` and selects
`$config['skin'] = 'akio';`. A release must document the exact supported
Roundcube range and keep Elastic installed while inheritance is enabled.

The [official Docker image documentation][docker] identifies `/var/www/html` as
the Roundcube installation/document root where additional skins live, and
`/var/roundcube/config` for additional config. Durable approaches are therefore
a read-only bind mount at `/var/www/html/skins/akio` plus persisted config, or a
small custom image that copies the release artifact there. A named volume over
all of `/var/www/html` can obscure image upgrades and will not be the preferred
skin-only example. Detailed commands belong to Phase 7 deployment docs after an
image-version test.

[release]: https://github.com/roundcube/roundcubemail/releases/tag/1.7.4
[source]: https://github.com/roundcube/roundcubemail/tree/1.7.4
[skins]: https://github.com/roundcube/roundcubemail/wiki/Skins
[markup]: https://github.com/roundcube/roundcubemail/wiki/Skin-Markup
[hooks]: https://github.com/roundcube/roundcubemail/wiki/Plugin-Hooks
[docker]: https://github.com/roundcube/roundcubemail-docker#persistent-data
