# Architecture

## Status and decision record

This document is the Phase 0 architecture baseline. It describes a skin, not a
Roundcube fork or a mail client. No PHP core file, database schema, IMAP/SMTP
operation, MIME sanitizer, or authentication flow belongs in this repository.

The initial compatibility target is **Roundcube 1.7.4**, the current stable
release when this research was performed on 2026-09-21. The previous maintained
series, 1.6, is a compatibility target only after explicit testing; it is not a
license to use private 1.7 implementation details. Release information comes
from the [official 1.7.4 release][release], and implementation conclusions were
checked against the `1.7.4` tag rather than `master`.

The skin will use the working name **Akio**, while keeping every brand
surface replaceable. The install directory and package name will be `akio`.

## Supported architecture

Roundcube's final response is assembled from HTML skin templates. The template
engine replaces `<roundcube:object>`, `<roundcube:button>`,
`<roundcube:container>`, labels, includes, variables, and conditionals with
server- and plugin-provided content. The official [Skins guide][skins] and
[Skin Markup reference][markup] are the public contracts we will use.

The shipped [Elastic skin at tag 1.7.4][elastic] was inspected as a behavioural
reference. In particular, its complete template set, `meta.json`, `ui.js`,
responsive layout states, iframe handling, plugin containers, message list,
compose fields, contact views, and settings views establish the integration
surface that a production skin must preserve. Its visual rules and icon system
will not be copied.

### Layering

1. **Roundcube core** owns sessions, authentication, commands, list models,
   storage, MIME parsing, sanitization, remote-content blocking, CSRF handling,
   localization, and plugin execution.
2. **Templates** place only documented Roundcube objects/buttons/containers and
   semantic shell markup. They keep stable IDs and command names required by
   Roundcube JavaScript and plugins.
3. **Compiled CSS** supplies tokens, component styles, responsive layout, print
   rules, and editor/embed styles. Tailwind is build-time tooling, never a
   runtime dependency.
4. **Skin JavaScript** handles presentation state only: responsive panels,
   accessible disclosure/menu affordances, theme selection, and composer
   progressive disclosure. It calls public `rcmail` commands/events and does
   not replace business logic.
5. **Optional plugins** are separate packages, used only if a feature genuinely
   requires a server-side hook or stored Roundcube preference. The base skin
   must remain useful without an Akio plugin.

### Inheritance decision

V1 declares `"extends": "elastic"` in `meta.json`, which is an officially
documented skin mechanism. The completed skin will provide all core templates,
its own layout, CSS, JavaScript, fonts, and icons. Elastic remains a compatibility
fallback for new or accidentally omitted templates and for plugin skin assets
while the plugin coverage matrix is being completed.

Phase 1 deliberately retains Elastic's CSS, UI JavaScript, and unmodified screen
templates through inheritance, then loads Akio's token/component layer last.
Only the shared layout include is adapted because pre-paint theme initialization
and stylesheet ordering cannot be added through `meta.json`. This transitional
dependency keeps every inherited screen operational; later phases replace it as
they introduce independently authored, tested templates.

This choice trades a dependency on the Elastic skin shipped with supported
Roundcube distributions for a safer upgrade path. Installation documentation
will state that Elastic must remain installed. Phase 7 may remove inheritance
only after the complete core and plugin matrix passes without fallback. Any
Elastic code actually adapted, rather than merely inspected or inherited at
runtime, must retain attribution and use a compatible license; new templates
should be authored from the documented object contract.

## Repository and distribution shape

Source and generated files will remain distinguishable:

```text
assets/                  brand assets and pinned font acquisition manifest
docs/                    architecture, compatibility, design, deployment
src/
  icons/                 selected Lucide SVG sources and license
  js/                    theme bootstrap and presentation behaviour
  styles/                Tailwind entrypoints and CSS token layers
templates/               Roundcube templates and includes
plugins/<plugin>/        supported plugin templates/styles/assets
scripts/                 deterministic validation and packaging
build/cache/fonts/       verified font cache (generated, ignored)
dist/akio/               ready-to-copy skin (generated, ignored)
meta.json                source skin metadata
composer.json            optional roundcube-skin package metadata
package.json             build-only Node dependencies and scripts
```

The release artifact is the contents of `dist/akio/`, copied to
`<roundcube>/skins/akio/`. It contains no `node_modules`, source maps, remote
resources, or Roundcube core. It is generated locally or in CI and is not
source-controlled. A manifest of built files and checksums is generated for
reproducibility.

## Template strategy

The initial complete set will track the filenames in Elastic 1.7.4, including
login/error/dialog/print views, mail and message views, compose/bounce,
contacts, identities, folders, responses, settings, and generic plugin views.
Shared includes will own the document head, task navigation, toolbars, paging,
and footer. A script will compare Akio's inventory with the selected upstream
tag and fail CI when upstream adds a template.

Template rules:

- preserve registered GUI-object IDs and command names;
- preserve plugin `<roundcube:container>` extension points;
- use Roundcube labels rather than English strings wherever a label exists;
- keep print, external-window, framed, error, and empty states functional;
- keep PHP template execution disabled (`skin_include_php = false`);
- use semantic landmarks/headings and only add ARIA where native semantics are
  insufficient;
- do not use JavaScript to reconstruct server-rendered objects;
- keep message/contact/settings preview frames because they are part of the
  supported architecture, while styling both parent and framed template so the
  result feels continuous.

## Assets and build pipeline

Tailwind will scan the local templates and JS, use a prefix (proposed `ak-`) and
disable Preflight to avoid destructive resets of server/plugin markup. Most
shared component styling will live in explicit CSS layers using design-token
custom properties; utilities are for controlled template composition. Dynamic
Roundcube classes will be safelisted deliberately, never with a broad wildcard.

Inter 4.1 variable WOFF2 files are acquired from exact URLs pinned to the
upstream release tag, checksum-verified against a committed text manifest,
cached only in ignored build output, and packaged locally with the OFL license.
Selected Lucide SVGs are pinned by exact package/version and accompanied by their
license. SVG icons are emitted by a deterministic build step, use `currentColor`,
a consistent stroke width, and are decorative only when an adjacent accessible
name exists. No runtime icon renderer is required.

Proposed commands for Phase 1 are:

```sh
npm ci                  # reproducible dependency installation
npm run dev             # watched, unminified skin build
npm run build           # clean, minified dist/akio output
npm run lint            # HTML/template, CSS, JS and repository checks
npm run test            # unit/integration checks that do not need a browser
npm run test:a11y       # browser accessibility smoke suite against a fixture
```

Build inputs will be pinned by a committed lockfile. Builds will avoid embedded
timestamps, normalize file ordering, and clean `dist/` first.

## Branding and configuration

Brand values have different owners:

- `product_name` and `skin_logo` remain administrator-owned Roundcube config;
- `skin_logo` variants cover login, small, dark, small-dark, favicon, and print;
- default neutral logo/favicon assets ship in the skin and can be replaced;
- colors are centralized CSS custom properties, with a documented optional
  post-build branding override stylesheet;
- `meta.json` supplies supported metadata/link declarations such as viewport,
  theme colors, icons, and an optional manifest.

No domain inspection or provider-specific behavior will be added. Per-domain
branding is deferred: it needs deployment configuration or a well-scoped plugin,
not hostname conditionals scattered through skin JavaScript.

## Theme architecture

Akio supports `light`, `dark`, and `system`. A first-party, same-origin cookie
stores an explicit value because theme choice is needed before login and the
skin alone has no supported server preference field. `system` is the default
and follows `prefers-color-scheme`; a media-query listener updates open views.
A small synchronous local head script applies the mode before CSS paint, and
same-origin frame documents run the same initialization. Both schemes have
independently selected tokens, including browser `color-scheme` and theme-color.

This is intentionally presentation state, not a monkey-patch. A later optional
plugin could persist the preference in Roundcube settings, but the skin cannot
add a stored server preference by itself.

## Security boundaries

- Message bodies continue to come from Roundcube's `messageBody` object.
- HTML sanitization, blocked remote objects, safe-image prompts, attachment
  validation, and content security policy are never bypassed.
- The message-body frame is retained. CSS may improve its surrounding surface
  and same-origin skin chrome, but arbitrary email markup is not rewritten.
- Login inputs and full-address usernames remain Roundcube configuration and
  form behavior; the skin changes presentation and labels only.
- No third-party request, telemetry, analytics, CDN, service worker mail cache,
  IMAP/SMTP code, or credential storage is allowed.

## Plugin strategy

Plugins can add template content through containers and hooks, and can provide
their own skin-specific templates/assets. Akio will preserve all core
containers and use generic, low-specificity form/table/menu styles so unknown
plugins remain operable. `plugins/<name>/` adapters will be added for bundled
plugins whose Elastic-specific output needs layout work, beginning with archive,
markasjunk, managesieve, password, enigma, and jqueryui integrations.

Adapters change presentation only. A companion plugin is justified only for a
server-side capability using a documented hook such as `preferences_list`,
`preferences_save`, `render_page`, `template_object_*`, or
`template_container`; it will be versioned and installed separately.

## Upgrade strategy

For every supported Roundcube release:

1. review release and security notes;
2. diff the upstream Elastic template inventory and documented markup objects;
3. diff stable IDs, object names, commands, containers, and UI events used by
   Akio against the new tag;
4. run the compatibility and plugin matrices on the new version;
5. document any fallback to Elastic and either adopt the new contract or hold
   the supported-version ceiling;
6. publish a skin release with an explicit Roundcube version range.

Security updates to Roundcube remain independently deployable because the skin
does not patch core. Administrators should never delay a Roundcube security
upgrade merely to retain styling; unsupported combinations should fall back to
Elastic until qualified.

## Sources inspected

- [Roundcube 1.7.4 release][release]
- [Roundcube Skins wiki][skins]
- [Roundcube Skin Markup wiki][markup]
- [Elastic skin, 1.7.4][elastic]
- [Roundcube plugin hooks documentation][hooks]
- [Official Roundcube Docker image documentation][docker]

[release]: https://github.com/roundcube/roundcubemail/releases/tag/1.7.4
[skins]: https://github.com/roundcube/roundcubemail/wiki/Skins
[markup]: https://github.com/roundcube/roundcubemail/wiki/Skin-Markup
[elastic]: https://github.com/roundcube/roundcubemail/tree/1.7.4/skins/elastic
[hooks]: https://github.com/roundcube/roundcubemail/wiki/Plugin-Hooks
[docker]: https://github.com/roundcube/roundcubemail-docker
