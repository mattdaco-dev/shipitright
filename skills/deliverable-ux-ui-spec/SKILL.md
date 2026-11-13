---
name: deliverable-ux-ui-spec
description: Produces or updates the "UX/UI specifications" deliverable of a ShipItRight project (UX principles, applied design system, journeys as a wireflow, inventory of the screens SCR-xx with their states, screen details and interface messages MSG-Uxx, formats specific to the product, accessibility), as an HTML page from the template. Use in phase P2 by the UX/UI Designer, in tandem with the prototype, or when a screen must be added or corrected after feedback from G1.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: UX/UI specifications

The UX/UI spec describes **each screen** of the product: what it shows, what one can do on it, how it
behaves in all its states. The Frontend dev codes from it, QA takes the exact labels from it, the
prototype is its clickable version.

- **Author**: UX/UI Designer. **Contributor**: BA (rules and messages).
- **Phase**: P2, at the same time as the prototype. Goes through gate **G1**, validated by the human.
- **File**: `docs/20-ux/ux-ui-spec.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-ux-ui-spec/template.html` with Read, then writing it to its
  place in the project with Write.

## Inputs to read

1. `.team/foundation.md`, then the design system foundation it declares
   (`.team/foundations/design-systems/<name>/`, and the source it points to): "By role" part,
   components, tone, formats, accessibility. No design system declared: create a minimal one before
   the spec (see below).
2. `docs/00-framing/framing.html`: personas, constraints (accessibility, brand guidelines, devices).
3. `docs/20-specs/story-map.html`: journeys and stories of the MVP release.
4. `docs/20-specs/functional-design.html`: functional flows, rules `BR-xx`, roles and permissions,
   messages word for word.
5. `docs/20-specs/stories/`: the acceptance criteria that touch the screen.
6. `prototype/` if it exists: the spec and the prototype must stay aligned.

## Content

| Section | Level | What we expect |
|---|---|---|
| UX principles | required | 3 to 6 principles specific to the product, each with its concrete consequence on the screens |
| Applied design system | required | the foundation cited (name, version, status), the DS components used and their screens, the additions and deviations specific to the product. Never copied tokens, grid or components |
| User journeys | required | native wireflow (`.pf` with `screen` and `screen dialog` nodes), one diagram per persona, actions as arrow labels, the FL-xx covered in the title |
| Screen inventory | required | one clickable card per screen `SCR-xx`: thumbnail (screenshot of the prototype, hatched otherwise), roles, stories, states covered; story → screens coverage table |
| Screen details | required | for each screen: goal, access, content, actions, display rules, states (nominal, empty, loading, error, insufficient permissions), messages; dialogs under their screen |
| Data formats | required | the DS formats apply; only the data specific to the product, display and input |
| Accessibility | required | the level of the DS, and what the product adds (own components, announcements) |
| Link to the prototype | required | path of the prototype, version, screens and states covered |
| Micro-interactions | optional | transitions, visual feedback, perceived response times, when the DS does not set them |

## Design system

The spec **cites** the design system, it does not copy it. The tokens, the responsive grid, the
component catalogue, the tone and the formats live in the foundation declared in
`.team/foundation.md`.

Project without a design system: the UX creates a minimal one in P2, before the spec, in the project,
`.team/foundations/design-systems/<name>/`, versioned with it (format:
`${CLAUDE_PLUGIN_ROOT}/team/conventions/foundation.md`):

- `foundation.md`: manifest, with accessibility, tone and formats in a few lines;
- `tokens.css`: the CSS variables, taken over by the prototype and the front end;
- `components.md`: the components the MVP needs, their variants, the grid.

It only covers the need of the MVP and is validated at G1 with the spec. Example:
`${CLAUDE_PLUGIN_ROOT}/team/examples/formats/foundations/design-systems/reservation-salles/`.

## Messages

- **Functional messages** (`MSG-xx`): defined by the BA in the functional design, taken over word for
  word and linked. A new functional message is added by the BA, not invented here.
- **Interface messages** (`MSG-Uxx`): empty states, technical error, access denied. Defined in the
  spec, numbered, anchored (`<td id="MSG-U03">`), written in the tone of the DS.

## Usable skills

- `shipitright:proto-bar`: the prototype bar and the contract of the three states.
- The skills and MCP that the design system foundation cites for the UX ("By role" part).
- `agent-skills:frontend-ui-engineering`, if installed: quality of a production interface.
- Figma MCP, optional: only if a Figma mockup exists and its URL is given in the brief. Never browse a
  Figma file on your own initiative.

## Quality rules

- **One screen, one stable `SCR-xx` identifier**, the same in the spec, the prototype (id of the
  screen in the code) and the stories (field `screens`).
- **Each screen has a story, each front-end story has a screen.** A screen without a story is extra
  scope; a story without a screen is a gap.
- **The five states are described** for each screen that displays data: nominal, empty, loading,
  error, insufficient permissions. A state that does not apply says so ("no empty state: the list
  always contains the current user").
- **Messages are written word for word**: `MSG-xx` taken from the functional design, `MSG-Uxx`
  defined here (see Messages).
- **A component is named as in the DS.** What the DS does not have is an addition, declared in
  "Applied design system".
- **A dialog belongs to its screen**: no `SCR-xx` of its own, an anchor `SCR-xx-<name>`.
- **A display rule cites its business rule** (`BR-xx`) when it derives from one.
- **Thumbnails come from the prototype** (screenshot of the screen, fictitious data, cropped under
  the prototype bar), stored in `docs/20-ux/screenshots/SCR-xx-<state>.png`. Without a screenshot,
  keep the placeholder.
- **Behaviour stated positively**: "the button is disabled as long as…", never "the button must not
  be usable".

## Delivering

1. Copy the template, replace `PROJECT_NAME`, fill each section. Duplicate the screen block (`<h3>` and
   its content) for each `SCR-xx`.
2. Cross-check with the prototype: same screens, same states, same labels.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/20-ux`.
4. Set the status to `in-review` and tell the PO that the spec is ready for the consistency pass.
