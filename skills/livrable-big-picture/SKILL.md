---
name: livrable-big-picture
description: Produit ou met à jour le livrable "Big picture" d'un projet ShipItRight, façon event storming (frise des événements par phase et par flux, pivots, acteurs, systèmes externes, hotspots, opportunités), en page HTML à partir du gabarit. À utiliser en phase P1, quand le BA ouvre l'analyse à partir du cadrage validé, ou quand la big picture doit être corrigée après un chantier d'analyse ou un retour.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : big picture

La big picture raconte le domaine **dans l'ordre où les choses arrivent**, flux par flux, avec les
mots du métier. Elle montre d'un coup d'œil le parcours complet, qui agit, quels systèmes interviennent
et où sont les zones d'ombre. C'est la carte commune de P1 : les chantiers d'analyse s'y rattachent,
la story map en tire son backbone, l'architecte y lit les frontières de domaine.

Format : event storming big picture (Brandolini), avec des couloirs par flux et des
événements à la première personne.

- **Auteur** : BA. **Contributeurs** : PO (règles et arbitrages), UX (usages), Architecte (systèmes
  externes).
- **Phase** : P1, en ouverture de l'analyse. Passe le gate **G1** avec les autres livrables de specs.
- **Fichier** : `docs/10-analyse/big-picture.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-big-picture/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Objectifs

- Une compréhension partagée du domaine de bout en bout, la même pour tous les rôles.
- Faire apparaître tôt ce qu'on ne sait pas (hotspots), quand c'est encore peu coûteux.
- Un langage commun : les termes du glossaire, au mot près.
- Montrer les moments irréversibles (pivots) et les passages de relais entre acteurs.

Ce n'est ni une spec, ni un modèle de données, ni un enchaînement d'écrans.

## Entrées

- `docs/00-cadrage/cadrage.html` : vision, personas, périmètre, règles métier connues, glossaire,
  questions ouvertes. C'est la source principale.
- `.team/questions/` : questions déjà posées et réponses du PO.
- Les analyses de chantier de `docs/10-analyse/` si elles existent déjà (mise à jour).

## Mener l'atelier en solo

Un event storming se fait d'habitude à plusieurs devant un mur. Ici le BA le déroule seul, en passes
successives. Chaque passe a son objet.

1. **Événements en vrac.** Lister tout ce qui arrive dans le domaine, **à la première personne et au
   passé composé**, du point de vue de celui qui le vit : « J'ai réservé la salle », « J'ai reçu
   l'annulation ». Une réaction automatique a pour acteur « Application » : « J'ai vérifié qu'aucune
   réservation ne chevauche ». Pas de verbe technique (« J'ai inséré une ligne »), pas d'écran
   (« J'ai cliqué sur Valider »). Viser large, y compris les échecs et ce qui sortira du périmètre.
2. **Flux.** Regrouper les événements en **couloirs**, un par flux ou scénario qui se lit d'une traite
   (« réservation ponctuelle », « réservation récurrente », « gestion du parc »). Ce qui est vu mais
   exclu va dans un couloir « Hors périmètre ».
3. **Chronologie et phases.** Ordonner chaque couloir dans le temps, puis découper l'ensemble en
   **phases** (4 à 7). Dans une phase, `data-t` donne le moment : deux événements simultanés de deux
   couloirs ont le même `data-t`.
4. **Pivots.** Repérer les événements qui changent l'état du domaine de façon irréversible ou qui
   passent la main à un autre acteur. Un pivot **clôt sa phase**.
5. **Acteurs et systèmes.** Sous chaque événement : l'acteur (persona du cadrage), puis le système
   externe s'il y en a un.
6. **Hotspots et opportunités.** Partout où il y a une question, un conflit entre deux règles ou un
   risque, poser un hotspot sous l'événement concerné. Chaque hotspot qui demande une réponse du métier
   devient une question `Q-xxx` dans `.team/questions/`, et le sticky cite son id en lien vers ce fichier. Une idée
   d'amélioration devient une opportunité.
7. **Flèches.** Elles sont automatiques d'un événement au suivant de son couloir, dans une phase. Couper
   la chaîne sur des alternatives (`data-flow="end"` sur la colonne), et tracer à la main les liens
   entre couloirs (`data-links`, voir le commentaire du gabarit).

Ce que le cadrage ne dit pas reste un hotspot. On n'invente pas un événement pour combler un trou.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Objectifs et périmètre | obligatoire | objectifs de la big picture, « on regarde » et « on ne regarde pas ». Pas de rappel de la vision : un lien vers le cadrage |
| Légende | obligatoire | déjà présente dans le gabarit, à garder telle quelle |
| Frise des événements | obligatoire | phases, couloirs par flux, une colonne par moment (événement, acteur, système, hotspot, opportunité), pivots, couloir hors périmètre si utile |
| Événements pivots | obligatoire | les 3 à 6 pivots, avec ce qui change après eux et qui prend la main |
| Acteurs et systèmes externes | obligatoire | chaque acteur relié à un persona (`PER-xx`, en lien), chaque système externe avec son rôle. Aucun système : l'écrire |
| Hotspots | obligatoire | questions, conflits, risques, chacun avec sa phase et son `Q-xxx` s'il est posé au PO. Liste vide : l'écrire |
| Opportunités | recommandé | idées d'amélioration, avec leur phase et la valeur attendue |

Pas de commandes, politiques ni read models : ils relèvent de l'event storming de niveau process, et
les règles se posent dans la conception fonctionnelle. Pas de contextes candidats non plus :
l'architecte découpe les domaines en P3, à partir des couloirs et des pivots de la frise.

## Règles de qualité

- **Un événement est un fait vécu, à la première personne.** « J'ai réservé la salle », pas
  « Réserver une salle » (c'est une intention) ni « Formulaire validé » (c'est un écran).
- **Les termes du glossaire sont repris au mot près.** Un terme nouveau va au glossaire via le PO.
- **Un sticky, une idée.** Un événement qui contient « et » se coupe en deux.
- **Chaque hotspot est traçable** : soit il cite un `Q-xxx`, soit il dit pourquoi il ne remonte pas
  (risque connu, simple point d'attention, hors MVP).
- **Les acteurs sont des rôles**, ceux des personas du cadrage, jamais des personnes.
- **La frise reste lisible** : 3 à 4 moments par phase et par couloir, 6 à 12 événements par phase.
  Au-delà, couper la phase en deux.

## Ce qui en découle

- **Story map** (`livrable-story-map`) : les phases donnent les activités du backbone, les événements
  déclenchés par un acteur donnent les tâches utilisateur, les opportunités des stories candidates.
- **Chantiers d'analyse** (`livrable-analyse`) : le PO découpe souvent les chantiers par phase, par
  couloir ou par grappe de hotspots.
- **Conception fonctionnelle** : les pivots et les réactions de l'« Application » deviennent des règles
  de gestion `RG-xx`.
- **Architecte** : les couloirs, les pivots et les systèmes externes préparent le découpage en domaines
  et les flux de la conception macro.

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplir chaque section, supprimer les exemples.
2. Créer les questions `Q-xxx` des hotspots dans `.team/questions/` (champ `bloquant` renseigné).
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/10-analyse/big-picture.html`.
4. Ouvrir la page dans un navigateur : une colonne au contour rouge signale un `data-lane` absent de
   `data-lanes`.
5. Rapport : chemin du fichier, phases et couloirs retenus, nombre de hotspots et questions créées.
