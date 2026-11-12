---
name: livrable-pv-recette
description: Produit ou met à jour le procès-verbal de recette d'un sprint de la team ShipItRight (périmètre recetté, chemin de recette, résultats, réserves, anomalies acceptées, verdict et décision, reste au backlog), en page HTML à partir du gabarit. À utiliser par le PO à la pré-recette pour préparer le chemin de recette, puis pendant et après la recette G3 avec l'humain pour consigner les résultats et la décision.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : PV de recette

Le PV consigne ce que l'humain a vérifié et ce qu'il a décidé. C'est la trace du gate **G3** : sans PV
signé, le sprint n'est pas fini et `sprint/N` n'est pas mergé dans `main`.

- **Auteur** : PO. Avec l'humain (qui décide) et le QA (qui fournit la campagne et les anomalies).
- **Phase** : fin de sprint. Préparé à la pré-recette, complété pendant la recette **G3**.
- **Fichier** : `docs/50-recette/pv-sprint-N.html`.
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-pv-recette/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.

## Entrées à lire

- `docs/sprints/sprint-N.html` : objectif et stories engagées.
- `docs/40-qa/campagne-sprint-N.html` : verdict QA, résultats par scénario, anomalies ouvertes, et le
  commit recetté (section Passages), repris tel quel dans le périmètre.
- `docs/20-specs/stories/US-xxx-<slug>.html` des stories du sprint : critères Gherkin et jeux de données
  d'exemple `Dn`, base du chemin de recette.
- La recommandation du verdict QA (ordre de passage) et la remise à zéro de « Démo et recette » (dernière
  ligne des passages de la campagne).

## Deux temps

1. **Pré-recette (PO seul)** : périmètre, chemin de recette avec résultats attendus, anomalies ouvertes
   à présenter. La page part en recette avec ses sections résultats, réserves et verdict encore à
   compléter.
2. **Recette (PO et humain)** : l'humain déroule le chemin, le PO note le résultat obtenu de chaque
   étape, les réserves et la décision, au fil de l'eau.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Périmètre recetté | obligatoire | stories, version (branche et commit recetté, repris de la campagne, en lien vers `campagne-sprint-N.html#passages`), environnement et sa remise à zéro, date, participants, verdict QA de départ en lien |
| Chemin de recette | obligatoire | 15 minutes au plus : un tableau par parcours, étapes numérotées de bout en bout, qui visent les décisions prises par délégation (arbitrages PO), les limites acceptées et un parcours complet ; les autres scénarios renvoient à la campagne. Par étape : scénario `US-xxx/Sn` en lien, action et données à saisir, résultat attendu, résultat obtenu, statut (`ok`, `réserve` avec son `RES-xx`, `ko`) ; une ligne de fin de parcours nomme les scénarios sans étape et où la campagne les prouve |
| Résultats | obligatoire | par story : étapes, acceptée, acceptée avec réserves, refusée, commentaire de l'humain mot pour mot |
| Réserves | obligatoire | `RES-xx` (ancre de la ligne), écart constaté, story et étape, ticket (`BUG-xxx` existant ou `T-xxx` créé), échéance. Aucune : l'écrire |
| Anomalies ouvertes acceptées | obligatoire | majeures seulement : `BUG-xxx`, titre, acceptation écrite du PO dans la campagne, raison de l'humain, échéance. Aucune : l'écrire, en nommant les mineures reportées en réserves |
| Verdict et décision | obligatoire | accepté, accepté avec réserves, refusé ; formulation de l'humain entre guillemets ; décision (merge dans `main` au commit recetté, ou ce qui manque), décideur, date, ligne du journal ; même verdict dans la balise `<meta name="verdict">` (`accepte`, `accepte-avec-reserves`, `refuse`) |
| Reste au backlog | recommandé | stories non livrées, réserves et nouveaux besoins exprimés pendant la recette |

Chaque section porte son bloc (i) `info-body` (À quoi sert, Contenu, Pourquoi ce formalisme, Lire),
comme les autres livrables ; le gabarit les fournit, on ne les retouche pas.

Statut de la page : `préparé` à la pré-recette, `signé` avec la date après G3 (ou `refusé`). Le
verdict de l'humain se reporte aussi dans la balise `<meta name="verdict">` de l'en-tête : `accepte`,
`accepte-avec-reserves` ou `refuse` ; vide tant que la recette n'a pas eu lieu. La page de pilotage la
lit (Overview, tableau des gates, stories livrées) : elle dit la même chose que le callout du verdict.

**Réserve levée** : une réserve `RES-xx` est levée quand l'élément qui lui est lié, l'anomalie `BUG-xxx`
ou le ticket `T-xxx` créé pour elle, passe au statut `fait` au board. Le PV signé ne se réécrit pas ; la page de pilotage retire la réserve de son Hotspot
d'après le board.

## Règles de qualité

- **Le chemin de recette tient en 15 minutes au plus.** L'humain le joue en entier : il vise ce que lui
  seul peut juger, les décisions prises par délégation (arbitrages PO), les limites acceptées (réserves
  à venir, anomalies ouvertes, dettes du sprint) et un parcours complet de bout en bout. Les autres
  scénarios n'ont pas d'étape : la ligne de fin de parcours les renvoie aux résultats de la campagne.
- **Le chemin de recette se lit sans la team.** Chaque étape dit quoi faire à l'écran et ce qu'on doit
  voir, avec les mots de l'écran (messages `MSG-xx` au mot près) et des données fictives prêtes à
  saisir. Un chemin par parcours, pas un par scénario technique.
- **Les données viennent des jeux `Dn` des stories**, décalées à des dates postérieures à la recette
  sans changer le jour de la semaine (un jeu « vendredi » reste un vendredi). Les étapes s'enchaînent :
  une réservation créée à une étape sert de conflit à la suivante.
- **Un scénario que l'écran ne permet pas de provoquer n'a pas d'étape** (erreur technique, état
  passé) : la ligne de fin de parcours le nomme et renvoie aux résultats de la campagne.
- **L'ordre suit la recommandation du verdict QA** : l'humain juge d'abord sur l'écran ce qui deviendra
  une réserve. Le scénario recommandé par le verdict QA passe en tête de son parcours, juste après les
  étapes qui préparent ses données.
- **Le verdict est celui de l'humain**, pas celui du PO ni du QA. Le PO le consigne mot pour mot.
- **Une réserve devient un ticket** dans `.team/board/` avant la clôture du PV, et le PV cite son id.
- **Une anomalie mineure laissée ouverte au verdict devient une réserve `RES-xx`.** Son ticket est le
  `BUG-xxx` existant, resté au statut `backlog`. La réserve est levée quand ce `BUG-xxx` passe à `fait`.
- **Une anomalie majeure ouverte n'est acceptée que par l'humain**, avec une échéance. Elle seule a sa
  ligne dans « Anomalies ouvertes acceptées » : une anomalie n'est consignée qu'une fois.
- **Le PV ne recopie pas la campagne** : il cite son verdict, son commit recetté et ses résultats par
  scénario en lien.
- **Un besoin nouveau n'est pas une réserve.** Il va au backlog comme candidat de story, il ne bloque
  pas le verdict.
- **Refusé** : le PV dit ce qui manque pour accepter. Le sprint reste ouvert, `sprint/N` n'est pas mergé.

## Livrer

1. Pré-recette : copier le gabarit, remplacer `NOM_PROJET` et `N`, remplir le périmètre et le chemin
   (résultats attendus), lister les anomalies ouvertes.
2. Recette : compléter résultats, réserves, anomalies acceptées, verdict et décision avec l'humain.
3. Créer les tickets des réserves, noter les ids dans le PV, mettre à jour `.team/journal.md`.
4. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/50-recette`.
5. Statut `signé` avec la date, méta `verdict`, ligne `G3` dans le journal, page de pilotage
   régénérée. Prévenir le Scrum Master pour la review
   et la rétro.
