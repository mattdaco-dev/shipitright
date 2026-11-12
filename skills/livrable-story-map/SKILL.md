---
name: livrable-story-map
description: Produit ou met à jour le livrable "Story map" d'un projet ShipItRight (persona et objectif du parcours, backbone des activités, tâches utilisateur, stories US-xxx sous chaque tâche, lignes du MVP et des releases R2 et R3 avec leur objectif), en page HTML à partir du gabarit. À utiliser en fin de P1 et en P2, quand le BA organise le backlog à partir de la big picture et des analyses, ou quand le découpage en releases change.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : story map

La story map met le backlog **dans l'ordre du parcours utilisateur** et le découpe en releases. En
lisant de gauche à droite, on suit ce que fait l'utilisateur ; de haut en bas, on passe de
l'indispensable au confort. La première ligne de release dit ce qu'est le MVP.

- **Auteur** : BA. **Contributeurs** : PO (priorités, contenu des releases), UX (parcours, tâches).
- **Phase** : construite en fin de P1, affinée en P2. Passe le gate **G1**.
- **Fichier** : `docs/20-specs/story-map.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-story-map/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Entrées

- `docs/00-cadrage/cadrage.html` : personas, objectifs, périmètre (dedans, dehors, plus tard).
- `docs/10-analyse/big-picture.html` : les phases donnent les activités, les événements déclenchés par
  un acteur donnent les tâches.
- `docs/10-analyse/*.html` : recommandations des chantiers, cas limites qui deviennent des stories.
- `docs/20-specs/stories/` : stories déjà rédigées, pour reprendre leurs ids.

## Construire la carte

1. **Personas et objectifs.** Une story map suit un parcours, porté par un persona du cadrage. Deux
   personas aux parcours différents : deux parcours dans la section Carte, chacun avec son titre `h3`
   et sa grille. Un filet les sépare automatiquement.
2. **Backbone.** Les activités (5 à 8) sont les grandes étapes du parcours, dans l'ordre. Sous chaque
   activité, les tâches utilisateur, formulées par un verbe (« Choisir une formule »).
3. **Stories.** Sous chaque tâche, les stories qui la réalisent, de la plus simple à la plus riche.
   Chaque story a un id `US-xxx` et un titre court.
4. **Priorités MoSCoW.** Chaque activité et chaque tâche porte un badge Must, Should, Could ou Won't
   (couleurs du board Notion). Une activité prend la priorité la plus haute de ses tâches.
5. **Releases.** Tracer la ligne du MVP : le plus petit ensemble qui traverse **tout** le backbone et
   atteint l'objectif du parcours. Puis les releases R2 et R3. Chaque release a un objectif, pas
   seulement une liste.
   Cohérence avec MoSCoW : une tâche **Must** a au moins une story au MVP ; une tâche **Won't** n'en a
   aucune (seule exception à la traversée du backbone).
6. **Hors MVP.** Toute story sous la ligne du MVP qui semble indispensable porte sa raison.

Le PO valide la ligne du MVP. Le BA la propose, il ne la décide pas.

## Structure de la grille

La grille est en **rangées** : chaque colonne de la grille est une tâche, et chaque release occupe une
rangée de cellules, une par tâche. Toutes les cellules d'une rangée ont la même hauteur, donc les lignes
de release restent alignées d'une colonne à l'autre, même si une tâche a trois stories au MVP et sa
voisine aucune.

```html
<div class="sm-grid sm-rows" style="--tasks: 4">
  <div class="sm-activity" style="grid-column: span 2">Activité A</div>  <!-- couvre ses 2 tâches -->
  <div class="sm-activity" style="grid-column: span 2">Activité B</div>
  <div class="sm-task">Tâche 1</div> ... <div class="sm-task">Tâche 4</div>
  <div class="sm-release">MVP : objectif</div>                          <!-- toute la largeur -->
  <div class="sm-cell"><div class="sm-story">...</div></div>             <!-- une cellule par tâche -->
  <div class="sm-cell sm-empty"></div>                                    <!-- tâche sans story -->
  ...
</div>
```

- `--tasks` = nombre de tâches. La somme des `span` des activités doit lui être égale.
- Chaque rangée de release contient exactement `--tasks` cellules, dans l'ordre des tâches, y compris
  les cellules vides (`sm-cell sm-empty`). Une cellule oubliée décale toute la suite.
- Stories de la release R2 : classe `sm-story r2` ; de la release R3 : `sm-story r3`.
- **Une carte de story est un lien vers son fichier** : `<a class="sm-story" href="stories/US-001-<slug>.html">`.
  Toute la carte est cliquable, l'humain y accède directement dès que la story est rédigée.
- Badge MoSCoW : `<span class="moscow must">Must</span>` en tête de l'activité ou de la tâche (`should`,
  `could`, `wont`). Il flotte en haut à droite de la carte. Une tâche Won't prend aussi la classe `wont`.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Personas et objectifs des parcours | obligatoire | un persona du cadrage (`PER-xx`) par parcours, en lien, avec objectif, début et fin |
| Carte | obligatoire | un parcours par persona ; backbone des activités et tâches avec leur badge MoSCoW, stories `US-xxx` cliquables sous chaque tâche, lignes de release, légende |
| Objectifs des releases | obligatoire | pour le MVP et les releases R2 et R3 : objectif, indicateur du cadrage visé, nombre de stories |
| Stories hors MVP | recommandé | stories qu'on pourrait croire indispensables, laissées hors MVP, avec la raison |
| Correspondance avec les epics | recommandé | chaque activité ou grappe de tâches reliée à son `EPIC-xx` |
| Questions et hypothèses | recommandé | `Q-xxx` et hypothèses liées au découpage. Liste vide : l'écrire |

## Règles de qualité

- **Le MVP traverse tout le backbone.** Une release qui ne couvre que les deux premières activités ne
  permet pas d'atteindre l'objectif du parcours : ce n'est pas un MVP.
- **Le MoSCoW et les releases se tiennent** : pas de tâche Must sans story au MVP, pas de story au MVP
  sous une tâche Won't.
- **Les ids `US-xxx` de la carte correspondent aux pages** `docs/20-specs/stories/US-xxx-<slug>.html`. Une
  story de la carte sans fichier est à rédiger ; un fichier sans place sur la carte est un oubli ou
  une story à retirer.
- **Un id ne se réutilise jamais**, même pour une story abandonnée.
- **Les tâches sont des actions de l'utilisateur**, pas des écrans ni des composants techniques.
- **Les termes du glossaire sont repris au mot près.**

## Ce qui en découle

- **Epics et user stories** (`livrable-epic-us`) : une activité ou une grappe de tâches donne un epic
  `EPIC-xx` ; chaque story de la carte devient une page `US-xxx-<slug>.html` avec le même id et le même titre.
- **Roadmap** (`livrable-roadmap`) : les releases deviennent les jalons de la roadmap, les epics ses
  lignes. Si une release change de contenu, la roadmap se met à jour.
- **Sprint planning** : le PO choisit les stories du sprint en descendant la carte release par release.

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplir chaque section, supprimer les exemples et les
   sections facultatives sans objet.
2. Contrôler la correspondance entre les ids de la carte et `docs/20-specs/stories/`.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/20-specs/story-map.html`.
4. Rapport : chemin du fichier, nombre d'activités, de tâches et de stories, contenu du MVP en une
   ligne, stories sans fichier, questions créées.
