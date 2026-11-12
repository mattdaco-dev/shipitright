---
name: livrable-analyse
description: Produit ou met à jour le livrable "Analyse d'un chantier" d'un projet ShipItRight (question du chantier, constats, cas limites, benchmark, options comparées par critères pondérés, recommandation, questions et hypothèses), en page HTML à partir du gabarit, avec les balises meta que lit l'inventaire des analyses. À utiliser en phase P1, ou après G1 pour préparer une phase ou une release suivante, quand le PO confie un chantier d'exploration à un BA, ou quand une analyse doit être reprise après une réponse du PO ou un retour.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : analyse d'un chantier

Un chantier répond à **une question** que le cadrage laisse ouverte : comment se déroule tel parcours,
comment calculer tel montant, quelle solution existante reprendre. L'analyse rend des constats, les
options possibles et une recommandation argumentée, pour que le PO tranche et que les specs partent
sur une base vérifiée.

- **Auteur** : un BA par chantier, plusieurs chantiers en parallèle. **Contributeur** : Architecte,
  consulté sur la faisabilité des options.
- **Phase** : P1. Passe le gate **G1** avec les autres livrables de specs. Après G1, le PO peut ouvrir
  un chantier pour préparer une phase ou une release suivante (voir plus bas).
- **Fichier** : `docs/10-analyse/<chantier>.html`, avec `<chantier>` en kebab-case
  (`parcours-souscription.html`, `calcul-tarif.html`).
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-analyse/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.
- **Inventaire** : la page `docs/10-analyse/index.html` liste toutes les analyses (auteur, avancement,
  statut, cible (Pour), recommandation, ce qui reste ouvert, livrables impactés). Elle est générée par
  `${CLAUDE_PLUGIN_ROOT}/team/scripts/pilotage-pages.mjs` (skill `shipitright:livrable-pilotage`) depuis les pages d'analyse : le BA n'y
  écrit pas, il tient à jour l'en-tête et les balises meta de son analyse, qu'elle lit.

## Découpage en chantiers (PO)

Le PO découpe P1 en chantiers **indépendants** : chacun a sa question, ses entrées, son fichier, et
peut avancer sans attendre les autres. Découpages qui marchent : par phase de la big picture, par
grappe de hotspots, par sujet transverse (calcul, règle complexe, benchmark du marché). Deux chantiers
qui devraient se lire l'un l'autre sont en fait un seul chantier, ou deux chantiers en séquence.

Le brief du BA donne : le nom du chantier, la question, sa cible (la phase ou la release qu'il
prépare, reportée dans la meta `pour`), les entrées, la timebox (en nombre de passes ou en
périmètre), ce qui est hors du chantier.

## Chantier ouvert après G1

Le PO peut ouvrir un chantier après G1, pour préparer une phase ou une release suivante. Il suit le
même format et les mêmes règles qu'en P1 ; sa meta `pour` porte la phase ou la release visée. Les
stories qui en sortent suivent la règle des stories rédigées après G1 (`${CLAUDE_PLUGIN_ROOT}/PROCESS.md`, section 4, P2) :
le PO les valide (`Arbitrage PO`, statut `validee`) et les montre à l'humain au G3 suivant ; elles lui
remontent avant si elles changent le périmètre ou portent une règle métier forte.

## Entrées

- Le brief du chantier.
- `docs/00-cadrage/cadrage.html` et `docs/10-analyse/big-picture.html`.
- `.team/questions/` : questions et réponses déjà connues.
- Les autres analyses de `docs/10-analyse/` si le brief les cite (lecture seule, on n'y écrit pas).

## Cible, avancement, statut et auteur

**Cible** : la phase ou la release que le chantier prépare, champ « Pour » de l'en-tête et meta `pour`
(`P1`, `P2`, `P3`, ou une release `R2`, `R3`…). Un chantier de P1 porte `P1`. Un chantier ouvert après
G1 porte la phase ou la release qu'il vise, donnée par le brief du PO. L'inventaire en fait sa colonne
« Pour », et la page de pilotage montre une carte « Analyses de chantier » dans chaque colonne de
l'Overview qui a au moins un chantier. Dans l'en-tête, une phase s'écrit en texte (`<b>Pour</b> P2`)
et une release dans sa balise, selon la règle du glossaire sur les releases :
`<b>Pour</b> <span data-release>R2</span>`. Pour une cible autre que `P1`, le kicker de l'en-tête devient
« Analyse pour la release R2 » (ou « Analyse pour P2 »).

Une analyse porte deux échelles distinctes, chacune dans l'en-tête et dans une balise meta :

| Échelle | En-tête | Meta | Valeurs |
|---|---|---|---|
| Avancement du chantier | Chantier | `chantier` | `en-cours` (en cours : la timebox n'est pas épuisée, une passe reste à faire), `termine` (terminé), `restitue-partiel` (restitué partiel : timebox épuisée sans réponse complète) |
| Statut de la page | Statut | `statut` | `brouillon`, `en-revue` (en revue), `valide` (validé) |

L'avancement dit si le BA a fini, le statut si la page a passé sa revue et son gate. Un chantier
terminé peut rester en brouillon ; un chantier restitué partiel peut être validé.

**Auteur** : « IA » (meta `auteur` à `ia`) quand un agent de la team a traité le chantier, sinon le nom
de la personne qui l'a fait (meta `auteur` à ce nom). L'instance du BA n'apparaît pas dans la page :
elle reste tracée par le journal (lignes `dispatch` et `rapport`).

Balises à garder dans le `<head>`, cohérentes avec les champs Auteur, Statut, Pour et Chantier de l'en-tête :

```html
<meta name="type" content="analyse">
<meta name="auteur" content="ia">
<meta name="statut" content="brouillon">
<meta name="chantier" content="en-cours">
<meta name="pour" content="P1">
```

## Chantier trop flou : s'arrêter et restituer

Un chantier se traite comme un spike : il est **timeboxé**. Si la question ne peut pas recevoir de
réponse dans la timebox (entrées manquantes, question mal posée, sujet qui éclate en plusieurs), le BA
ne force pas. Il s'arrête et livre quand même l'analyse :

- avancement `restitué partiel` dans l'en-tête (meta `chantier` à `restitue-partiel`) et dans la
  section « Question du chantier » ;
- les sections obligatoires remplies avec ce qui est établi, le reste en `Q-xxx` ou en hypothèse ;
- dans la recommandation : ce qui manque pour conclure, et un redécoupage proposé si la question est
  trop large.

Une analyse partielle et honnête vaut mieux qu'une recommandation fondée sur des inventions.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| En-tête | obligatoire | la question du chantier dans le chapeau ; auteur (IA ou nom), statut de la page, cible (Pour), avancement du chantier, alignés sur les balises meta ; toutes les sources lues dans la ligne « Sources », en liens |
| Question du chantier | obligatoire | pourquoi elle se pose, ce qui est hors du chantier, timebox et avancement (en cours, terminé ou restitué partiel) |
| Constats | obligatoire | ce qui est établi, chaque constat numéroté `C1`, `C2` (ancre `id="C1"`) avec sa source en lien |
| Cas limites et exceptions | obligatoire | situations rares, erreurs, frontières, avec le comportement attendu ou une `Q-xxx` |
| Exploration des solutions | recommandé | pistes envisagées, benchmark de l'existant, en cartes : principe, forces, limites |
| Options comparées | recommandé | critères pondérés, score de 1 à 5 par option, total, option recommandée surlignée. Chantier descriptif sans choix : l'écrire |
| Recommandation | obligatoire | l'option ou la conclusion retenue, pourquoi, à quelles conditions, ce qu'il faut pour conclure si restitué partiel |
| Impacts sur les autres livrables | recommandé | ce que la recommandation change dans la big picture, la story map, les règles, l'UX, la conception ; chaque livrable de la première colonne en lien, que l'inventaire reprend |
| Questions et hypothèses | obligatoire | `Q-xxx` posées au PO, hypothèses `HYPOTHÈSE` prises pour avancer. Liste vide : l'écrire |
| Synthèse inter-chantiers | facultatif | liens et tensions avec les autres chantiers, quand le BA les a lus |

Pas de livrable `options` séparé : la comparaison vit dans chaque analyse, la synthèse entre chantiers
dans la section facultative ci-dessus ou dans la story map.

## Comparer les options

1. Choisir 3 à 6 critères tirés des objectifs et contraintes du cadrage (valeur pour le persona, coût
   de réalisation, risque, conformité, délai). Leur donner un poids de 1 à 3.
2. Noter chaque option de 1 à 5 sur chaque critère (`score s1` à `s5`), avec une justification courte
   quand la note n'est pas évidente.
3. Total = somme des notes multipliées par les poids. Surligner l'option recommandée (`tr.recommended`).
4. La recommandation peut contredire le total : dans ce cas, le dire et expliquer pourquoi.

Un critère de faisabilité technique se fait confirmer par l'architecte (post dans le forum, mention
`architecte`). Sans réponse, la note reste marquée `HYPOTHÈSE`.

## Règles de qualité

- **Un constat cite sa source**, en lien. Sans source, c'est une hypothèse et elle se marque comme telle.
  Les options, la recommandation et les impacts renvoient aux constats par leur numéro (`<a href="#C2">C2</a>`).
- **Le BA recommande, le PO tranche.** La recommandation est argumentée, la règle métier qui en
  découle n'est pas actée tant que le PO ne l'a pas validée.
- **Les cas limites ont un comportement ou une question**, jamais un blanc.
- **Les termes du glossaire sont repris au mot près.**
- **On reste dans la question du chantier.** Un sujet voisin découvert en route va en question ou en
  impact, pas en analyse supplémentaire.

## Livrer

1. Copier le gabarit sous `docs/10-analyse/<chantier>.html`, remplacer `NOM_PROJET` et `NOM_CHANTIER`,
   remplir chaque section, supprimer les exemples et les sections facultatives sans objet. Tenir les
   balises meta `auteur`, `statut`, `pour` et `chantier` alignées sur l'en-tête à chaque passe.
2. Créer les questions `Q-xxx` dans `.team/questions/` (champ `bloquant` renseigné).
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/10-analyse/<chantier>.html`.
4. Rapport : chemin du fichier, avancement (en cours, terminé ou restitué partiel) et statut de la
   page, recommandation en une ligne, questions créées, impacts à reporter dans les autres livrables.
   Le PO régénère ensuite l'inventaire avec la page de pilotage.
