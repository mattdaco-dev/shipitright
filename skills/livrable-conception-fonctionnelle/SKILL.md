---
name: livrable-conception-fonctionnelle
description: Produit ou met à jour le livrable "Conception fonctionnelle" d'un projet ShipItRight (parcours fonctionnels, règles de gestion RG-xx, modèle conceptuel des données métier, cycles de vie, rôles et droits, messages, calculs), en page HTML à partir du gabarit. À utiliser en phase P2 par le Business Analyst, quand les règles de gestion doivent être posées ou corrigées après un retour de G1 ou de la passe de cohérence.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : conception fonctionnelle

La conception fonctionnelle dit **comment le produit se comporte**, indépendamment des écrans et de la
technique : quels parcours, quelles règles, quels objets métier, qui a le droit de faire quoi. C'est
la référence des règles `RG-xx` que les stories, la spec UX et le QA citent.

- **Auteur** : Business Analyst. **Contributeur** : PO (arbitre les règles métier).
- **Phase** : P2, en tandem avec la spec UX et le prototype. Passe le gate **G1**, validé par l'humain.
- **Fichier** : `docs/20-specs/conception-fonctionnelle.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-conception-fonctionnelle/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Entrées à lire

1. `docs/00-cadrage/cadrage.html` : périmètre, personas, règles métier connues, glossaire.
2. `docs/10-analyse/` : big picture, analyses de chantier, `options.md` (solution retenue).
3. `docs/20-specs/story-map.html` : activités, stories et releases. Le périmètre MVP en vient.
4. `docs/20-ux/spec-ux-ui.html` s'il existe déjà : identifiants `EC-xx` des écrans.
5. `.team/questions/` : réponses du PO aux questions déjà posées.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Périmètre et références | obligatoire | rappel du périmètre couvert (release, epics), liens vers cadrage, analyse et story map |
| Parcours fonctionnels | obligatoire | un parcours `PF-xx` par activité de la story map, en schéma `.pf` : déclencheur, actions, traitements, décisions en losange, résultats, refus ; règles et messages en pastilles |
| Règles de gestion | obligatoire | règles numérotées `RG-xx` (ancre `id`) : énoncé déclaratif, portée, source, stories et écrans liés. Ces deux colonnes font la traçabilité |
| Modèle conceptuel des données métier | obligatoire | schéma `.mcd` : un objet par carte (nom en gras, attributs `nom [type métier]`), relations nommées avec la cardinalité aux deux bouts, puis une fiche par objet |
| Cycles de vie des objets métier | obligatoire | schéma `.pf lifecycle` par objet qui a un statut (états, transitions et leur événement), puis le tableau acteur et condition |
| Rôles et droits | obligatoire | matrice rôle × action, avec les restrictions de portée (« ses dossiers », « son agence ») |
| Questions et hypothèses | obligatoire | `Q-xxx` posées au PO, hypothèses en cours. Liste vide : l'écrire |
| Notifications et messages | recommandé | messages, e-mails, notifications : déclencheur, destinataire, libellé au mot près |
| Calculs et algorithmes métier | recommandé | formule, entrées, arrondis, exemple chiffré fictif |
| Exigences non fonctionnelles métier | recommandé | délais, volumes, disponibilité, conservation, exprimés par le métier et mesurables |
| Glossaire complémentaire | facultatif | termes apparus après le cadrage |

## Schémas

Tous les schémas du livrable suivent le même formalisme que la big picture : cartes colorées par type,
flèches routées par `doc.js`, références en pastilles cliquables. Pas de Mermaid. Chaque élément se
place sur une grille par `data-c` (colonne) et `data-r` (ligne), les liens par `data-links`.

- **Parcours** (`.pf`) : `start`, `user` (avec l'acteur en `<small>`), `system`, `decision`, `end`,
  `error`, `stop`. Une décision est une question de 2 à 4 mots (« Salle déjà prise ? »). Sa branche
  principale part à droite, l'alternative juste en dessous. 6 colonnes au plus.
- **Modèle conceptuel** (`.mcd`) : `data-links="cible|verbe|card. côté source|card. côté cible"`, avec
  `0:1`, `1:1`, `0:n`, `1:n`. Les relations ne se rejoignent jamais. Disposer les objets pour que chaque
  relation soit un trait droit, une relation par côté d'objet si possible.
- **Cycles de vie** (`.pf lifecycle`) : `dot` pour l'état initial, `state` pour un état, `state final`
  pour un état terminal. Plusieurs transitions entre deux mêmes états : une seule flèche (« annulée
  (3 cas) »), le détail dans le tableau.

Vérifier dans un navigateur : un libellé qui ne tient pas sur sa flèche part dans une légende numérotée
sous le schéma. C'est le signe qu'il faut écarter les cartes ou raccourcir le libellé.

## Règles de qualité

- **Une règle, une phrase déclarative.** « Un contrat résilié ne peut plus être modifié », pas « le
  système doit vérifier que… ». Une règle se teste sans lire le reste de la page.
- **Les identifiants `RG-xx` sont stables.** On n'en renumérote jamais ; une règle abandonnée reste
  dans le tableau, barrée, avec la raison. Les règles du cadrage gardent leur numéro.
- **Chaque règle a une source** : cadrage, réponse `Q-xxx`, analyse, réglementation. Sans source, c'est
  une hypothèse : bloc `callout hypothese`.
- **Aucune règle métier inventée.** Ce qui manque devient une question `Q-xxx` dans
  `.team/questions/`, adressée au PO, et un badge `<a class="qmark" href="../questions.html#Q-xxx">Q-xxx</a>` à l'endroit concerné.
- **Du métier, pas du physique.** Le modèle conceptuel parle d'objets que l'utilisateur connaît
  (contrat, sinistre, assuré). Pas de clés techniques, de tables ni de types SQL : c'est le travail de
  l'architecte en P3.
- **Les messages s'écrivent au mot près**, avec les parties variables entre chevrons :
  « Le contrat <numéro> a été résilié ». La spec UX et les critères Gherkin les reprennent tels quels.
- **Les termes du glossaire sont repris au mot près.**
- **Des rôles, jamais des personnes**, et des données d'exemple fictives.

## Livrer

1. Copier le gabarit, remplacer `NOM_PROJET`, remplir chaque section. Les sections recommandées sans
   objet gardent une ligne de justification ; les facultatives sans objet se suppriment.
2. Vérifier la traçabilité : chaque `RG-xx` a au moins une story dans sa colonne Stories, chaque story
   de la release MVP qui porte une règle la cite.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/20-specs`.
4. Reporter les questions ouvertes dans `.team/questions/`, mettre le statut à `en revue` et
   signaler au PO que le livrable est prêt pour la passe de cohérence.
