---
name: deliverable-framing
description: Produces or updates the "Framing and vision" deliverable of a ShipItRight project (vision, problem, goals, personas, scope, constraints, open questions), as an HTML page from the template. Use in phase P0, when the PO runs the framing interview with the human, or when the framing must be corrected after feedback.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: framing and vision

The framing sets **why** we build, **for whom**, and **how far**. It is the input of every other
phase: a BA, a UX designer or the Architect must be able to start cold by reading it.

- **Author**: PO, with the human (the only fully interactive phase).
- **Phase**: P0. Goes through gate **G0**, validated by the human.
- **File**: `docs/00-framing/framing.html`.
- **Template**: [`template.html`](template.html), to copy then fill. Copying means reading
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-framing/template.html` with Read, then writing it to its
  place in the project with Write.

## Running the interview

The PO does not write the framing alone from the expression of need: they question the human, one
question at a time, offering their expected answer when they have one. Each question goes through the
structured question tool (`AskUserQuestion`), expected answer as the first option. A free-answer
question (name, URL, list) is asked directly in the message. Method: each answer opens the next branch
of the decision tree, and we go on until shared understanding, leaving no branch unresolved; a point
that cannot be settled becomes an open question. Suggested order: problem, users, goals, scope,
constraints (stack and design system included), known business rules. What remains unclear after the
interview becomes an **open question** with an owner, never an invention.

## Content

| Section | Level | What we expect |
|---|---|---|
| Vision | required | vision statement in one or two sentences, and structured pitch (for, who, the product is, that, unlike, our product) |
| Problem and context | required | current situation, pain points, cost of inaction |
| Goals and success metrics | required | 3 to 5 goals, each measurable with a target |
| Target users | required | one persona per usage profile: goals, frustrations, frequency, proficiency. Identifier `PER-xx` as the card anchor and at the start of the title, initial of the role in the avatar |
| Scope | required | in, out (with the reason), later |
| Constraints | required | regulatory, technical (the chosen stack and design system foundations included, or to be created), schedule, with their source |
| Open questions | required | id `Q-xxx`, owner, what they block. Empty list: write it |
| Known business rules | recommended | rules already expressed, numbered `BR-xx` |
| Assumptions and risks | recommended | impact and mitigation |
| Glossary | recommended | business terms and shared definition |
| Stakeholders | recommended | roles, interest, involvement (decides, consulted, informed) |
| Existing tools and alternatives | optional | current tools, market solutions |
| Planned milestones | optional | major known steps |

## Quality rules

- **Roles, never people**: "the claims handler", not a first name.
- **A goal without a metric is not a goal.** "Improve the experience" does not pass; "reduce the
  time to file a claim from 15 to 5 minutes" passes.
- **Out of scope carries its reason.** Without it, the question comes back every sprint.
- **No invented business rule.** What the human did not say goes to an open question.
- **Glossary terms are used word for word** in every later deliverable.

## Delivering

1. Copy the template, replace `PROJECT_NAME`, fill each section, delete the optional sections that do
   not apply.
2. Declare the foundations in `.team/foundation.md` (format:
   `${CLAUDE_PLUGIN_ROOT}/team/conventions/foundation.md`). The plugin ships none: ask the human for
   their stack and design system (folder, git repository, MCP, skill, URL) and write its manifest in
   `.team/foundations/<type>/<name>/foundation.md`. If they have none: write so, with its author
   (Architect in P3 for the stack, UX in P2 for the design system), who will create it in
   `.team/foundations/`.
3. Check: `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs/00-framing`.
4. Open the page and present it to the human for G0. Status `validated` once accepted, with the date.
5. Copy the open questions into `.team/questions/` and regenerate the dashboard page
   (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/dashboard-pages.mjs .`, skill
   `shipitright:deliverable-dashboard`).
