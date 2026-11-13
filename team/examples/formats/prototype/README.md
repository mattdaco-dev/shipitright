# Prototype Réservation de salles

Static clickable prototype of Réservation de salles, MVP release. It illustrates the UX/UI spec
(`docs/20-ux/ux-ui-spec.html`) and the functional design (`docs/20-specs/functional-design.html`).
The data is fictitious. The interface is in French, the project language.

Version v1 of 05.10.2026.

## Run

No dependency, no build. From this folder:

```sh
python3 -m http.server 8765
```

then open http://localhost:8765. Opening `index.html` directly in the browser works too. Only
external resource: the Inter font, loaded from Google Fonts.

The demo always runs on **Monday 05.10.2026 at 10:20** (`NOW` in `data.js`): the past slots of the
day are greyed out, the first start time offered is 10:30.

Fictitious accounts: `lea.martin@example.com` (employee) and `paul.schmit@example.com` (manager), any
non-empty password. Another address, or an empty password, gives the credentials error.

## Design system

The prototype uses the design system of the project: `ds/` holds the files the foundation declares
for the prototype, copied as is. `styles.css` holds no hard-coded color, font or spacing, only the
layout and the variables of `ds/proto-alias.css`.

- Foundation: `reservation-salles` v0.1 of 05.10.2026 (`foundations/design-systems/reservation-salles/`).
- Files copied into `ds/`: `tokens.css`, `proto-alias.css`.
- DS components used as is: none, the foundation ships no implementation. Kit stand-ins, named as in
  the DS: navigation bar, button (primary, secondary, destructive), field, drop-down list, date picker
  (days that can be disabled, input DD.MM.YYYY), table, dialog, message banner, skeleton.
- Additions of the spec: occupancy grid (SCR-02), its list of free slots below 768 px, « Série »
  badge (SCR-05).

## What it shows

The black bar at the top drives the demo. It is not part of the product: it is the shared component
`proto-bar.js` (skill `proto-bar`, v2.0.0), copied as is, never modified here.

- **Profil**: Employé (Léa Martin) or Gestionnaire (Paul Schmit). The manager also gets the
  « Parc de salles » entry (SCR-06, SCR-07) and « Annuler avec un motif » in the tooltip of a
  reservation (SCR-02). Switching to Employé on SCR-06 or SCR-07 sends back to SCR-02 with MSG-U10.
- **Données**: with or without data, to see the empty states (SCR-02, SCR-03, SCR-05, SCR-06).
- **Serveur**: « Refuse » makes the server refuse the submission of SCR-04 (out-of-rules state,
  MSG-03), the case no picker lets you produce.
- **States**: nominal, loading (skeletons; inactive forms with an indicator in the button), error
  (message that names the cause, and `Réessayer`).
- **Reset the proto**: clears the saved changes, the session and the settings.

## Flows to walk through at G1

1. **FL-01** Log in as Léa, click a free slot of the grid, « Réserver »: banner MSG-02 on SCR-05.
   For the conflict (MSG-01): in SCR-04, pick Alzette at 14:30, booked by Tom Hoffmann.
2. **FL-02, example of CALC-01**: SCR-04 on Moselle, Tuesday 06.10.2026 from 10:00 to 11:00,
   « Chaque semaine » until 29.12.2026: 13 occurrences, 20.10 is taken, the dialog offers to create
   the 12 free ones.
3. **FL-03**: SCR-05, « Annuler » on the Wednesday series (Sûre): choice between occurrence and
   series. Today's 10:00 reservation (Alzette) has started: no « Annuler » button (BR-03).
4. **FL-04**: Gestionnaire profile. Tooltip of a reservation, « Annuler avec un motif »; SCR-06,
   « Désactiver » a room (announces the number of future reservations cancelled, MSG-06); SCR-07,
   name already taken (« Our »). Léa sees the reason on SCR-05 (MSG-05).

## Screens and states covered

| Screen | Access | States covered | Stories |
|---|---|---|---|
| SCR-01 Connexion | `#SCR-01` | nominal, loading, credentials error (MSG-U01), return to the page asked | US-001 |
| SCR-02 Occupation du jour | `#SCR-02/day=YYYY-MM-DD&room=<id>` | nominal, filter on one room, weekend, past day, empty (MSG-U02), loading, error (MSG-U03), rights (no cancellation for the employee); dialog `SCR-02-motif` | US-002, US-003, US-017 |
| SCR-03 Recherche de salle | `#SCR-03/day=YYYY-MM-DD` | nominal, no result (MSG-U04), loading, error (MSG-U05) | US-004 |
| SCR-04 Réservation | `#SCR-04/room=<id>&day=…&start=HH:MM` | nominal, series with summary, conflict (MSG-01), out of rules (MSG-03), « Jusqu'au » more than 3 months ahead, saving, error (MSG-U06); dialog `SCR-04-conflits` (MSG-04) | US-005, US-006 |
| SCR-05 Mes réservations | `#SCR-05` | nominal, confirmation (MSG-02), series, cancelled with a reason (MSG-05), started without « Annuler », empty (MSG-U07), loading, error (MSG-U08); dialog `SCR-05-annuler` | US-007, US-008, US-009 |
| SCR-06 Parc de salles | `#SCR-06` | nominal, room disabled (MSG-06), empty (MSG-U02), loading, error (MSG-U09), insufficient rights (MSG-U10); dialog `SCR-06-desactiver` | US-014, US-015, US-016 |
| SCR-07 Fiche salle | `#SCR-07` (new), `#SCR-07/<id>` | nominal empty or prefilled, name already taken (BR-10), loading, error (MSG-U11), insufficient rights (MSG-U10) | US-014, US-015 |

Visible rules: BR-01 (conflict on submission, 10:00 and 10:00 do not overlap), BR-02 and BR-03
(lists by quarter hour from 08:00 to 19:00, 4 hours at most, calendar without past days or weekends,
past slots greyed out), BR-04 and CALC-01 (daily or weekly series, 3 months at most), BR-05
(conflicts dialog), BR-06 (occurrence or series), BR-07 (reason required), BR-08 (disabled room off
the grid, future reservations cancelled, the current one kept), BR-09 (search), BR-10 (unique name
among active rooms), BR-11 (only the holder and the manager cancel).

Keyboard in the grid: the arrows move by one slot, « Entrée » opens the slot or the tooltip,
« Échap » closes the tooltip, the calendar and the dialog.

Changes are kept in the browser `localStorage`, under the prefix `resasalles.`.

## Deviations from the spec

- Two texts of the spec have no identifier: the announcement of the disable dialog and « Une salle
  active porte déjà ce nom. ». They are in `MESSAGES` under the anchor of the spec
  (`SCR-06-desactiver`, `SCR-07-nom`).
- With no text in the spec, these fields are only flagged invalid (border, `aria-invalid`): day typed
  out of rules (SCR-04, SCR-03), « Jusqu'au » beyond 3 months, empty name and capacity outside 1 to
  200 (SCR-07).
- Demo additions, outside the product: the note on fictitious accounts under the SCR-01 form, the
  legend under the occupancy grid.
- The title of SCR-07 is « Fiche salle » for creation and for editing, since the spec gives no title.
- A room without equipment shows « aucun ».

## Files

| File | Role |
|---|---|
| `index.html` | Page and application chrome |
| `proto-bar.js` | Prototype bar, copy of the shared component |
| `ds/` | Design system files, copied from the foundation |
| `styles.css` | Layout, from the variables of `ds/proto-alias.css` |
| `data.js` | Simulated clock, rules, profiles, rooms, reservations, messages (`MSG-xx`, `MSG-Uxx`) |
| `app.js` | State, hash routing, one render function per screen, dialogs, simplified rules |

## Known limits

- No server: the conflict is checked in the browser, without concurrency (Q-001).
- Bank holidays are not excluded from series (assumption of CALC-01, Q-005).
- No change to a reservation (US-011, release R2) and no reactivation of a room (Q-004).
- Date and time are frozen: nothing "passes" during the demo.
- The loading and error states of the bar apply to the whole current screen; on SCR-02, the day
  picker stays active, as the spec says.
