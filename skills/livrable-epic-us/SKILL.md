---
name: livrable-epic-us
description: Rédige ou met à jour les epics, user stories et spikes d'un projet ShipItRight, en pages HTML avec métadonnées en balises meta (besoin, règles fonctionnelles, critères d'acceptation Gherkin, écrans du prototype, données d'exemple, notes techniques, checklist DoR), à partir des gabarits. À utiliser en phase P2 par le Business Analyst, par le QA pour les critères, par l'architecte pour les notes techniques en P3, ou quand une story doit être corrigée après un retour de G1 ou de revue.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : epics et user stories

Les stories sont l'unité de travail de la team : le Scrum Master et l'architecte les découpent en
tickets, les devs les implémentent, le QA teste leurs critères, le PO les reporte dans le board
Notion. Epics et stories sont des **pages HTML**, au même rendu que les autres livrables : l'humain
les lit depuis la story map, les agents les filtrent par leurs balises `<meta>`.

- **Auteur** : Business Analyst. **Contributeurs** : PO (priorité, arbitrages), QA (critères
  d'acceptation), Architecte (section « Notes techniques » et balise `endpoints`, en P3).
- **Phase** : P2. Passent le gate **G1**, validé par l'humain. Les notes techniques sont complétées
  en P3, avant le sprint planning. Une story rédigée après G1 (releases R2, R3…) est validée par le
  PO, puis montrée à l'humain au G3 suivant (voir « Statut et validation »).
- **Fichiers** :
  - `docs/20-specs/epics/EPIC-xx-<slug>.html`
  - `docs/20-specs/stories/US-xxx-<slug>.html` (stories et spikes)
  - les captures du prototype à côté de la story : `stories/US-xxx_<ce-qu-elle-montre>.jpg`
- **Gabarits** : [`template-epic.html`](template-epic.html), [`template-us.html`](template-us.html),
  [`template-spike.html`](template-spike.html). Copier, c'est lire le gabarit dans
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-epic-us/` avec Read, puis l'écrire à sa place avec Write.

`check-livrable.mjs` s'applique comme aux autres livrables (sections obligatoires, ancres des liens).
Une story est prête quand sa checklist **Definition of Ready**, en fin de page, est entièrement
cochée : le compteur à côté du titre affiche alors `9 / 9` en vert.

## Métadonnées et filtrage

Ce qu'un agent filtre est dans les balises `<meta>` de l'en-tête de la page, une valeur ou une liste
séparée par des espaces : `id`, `type`, `epic`, `statut`, `priorite`, `release`, `acteur`, `ecrans`,
`regles`, `endpoints`, `depend_de`, `taille`, `front`, `valide_par`, `valide_le`, `notion_url`.
Exemples :

```sh
grep -l 'name="epic" content="EPIC-02"' docs/20-specs/stories/*.html      # stories d'une epic
grep -l 'name="ecrans" content="[^"]*EC-04' docs/20-specs/stories/*.html  # stories qui touchent EC-04
grep -L 'name="statut" content="prete"' docs/20-specs/stories/*.html      # stories pas encore prêtes
```

Le bandeau visible (statut, priorité, release…) reprend les mêmes valeurs : les deux se mettent à jour
ensemble.

**Taille et part front : la story est la seule source.** La roadmap (estimation macro) et la page
backlog lisent les balises `taille` et `front` de la story. Une taille revue se corrige dans la story,
jamais dans la roadmap ni le backlog.

- `taille` : `XS`, `S`, `M`, `L` ou `XL`, la complexité relative de la story (barème plus bas, section
  « Taille »).
- `front` : un entier de 0 à 100, la part du travail de la story côté front, en %. Le back est le
  complément : `front` 40 vaut 40 % front et 60 % back. Une story purement back vaut 0, purement
  front 100. Le bandeau l'affiche « Front / back 40 / 60 ».

## Statut et validation

La balise `statut` prend une de ces valeurs, dans l'ordre du parcours :

| `statut` | Signification | Affiché sur la page backlog |
|---|---|---|
| `brouillon` | page rédigée, Definition of Ready incomplète | Rédigée |
| `prete` | Definition of Ready entièrement cochée | Prête |
| `validee` | validée par l'humain au G1, ou par le PO après G1 (voir ci-dessous) | Validée |
| `en-sprint` | engagée dans un sprint | En sprint N |
| `faite` | acceptée dans un PV signé | Livrée |
| `abandonnee` | retirée du backlog ; l'identifiant n'est pas réutilisé | barrée, hors comptes |

Qui valide :

- **Story rédigée avant G1** : validée par l'humain au gate G1. `valide_par` vaut `humain`,
  `valide_le` la date du G1.
- **Story rédigée après G1** (releases R2, R3…) : validée par le PO, au titre d'un arbitrage PO,
  puis montrée à l'humain au G3 suivant. `valide_par` vaut `po`, `valide_le` la date de la
  validation. Si la story change le périmètre ou porte une règle métier forte, le PO la remonte
  d'abord à l'humain : `valide_par` vaut alors `humain`.

Les balises `valide_par` (`humain` ou `po`) et `valide_le` (`AAAA-MM-JJ`, date ISO ; `JJ.MM.AAAA` reste lu sur un projet antérieur) restent vides tant que la
story n'est pas validée. Elles se renseignent quand `statut` passe à `validee`, avec la ligne
« Validée » du bandeau, et ne changent plus ensuite : une story en sprint ou faite garde qui l'a
validée et quand.

## Entrées à lire

1. `docs/20-specs/story-map.html` : activités, stories et releases. Une carte de la story map = une
   story, avec le même identifiant `US-xxx`.
2. `docs/20-specs/conception-fonctionnelle.html` : règles `RG-xx`, parcours, rôles et droits,
   messages au mot près.
3. `docs/20-ux/spec-ux-ui.html` et `prototype/` : écrans `EC-xx`, états, libellés.
4. `docs/00-cadrage/cadrage.html` : personas, glossaire.
5. `.team/questions/` : réponses déjà données par le PO.

## Contenu d'une user story

Les balises `<meta>` portent ce que les agents filtrent ; le corps porte ce qu'ils lisent.

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| En-tête | obligatoire | balises `<meta>` (voir plus haut), bandeau visible, et ligne **Sources** : les PF-xx, RG-xx, MSG-xx, EC-xx dont la story découle, en liens |
| Contexte | obligatoire | où on est dans le produit, ce qui existe, pourquoi ça ne suffit pas. 2 à 4 lignes |
| Besoin | obligatoire | « En tant que <un seul acteur>, je veux <capacité>, afin de <finalité livrée par cette story> » |
| Périmètre | obligatoire | dans la story, hors story (dépendances aval, parcours exclus) |
| Règles fonctionnelles | obligatoire | tableau d'invariants déclaratifs `R1`, `R2`… (ancres) ; une règle de gestion partagée cite son `RG-xx` en lien. Dans sa story, une règle s'écrit `R2` ; hors de sa story, `US-xxx/R2` (`US-006/R2`), en lien vers `…/US-xxx-<slug>.html#R2` |
| Critères d'acceptation | obligatoire | scénarios Gherkin numérotés et nommés, en texte brut dans `<pre class="gherkin">` ; chaque scénario devient une carte ancrée `#S1`, `#S2`…, citée `US-xxx/S1`, `US-xxx/S2`… |
| Écrans et prototype | obligatoire | écran `EC-xx`, état, lien vers le prototype, et une capture par état (`US-xxx_<slug>.jpg`). Story sans écran : l'écrire |
| Points à trancher | obligatoire | une ligne par question, avec son badge `Q-xxx`, l'hypothèse retenue et si elle bloque. Aucune : l'écrire |
| Definition of Ready | obligatoire | checklist en fin de fichier |
| Données d'exemple | recommandé | jeux de données fictifs pour le QA et les devs, séparés des critères, numérotés `D1`, `D2`… (ancre `id="Dn"` sur la ligne) ; hors de la story, un jeu s'écrit `US-xxx/D1`, en lien vers `…/US-xxx-<slug>.html#D1` |
| Notes techniques | obligatoire en P3 | rempli par l'architecte : bloc généré `gen:story-tech` (depuis `meta endpoints`), puis contraintes et tableau scénario, élément qui le sert, écran |
| Exigences transverses | recommandé | tableau catégorie (État, Accessibilité, Libellés, Performance, Sécurité), exigence, vérification (scénario en lien, test clavier, recette visuelle…) |

## Contenu d'une epic

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| En-tête | obligatoire | balises `<meta>` `id`, `statut`, `priorite`, `release`, `notion_url`, bandeau visible, ligne Sources |
| Contexte | obligatoire | le problème ou l'opportunité, à l'échelle du lot. 3 à 5 lignes |
| Intention | obligatoire | ce que le produit saura faire à la fin de l'epic, du point de vue de l'utilisateur |
| Périmètre | obligatoire | dans l'epic, hors epic |
| Conditions de sortie | obligatoire | checklist : à quoi on reconnaît que l'epic est terminée (conditions de clôture, pas des critères) |
| Points à trancher | obligatoire | arbitrages ouverts à l'échelle du lot, ou « aucun » |

**Une epic n'a pas de notes techniques** : la conception détaillée est organisée par objet, et ce
qui sert une story est dans les notes techniques de la story.

**Une epic ne liste pas ses stories** : la liste diverge dès le premier découpage. Les stories
portent `<meta name="epic" content="EPIC-xx">`, et la story map les montre.

Un **spike** (investigation) vit dans `stories/` avec un identifiant `US-xxx` et `<meta name="type" content="spike">`. Il se
juge sur sa réponse : question, pourquoi maintenant, timebox, livrable attendu, critères d'arrêt.

## Règles de rédaction

**Avant d'écrire**
- **Aucune règle métier inventée.** Ce qui manque devient une question `Q-xxx` dans
  `.team/questions/`, adressée au PO, listée en « Points à trancher » et signalée à l'endroit
  concerné par son badge `<a class="qmark" href="../../questions.html#Q-xxx">Q-xxx</a>`. Régénérer
  ensuite la page des questions (`node ${CLAUDE_PLUGIN_ROOT}/team/scripts/questions-page.mjs .`). Une story qui assume trois questions ouvertes vaut mieux qu'une story qui en cache trois.
- **L'acteur est un rôle, jamais une personne**, contexte compris. Dans les scénarios,
  « l'utilisateur » suffit quand le rôle est unique.
- Titre : une phrase à l'infinitif ou un groupe nominal, jamais « En tant que ».

**Les cinq erreurs à corriger à chaque rédaction**
1. **Du fonctionnel caché ailleurs que dans les règles et les critères** (données d'exemple, notes
   techniques, prototype). Tout comportement attendu remonte en règle ou en scénario.
2. **Plusieurs acteurs, un seul déclaré.** Un seul acteur dans le besoin ; les autres sont couverts
   par une règle explicite et un scénario dédié.
3. **Plusieurs parcours, un seul couvert.** Création et modification sont deux parcours. Si la règle
   vaut pour les deux, l'écrire ; sinon dire lequel est exclu.
4. **Un « afin de » que la story ne livre pas.** Si la finalité dépend d'un autre système, elle va en
   Contexte ou en Périmètre hors story. Le « afin de » se vérifie à la recette de la story.
5. **Un comportement décrit en négatif.** « Le champ ne doit pas être rempli » ne dit pas s'il est
   masqué, désactivé ou facultatif. Reformuler en positif, ou poser la question (badge `Q-xxx`).

**Critères d'acceptation**
- **Règle ou scénario ?** Un invariant qui vaut partout est une règle. Ce qui est observable dans un
  parcours donné est un scénario. Mettre un invariant en Gherkin multiplie les scénarios.
- Un scénario porte **un nom et un seul comportement**, numéroté à la suite : `Scénario 1 : <ce
  qu'il démontre>`. Un scénario inséré renumérote la suite. Le numéro sert en revue, en test et en
  recette. Il donne l'identifiant du scénario, `US-007/S4`, qu'un ticket, un test ou une campagne
  écrit en texte, en lien vers son ancre `US-007-<slug>.html#S4`.
- Dans le `<pre class="gherkin">`, écrire `&lt;` et `&gt;` pour les chevrons des parties variables.
- Structure complète : `Étant donné` / `Quand` / `Alors`. Jamais une cascade de `Alors` sans contexte.
- Les libellés visibles (message, bouton) sont entre guillemets, au mot près, repris de la
  conception fonctionnelle. Partie variable entre chevrons : « Le dossier <référence> a été clos ».
- Couvrir : le nominal, le cas bloqué, chaque acteur qui se comporte différemment, chaque parcours,
  le cas limite où la condition d'affichage cesse d'être vraie, et l'état d'erreur de l'écran.
- **Aucune donnée de test dans un critère** : ni nom, ni montant, ni date, ni référence. Décrire la
  condition en termes génériques (« un dossier clos », « une date postérieure à aujourd'hui »). Les
  valeurs concrètes vont dans « Données d'exemple ».

**Données d'exemple**
- Fictives, cohérentes avec `prototype/data.js` quand le proto les montre.
- Chaque jeu dit quel scénario il illustre (« Scénario 2 »). Les données n'ajoutent aucun
  comportement : si un jeu révèle une règle, elle remonte dans les règles.

**Notes techniques (architecte)**
- La balise `<meta name="endpoints">` liste les `EP-xx` qui servent la story : **obligatoire** dès
  la P3, c'est elle qui alimente la section.
- Le bloc `<!-- gen:story-tech --><!-- /gen -->` est rempli par
  `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/detaillee-pages.mjs docs/30-conception` (skill `shipitright:livrable-conception-detaillee`) :
  endpoints avec leur statut (opération figée ou provisoire), traitements, entités et schémas, en
  liens vers la conception détaillée. Ne jamais l'éditer ; `check-livrable` signale un bloc périmé.
- L'architecte écrit seulement, après le bloc, les **Contraintes** (transaction, idempotence,
  arbitrage, volumétrie, sécurité) et le **tableau scénario, élément qui le sert, écran** : une ligne
  par scénario `Sn`, avec l'endpoint, le traitement ou le code d'erreur qui le sert et l'écran ou le
  message où il se voit. C'est la couverture de la story, vérifiée à la passe de cohérence de G2.
- Pas de chemins de fichiers de code : ils vieillissent et trompent un agent frais.

**Taille**

La taille mesure la complexité relative de la story, pas une durée : elle ne dépend pas de qui
réalise (humain, assisté, agent). La roadmap lui associe des poids (estimation macro).

| Taille | Repère |
|---|---|
| `XS` | ajustement d'un écran ou d'un endpoint existant, sans règle nouvelle |
| `S` | un écran ou un endpoint simple, une ou deux règles |
| `M` | un écran et un endpoint, quelques règles |
| `L` | plusieurs écrans ou endpoints, ou une règle délicate (calcul, concurrence) ; tient encore dans un sprint, en trois tickets au plus |
| `XL` | ne tient pas dans un sprint, ou donnerait plus de trois tickets |

**Une story `XL` se découpe avant d'entrer en sprint, et avant G1 pour une release présentée au G1.** La Definition of Ready le vérifie : une
story `XL` ne peut pas être `prete`. Le découpage donne de nouvelles stories, avec de nouveaux
identifiants ; la story d'origine passe `abandonnee` ou garde la partie restante.

## D'une story aux tickets

Au sprint planning, le Scrum Master et l'architecte découpent chaque story en tickets `T-xxx` dans
`.team/board/` (format dans `${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 5). Le BA n'écrit pas les tickets, mais la story
doit permettre ce découpage sans retour en arrière.

- **Une story qui touche back et front donne en général deux tickets reliés par une opération du
  contrat d'API** : le ticket back `produit` les `EP-xx`, le ticket front les `consomme`. Les deux
  portent `stories: [US-xxx]`.
- **Opération figée** (`x-contract: fige` dans le contrat d'API) : back et front partent en
  parallèle, le front contre un mock. Pas de ticket sur une **opération provisoire** : l'architecte
  la fige au sprint planning, sinon la story sort du sprint.
- Une story purement front ou purement back donne un seul ticket.
- Le brief du ticket reprend les scénarios par leur identifiant (« couvre US-007/S1 à US-007/S4 »,
  en liens vers les ancres `#S1` à `#S4`) plutôt que de les recopier : la story reste la source.
- Une story qui donne plus de trois tickets est trop grosse : la redécouper.

## Captures du prototype

Une capture par écran et par état cité dans « Écrans et prototype », prise sur le prototype servi en
local, dans Chrome à 1440 × 900, puis rangée à côté de la story : `US-006_conflits.jpg`. Le nom dit ce
que montre la capture. Tant qu'elle manque, la page affiche un emplacement hachuré « capture à
prendre » et la DoR reste incomplète. Le BA les prend avec un Chromium headless à lui (Playwright),
pas avec le Chrome DevTools MCP réservé au PO, quand le prototype est prêt ; sinon il le note dans
son rapport et l'UX les produit.

## Livrer

1. Copier le gabarit (`template-us.html`, `template-epic.html` ou `template-spike.html`) vers
   `stories/US-xxx-<slug>.html` ou `epics/EPIC-xx-<slug>.html`, slug en kebab-case, identifiant de la
   story map. Remplacer `NOM_PROJET`.
2. Remplir chaque section et les balises `<meta>`, supprimer les commentaires et les sections
   facultatives sans objet. Une section recommandée sans objet garde une ligne qui le dit.
3. Prendre les captures du prototype.
4. Relire contre les cinq erreurs, puis cocher la Definition of Ready (`<li class="done">`). Statut
   `prete` quand tout est coché, `brouillon` sinon. Le BA ne passe jamais une story en `validee` :
   c'est le PO, qui renseigne alors `valide_par` et `valide_le` (section « Statut et validation »).
5. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/20-specs`.
6. Reporter les questions dans `.team/questions/`, régénérer la page des questions, et signaler au PO
   les stories prêtes. Il les reporte dans le board Notion et renseigne `notion_url`.
