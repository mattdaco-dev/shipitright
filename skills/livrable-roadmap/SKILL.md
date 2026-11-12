---
name: livrable-roadmap
description: Produit ou met à jour le livrable "Roadmap" d'un projet ShipItRight (releases et dates de recette, grille phases × releases × epics, estimation macro par mode de réalisation, composition de l'équipe, calendrier calculé par simulation avec comparaison des modes, dépendances et risques, changelog, calibrage), en page HTML à partir du gabarit. À utiliser en phase P2 quand le PO pose la première roadmap à partir de la story map, puis à chaque fin de sprint après la recette.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : roadmap

La roadmap dit **quand** on compte livrer quoi, avec quelle équipe, et ce qui peut faire glisser les
dates. Elle reprend les releases de la story map, les place dans une grille par phase et par release,
estime le travail et calcule un calendrier par simulation : ordonnancement sous contrainte de
capacité, puis Monte Carlo pour une date probable et une date prudente. C'est le document que le PO
montre à l'humain pour parler délais et équipe.

- **Auteur** : PO. **Contributeurs** : Scrum Master (calibrage, avancement réel), Architecte
  (estimation macro, dépendances techniques, risques).
- **Phase** : première version en P2, passe le gate **G1**. Mise à jour à chaque fin de sprint, après
  la recette G3.
- **Fichier** : `docs/roadmap.html`, à la racine de `docs/`. Les assets sont donc en
  `_assets/` (`doc.css`, `doc.js`, `plan.js`), la page de pilotage en `index.html` (pas de `../`).
- **Gabarit** : [`template.html`](template.html), à copier puis remplir. Copier, c'est lire
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-roadmap/template.html` avec Read, puis l'écrire à sa place dans le
  projet avec Write.
- **Exemple rempli** : `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/roadmap.html`.

## Entrées

- `docs/20-specs/story-map.html` : releases, objectifs, stories par release.
- `docs/20-specs/epics/` et `docs/20-specs/stories/` : epics (lignes de la grille), stories, dépendances,
  et la taille de chaque story (balises `taille`, XS à XL, et `front`, part front en %).
- `docs/00-cadrage/cadrage.html` : jalons, contraintes de calendrier, MEP souhaitée s'il y en a une.
- L'architecte et le SM pour l'estimation macro (travaux hors stories ; la taille et la part front
  d'une story se posent dans la story, pas dans la roadmap), les équipes externes pour leurs dates de
  livraison.
- À chaque mise à jour : `docs/sprints/sprint-N.html` (plan, review), `docs/50-recette/pv-sprint-N.html`,
  le journal `.team/journal.md`, le temps estimé et réel du sprint donné par le SM.

Le PO délègue la mise à jour au Scrum Master s'il préfère garder son contexte : le SM prépare, le PO
relit et valide.

## Contenu

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| Releases | obligatoire | pour chaque release : objectif (repris de la story map), date de recette G3 probable et prudente (`data-plan`), epics, nombre de stories, statut |
| Roadmap | obligatoire | grille : une colonne par phase P0 à P3, puis une par release (Later pour les stories sans release) ; ligne Livrables, puis une ligne par epic ; gates entre les colonnes (`data-gate`, voir Grille) |
| Estimation macro | obligatoire | disclaimer sur la source des estimations, définitions, un tableau par lot (conception, puis chaque release) avec son total, puis le total projet |
| Composition de l'équipe | obligatoire | hôte `.capa-team` : plan.js y rend l'équipe et l'effet d'un temps plein de plus ou de moins, mode par mode |
| Calendrier de réalisation | obligatoire | disclaimer, hypothèses, légende, configuration JSON du calendrier, hypothèse sur les gates |
| Dépendances et risques | obligatoire | dépendances internes et externes, risques sur le calendrier avec impact et parade. Aucun : l'écrire |
| Changelog | recommandé | à chaque mise à jour : ce qui a bougé, pourquoi, qui l'a décidé |
| Calibrage | facultatif | hôte `.capa-calib` : plan.js y liste les sprints mesurés et le facteur qui corrige les estimations |

Pas de section Now / Next / Later : la grille et le calendrier la remplacent. Pas de sprints dans la
grille ni dans l'estimation : le calendrier calcule les dates, le découpage en sprints se fait au
sprint planning.

## Les trois modes de réalisation

Toute la roadmap raisonne sur trois modes, dans cet ordre d'onglets ; « Humain assisté par IA » est
le mode par défaut, celui des dates citées dans le texte.

- **Humain** : développeurs sans assistance, tests compris.
- **Humain assisté par IA** : les mêmes avec un assistant de code ; une campagne QA automatisée par
  IA précède chaque recette.
- **IA en autonomie** : la team d'agents, en heures de travail ; l'humain garde les gates, la
  validation métier et la recette.

Dans tous les modes, la validation métier de chaque story et la recette reviennent au PO et à l'aide à
la recette (BA, gens du métier, testeurs). L'UX est une équipe transverse qui ne bloque jamais : elle
figure dans l'équipe, hors calcul.

## Estimation macro

Un seul bloc `.est` (réglage de l'échelle par la roue dentée, dans le navigateur du lecteur), avec un
`h4.est-title` et un `table.heat` par lot, puis un `table.est-sum` pour le total projet.

- **Colonnes** : Story ou travail, Taille, Front, puis le groupe « Réalisation selon le mode » (Humain
  en j, Assisté IA en j, IA en autonomie en heures d'agents), puis « Validation, recette » (j, tous
  modes).
- **Story** : `<tr data-size="M" data-front="60" data-rel="mvp">`, cellules vides `e-front`, `e-h`,
  `e-a`, `e-ag`, `e-hu`. Le premier lien de la ligne est l'identifiant de la story, que le calendrier
  reprend. `data-size` et `data-front` recopient les balises `taille` et `front` de la page de la story,
  seule source : la roadmap n'a pas de taille à elle, et une story qui change de taille change d'abord
  dans sa page. Une story XL se découpe avant d'entrer en sprint ; un spike n'a pas de taille, il garde
  son `timebox`.
- **Travail hors stories** (conception, socle, campagne QA et recette) :
  `<tr class="work" data-rel="mvp" data-items="qa-mvp recette-mvp">`, cellules vides. Les valeurs
  viennent des items du calendrier : on ne les écrit qu'une fois, dans la configuration.
- **Totaux** : `<tr class="total" data-rel="mvp">`, et `data-only="stories"` pour un sous-total des
  stories ; `<span data-est="mvp:h">` ailleurs dans la page, `*:h` pour tout le projet.
- **Source** : le callout du début dit d'où viennent les estimations. En P2, c'est l'estimation macro
  de l'architecte et du SM. Quand l'équipe aura estimé les stories dans l'outil du projet, ses
  estimations les remplacent et le callout le dit.

## Grille

Les gates se posent sur l'en-tête de colonne qu'ils closent : `<div class="rm-head" data-gate="G1"
data-gate-name="Validation de la conception fonctionnelle">`. Tant que le gate n'est pas franchi,
`data-gate` porte son seul nom (`G1`) ; franchi, il porte le code de la décision et sa date en ISO :
`data-gate="G1|validated|2026-10-12"` (`accepte` pour un G3). Ces codes ne se traduisent jamais ;
`data-gate-name` dit le gate en clair, dans la langue du projet, pour l'infobulle. La section porte
`data-section="roadmap"`, et l'en-tête de la page les métas `statut` (`brouillon`, `en-revue`, `valide`),
`date` (ISO) et `version`, alignées sur ses champs : la page de pilotage les lit, jamais le texte visible. Tous les
gates sont humains : la grille ne porte pas de décideur. Une colonne de release porte le G3 qui la
clôt, franchi quand toutes ses stories sont acceptées dans un PV signé, avec ou sans réserve.

## Calendrier de réalisation

Le calcul est dans `_assets/plan.js` ; la page ne porte que sa configuration, dans
`<div class="capa"><script type="application/json">…</script></div>`. Le schéma complet est en tête de
`plan.js`. L'essentiel :

- `start` : démarrage souhaité. Le travail restant ne démarre jamais avant aujourd'hui. `today` ne
  se met que pour figer un instantané (un exemple).
- `holidays` : jours non travaillés.
- `modes` : `humain`, `assiste` (`"default": true`), `ia`, chacun avec sa `note`.
- `profiles` : profils en équivalents temps plein. Les devs (`front`, `back`, `full`, `team: "dev"`,
  limités aux modes `humain` et `assiste`), l'aide à la recette (`recette`, `validation`), les agents
  (`unit: "h"`, mode `ia`), le PO (`fixed`, seul à tenir les gates) et l'UX (`fixed`, `calc: false`).
- `rules` : perte de coordination, personnes au plus par story, marge d'erreur, simulations,
  `calibration.sprints` : un `{ "sprint": N, "estimated": …, "actual": … }` par sprint mesuré, en
  heures d'agents. `estimated` : l'estimation des stories livrées ; `actual` : les heures d'agents de
  leurs tickets, du lancement de chaque agent à son rapport, revues et corrections comprises, relevées
  dans le journal (`.team/journal.md`).
- `releases` : chacune avec le gate G3 qui la clôt, et `due` seulement si le cadrage ou l'humain donne
  une MEP souhaitée.
- `items` : P0 fait (`start`/`end`), phases de conception (`d` par mode en jours, `work` en heures
  d'agents pour `ia`), revues de gate sur `gate`, gates (`gate: true`), livraisons externes (`team`,
  `deliver` = date qu'elles s'engagent à tenir, `duration` pour dessiner la barre), socle, campagne QA
  (`d` en assisté, agents en IA), recette (`work.all` sur `recette`).
- `storyDeps`, `storyAfter`, `storyGroup`, `groups` : dépendances et regroupements du planning.
- Après P3, un ticket `{ "id": "T-020", "story": "US-006", "work": {…} }` remplace la réalisation de
  sa story ; la story garde sa validation métier, après tous ses tickets.

Les essais du lecteur (équipe, dates, règles) restent dans son navigateur ; la configuration de la
page est la référence.

## Règles de qualité

- **La roadmap suit la story map.** Une release y a le même nom, le même objectif, les mêmes stories.
  Si on change le contenu d'une release, on change les deux.
- **La taille vient de la story.** `data-size` et `data-front` d'une ligne de story reprennent les
  balises `taille` et `front` de sa page ; un écart se corrige dans la roadmap, qui suit la story. La
  page backlog lit les mêmes balises.
- **Une seule source par donnée.** Les dates citées dans le texte passent par `data-plan`, les travaux
  hors stories par `data-items`, les sprints mesurés par `rules.calibration.sprints`. Jamais une date ni
  une charge recopiée à la main.
- **Le calendrier est une aide, pas un engagement.** Le disclaimer reste en tête de la section, et
  toute valeur posée à l'estime est dans les hypothèses.
- **Une MEP souhaitée vient du cadrage ou de l'humain.** Sans elle, `due` reste vide.
- **Le passé est vrai, le futur est une prévision.** Les livrables et les stories recettés passent en
  `done` d'après le PV de recette. Ce qui a glissé apparaît à sa nouvelle place, et le changelog dit
  pourquoi.
- **Un risque a une parade**, ou une question `Q-xxx` qui la cherchera.
- **On ne réécrit pas le changelog** : une mise à jour ajoute une ligne en tête.

## Livrer

1. Première version : copier le gabarit sous `docs/roadmap.html`, remplacer `NOM_PROJET`, remplir
   chaque section et la configuration du calendrier, supprimer les exemples.
2. Fin de sprint : passer en `done` ce qui est recetté, ajouter le sprint mesuré à
   `rules.calibration.sprints` (heures d'agents, chiffres de la page de sprint), après P3 remplacer les stories par leurs tickets, recaler les dates
   des équipes externes, ajouter une ligne au changelog, incrémenter la version et la date.
3. Vérifier : `node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs/roadmap.html`. Il contrôle
   aussi la configuration du calendrier (JSON, références, compétences sans profil).
4. Ouvrir la page : la synthèse du calendrier, le bloc « Profils en trop » et la comparaison des modes
   ne doivent rien signaler d'inattendu.
5. Rapport : chemin du fichier, version, dates probable et prudente des releases, ce qui a bougé
   depuis la version précédente, risques ouverts.
