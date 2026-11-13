# Prototype PROJECT_NAME

Static clickable prototype of PROJECT_NAME. It illustrates the UX/UI spec
(`docs/20-ux/ux-ui-spec.html`) and the functional design
(`docs/20-specs/functional-design.html`). The data is fictitious.

## Running

No dependency nor build. From this folder:

```sh
python3 -m http.server 8765
```

then open http://localhost:8765. Opening `index.html` directly in the browser works too. Only
external resource: the font, loaded from Google Fonts if the design system takes it from there.

## Design system

The prototype takes over the design system of the project (`.team/foundation.md`): `ds/` holds the
files that the foundation declares for the prototype, copied as is. `styles.css` holds no value, only
the layout and aliases to the tokens of the DS.

- Foundation: <name and version of the DS>
- Files copied into `ds/`: <list>
- DS components used as is: <list>; stand-ins of the kit: <list>

## What it shows

The black bar at the top drives the demo. It is not part of the product: it is the shared component
`proto-bar.js` (skill `shipitright:proto-bar`), copied as is, never edited here.

- **Profile**: <list of the profiles and what changes for each>.
- **Data**: with or without data, to see the empty states.
- **States**: nominal, loading (skeletons), error (message and `Retry`).
- **Reset prototype**: clears the saved changes and goes back to the initial state.

## Screens and states covered

| Screen | Access | States covered | Stories |
|---|---|---|---|
| SCR-01 List | `#SCR-01` | nominal, empty, loading, error | US-xxx |
| SCR-02 Detail | `#SCR-02/<id>` | nominal, not found, insufficient permissions, loading, error; dialog SCR-02-delete | US-xxx |
| SCR-03 Form | `#SCR-03/<id>?from=<screen>` | nominal, required field empty, insufficient permissions (redirect and banner), loading, error | US-xxx |

Changes are kept in the browser's `localStorage`, under the prefix `projectname.`.

## Widths checked

390, 768, 1024 and 1280 px: no horizontal scrolling of the page. <behaviours specific to the product>

## Files

| File | Role |
|---|---|
| `index.html` | Page and chrome of the application |
| `proto-bar.js` | Prototype bar, copy of the shared component |
| `ds/` | Design system files, copied from the foundation |
| `styles.css` | Layout and aliases to the DS tokens |
| `data.js` | Profiles, statuses, fictitious data, messages by identifier (`MSG-xx`, `MSG-Uxx`), labels `LABELS` |
| `app.js` | State, hash routing, permission guard, one render function per screen, dialogs |

## Known limits

- <what the prototype does not show, or simulates without business calculation>
