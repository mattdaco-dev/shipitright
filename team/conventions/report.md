# Agent end report

Each agent ends with this report, as its final answer **and**, for a ticket, in its `## Report`
section. It is the only thing the PO reads: it must be enough to decide what comes next without
opening a file.

```markdown
## Report <role-n> · <T-xxx or deliverable> · <date>

**Proposed status**: done | to rework | blocked
**Summary**: <two or three lines: what was produced>

**Files** (exact paths)
- <path>: created | modified, <in a few words>

**Decisions taken**
- <decision, and why>   (or "none")

**For what follows**: <what the next ticket or agent must know: signatures produced, contract,
pitfall met>

**Open points**
- <question, hypothesis made, unresolved finding, open forum topic>   (or "none")

**Checks**: <build, tests, deliverable checker: commands and result>

**Retro**: <one or two lines: what slowed down, what was missing in the brief>
```

An honest report is worth more than a green report: unfinished work is declared `to rework` or
`blocked`, with the reason.
