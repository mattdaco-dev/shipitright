---
name: notion-board
description: Crée et fait vivre le board Notion d'un projet ShipItRight, miroir facultatif du board local (.team/board, epics, stories, anomalies), seulement si le MCP Notion est disponible. À utiliser par le PO à la création d'un projet (création de la base et des vues), puis à chaque synchro de vague, gate ou fin de sprint pour reporter les créations et changements de statut.
---

# Board Notion du projet

Le board local (`.team/board/`, `docs/20-specs/epics/`, `docs/20-specs/stories/`) est la
**source de vérité** des agents. Le board Notion en est le **miroir pour l'humain** : il y suit
l'avancement sans ouvrir le dépôt. Un seul agent écrit dans Notion : **le PO**. Les autres rôles n'y
touchent pas.

**Facultatif** : ce skill suppose le MCP Notion. Sans lui, le projet n'a pas de board Notion, pas de
`.team/notion.md`, et les étapes de synchro sont sautées ; le board local suffit.

## 1. Création, au lancement du projet

**Toujours demander à l'humain où créer le board** : l'URL d'une page Notion parente existante, ou
l'accord pour créer une page privée de projet. Ne jamais choisir une page soi-même ni explorer son
espace Notion pour en trouver une.

Puis, une fois la destination donnée :

1. Si besoin, créer la page du projet (`notion-create-pages`, titre = nom du projet, courte description
   tirée du cadrage).
2. Créer la base (`notion-create-database`, parent = page du projet, titre `Board <projet>`) avec ce
   schéma :

```sql
CREATE TABLE (
  "Titre" TITLE,
  "Ref" RICH_TEXT COMMENT 'Identifiant local : EPIC-01, US-004, T-012, BUG-003',
  "Type" SELECT('Epic':purple, 'Story':blue, 'Ticket':gray, 'Bug':red, 'Spike':yellow),
  "Statut" SELECT('Backlog':gray, 'Prêt':blue, 'En cours':yellow, 'En revue':orange, 'En test':pink, 'Fait':green, 'Bloqué':red),
  "Rôle" SELECT('business-analyst':blue, 'ux-designer':pink, 'architecte':purple, 'dev-backend':brown, 'dev-frontend':orange, 'qa':green, 'scrum-master':gray, 'po':default),
  "Instance" RICH_TEXT,
  "Sprint" SELECT('Conception':gray, 'Sprint 1':blue, 'Sprint 2':green, 'Sprint 3':orange),
  "Epic" RICH_TEXT,
  "Stories" RICH_TEXT,
  "Priorité" SELECT('Must':red, 'Should':orange, 'Could':blue, 'Won''t':gray),
  "Release" SELECT('MVP':red, 'R2':orange, 'R3':gray),
  "Taille" SELECT('XS':blue, 'S':green, 'M':yellow, 'L':orange, 'XL':red),
  "Dépend de" RICH_TEXT,
  "Fichier" RICH_TEXT COMMENT 'Chemin du fichier local, source de vérité',
  "Mis à jour" LAST_EDITED_TIME
)
```

3. Créer les vues (`notion-create-view`) :
   - `Kanban` : type `board`, `GROUP BY "Statut"`, filtre `Type` différent de `Epic` ;
   - `Sprint en cours` : type `board`, `GROUP BY "Statut"`, filtre sur le sprint courant (à mettre à
     jour à chaque sprint) ;
   - `Backlog` : type `table`, tri par `Release` puis `Priorité` ;
   - `Epics` : type `table`, filtre `Type = Epic`.
4. Noter dans `.team/notion.md` : URL de la page projet, URL de la base, identifiant
   `collection://` de la source de données, date de création. C'est là que les sessions suivantes
   retrouvent le board.

Ajouter une option de `Sprint` quand un nouveau sprint démarre (`notion-update-data-source`).

## 2. Contenu des pages

Avant d'écrire du contenu de page, lire la spécification Markdown Notion (`notion://docs/enhanced-markdown-spec`
via `notion-fetch`), une fois par session.

| Type | Contenu de la page Notion |
|---|---|
| Epic | Contexte, intention, périmètre, conditions de sortie (copiés de `EPIC-xx-<slug>.html`) |
| Story | Contexte, besoin, règles fonctionnelles, critères d'acceptation, points à trancher (copiés de `US-xxx-<slug>.html`) |
| Ticket | Brief résumé en quelques lignes, puis à la clôture le résumé du rapport et le verdict de revue |
| Bug | Sévérité, scénario concerné, attendu, obtenu |

Toujours terminer la page par le chemin du fichier local. Après création, reporter l'URL Notion dans
la balise `<meta name="notion_url">` de la page locale.

## 3. Synchronisation

Le PO synchronise **par lots**, jamais au fil de chaque micro-changement :

- après la création des epics et stories (fin de P2) ;
- après le sprint planning (création des tickets) ;
- à chaque synchro de vague (statuts, nouveaux bugs) ;
- à chaque gate et en fin de sprint (statuts finaux, liens vers le PV et la page sprint).

Procédure : lister les fichiers locaux modifiés depuis la dernière synchro (`git log` / dates), créer
les pages manquantes en un seul appel `notion-create-pages` (jusqu'à 100 pages), mettre à jour les
propriétés des pages existantes (`notion-update-page`, commande `update_properties`). Noter la date de
synchro dans `.team/notion.md`.

En cas d'écart entre Notion et le local, **le local gagne**. Si l'humain a modifié quelque chose dans
Notion (commentaire, statut, priorité), le PO le traite comme un retour de l'humain : il le reporte dans
le local après en avoir pris acte, puis resynchronise.

## 4. Garde-fous

- Pas d'exploration de l'espace Notion de l'humain en dehors de la page du projet.
- Pas de suppression de page sans accord explicite de l'humain : un ticket abandonné passe en statut
  `Fait` avec la mention « abandonné » dans le titre, ou reste en `Backlog`.
- Pas de données réelles dans Notion, comme partout ailleurs.
