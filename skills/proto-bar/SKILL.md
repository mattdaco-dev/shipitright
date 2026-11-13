---
name: proto-bar
description: Adds to an HTML prototype of a ShipItRight project the prototype control bar, always identical (black background, yellow border, PROTOTYPE tag, nominal, loading and error states, reset, labels in the project language), plus the prototype's own settings (layout, profile, variant…). Use when creating, changing or updating an HTML prototype or a clickable mockup, unless the user refused the bar for that prototype, or when the user says "prototype", "HTML proto", "clickable proto", "proto bar", "proto-bar". Not for a demo page that is not a product prototype.
allowed-tools:
  - "Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js *)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

Goal: **every HTML prototype looks the same through its control bar**, whatever session produces
it. Only the prototype's own settings change, the rest is fixed.

The bar does not belong to the mocked product: it drives the demo (switch profile, layout, state).
It must therefore stand clearly apart from the interface shown, which its style, deliberately outside
any design system, guarantees.

**When to add it**: to a product prototype (mocked screens, clickable flow). Not to an HTML page
that is not one (report, export site, technical demo of a library), nor to a prototype for which the
user said they did not want it: that refusal holds for the rest of that prototype, do not offer it
again at each change.

## 1. Copy the file, never rewrite it

The component is a single self-contained file, CSS included:
`${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js`, next to this `SKILL.md`. The ShipItRight
plugin is its source.

```sh
cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js prototype/
```

- **Copy it as is** into the prototype folder (at the prototype root or in `assets/`). No link to
  the plugin: a prototype must stay self-contained, for instance to be published as is on static
  hosting (GitHub Pages is the usual case).
- **Never change the copy**, nor override its `.pb-*` classes from the prototype CSS. If the bar
  must evolve, propose it to the ShipItRight repository, which changes this file and bumps the
  version in its header; then copy it again into the prototypes concerned.
- No "hand-made" reimplementation of a lookalike bar: that is exactly what this skill avoids.

## 2. Wire the bar

Load the script **before** the prototype's script, then call `ProtoBar.mount()` at startup.
`mount()` needs `document.body`: called earlier (script in the `<head>`), it waits for
`DOMContentLoaded` to show.

```html
<script src="proto-bar.js"></script>
<script src="app.js"></script>
```

```js
ProtoBar.mount({
  title: 'Room booking, target design',  // prototype name
  version: 'v1',                          // prototype version, bumped at each delivery
  date: '2026-09-29',                     // version date, as YYYY-MM-DD
  lang: 'en',                             // project language, BCP 47 code (.team/project.json); 'en' by default
  labels: { mock: 'mock data' },          // optional: fixed labels given or overridden
  dateFormat: 'dd.mm.yyyy',               // optional: 'dd/mm/yyyy', 'dd.mm.yyyy' or 'yyyy-mm-dd'
  storagePrefix: 'booking.',              // localStorage keys cleared by the reset
  onState: (state) => render(),           // 'ok' | 'loading' | 'error'
  onReset: () => location.reload(),       // optional, this is the default
  controls: [
    { type: 'seg', id: 'layout', label: 'Layout', value: 'new',
      options: [['old', 'Old'], ['new', 'New']], onChange: (v) => setLayout(v) },
    { type: 'select', id: 'profile', label: 'Profile', value: 'member',
      groups: [{ label: 'Internal', options: [['member', 'Employee'], ['facility', 'Facility manager']] },
               { label: 'External', options: [['guest', 'Guest']] }],
      onChange: (v) => setProfile(v) },
    { type: 'button', id: 'tour', label: 'Replay the demo', onClick: () => startTour() },
  ],
});
```

- `lang` is the project language, read from `.team/project.json` (`language`, `en` without that
  file): any BCP 47 code (`fr`, `en`, `de`, `pt-BR`). It switches every fixed label of the bar
  ("mock data", "Settings", "States" and its three values, "Reset prototype", accessibility label).
- Built-in labels: `fr` and `en` (a variant takes those of its base language: `fr-LU` takes `fr`).
  `labels` gives or overrides labels, by key: `tag`, `mock`, `settings`, `states`, `ok`, `loading`,
  `error`, `reset`, `region`. **For another language, `labels` is required**, translated from
  `.team/labels.json` or by the PO; without it, the bar takes the English labels and logs a console
  warning listing the missing keys.
- `dateFormat` defaults to the short format of the language, given by `Intl.DateTimeFormat`
  (`05/10/2026` in `fr`, `10/05/2026` in `en`). Set it when the design system imposes a format
  (`dd.mm.yyyy` for projects that use it). An unknown `dateFormat` value or an invalid language code
  is ignored with a console warning, and the default applies.
- `ProtoBar.set(id, value)` resyncs a setting when the prototype changes it itself, without calling
  its `onChange`. If `mount()` is still waiting for `DOMContentLoaded` (script loaded in the
  `<head>`), `set` calls are queued and replayed, in order, as soon as the bar is mounted.
- The state selector is a setting like the others, with the reserved key `__state`:
  `ProtoBar.set('__state', 'error')` updates the selector and `ProtoBar.state`, **without** calling
  `onState` (a prototype that changes state itself does its own rendering).
- `ProtoBar.state` gives the current state.
- Calling `mount()` again replaces the bar (listeners and observer included, no duplicate) and
  resets the state to `ok` **without** calling `onState`: the prototype redoes its nominal rendering
  if it needs to. Values chosen in the settings are kept: the bar writes them into the `opts` passed
  (`def.value` is changed), so mounting again with the same `opts` finds the current choices. To
  start from the initial values, pass new `opts`.
- The bar carries the `data-proto-bar` attribute: on mount, only a previous bar carrying it is
  removed, never a prototype element that would use the `.pb` class.
- The bar is **always 56 px** high, at every width, and stays sticky at the top. It exposes that
  height in `--proto-bar-h`: use it to offset the prototype's `sticky` elements
  (`top: var(--proto-bar-h)`), never a hard-coded value.
- The bar sits above everything (`z-index: 2147483647`, the maximum). The **prototype's overlays**
  (modals, side panels, backdrops) must therefore **start below it**: `inset: var(--proto-bar-h) 0 0 0`
  instead of `inset: 0`, otherwise their header and close button slide under it.

Each prototype screen carries its `SCR-xx` identifier (container id or route `#SCR-xx`), the one from
the UX/UI spec (skill `shipitright:deliverable-ux-ui-spec`).

## 3. What is fixed, what is free

**Fixed, present in every bar, in this order** (English labels below, in the language of `lang`
otherwise):

1. the **PROTOTYPE** tag, the title, then "mock data · version · date";
2. the prototype's **own settings**;
3. the **States: Nominal / Loading / Error** selector;
4. the **Reset prototype** button, always last.

**Free:** the list of own settings (`seg` for 2 to 4 choices, `select` beyond, `button` for a
one-off action). Short labels, in the prototype language (the same as `lang`), one name per setting
("Profile", "Layout", "Variant", "Alerts").

## 4. The three states are a contract

The state selector is always there, so **the prototype must render them**:

- **Loading**: skeletons in place of, and at the height of, the expected content;
- **Error**: an error message that names the cause and offers a way out (`Retry`). If the screen is
  made of independent blocks, fail only some of them, to show that one block's error does not take
  the others down;
- **Nominal**: the normal screen.

A prototype that does not have its states yet still handles them: at least a global skeleton and a
global error message, rather than a selector that does nothing.

## 5. Reset

"Reset prototype" clears the `localStorage` keys that start with `storagePrefix`, then calls
`onReset` (page reload by default). **Without `storagePrefix`, nothing is cleared** (the bar logs a
console warning): give it as soon as the prototype stores anything. Prefix **all** the prototype's
keys, so that a reset truly restarts the demo without touching other prototypes served from the
same domain.

## 6. Narrow width

The bar never wraps. When the settings no longer fit next to the title, they move one by one,
**starting from the end**, into a drop-down menu opened by the **Settings** button; the order of
section 3 is kept between the bar and the menu. Below 900 px, the "mock data · version · date" line
disappears and the title is truncated. The menu closes with Escape or a click outside. Nothing to do
on the prototype side.

## 7. Check

Before delivering the prototype:

- the bar shows at the top, identical to other prototypes (same file, same version), in the
  prototype language;
- each own setting acts on the screen;
- the three states render something visible;
- "Reset prototype" brings back the initial state;
- at 390 px, the bar is 56 px high and the Settings button does unfold the settings.
