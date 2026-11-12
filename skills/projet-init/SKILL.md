---
name: projet-init
description: Crée un nouveau projet ShipItRight dans le dossier courant (arborescence .team et docs, assets des livrables, page de pilotage, journal, dépôt git sur la branche conception), puis la création du board Notion si le MCP Notion est disponible. À utiliser par le PO quand l'humain apporte un nouveau besoin ou demande de démarrer un projet.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Bash(${CLAUDE_PLUGIN_ROOT}/team/scripts/init-projet.sh *)"
  - "Bash(cp ${CLAUDE_PLUGIN_ROOT}/team/assets/* *)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Créer un projet

## 1. Nommer

Demander à l'humain le nom du projet s'il ne l'a pas donné, et proposer un slug court en kebab-case
(`declaration-sinistre`). Le projet se crée à la racine du dossier courant : vérifier qu'il n'est pas
déjà un projet (ni `.team/` ni `docs/`). Un dossier `docs/` existant, même sans rapport avec
ShipItRight, fait refuser le script : le dire à l'humain, qui le déplace ou choisit un autre dossier.

## 2. Initialiser

```sh
${CLAUDE_PLUGIN_ROOT}/team/scripts/init-projet.sh <slug> "<Nom du projet>"
```

Le script crée :

```
<dossier courant>/
  .team/board/  forum/  questions/  journal.md  socle.md (socles à déclarer au cadrage)
  docs/_assets/ (copie de ${CLAUDE_PLUGIN_ROOT}/team/assets)  index.html (page de pilotage, gabarit livrable-pilotage)
  docs/00-cadrage/ 10-analyse/ 20-specs/{epics,stories}/ 20-ux/ 30-conception/api/ 40-qa/ 50-recette/ sprints/ adr/
  docs/10-analyse/index.html (inventaire des analyses) et docs/20-specs/backlog.html : générés par
    pilotage-pages.mjs, comme la page de pilotage
  prototype/  backend/  frontend/      (un .gitkeep dans chaque dossier vide)
  README.md  .gitignore
```

et un commit sur la branche `conception` (jamais de commit sur `main`), qui ne contient que ce que le
script a créé ou modifié. Le script vérifie tout avant d'écrire, et retire ce qu'il a écrit s'il
échoue :

- le nom passe tel quel, caractères spéciaux compris (`R&D / Prêts`) ; le slug est en kebab-case ;
- un `README.md` existant n'est pas écrasé : le script lui ajoute une section `## ShipItRight` ;
- dossier qui n'est pas un dépôt git : `git init` ; dépôt existant : le projet doit être à sa racine,
  une branche `conception` existante est reprise si elle ne contient pas déjà `.team/` ni `docs/` et
  que l'arbre de travail n'a pas de modification en cours, sinon le script refuse ;
- `.team/` ou `docs/` déjà présents : le script refuse, sans rien écrire.

## 3. Board Notion, si le MCP Notion est disponible

Sans MCP Notion, sauter cette étape : pas de board, pas de `.team/notion.md`, le board local suffit.
Sinon, suivre le skill `shipitright:notion-board`, section 1 : **demander à l'humain où créer le
board** (URL d'une page parente, ou accord pour une page privée), puis créer la base, les vues, et
`.team/notion.md`. Le bouton Notion de la page de pilotage lit ce fichier : régénérer la page
(section suivante).

## 4. Démarrer le cadrage

Enchaîner sur l'entretien de cadrage (skill `shipitright:livrable-cadrage`), une fois le projet
créé, pas avant. Les socles (stack, design system) se déclarent pendant l'entretien : le PO demande
à l'humain les siens, ou décide avec lui qu'ils seront créés dans le projet. L'outillage que le socle de stack demande n'est vérifié qu'avant le premier sprint, par
l'architecte.

## Tenir la page de pilotage à jour

La page de pilotage (`docs/index.html`, qui remplace le portail), la page backlog
(`docs/20-specs/backlog.html`) et l'inventaire des analyses (`docs/10-analyse/index.html`) ne
s'éditent pas à la main : elles sont générées depuis les fichiers du projet (journal, board, questions,
méta `statut` et `verdict` des livrables, pages d'analyse, stories, story map, roadmap, pages de sprint, campagnes, PV).
Le PO les régénère :

- à chaque synchro de vague ;
- à chaque gate, une fois la décision consignée au journal et le statut du livrable mis à jour ;
- à chaque merge dans `sprint/N`.

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/pilotage-pages.mjs .
```

Aucune ligne de journal n'est ajoutée pour ces pages : elles lisent les événements déjà consignés,
sans date prévue ni retard (les dates sont dans le calendrier de la roadmap). `check-livrable.mjs`
lance `pilotage-pages.mjs --check` et signale une page qui n'est plus à jour. Format et règles : skill
`shipitright:livrable-pilotage`.

Les assets d'un projet existant se mettent à jour par `cp ${CLAUDE_PLUGIN_ROOT}/team/assets/* docs/_assets/`
quand `doc.css` ou `doc.js` évoluent.
