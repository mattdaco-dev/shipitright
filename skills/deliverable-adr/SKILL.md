---
name: deliverable-adr
description: Writes or evolves the architecture decisions (ADR) of a ShipItRight project, one HTML page per decision with metadata in meta tags (status, date, supersedes, answers, foundation deviation; foundation deviation, context, decision, rationale and rejected options, consequences), and regenerates the register docs/adr/index.html. Used by the Architect in P3 and along the way, as soon as a structuring choice is made, a deviation from the stack foundation must go up to the human, or an accepted decision must be superseded.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Deliverable: architecture decisions (ADR)

An ADR records **a structuring choice and its why**, so that someone joining the project three
months from now does not reopen a settled debate. ADRs are **HTML pages**, rendered like the other
deliverables; the **register** `docs/adr/index.html` is generated from their `<meta>` tags.

- **Author**: Architect. The PO brings to the human every "proposed" ADR that carries a foundation
  deviation.
- **Phase**: P3, then along the way (sprint planning, technical forum). Checked at gate **G2**.
- **Files**: `docs/adr/NNNN-<slug>.html`, register `docs/adr/index.html` (generated).
- **Template**: [`template-adr.html`](template-adr.html); copying it means reading it in
  `${CLAUDE_PLUGIN_ROOT}/skills/deliverable-adr/` with Read, then writing it in place with Write.
  Example: `${CLAUDE_PLUGIN_ROOT}/team/examples/formats/docs/adr/`.

## What to record

**An ADR** for a lasting choice that structures the code or is costly to undo: framework or major
library, persistence of an entity, architecture style, split into modules, API contract conventions,
authentication and security, concurrency strategy, breaking a frozen operation (`INV-58`), **any
deviation from the stack foundation**.

**No ADR** for an implementation detail, a reversible choice at no cost, what an `INV-xx` invariant
or the foundation already set, what belongs in a commit message. Test: would an incoming dev need the
why? If not, no ADR. Before writing one, check in the register that it does not exist: a decision
that changes supersedes another.

## Statuses and life cycle

| Status | `meta status` | Meaning | Moves to |
|---|---|---|---|
| proposed | `proposed` | decision written, not applied yet. **Required for a foundation deviation**, which the PO brings to the human; applies only once accepted | accepted, abandoned |
| accepted | `accepted` | decision in force; choice left open by the foundation, or deviation validated by the human | superseded |
| superseded | `superseded` | a more recent accepted decision supersedes it | (final) |
| abandoned | `abandoned` | proposal not kept | (final) |

**Immutability**: an accepted ADR is not rewritten. To change the decision, write a **new ADR** that
supersedes it (`meta supersedes`). On the old one, only two things change: `meta status` becomes
`superseded` and `meta date` takes the date of the replacement; the generator writes the rest
("Superseded by", banner). A "proposed" or "abandoned" ADR can be corrected as long as it is not
accepted. A number is never reused, even after abandonment.

Proposed replacement: the new ADR is `proposed` with `meta supersedes`; the old one stays `accepted`
and applies, the generator flags it with a banner. When the new one is accepted, the old one becomes
`superseded` (generator error otherwise).

## Metadata

Read by `${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs`, which writes the visible header of the
page (block `<!-- gen:adr-meta -->`) and the register. They are not copied elsewhere in the page.

| Tag | Value | Level |
|---|---|---|
| `id` | `ADR-NNNN`, the four digits of the file name | required |
| `title` | the title, identical to the `h1` text after "ADR-NNNN:" | required |
| `status` | `proposed`, `accepted`, `superseded`, `abandoned` | required |
| `date` | `YYYY-MM-DD`, date of the last status change | required |
| `foundation_deviation` | `yes` or `no` | required |
| `decided_by` | who decided, once `accepted`: `architect` for a choice the foundation leaves open; the real name of the person for a foundation deviation (decider, `team/glossary.md`), never "human" | required once accepted |
| `supersedes` | the `ADR-xxxx` this decision supersedes, separated by spaces; empty otherwise | required if it supersedes |
| `answers` | the `Q-xxx` it answers; empty otherwise | recommended |

"Superseded by" is not a tag: it is computed from `supersedes` of the superseding decision, written
only once.

```sh
grep -l 'name="status" content="proposed"' docs/adr/*.html                # pending ADRs
grep -l 'name="foundation_deviation" content="yes"' docs/adr/*.html       # foundation deviations
```

## Content of an ADR

| Section | Level | What is expected |
|---|---|---|
| Header | required | `<meta>` tags, `h1` "ADR-NNNN: title" (colon per the typography of the language), block `<!-- gen:adr-meta --><!-- /gen -->` (status, date, supersedes, superseded by, answers, foundation deviation), filled by the generator |
| Foundation deviation | required | one or two sentences. No: what the foundation says on the subject and why the decision complies. Yes: the rule or `INV-xx` invariant set aside, its scope; the ADR stays "proposed" until the human agrees |
| Context | required | the problem, the constraints (framing, foundation, `BR-xx`), the part of question `Q-xxx` addressed; short prose |
| Decision | required | list, one statement per choice, affirmative; numbered when order matters |
| Rationale | required | arguments for the decision as a list, then `table.options`: one row per rejected option and why. At least one option |
| Consequences | required | `dl.defs` with three fixed terms: **Positive**, **Negative**, **Next steps** (actions and who carries them, or "none"), marked by `<dt data-value="positive">`, `negative`, `next` |

The generator finds each section by its `data-section` attribute (`foundation-deviation`, `context`,
`decision`, `rationale`, `consequences`), never by its heading: the heading and visible terms are
written in the project language, the attributes stay as they are.

Each section keeps its **(i)** from the template: `<div class="info-body" hidden>` right after the
`h2`, with a `<dl class="defs">` **Purpose**, **Content**, **Why this format**, then if needed
**Read**. It is copied as is.

## Writing rules

- **Every reference is a link** to where the item is defined, targets in
  `${CLAUDE_PLUGIN_ROOT}/team/glossary.md`, from `docs/adr/`:
  `../20-specs/functional-design.html#BR-01`, `../questions.html#Q-001` (class `qmark`),
  `../30-design/detailed/endpoints/EP-01.html`,
  `../30-design/detailed/cross-cutting/compliance.html#INV-60`, another ADR by its file
  (`0002-<slug>.html`), an error code to `../30-design/detailed/cross-cutting/errors.html#CODE`.
  An identifier whose target is not produced yet is a link to its planned target (warning from
  `check-deliverable.mjs`). A project foundation (`.team/foundations/`) is a link; an external source
  it points to (repository, URL, MCP) is cited in `<code>`, as its manifest writes it.
- **No invented business rule**: a decision that depends on a business answer waits for the answer
  (`Q-xxx`) or states a visible assumption in "Decision" and cites it in "Consequences".
- **One decision per ADR.** A question that calls for two independent choices (framework and
  concurrency) gives two ADRs answering the same `Q-xxx`.
- **Honest negative**: every option has a cost; write it, even if small.
- A decision that touches the API contract, compliance or design makes them evolve: those
  deliverables cite the ADR as a link, and the ADR cites in "Next steps" what must be carried over.
- No code path, no commit, no pointer to the ADR in a Claude Code instruction file (the project's
  `CLAUDE.md`): the register `docs/adr/index.html` is enough.

## Commands

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs docs                # fills the headers, generates adr/index.html
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs docs --check        # checks without writing
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-deliverable.mjs docs        # also runs adr-pages --check
```

The generator exits with an error (code 1) on: wrong file name or `id`, invalid status or date,
`h1` different from `title`, required section missing, "Rationale" without a rejected option,
"Consequences" without Positive or Negative, block `gen:adr-meta` missing, unknown superseded ADR,
ADR `superseded` without an accepted decision superseding it, ADR superseded by an accepted decision
left at another status, page to regenerate (`--check`). It warns on: section without (i), identifier
cited without a link while its target exists, `Q-xxx` missing from `questions.html`, "Next steps"
missing, ADR or index still in Markdown. It is idempotent.

## Deliver

1. Take the next free number (register), copy the template to `docs/adr/NNNN-<slug>.html`, slug in
   kebab-case, replace `PROJECT_NAME` and `ADR-NNNN`.
2. Fill the `<meta>` tags; `proposed` for a foundation deviation, otherwise `accepted` when the
   foundation and the framing leave the choice open to the Architect.
3. Fill each section, references as links, keep the (i), leave the `gen:adr-meta` block empty.
4. For a replacement: `meta supersedes` in the new ADR; when it is accepted, `status` and `date` of
   the old one, nothing else.
5. Generate, then `check-deliverable.mjs` on `docs/`: 0 errors, 0 KO.
6. Link the ADR from the deliverables it touches, where it justifies a choice (stack, persistence,
   security of the macro design; compliance, API contract, detailed design). The "Architecture
   decisions" section of the macro design does not list the ADRs: it points to the register
   `docs/adr/index.html`, which is regenerated (step 5).
7. Report: "proposed" ADRs to bring to the human (foundation deviations first), replacements done.
