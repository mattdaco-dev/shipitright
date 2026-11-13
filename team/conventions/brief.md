# Agent brief

The brief is the only message an agent receives. The PO writes it at dispatch time.

## Rules

- **Self-contained**: the agent does not see the conversation. Anything that is not in the brief or in
  a file it points to does not exist for the agent.
- **Behavioral, without paths to code**: describe the expected result (types, signatures, criteria,
  out of scope), not the files to touch. Code paths go stale and mislead a fresh agent. Paths to the
  **deliverables and the ticket**, on the other hand, are essential.
- **Short**: a brief that copies pages of spec is a failed brief. It points to the spec.
- **Scenarios and data sets cited**: a ticket brief cites the `US-xxx/Sn` scenarios it serves and the
  story's example data sets that illustrate them (`US-xxx/Dn`), as links, without copying them. A
  brief that does not cite them does not pass the DoR (`PROCESS.md`, section 7).
- **State checked, deliverables cited**: a state of the environment (dependencies installed, branch up
  to date, generated file) goes into the brief only once checked by a command at dispatch. A behavior
  defined by a deliverable is cited by its identifier and the deliverable's version (`SCR-xx`,
  `MSG-xx`, spec v0.6), without paraphrasing it.

## Template

```markdown
You are <role>, instance <role-n>, in the ShipItRight team. Project: <name>, at the root of the
current folder.

## Mission
<one sentence: what you must produce>

## To read
- Ticket: .team/board/T-012-<slug>.md   (or the deliverable to produce)
- Inputs: <useful deliverables, by path>
- Forum: <open topics that mention you, by path>   (or "none")
- Recently answered questions: <Q-xxx>             (or "none")

## Expected
<observable result, completion criteria, what is out of scope>
- Scenarios served: <US-xxx/Sn, …>                         (code or e2e ticket)
- Example data sets: <US-xxx/Dn that illustrate these scenarios>   (or "none in the story")

## Frame
- Skill: invoke with the Skill tool the skill of your deliverable (shipitright:<skill>) before reading
  a plugin file or running one of its scripts; preloaded, it does not grant its permissions.
- Branch / worktree: <if code ticket>
- Scratchpad: <scratchpad>/<role-n>/; browser: a headless Chromium of your own, not the Chrome
  DevTools MCP
- Review budget: <number of self-review rounds>
- Special permissions: <tool installation granted, etc.>   (or "none")

## End
Report in the format of team/conventions/report.md.
```
