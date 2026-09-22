# Phase 2: login and application shell

## Owned templates and compatibility

`templates/login.html` replaces Elastic 1.7.4 `templates/login.html`. It retains
the `logo`, `productname`, and `loginform` objects; `login-form` ID/name, POST
method, submit behavior, message stack (through the inherited-shape footer),
no-script warning, and `loginfooter` plugin container. Product identity remains
administrator-replaceable through Roundcube's `product_name` and `skin_logo`.
The information footer is intentionally removed; plugin footer output remains.

`templates/includes/menu.html` replaces Elastic 1.7.4's matching include. It
retains `layout-menu`, `taskmenu`, `logo`, core compose/mail/addressbook/settings/
logout commands, selected classes, FAB data, the about action, mobile close
control, and the `taskbar` plugin container. It replaces Elastic's blind binary
theme toggle with a native-details account popover containing three radio-style
choices. No mail command or authenticated endpoint is reimplemented.

`templates/includes/footer.html` is the minimal Elastic 1.7.4 compatibility
footer retained locally so every owned page closes the conditional layout,
preserves the hidden support target and `messagestack`, and loads Bootstrap and
Elastic's `ui.js` in their required order.

The complete `mail.html` remains inherited deliberately. Consequently its
`mailboxlist`, message/search objects, content frame, GUI IDs, drag/drop targets,
folder/list action menus, and plugin containers stay byte-for-byte upstream.
Akio styles those stable regions and supplies the menu include. Contacts,
Settings, Composer, message content, error/dialog, and plugin-specific templates
also remain Elastic dependencies until their planned phases.

## Shell and responsive behavior

The desktop shell uses Elastic's proven four-region controller while presenting
the first region as a compact product rail, the sidebar as the folder/context
pane, and the remaining inherited regions as workspace. The folder list keeps
dynamic localized IMAP names, nesting, counters, selection, drag/drop, and
actions; CSS truncates only visually, without changing accessible text.

At normal widths spacing and pane bases contract before any functionality is
removed. Below 48rem, Elastic's existing single-workspace/drawer controller is
retained, touch targets remain 44 CSS pixels, and the account popover becomes a
viewport-edge sheet. This avoids maintaining a competing navigation state
machine.

## Theme, localization, and accessibility

The chooser uses `menuitemradio` states with localized System, Light, Dark, and
Appearance labels. Click/Enter/Space selection persists `akioColorMode`; System
tracks live `prefers-color-scheme`, all choices update `theme-color`, and the
synchronous head script prevents initial mismatch. Arrow keys move among theme
choices. Escape closes the popover and restores focus; click-away closes it.

Landmarks, visible labels, localized accessible names, native form submission,
`:focus-visible`, non-color selected indicators, reduced-motion handling,
forced-color borders, and minimum touch targets are included. The login object
continues to own field names, autocomplete behavior, CSRF data, errors, disabled
state, and authentication. WCAG 2.2 AA is the design target, not a certification.

## Qualification and known limitations

Automated checks cover template contracts, localization, theme behavior source,
contrast tokens, external resources, tracked binaries, deterministic production
output, and installable contents. The official Roundcube 1.7.4 complete package
is used for upstream contract comparison and source-level smoke validation.

A configured mail server and browser/assistive-technology environment are still
required to manually qualify authentication errors, authenticated folder data,
plugin additions, keyboard reading order, 200% zoom, standalone display, and the
full viewport/browser matrix. These checks must not be inferred from unit tests.
