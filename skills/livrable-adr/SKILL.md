---
name: livrable-adr
description: Rédige ou fait évoluer les décisions d'architecture (ADR) d'un projet ShipItRight, une page HTML par décision avec métadonnées en balises meta (statut, date, remplace, répond à, écart au socle ; écart au socle, contexte, décision, raison et options écartées, conséquences), et régénère le registre docs/adr/index.html. À utiliser par l'Architecte en P3 et au fil de l'eau, dès qu'un choix structurant est pris, qu'un écart au socle de stack doit remonter à l'humain, ou qu'une décision acceptée doit être remplacée.
allowed-tools:
  - "Bash(node ${CLAUDE_PLUGIN_ROOT}/team/scripts/*)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

# Livrable : décisions d'architecture (ADR)

Un ADR consigne **un choix structurant et son pourquoi**, pour qu'une personne qui arrive sur le projet
dans trois mois ne rouvre pas un débat tranché. Les ADR sont des **pages HTML**, au même rendu que les
autres livrables ; le **registre** `docs/adr/index.html` est généré depuis leurs balises `<meta>`.

- **Auteur** : Architecte. Le PO remonte à l'humain chaque ADR « proposé » qui porte un écart au socle.
- **Phase** : P3, puis au fil de l'eau (sprint planning, forum technique). Vérifiés au gate **G2**.
- **Fichiers** : `docs/adr/NNNN-<slug>.html`, registre `docs/adr/index.html` (généré).
- **Gabarit** : [`template-adr.html`](template-adr.html) ; le copier, c'est le lire dans
  `${CLAUDE_PLUGIN_ROOT}/skills/livrable-adr/` avec Read, puis l'écrire à sa place avec Write. Exemple :
  `${CLAUDE_PLUGIN_ROOT}/team/exemples/formats/docs/adr/`.

## Quoi consigner

**Un ADR** pour un choix durable qui structure le code ou le coûte cher à défaire : framework ou
bibliothèque majeure, persistance d'une entité, style d'architecture, découpage en modules, conventions
du contrat d'API, authentification et sécurité, stratégie de concurrence, rupture d'une opération figée
(`CF-58`), **tout écart au socle de stack**.

**Pas d'ADR** pour un détail d'implémentation, un choix réversible sans coût, ce qu'un invariant `CF-xx`
ou le socle fixent déjà, ce qui relève du message de commit. Test : un dev qui arrive aurait-il besoin
du pourquoi ? Sinon, pas d'ADR. Avant d'en écrire un, vérifier dans le registre qu'il n'existe pas : une
décision qui change en remplace une autre.

## Statuts et cycle de vie

| Statut | `meta statut` | Sens | Passe à |
|---|---|---|---|
| proposé | `propose` | décision rédigée, pas encore appliquée. **Obligatoire pour un écart au socle**, que le PO remonte à l'humain ; ne s'applique qu'une fois acceptée | accepté, abandonné |
| accepté | `accepte` | décision en vigueur ; choix laissé ouvert par le socle, ou écart validé par l'humain | remplacé |
| remplacé | `remplace` | une décision acceptée plus récente la remplace | (final) |
| abandonné | `abandonne` | proposition non retenue | (final) |

**Immuabilité** : un ADR accepté ne se réécrit pas. Pour changer la décision, on écrit un **nouvel ADR**
qui la remplace (`meta remplace`). Sur l'ancien, seules deux choses changent : `meta statut` passe à
`remplace` et `meta date` prend la date du remplacement ; le générateur écrit le reste (« Remplacé
par », bandeau). Un ADR « proposé » ou « abandonné » peut se corriger tant qu'il n'est pas accepté. Un
numéro n'est jamais réutilisé, même après abandon.

Remplacement proposé : le nouvel ADR est `propose` avec `meta remplace` ; l'ancien reste `accepte` et
s'applique, le générateur le signale par un bandeau. À l'acceptation du nouveau, l'ancien passe à
`remplace` (erreur du générateur sinon).

## Métadonnées

Lues par `${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs`, qui écrit l'en-tête visible de la page (bloc
`<!-- gen:adr-meta -->`) et le registre. Elles ne se recopient pas ailleurs dans la page.

| Balise | Valeur | Niveau |
|---|---|---|
| `id` | `ADR-NNNN`, les quatre chiffres du nom de fichier | obligatoire |
| `titre` | le titre, identique au texte du `h1` après « ADR-NNNN : » | obligatoire |
| `statut` | `propose`, `accepte`, `remplace`, `abandonne` | obligatoire |
| `date` | `AAAA-MM-JJ`, date du dernier changement de statut | obligatoire |
| `ecart_socle` | `oui` ou `non` | obligatoire |
| `remplace` | les `ADR-xxxx` que cette décision remplace, séparés par des espaces ; vide sinon | obligatoire si elle remplace |
| `repond_a` | les `Q-xxx` auxquelles elle répond ; vide sinon | recommandé |

« Remplacé par » n'est pas une balise : il se calcule depuis `remplace` de la décision qui remplace,
écrit une seule fois.

```sh
grep -l 'name="statut" content="propose"' docs/adr/*.html                     # ADR en attente
grep -l 'name="ecart_socle" content="oui"' docs/adr/*.html                     # écarts au socle
```

## Contenu d'un ADR

| Section | Niveau | Ce qu'on y attend |
|---|---|---|
| En-tête | obligatoire | balises `<meta>`, `h1` « ADR-NNNN : titre » (deux-points selon la typographie de la langue), bloc `<!-- gen:adr-meta --><!-- /gen -->` (statut, date, remplace, remplacé par, répond à, écart au socle), rempli par le générateur |
| Écart au socle | obligatoire | une ou deux phrases. Non : ce que le socle dit du sujet et pourquoi la décision le respecte. Oui : la règle ou l'invariant `CF-xx` écarté, sa portée ; l'ADR reste « proposé » jusqu'à l'accord de l'humain |
| Contexte | obligatoire | le problème, les contraintes (cadrage, socle, `RG-xx`), le volet de la question `Q-xxx` traité ; prose courte |
| Décision | obligatoire | liste, une affirmation par choix, à l'affirmatif ; numérotée quand l'ordre compte |
| Raison | obligatoire | arguments de la décision en liste, puis `table.options` : une ligne par option écartée et pourquoi. Au moins une option |
| Conséquences | obligatoire | `dl.defs` à trois termes fixes : **Positif**, **Négatif**, **Suites** (actions et qui les porte, ou « aucune »), repérés par `<dt data-value="positive">`, `negative`, `next` |

Le générateur repère chaque section par son attribut `data-section` (`socle-deviation`, `context`,
`decision`, `rationale`, `consequences`), jamais par son titre : le titre et les termes visibles
s'écrivent dans la langue du projet, les attributs restent tels quels.

Chaque section garde son **(i)** du gabarit : `<div class="info-body" hidden>` juste après le `h2`, avec
une `<dl class="defs">` **À quoi sert**, **Contenu**, **Pourquoi ce formalisme**, puis au besoin
**Lire**. Il se recopie tel quel.

## Règles de rédaction

- **Toute référence est un lien** vers l'endroit où l'élément est défini, cible de `${CLAUDE_PLUGIN_ROOT}/team/glossaire.md`,
  depuis `docs/adr/` : `../20-specs/conception-fonctionnelle.html#RG-01`,
  `../questions.html#Q-001` (classe `qmark`), `../30-conception/detaillee/endpoints/EP-01.html`,
  `../30-conception/detaillee/transverse/conformite.html#CF-60`, un autre ADR par son fichier
  (`0002-<slug>.html`), un code d'erreur vers `../30-conception/detaillee/transverse/erreurs.html#CODE`.
  Un identifiant dont la cible n'est pas encore produite est un lien vers sa cible prévue
  (avertissement de `check-livrable.mjs`). Un socle du projet (`.team/socles/`) est un lien ; une
  source externe qu'il désigne (dépôt, URL, MCP) se cite en `<code>`, telle que son manifeste l'écrit.
- **Aucune règle métier inventée** : une décision qui dépend d'une réponse métier attend la réponse
  (`Q-xxx`) ou pose une hypothèse visible dans « Décision » et la cite dans « Conséquences ».
- **Une décision par ADR.** Une question qui appelle deux choix indépendants (framework et concurrence)
  donne deux ADR qui répondent à la même `Q-xxx`.
- **Négatif honnête** : chaque option a un coût ; l'écrire, même faible.
- Une décision qui touche le contrat d'API, la conformité ou la conception les fait évoluer : ces
  livrables citent l'ADR en lien, et l'ADR cite dans « Suites » ce qu'il faut y reporter.
- Pas de chemin de code, pas de commit, pas de pointeur vers l'ADR dans un fichier d'instructions de
  Claude Code (`CLAUDE.md` du projet) : le registre `docs/adr/index.html` suffit.

## Commandes

```sh
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs docs            # remplit les en-têtes, génère adr/index.html
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/adr-pages.mjs docs --check    # vérifie sans écrire
node ${CLAUDE_PLUGIN_ROOT}/team/scripts/check-livrable.mjs docs       # lance aussi adr-pages --check
```

Le générateur sort en erreur (code 1) sur : nom de fichier ou `id` faux, statut ou date invalide,
`h1` différent de `titre`, section obligatoire absente, « Raison » sans option écartée,
« Conséquences » sans Positif ou Négatif, bloc `gen:adr-meta` absent, ADR remplacé inconnu, ADR
`remplace` sans décision acceptée qui le remplace, ADR remplacé par une décision acceptée resté à un
autre statut, page à régénérer (`--check`). Il avertit sur : section sans (i), identifiant cité sans
lien alors que sa cible existe, `Q-xxx` absente de `questions.html`, « Suites » absent, ADR ou index
encore en Markdown. Il est idempotent.

## Livrer

1. Prendre le prochain numéro libre (registre), copier le gabarit en `docs/adr/NNNN-<slug>.html`, slug
   en kebab-case, remplacer `NOM_PROJET` et `ADR-NNNN`.
2. Renseigner les balises `<meta>` ; `propose` pour un écart au socle, sinon `accepte` quand le choix
   est laissé ouvert à l'architecte par le socle et le cadrage.
3. Remplir chaque section, références en liens, garder les (i), laisser le bloc `gen:adr-meta` vide.
4. Pour un remplacement : `meta remplace` dans le nouvel ADR ; à son acceptation, `statut` et `date` de
   l'ancien, rien d'autre.
5. Générer, puis `check-livrable.mjs` sur `docs/` : 0 erreur, 0 KO.
6. Lier l'ADR depuis les livrables qu'il touche, là où il justifie un choix (stack, persistance,
   sécurité de la conception macro ; conformité, contrat d'API, détaillée). La section « Décisions
   d'architecture » de la macro ne liste pas les ADR : elle renvoie au registre `docs/adr/index.html`,
   qui se régénère (étape 5).
7. Rapport : ADR « proposé » à remonter à l'humain (écarts au socle en tête), remplacements faits.
