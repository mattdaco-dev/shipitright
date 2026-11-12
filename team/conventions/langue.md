# Langue d'un projet

Un projet ShipItRight se rédige dans **une langue**, choisie au `projet-init` : tout le texte visible
des livrables, des pages générées, des prototypes et des questions à l'humain. La langue est ouverte :
`fr`, `en`, `de`, `pt-BR`, n'importe quel code BCP 47. Le plugin fournit les libellés `fr` et `en` ;
pour une autre langue, le PO traduit les libellés au `projet-init` (section 4).

Ce qui ne se traduit jamais, quelle que soit la langue : code, identifiants (`US-012`, `RG-03`,
`S2-A1`), noms de fichiers, messages de commit (anglais), attributs (`id`, `class`, `data-*`,
`<meta name>` et leurs valeurs codées), contenu des `<script type="application/json">`.

## 1. Où vit la langue

`.team/projet.json`, écrit par `init-projet.sh --lang <code>` :

```json
{ "langue": "de" }
```

Sans ce fichier (projet antérieur à la 0.4.0), la langue vaut `fr`.

Chaque livrable HTML porte la langue du projet sur sa racine : `<html lang="de">`. Les gabarits sont
écrits avec `lang="fr"` : l'agent qui copie un gabarit remplace la valeur.

## 2. Gabarits : la structure, pas le texte

Un gabarit donne la structure d'un livrable. L'agent qui le remplit rédige **tout le texte visible dans
la langue du projet**, titres de sections et étiquettes d'en-tête compris (`<b>Statut</b>` devient
`<b>Status</b>` en anglais). Il ne traduit ni les attributs ni les valeurs codées : ce sont eux que les
scripts lisent.

## 3. Ce que les scripts lisent : jamais du texte visible

Un script ou `check-livrable` ne repère jamais un champ, une section ou une valeur par son libellé
visible. Il lit :

| Quoi | Où | Exemple |
|---|---|---|
| Champ d'en-tête | `<meta name="<code>" content="<valeur>">` dans `<head>` | `<meta name="date" content="2026-10-02">` |
| Section | attribut `data-section="<code>"` sur la `<section>` | `<section class="section" data-section="results">` |
| Colonne d'un tableau | attribut `data-col="<code>"` sur le `<th>` | `<th data-col="nature">Nature</th>` |
| Valeur d'une cellule | attribut `data-value="<code>"` sur le `<td>` | `<td data-value="essai">trial for one sprint</td>` |
| Date | ISO `AAAA-MM-JJ` dans la méta ou `datetime` | `<time datetime="2026-10-02">2. Oktober 2026</time>` |

- Les codes nouveaux (`data-section`, `data-col`, noms de méta) sont en anglais, en kebab-case
  (`date_recette` et les autres noms de méta existants restent tels quels).
- Les **valeurs codées existantes** restent inchangées : `statut` (`brouillon`, `validee`, `faite`…),
  `verdict` (`favorable`, `defavorable`…), `data-level` (`obligatoire`…). Elles ne s'affichent jamais
  telles quelles : la page affiche leur libellé dans la langue du projet.
- Compatibilité : les scripts gardent leur ancienne lecture du texte français **en repli**, quand la
  méta ou l'attribut manque, pour les projets créés avant la 0.4.0. Le repli ne sert jamais pour un
  projet qui a un `.team/projet.json`.

## 4. Journal : la décision d'un gate

Une ligne de gate porte sa décision en code, juste après le gate, puis le texte libre dans la langue du
projet :

```
2026-10-02 14:10 · G1 · validated · conception fonctionnelle validée, retours P2 intégrés
2026-10-09 11:00 · G2 · changes-requested · trois retours sur l'API de réservation
2026-10-20 17:30 · G3 · accepte-avec-reserves · sprint 1 (RES-01, RES-02)
```

Codes : `validated`, `changes-requested` pour G0 à G2 ; pour G3, le code du `verdict` du PV
(`accepte`, `accepte-avec-reserves`, `refuse`). Les
autres lignes (`dispatch`, `rapport`, `incident`, `reprise`…) gardent leur type en français, qui est un
code, et leur texte dans la langue du projet.

## 5. Libellés des pages générées et des assets

Les libellés fixes (pages générées par les scripts, `doc.js`, `plan.js`) viennent de dictionnaires :

```
team/i18n/<langue>/<espace>.json      fournis par le plugin, langues fr et en
.team/libelles.json                   propres au projet : { "<espace>": { "<clé>": "…" } }
```

- Un dictionnaire est un objet plat `{ "<clé>": "<libellé>" }` ; la clé complète est
  `<espace>.<clé>`. Espaces : `common`, `pilotage`, `detaillee`, `adr`, `questions`, `doc`, `plan`,
  `gherkin`.
- Paramètres entre accolades : `"{n} stories sur {total}"`. Un libellé qui dépend d'un nombre est un
  objet de formes plurielles CLDR, choisi par `Intl.PluralRules` sur le paramètre `n` :
  `{ "one": "{n} story", "other": "{n} stories" }`.
- Pas d'accord composé à l'exécution (unité + participe accordé) : chaque phrase est une clé entière.
- Résolution d'une clé : `.team/libelles.json`, puis la langue exacte (`pt-BR`), puis sa langue de base
  (`pt`), puis `en`. Une clé absente partout s'affiche telle quelle et `check-livrable` le signale.
- Dates affichées : `Intl.DateTimeFormat` dans la langue du projet ; nombres : `Intl.NumberFormat`.

**Langue sans dictionnaire fourni** : au `projet-init`, le PO traduit les fichiers `team/i18n/en/*.json`
dans la langue du projet et écrit `.team/libelles.json`, en gardant clés et paramètres. Pour
l'espace `gherkin`, il reprend les mots-clés officiels de Gherkin pour cette langue.

**Côté navigateur** : `node <racine du plugin>/team/scripts/i18n-assets.mjs .` écrit
`docs/_assets/i18n.js` (`window.SIR_I18N = { lang, labels }`, espaces `common`, `doc`, `plan`,
`gherkin` déjà résolus). `init-projet.sh` le lance, `pilotage-pages.mjs` le relance à chaque
régénération. `doc.js` et `plan.js` le chargent depuis leur propre dossier avant de rendre quoi que ce
soit. Le prototype n'en dépend pas : la barre `proto-bar` a ses libellés `fr` et `en` et prend
`labels` pour une autre langue.

## 6. Code partagé

`team/scripts/lib/i18n.mjs` : `projectLang(dir)`, `loadLabels(dir, espaces)`, `makeT(lang, labels)`,
`formatDate(iso, lang, style)`, `writeClientI18n(dir)`. Les scripts l'importent, aucun ne recode sa
propre résolution.
