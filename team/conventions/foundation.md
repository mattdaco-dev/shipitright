# Convention: foundations

The ShipItRight plugin ships no stack and no design system: they belong to the user. The team
receives them as **foundations**: a folder that says where the reference is and what it imposes. A
project declares its foundations at framing; its deliverables point to the foundation and describe
only the deviations and additions.

A foundation comes from one of these two origins:

- **A source of the user**: their stack or design system already exists elsewhere (local folder, git
  repository, MCP server, skill, documentation URL). At framing, the PO asks for it. The project keeps
  a manifest of it in `.team/foundations/<type>/<name>/foundation.md`, which points to the source and
  says how an agent accesses it.
- **A foundation created in the project**: the user has none, or none suitable. The PO decides with
  them at framing that it will be created: the stack by the Architect in P3, the design system by the
  UX in P2. It is validated at the gate (G2 for a stack, G1 for a design system).

In both cases, the foundation lives in the project, under `.team/foundations/`, and is versioned with
it.

Two types of foundation:

| Type | Folder | What it imposes | Read by |
|---|---|---|---|
| Stack | `.team/foundations/stacks/<name>/` | layers and versions, code organization, compliance invariants, tooling, build and test commands | Architect, devs, QA, Reviewer, Scrum Master |
| Design system | `.team/foundations/design-systems/<name>/` | principles, tokens, components, grid and responsive, accessibility, tone of labels, data formats | UX, Dev frontend, BA (messages, formats), QA, Reviewer |

## Content of a foundation

```
.team/foundations/<type>/<name>/
  foundation.md     manifest, required
  compliance.md     INV-xx invariants of the foundation (stack: required; design system: recommended)
  tokens.css        design system: the tokens as CSS variables, used by the prototype and the front
  proto-alias.css   design system: links the prototype kit's variables to the DS tokens
  components.md     design system: catalogue of components, when the foundation has none elsewhere
  source/           local clone or symbolic link to the reference, ignored by git
```

A foundation can carry everything itself (files of the folder), or only point to the reference: a
local folder, a remote repository, an MCP server, a skill, a documentation URL. The manifest says
which, and how an agent accesses it.

## Manifest `foundation.md`

```markdown
---
type: stack | design-system
name: <folder slug>
version: <version of the reference, or date>
status: active | example | to-complete
---

# Foundation: <Readable name>

<One sentence: what it is, for which projects.>

## Sources

| Source | Type | Access | Content |
|---|---|---|---|
| <name> | folder, git, mcp, skill, url | path, repository URL, server or skill name | what is found there |

## What the foundation provides

<Stack: layers and versions, code organization, invariants, tooling, commands.>
<Design system: principles, tokens, components, responsive, accessibility, tone, formats.>
One line per element, with the place to read it (foundation file or source).

## Prototype

<Design system only.> The files to copy into `prototype/ds/`: `tokens.css` and `proto-alias.css` at
least, plus the components stylesheet or bundle if the DS provides one usable without a build. Say
which components the prototype takes from the DS and which remain kit substitutes.

## By role

| Role | What it reads | What it takes from it |
|---|---|---|

## Deviations

What a project can override, and how: a deviation from the stack goes through an ADR with status
proposed (`proposed`) and goes up to the human; a deviation from the design system is justified in the
UX/UI spec.
```

## Project side: `.team/foundation.md`

Each project declares its foundations in `.team/foundation.md`, filled in at framing by the PO. Each
foundation is a relative link to its manifest in `.team/foundations/`:

```markdown
# Project foundations

| Type | Foundation | Version | Status |
|---|---|---|---|
| Stack | [api-kotlin](foundations/stacks/api-kotlin/foundation.md) (user's source: git repository) | 3.2 | adopted G0 |
| Design system | [salles-ds](foundations/design-systems/salles-ds/foundation.md) (created in the project) | 0.1.0 | created in P2, validated G1 |

## Project overrides

What changes compared with the foundations, with its source (ADR, human decision, UX/UI spec).
```

A project without a design system: the UX creates a minimal one in P2 in
`.team/foundations/design-systems/<name>/` (manifest, `tokens.css`, `components.md`) and the PO
declares it in `.team/foundation.md`; the human validates it at G1. A project without a stack provided
by the human: the Architect creates the stack foundation in P3 in `.team/foundations/stacks/<name>/`,
the human validates the stack at G2. Example of a design system created in a project, fictitious:
`team/examples/formats/foundations/design-systems/reservation-salles/`.

## Rules

- **A deliverable does not copy a foundation.** It cites it (`foundation salles-ds, component Table`)
  and describes only the deviation or addition specific to the product.
- **The foundation prevails over the agent's habit.** A convention read in the foundation wins over a
  general practice of the role; an agent that wants to deviate from it says so in its report.
- **A source is not browsed on one's own initiative beyond the need**: an agent reads in the
  foundation what its ticket or deliverable requires.
- **A clone or a symbolic link goes into `source/`** and is not committed (`init-project.sh` adds
  `.team/foundations/*/*/source` to the project's `.gitignore`).
- **Numbering of invariants**: `INV-01` to `INV-49` for the stack foundation (back, then front),
  `INV-50` to `INV-59` for the framework's cross-cutting invariants, `INV-60` to `INV-69` for the
  project, `INV-70` to `INV-79` for the design system.
- **The project takes the foundation's invariants by reference.** Its compliance contract, page
  `docs/30-design/detailed/cross-cutting/compliance.html`, does not copy the foundation's
  `compliance.md`: it points to it (sections `#stack-foundation` and `#design-system`, targets of
  links to a foundation `INV-xx`) and lists only the invariants set aside, each with its ADR.
