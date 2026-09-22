# Akio Roundcube skin

Akio is a provider-neutral, accessible skin for Roundcube Webmail. This
repository contains only the skin and its build tooling: it does not fork
Roundcube, implement IMAP/SMTP, or modify Roundcube core.

Phase 3 adds an owned, dense mail workspace and isolated message reader to the
login, navigation, theme, and token foundation. Contacts, Settings, and Composer
remain inherited for later phases. See [`docs/PHASE-3.md`](docs/PHASE-3.md) for
the mail contracts and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the
architecture.

## Requirements

- Node.js 20.19 or newer for development only
- npm (use `npm ci` for the committed dependency graph)
- Roundcube 1.7.4 with its bundled Elastic skin retained

Node, npm, Tailwind, and all other build dependencies are absent from the
installable artifact and are not needed by the web server.

## Develop and validate

```sh
npm ci
npm run fonts:fetch     # optional; builds acquire/verify fonts automatically
npm run build:dev       # one unminified build in build/dev/akio
npm run dev             # rebuild on source changes until Ctrl+C
npm run lint
npm test
```

Open `demo/index.html` through a local web server after `npm run build:dev` to
inspect tokens and basic controls without maintaining a second application. For
example, from the repository root:

```sh
python3 -m http.server 4173
# then open http://localhost:4173/demo/
```

The demo references the development build and is never included in `dist/`.
Actual behavior must still be tested in Roundcube.

## Production build

```sh
npm ci
npm run build
npm run validate
```

The build removes and recreates `dist/akio`, minifies CSS and JavaScript, copies
runtime assets plus release documentation, and writes `SHA256SUMS` in stable path
order. It includes no source maps, Node packages, credentials, or remote runtime
dependencies. `dist/` is generated locally or in CI and is deliberately ignored
by Git; run the production build before installing or publishing the skin.

### Inter acquisition

Inter remains entirely self-hosted by the installed skin and is never fetched by
the browser. The build retrieves two official Inter 4.1 variable WOFF2 files from
URLs pinned to the upstream `v4.1` Git tag. The normal file covers weights 400,
500, and 600; the italic file supplies italic 400.

Expected URLs, output names, styles, weight ranges, and SHA-256 digests live in
`assets/fonts/inter-4.1.json`. `scripts/acquire-fonts.mjs` verifies both cached
and newly downloaded bytes before copying them into `dist/akio/fonts`. A failed
request, missing file, or checksum mismatch stops the build. The ignored cache is
`build/cache/fonts/`. `npm run clean` preserves it while removing generated
development and production output; remove `build/cache/fonts` to force a clean
acquisition.

This separates network-dependent acquisition from local checks: `npm test` and
`npm run lint` require no font download, while `npm run fonts:fetch`,
`npm run build:dev`, and `npm run build` acquire or verify the pinned files.

Lucide SVGs are selected through `src/icons/icons.json`. Use the `ak-icon` class
for inline imagery, set decorative icons to `aria-hidden="true"`, and give every
icon-only control an accessible name. Add an icon to the selection only when a
skin component needs it.

## Install in Roundcube

1. Build the skin or download a release artifact.
2. Copy the generated directory as `<roundcube>/skins/akio`.
3. Keep `<roundcube>/skins/elastic` installed; Phase 1 uses Roundcube's supported
   skin inheritance for templates and behavior it does not yet override.
4. Set the skin in `config/config.inc.php`:

   ```php
   $config['skin'] = 'akio';
   ```

5. Clear browser/proxy caches and sign in. To permit users to choose skins, keep
   `skin` out of Roundcube's `dont_override` setting.

Roundcube's `product_name` and `skin_logo` configuration remain the preferred
branding controls. The neutral defaults in `assets/images/` can also be replaced
before rebuilding. Provide light, dark, small, and small-dark variants when
overriding logos.

## Docker

The official Roundcube image uses `/var/www/html` as the installation root and
`/var/roundcube/config` for additional configuration. Build on the host, then
mount only the generated skin so container/image upgrades are not hidden by a
volume over the whole document root:

```yaml
services:
  roundcube:
    image: roundcube/roundcubemail:1.7.4-apache
    volumes:
      - ./dist/akio:/var/www/html/skins/akio:ro
      - ./roundcube-config:/var/roundcube/config:ro
```

Place a PHP configuration fragment in `./roundcube-config`, for example:

```php
<?php
$config['skin'] = 'akio';
```

For an immutable deployment, copy the built artifact in a derived image instead:

```dockerfile
FROM roundcube/roundcubemail:1.7.4-apache
COPY --chown=www-data:www-data dist/akio /var/www/html/skins/akio
```

Pin the image tag to a version qualified by the compatibility matrix. Docker is
deployment documentation only; it is not part of this repository's runtime.

## Branding and themes

- Set Roundcube's `product_name` for the textual product identity.
- Set `skin_logo` for deployment-specific logos without editing templates.
- Replace the neutral source logo, favicon, and manifest icon under
  `assets/images/` when producing a branded distribution.
- Theme selection is stored in the first-party `akioColorMode` cookie. `system`
  follows `prefers-color-scheme`; explicit light/dark choices override it.
- The account menu provides explicit, localized System, Light, and Dark choices.
  It supports arrow-key navigation, persists to the first-party cookie, follows
  live OS changes in System mode, and updates browser theme metadata.

No theme or asset causes a third-party request.

## Upgrade or rebuild

```sh
git pull --ff-only
npm ci
npm run lint
npm test
npm run build
npm run validate
```

Replace the installed `skins/akio` directory atomically with the rebuilt output,
then clear caches. Before moving to a newer Roundcube series, follow the upstream
inventory and compatibility review in
[`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md). A Roundcube security
update takes priority; select Elastic temporarily if an Akio combination is not
yet qualified.

## Known Phase 3 limitations

- Contacts, Settings, Composer, attachment-part previews, generic includes, and
  plugin-specific templates still inherit Elastic. Akio owns the mail workspace,
  reader, toolbar, shared layout/navigation, and login presentation; Elastic UI
  JavaScript remains the compatibility controller for core behavior.
- The message list intentionally has no fabricated body snippets because
  Roundcube's standard list object exposes envelope metadata rather than safe
  message excerpts.
- Visual browser, assistive-technology, and authenticated-server checks remain a
  release qualification step; static automation does not establish WCAG conformance.
- The PWA manifest supplies metadata and an icon only. There is no service worker
  or offline mail storage.
- Automated checks cover static foundation properties; they do not establish
  WCAG conformance or replace browser/assistive-technology testing.

## License

Akio is licensed under Creative Commons Attribution-ShareAlike 3.0. Third-party
font, icon, and compatibility-scaffold notices are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
