# Akio static UI showcase

This development-only showcase provides inert fixtures for visually reviewing
Akio without PHP, Roundcube, authentication, a database, or mail services.

## Run

From the repository root:

```sh
npm run preview
```

Then open <http://localhost:4173/preview/>. The command first creates the same
development skin build used by the existing demo in `build/dev/akio`, then
serves the repository with Python's standard static server. Set `PORT` or
`PYTHON` to override the defaults. Stop it with Ctrl+C.

Use browser responsive mode to check approximately 375, 390 (modern iPhone),
768, 1024, and 1440 CSS pixels. Every form and action is intentionally inert.

## Production assets and fixture CSS

Each fixture loads the generated production entrypoint
`../build/dev/akio/styles/akio.css`, the generated theme script, and images from
the generated skin. There is no copied Akio stylesheet and no remote/CDN asset.
The preview directory is excluded from `dist/akio`.

`preview.css` is explicitly fixture infrastructure: it supplies the structural
shell normally provided by Elastic's compiled baseline. Component colors,
controls, tokens, focus treatment, and Akio overrides continue to come from the
real skin CSS. Standalone fixtures contain no preview toolbar, so the Roundcube
viewport is not reduced or visually contaminated during responsive review.

## Fidelity and limitations

The login fixture closely follows Roundcube 1.7.4's `login.html`, generated
login table, and Elastic's runtime input-group transformation. Application
fixtures preserve the important Elastic IDs and conventions (`#layout`,
`#layout-menu`, `#layout-sidebar`, `#layout-list`, `#layout-content`, headers,
toolbars, scrollers, listings, popup menus, and dialogs).

Message rows, contact details, compose fields, settings fields, menus, modal
content, and responsive panel visibility are static approximations. Roundcube
normally generates and changes them through PHP, plugins, and Elastic UI
JavaScript; comments in the fixtures identify these approximation regions.

This showcase validates visual presentation only. It cannot validate:

- Roundcube PHP/runtime behavior or unrepresented server-generated markup;
- authentication, sessions, or database integration;
- IMAP/SMTP connectivity or any mail operation;
- plugin behavior or backend-driven JavaScript behavior;
- final browser behavior inside a real Roundcube installation.
