# Git

- **One repository per project**: the project is its own repository, at the root of the folder where
  Claude Code is opened (`git init` when the project is created by `init-project.sh`). The plugin is
  not in it: never commit into the plugin.
- **Branches**: `main` (never a direct commit), `sprint/N`, one branch per ticket `t-012-<slug>`
  created from `sprint/N`. Design deliverables live on `design` until G1/G2, then are merged into
  `sprint/1`.
- **Worktrees for parallel work**: a code ticket runs in its worktree, created by the PO at dispatch
  or by the dev at start:
  `git worktree add .worktrees/t-012 -b t-012-<slug> sprint/N`, from the project root. The worktree
  then gets its dependencies (`npm ci` or the foundation's equivalent, in each application) and its
  generated files; whoever creates it checks it with a command before the dev starts. `.worktrees/` is
  ignored by git; the worktree is removed after the merge.
- **QA e2e tests**: written in an `e2e` ticket (`team/conventions/ticket.md`), which follows the
  circuit of a ticket: its branch `t-020-<slug>` and its worktree, review by a fresh Reviewer (3 rounds
  at most), merge into `sprint/N` by the PO. Commit scope: the ticket, `test(t-020): cover US-006/S4`.
- **Bug**: at opening, the QA creates the fix branch from `sprint/N` in its worktree, commits the
  `BUG-xxx` test there, red, then removes the worktree:
  `git worktree add .worktrees/bug-003 -b bug-003-<slug> sprint/N`, commit, then
  `git worktree remove .worktrees/bug-003`. The dev reopens the existing branch, without `-b`:
  `git worktree add .worktrees/bug-003 bug-003-<slug>`, and fixes on it; review and merge like a
  ticket. Scope: the bug, `test(bug-003): reproduce US-006/S4`.
- **Merges**: the PO merges each ticket branch into `sprint/N` after a review without a blocking
  finding. The human merges `sprint/N` into `main` after acceptance.
- **Never `git push`.**
- **Commits**: Conventional Commits in English, scope = ticket, small and frequent.
  `feat(t-012): add invoice creation endpoint`, `test(t-012): cover rejected invoice`.
  `Co-Authored-By` footer kept.
- **Local unversioned files**: `HANDOVER.md`, secrets, `.env`.
- **Agent memory**: `.claude/agent-memory/shipitright-<role>/` has project scope; it is committed with
  the project, on the branch where the agent works, so the team finds it again from one session and
  one machine to another.
