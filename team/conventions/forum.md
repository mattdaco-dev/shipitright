# Forum and questions

## Forum

For any exchange between agents that is not a business question: technical disagreement, clarification
of a contract, report of a risk. One file per topic in `.team/forum/`, named `YYYY-MM-DD-<slug>.md`.
**Posts are append-only**, an existing post is never rewritten.

```markdown
---
subject: Format of amounts in the API
opened_by: dev-frontend-1
mentions: [architect]
status: open          # open | resolved
linked_to: [T-014, US-006]
---

### [dev-frontend-1] 2026-10-01 14:32
The contract exposes amounts as `number`. Round on the front side, or a decimal string?

### [architect] 2026-10-01 15:10
Decimal string, ADR-0004. `openapi.yaml` updated.
→ resolved
```

Agents do not run continuously: the forum is asynchronous from one wave to the next. After each wave,
the PO collects the open topics and puts them in the brief of the next agent mentioned. Whoever closes
a topic adds `→ resolved` and sets `status: resolved`.

## Business questions

Addressed to the PO, in `.team/questions/Q-007-<slug>.md`.
After creating a question or writing its answer, regenerate the reading page, which the deliverables
point to (`questions.html#Q-007`):

```sh
node <plugin root>/team/scripts/questions-page.mjs .
```

```markdown
---
id: Q-007
from: business-analyst-2  # instance that asks the question; the person's name for a workstream led outside the team
target: architect         # optional: who should answer, when it is not the PO
status: open              # open | answered | raised
blocking: no              # yes | no
linked_to: [US-012, BR-08]
---

## Question
<a single question, closed if possible, with the expected answer>

## Context
<why it arises, what depends on the answer>

## Hypothesis meanwhile
<if not blocking: the hypothesis adopted to move forward>

## Answer
<filled in by the PO, with the source: "human, 2026-10-02" or "PO, from framing BR-04">
```

Section headings are written in the project language; their **order** is fixed, and that is what the
scripts read (`team/conventions/language.md`): question, context, hypothesis, answer. The four
sections stay present even when empty, the answer is always the last one.

The PO answers if it can, from the framing and what the human has already said. Otherwise it sets the
question to `raised` and asks the human, **grouped** with the others, never one at a time as they come.
An answer that creates or changes a business rule is carried over into the deliverable concerned.
