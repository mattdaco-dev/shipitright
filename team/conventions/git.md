# Git

- **Un dépôt par projet** : le projet est son propre dépôt, à la racine du dossier où l'on ouvre
  Claude Code (`git init` à la création du projet par `init-projet.sh`). Le plugin n'y est pas : on ne
  commite jamais dans le plugin.
- **Branches** : `main` (jamais de commit direct), `sprint/N`, une branche par ticket
  `t-012-<slug>` créée depuis `sprint/N`. Les livrables de conception vivent sur `conception`
  jusqu'à G1/G2, puis sont mergés dans `sprint/1`.
- **Worktrees pour le travail parallèle** : un ticket de code s'exécute dans son worktree, créé par le PO
  au dispatch ou par le dev au démarrage :
  `git worktree add .worktrees/t-012 -b t-012-<slug> sprint/N`, depuis la racine du projet. Le
  worktree reçoit ensuite ses dépendances (`npm ci` ou l'équivalent du socle, dans chaque
  application) et ses fichiers générés ; celui qui le crée le vérifie par une commande avant que le
  dev commence. `.worktrees/` est ignoré par git ; le worktree est supprimé après le merge.
- **Tests e2e du QA** : écrits dans un ticket `e2e` (`team/conventions/ticket.md`), qui suit le
  circuit d'un ticket : sa branche `t-020-<slug>` et son worktree, revue par un Relecteur frais
  (3 tours au maximum), merge dans `sprint/N` par le PO. Scope des commits : le ticket,
  `test(t-020): cover US-006/S4`.
- **Anomalie** : à l'ouverture, le QA crée la branche de correction depuis `sprint/N` dans son
  worktree, y commite le test de `BUG-xxx`, rouge, puis supprime le worktree :
  `git worktree add .worktrees/bug-003 -b bug-003-<slug> sprint/N`, commit, puis
  `git worktree remove .worktrees/bug-003`. Le dev rouvre la branche existante,
  sans `-b` : `git worktree add .worktrees/bug-003 bug-003-<slug>`, et corrige
  dessus ; revue et merge comme un ticket. Scope : l'anomalie, `test(bug-003): reproduce US-006/S4`.
- **Merges** : le PO merge chaque branche de ticket dans `sprint/N` après une revue sans bloquant.
  L'humain merge `sprint/N` dans `main` après la recette.
- **Jamais de `git push`.**
- **Commits** : Conventional Commits en anglais, scope = ticket, petits et fréquents.
  `feat(t-012): add invoice creation endpoint`, `test(t-012): cover rejected invoice`.
  Footer `Co-Authored-By` conservé.
- **Fichiers locaux non versionnés** : `HANDOVER.md`, secrets, `.env`.
- **Mémoire des agents** : `.claude/agent-memory/shipitright-<rôle>/` a la portée du projet ; elle se
  commite avec lui, sur la branche où l'agent travaille, pour que la team la retrouve d'une session et
  d'une machine à l'autre.
