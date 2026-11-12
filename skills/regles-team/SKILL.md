---
name: regles-team
description: Règles communes à tous les membres de la team ShipItRight (repères, fichiers du plugin, démarrage à froid, périmètre d'écriture, questions au PO, rapport, style, git). Préchargé par chaque sous-agent de la team, invoqué par le PO au démarrage de la session.
user-invocable: false
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Règles communes de la team ShipItRight

Ces règles valent pour **tous** les membres de la team. Les sous-agents les reçoivent préchargées ; le
PO, agent principal du plugin (`${CLAUDE_PLUGIN_ROOT}/agents/po.md`, déclaré dans `settings.json`),
invoque ce skill au démarrage de la session. Chaque rôle a sa fiche dans
`${CLAUDE_PLUGIN_ROOT}/agents/<rôle>.md` et se lance comme sous-agent `shipitright:<rôle>`.

## Repères

- Process, phases, gates, cérémonies : `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`.
- Catalogue des livrables et niveaux d'exigence : `${CLAUDE_PLUGIN_ROOT}/team/livrables.md`.
- Identifiants, sigles et vocabulaire de la team : `${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`.
- Formats d'échange (brief, rapport, ticket, forum, questions) : `${CLAUDE_PLUGIN_ROOT}/team/conventions/`.
- Dans ces documents, `team/…`, `skills/…` et `<racine du plugin>` désignent la racine du plugin
  (`${CLAUDE_PLUGIN_ROOT}`) ; `.team/…` et `docs/…` partent de la racine du projet.
- Projet : le dossier courant, son propre dépôt git, avec son `.team/` et son `docs/`.
- Stack et design system : le plugin n'en embarque aucun, ils sont propres à l'utilisateur. Ceux du
  projet sont déclarés dans `.team/socle.md`, qui renvoie à une source de l'utilisateur (dossier, dépôt
  git, MCP, skill, URL) ou à un socle créé dans le projet (`.team/socles/`) ; format :
  `${CLAUDE_PLUGIN_ROOT}/team/conventions/socle.md`. Lis
  la partie « Par rôle » du socle qui te concerne avant d'agir, et charge les skills qu'il cite pour
  ton rôle.

## Fichiers et scripts du plugin

Le plugin est une copie en lecture : on n'y écrit jamais. Lire un de ses fichiers ou lancer un de ses
scripts (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/<script>.mjs .`, depuis la racine du projet) demande
une permission, que donne le skill du livrable concerné quand il est **invoqué avec l'outil Skill**
(`shipitright:<skill>`). Un skill seulement préchargé dans ta fiche te donne son contenu, pas ses
permissions : avant de lancer un script ou de lire un fichier du plugin, invoque le skill du livrable
(ou `shipitright:regles-team`).

**Une commande par appel Bash** : pas de chaînage (`;`, `&&`, `|`), pas de redirection (`>`, `>>`),
pas de `echo $?`. Une commande composée ne passe pas les permissions et reste bloquée. Pour chercher,
Glob et Grep s'ils sont disponibles, sinon `find` ou `grep` en commande simple.

## Si tu es un agent lancé par le PO

1. **Tu démarres à froid.** Tu ne vois pas la conversation avec l'humain. Ton brief dit qui tu es
   (rôle et instance, ex. `dev-backend-2`), sur quel projet, quoi produire. Tout le reste est dans les
   fichiers que le brief désigne.
2. **Lis avant d'agir** : ton brief, puis le ticket ou le livrable concerné, puis les sujets du forum
   et les questions qui te mentionnent (le brief les liste).
3. **Écris seulement dans ton périmètre** : les fichiers de ton livrable ou de ton ticket, les sections
   `Rapport` et `Rétro` de ton ticket, des posts en ajout dans le forum. Tu ne changes jamais le statut
   d'un ticket ni son affectation : c'est le PO.
4. **Tu ne parles jamais à l'humain.** Une question métier va dans `.team/questions/`, adressée à `@po`.
   Si elle ne bloque pas, pose une hypothèse visible (`HYPOTHÈSE`) et continue. Dans ton livrable, la
   question se signale par son badge `qmark` (pas de `[?]` nu), puis tu régénères la page des questions :
   `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/questions-page.mjs .`.
5. **Tu termines par un rapport** au format `${CLAUDE_PLUGIN_ROOT}/team/conventions/rapport.md`. C'est la seule chose que le
   PO lira : chemins exacts, décisions, points ouverts, ce que le suivant doit savoir.
6. **Si le travail déborde** (le ticket ne tient pas, la conception est contradictoire, un contrat manque),
   arrête-toi proprement et dis-le dans le rapport plutôt que de forcer.

## Règles communes

- **Langue** : français pour tout ce qui est rédigé. Code, identifiants, noms de fichiers et messages de
  commit en anglais.
- **Style** : pas de tiret cadratin ni demi-cadratin, pas d'emojis, pas de formules creuses. Direct,
  concret, phrases courtes.
- **Vocabulaire** : on ne francise pas les termes d'usage courant dans une équipe produit ou
  technique : roadmap, backlog, release, sprint, story, epic, spike, wireflow, design system, token,
  endpoint, Now / Next / Later. On ne les remplace pas par une traduction (« grille temporelle » pour
  roadmap).
- **Données** : toujours fictives. Aucune personne, aucun client, aucun montant réel.
- **Identifiants stables** : un élément identifié (règle, écran, endpoint, story, persona…) garde son
  identifiant pour toujours, et les livrables se citent par ces identifiants. Préfixes et objets
  désignés : `${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`.
- **Références en liens** : dans un livrable, un identifiant ou un livrable cité est un lien vers l'endroit
  où il est défini, et chaque élément identifié porte une ancre égale à son identifiant. Table des cibles :
  `${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`.
- **Git** : jamais de commit sur `main`, **jamais de `git push`**. Conventional Commits, scope = ticket :
  `feat(t-012): add invoice creation endpoint`. Détails : `${CLAUDE_PLUGIN_ROOT}/team/conventions/git.md`.
- **Installation d'outils** sur la machine (JDK, sbt, Docker…) : seulement si le brief le prévoit, l'humain
  ayant donné son accord au PO.
- **Hors du projet** : un agent ne modifie rien en dehors de la racine du projet, ni le plugin. Un socle
  créé pour le projet va dans `.team/socles/`. Une évolution du plugin s'écrit comme proposition
  (évolution proposée pour le plugin, `Sn-Em`, dans la rétro de la page de sprint), appliquée par
  l'humain dans le dépôt ShipItRight.
- **Ressources partagées** : ton scratchpad est un sous-dossier à ton instance
  (`<scratchpad>/<rôle-n>/`). Pour vérifier au navigateur, lance un Chromium headless à toi
  (Playwright) ; la page du Chrome DevTools MCP est partagée entre agents et reste au PO.
