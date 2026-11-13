---
name: deliverable-prototype
description: Produces or updates the clickable prototype of a ShipItRight project (vanilla HTML, CSS and JS, static, no build, fictitious data, proto-bar, one screen per SCR-xx of the UX spec), from the starter kit. Use in phase P2 by the UX/UI Designer, or by the Frontend dev as backup, to create the prototype, add a screen or a state, or correct the prototype after feedback from G1.
allowed-tools:
  - "Bash(cp -R ${CLAUDE_PLUGIN_ROOT}/skills/deliverable-prototype/starter/ *)"
  - "Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js *)"
  - "Bash(mkdir prototype/ds)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: prototype

The prototype is the **clickable version of the UX/UI spec**. The PO presents it to the human at gate
G1: it is often the first time the business sees the product. It must therefore cover the main
journeys with credible data, and stay simple enough to be corrected in a few minutes after feedback.

- **Author**: UX/UI Designer. **Contributor**: Frontend dev.
- **Phase**: P2, at the same time as the UX/UI spec. Goes through gate **G1**, validated by the human.
- **Folder**: `prototype/`.
- **Starter kit**: [`starter/`](starter/) (`index.html`, `styles.css`, `data.js`, `app.js`,
  `README.md`), to copy then adapt.

No `template.html` here: `check-deliverable.mjs` does not apply to the prototype. The check is done
with the checklist of the "Delivering" section.

## Example

`${CLAUDE_PLUGIN_ROOT}/team/examples/formats/prototype/`: the prototype of the "Réservation de salles"
(room booking) pilot, 7 screens, 4 dialogs, planning grid, simulated login, responsive. It follows this
skill and serves as the reference.

## Inputs to read

1. `.team/foundation.md`, then the design system foundation: "Prototype" section (files to copy into
   `ds/`, components usable as is), components, tone, formats.
2. `docs/20-ux/ux-ui-spec.html`: applied design system, wireflow, inventory of the `SCR-xx` screens,
   states, dialogs, messages `MSG-xx` and `MSG-Uxx`, formats specific to the product.
3. `docs/20-specs/story-map.html`: journeys of the MVP release, to cover first.
4. `docs/20-specs/functional-design.html`: roles and permissions (profiles of the bar), rules `BR-xx`
   that change the display, messages word for word.
5. The skill `shipitright:proto-bar` (`${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/SKILL.md`): wiring of the
   bar and contract of the three states.

## Starting

```sh
cp -R ${CLAUDE_PLUGIN_ROOT}/skills/deliverable-prototype/starter/ prototype/
cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js prototype/
mkdir prototype/ds
```

One command per Bash call. Then copy into `ds/` the files that the "Prototype" section of the design
system foundation names: Read each file, then Write it into `prototype/ds/`.

Copy `proto-bar.js` as is, never edit it nor override its `.pb-*` classes. Then replace `PROJECT_NAME`
and the prefix `projectname.` everywhere, and replace the example screens (`SCR-01` to `SCR-03`) by
those of the spec.

**Language**: read the project language in `.team/project.json` (`language`, `en` without this file)
and copy it into `PROTO.lang` (`app.js`, passed to `ProtoBar.mount`) and into `<html lang="…">`
(`index.html`). All the visible text of the prototype is written in that language; the example texts
of the kit are in English and get replaced. For a language other than `fr` and `en`, also pass
`labels` to the bar (skill `shipitright:proto-bar`). The formats (`fmtDate`, `fmtMoney`) follow the
design system and the language.

The kit already provides:

- the loading of `ds/tokens.css` and `ds/proto-alias.css`, styles without hard-coded values,
  responsive;
- the central state `S`, one render function per screen, registered in the `SCREENS` registry;
- hash routing with an id and named parameters: `#SCR-03/D-1001?from=SCR-01`, read by `params()`,
  written by `go(screen, id, { from: 'SCR-01' })`, to prefill a screen;
- the **permission guard**: a screen declared `right: 'edit'` in `SCREENS`, opened by URL without that
  right, sends back home with its message (`denied: 'MSG-Uxx'`) as a banner;
- the **dialog pattern**: `DIALOGS` registry keyed by the anchor of the spec (`SCR-02-delete`), opened
  from a button (`data-action="open-dialog"`), non-destructive default button (`data-autofocus`), Esc
  and an outside click close it, focus trapped, focus returned to the button;
- the messages `MESSAGES` by identifier and the labels `LABELS` (dialog titles, texts with a variable
  part), filled by `msg('MSG-04', { n, total })` and `label(...)`;
- the three states of the bar, an empty state, a profile without the edit right, a one-shot banner,
  a toast, prefixed `localStorage` persistence;
- a table that turns into one card per row below 768 px (`table.stack`, `td data-label`).

A **simulated login** is not in the kit: if the spec has a login screen, the guard of `render()`
extends to the session (without a session, every page leads to the login screen then back to the
page requested). The example `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/prototype/` shows it.

## Content

| Element | Level | What we expect |
|---|---|---|
| Design system in `ds/` | required | the files that the "Prototype" section of the foundation names (`tokens.css`, `proto-alias.css`, components if any), copied as is; no colour, font or spacing value in `styles.css` |
| `proto-bar` bar | required | copied from the skill `shipitright:proto-bar`, mounted at startup with title, version, date, project language and prefix |
| Main journeys | required | every journey of the MVP release of the story map, navigable end to end |
| One screen per `SCR-xx` | required | each screen of the inventory of the UX spec, with its id in the code and in the URL; the dialogs of the spec open from their screen, with the same actions as the wireflow |
| Three states | required | nominal, loading (skeletons in place of the content), error (named cause and `Retry`) on each screen that displays data |
| Responsive | required | each screen and each dialog usable from 390 to 1280 px and beyond, without horizontal scrolling of the page; breakpoints of the DS; a wide component (table, planning) scrolls in its own `.scroll-x` frame; behaviours specific to the product described in the UX spec (Additions and deviations) |
| Fictitious data | required | all in `data.js`, credible, no real data |
| `README.md` | required | how to run, what the bar shows, table of screens and states covered with their stories, known limits |
| Profiles and roles | recommended | a `Profile` setting in the bar, one profile per role of the permissions matrix |
| Empty states | recommended | `Data` setting (with / none) or equivalent, message word for word from the spec |
| Variants | recommended | `Variant` setting when the spec hesitates between two solutions to be settled at G1 |
| Insufficient permissions | recommended | what a profile without the right sees (hidden, disabled, message) |
| Guided tour | optional | commented journey for the G1 demo, button in the bar |

## Rules to keep it quick to change

- **Data separate from rendering.** Profiles, objects, statuses and messages live in `data.js`. A
  label or a figure is changed in one place.
- **Each screen is a render function** `renderSCR01()`, registered in the `SCREENS` registry under its
  key `'SCR-01'`. Adding a screen: one function, one line in `SCREENS`, one line in the README. Each
  dialog is an entry of `DIALOGS` under the anchor the spec gives it.
- **The `SCR-xx` identifiers are in the code** (registry, comment of the function, hash):
  `grep SCR-04` finds everything about the screen.
- **No framework, no build, no dependency** apart from the Inter font from Google Fonts. All paths are
  relative: the folder opens as is or is published on GitHub Pages.
- **Events delegated on `document`** (`data-go`, `data-action`): rendering replaces the HTML without
  rewiring listeners.
- **Every `localStorage` key carries the prefix** passed to `ProtoBar.mount`, otherwise "Reset
  prototype" does not reset the demo.
- **The design system comes from the foundation, never from the prototype.** `ds/` is copied as is;
  `styles.css` only holds the layout and uses the variables of `ds/proto-alias.css`. A component that
  the DS provides is used as is; the classes of the kit (`.btn`, `.table`, `.tag`) are only stand-ins.
- **Labels are those of the spec, word for word.** Messages live in `MESSAGES`, under their identifier
  (`'MSG-01'`, `'MSG-U03'`). A missing text is asked to the UX or the BA, it is not invented in the
  prototype.
- **Formats are those of the DS**: adapt `fmtDate` and the other helpers to the formats of the
  foundation.
- **Always responsive.** The prototype is designed for every width from the first screen, not as a
  catch-up: fluid grids, the navigation wraps below 1024 px, a single column below 768 px.
- **Nothing of the bar in the product**: `sticky` elements use `top: var(--proto-bar-h)`, overlays
  start under the bar (`inset: var(--proto-bar-h) 0 0 0`).

## Delivering

1. Open `prototype/index.html` (or `python3 -m http.server` in the folder) and run through each MVP
   journey end to end.
2. Checklist:
   - the bar shows, each specific setting acts on the screen;
   - each `SCR-xx` of the spec is reachable and renders its three states;
   - "Reset prototype" brings back the initial state;
   - no error in the console, `node --check` passes on each `.js`;
   - responsive: at 390, 768, 1024 and 1280 px, each screen and each dialog displays without
     horizontal scrolling of the page (`document.documentElement.scrollWidth` equal to the width);
   - no hard-coded value in `styles.css`: `grep -E '#[0-9a-fA-F]{3,6}\b|[0-9]+px' styles.css` only
     finds layout dimensions;
   - the README lists the screens and states covered, and the gaps with the spec.
3. Increment `version` and `date` in `app.js` (constant `PROTO`) at each delivery.
4. Capture each screen in the nominal state for the thumbnails of the UX spec
   (`docs/20-ux/screenshots/SCR-xx-nominal.png`, 1280 × 800 at the 16:10 ratio of the thumbnails,
   cropped under the bar), update the "Link to the prototype" section of the spec, and tell the PO
   that the prototype is ready for G1.
