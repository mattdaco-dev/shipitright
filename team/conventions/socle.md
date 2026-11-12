# Convention : socles

Le plugin ShipItRight n'embarque aucune stack ni aucun design system : ils sont propres à
l'utilisateur. La team les reçoit sous forme de **socles** : un dossier qui dit où se trouve la
référence et ce qu'elle impose. Un projet déclare ses socles au cadrage ; ses livrables renvoient au
socle et ne décrivent plus que les écarts et les compléments.

Un socle vient de l'une de ces deux origines :

- **Une source de l'utilisateur** : sa stack ou son design system existe déjà ailleurs (dossier local,
  dépôt git, serveur MCP, skill, URL de documentation). Au cadrage, le PO la lui demande. Le projet
  en garde un manifeste dans `.team/socles/<type>/<nom>/socle.md`, qui pointe vers la source et dit
  comment un agent y accède.
- **Un socle créé dans le projet** : l'utilisateur n'en a pas, ou pas d'adapté. Le PO décide avec lui
  au cadrage qu'il sera créé : la stack par l'architecte en P3, le design system par l'UX en P2. Il
  est validé au gate (G2 pour une stack, G1 pour un design system).

Dans les deux cas, le socle vit dans le projet, sous `.team/socles/`, et se versionne avec lui.

Deux types de socle :

| Type | Dossier | Ce qu'il impose | Lu par |
|---|---|---|---|
| Stack | `.team/socles/stacks/<nom>/` | couches et versions, organisation du code, invariants de conformité, outillage, commandes de build et de test | Architecte, devs, QA, Relecteur, Scrum Master |
| Design system | `.team/socles/design-systems/<nom>/` | principes, tokens, composants, grille et responsive, accessibilité, ton des libellés, formats de données | UX, Dev frontend, BA (messages, formats), QA, Relecteur |

## Contenu d'un socle

```
.team/socles/<type>/<nom>/
  socle.md          manifeste, obligatoire
  conformite.md     invariants CF-xx du socle (stack : obligatoire ; design system : recommandé)
  tokens.css        design system : les tokens en variables CSS, repris par le prototype et le front
  proto-alias.css   design system : relie les variables du kit de prototype aux tokens du DS
  composants.md     design system : catalogue des composants, quand le socle n'en a pas ailleurs
  source/           clone local ou lien symbolique vers la référence, ignoré par git
```

Un socle peut tout porter lui-même (fichiers du dossier), ou seulement pointer vers la référence :
un dossier local, un dépôt distant, un serveur MCP, un skill, une URL de documentation. Le manifeste
dit lequel, et comment un agent y accède.

## Manifeste `socle.md`

```markdown
---
type: stack | design-system
nom: <slug du dossier>
version: <version de la référence, ou date>
statut: actif | exemple | à compléter
---

# Socle : <Nom lisible>

<Une phrase : ce que c'est, pour quels projets.>

## Sources

| Source | Type | Accès | Contenu |
|---|---|---|---|
| <nom> | dossier, git, mcp, skill, url | chemin, URL du dépôt, nom du serveur ou du skill | ce qu'on y trouve |

## Ce que le socle fournit

<Stack : couches et versions, organisation du code, invariants, outillage, commandes.>
<Design system : principes, tokens, composants, responsive, accessibilité, ton, formats.>
Une ligne par élément, avec l'endroit où le lire (fichier du socle ou source).

## Prototype

<Design system seulement.> Les fichiers à copier dans `prototype/ds/` : `tokens.css` et
`proto-alias.css` au moins, plus la feuille ou le bundle de composants si le DS en fournit un
utilisable sans build. Dire quels composants le proto prend du DS et lesquels restent des
remplaçants du kit.

## Par rôle

| Rôle | Ce qu'il lit | Ce qu'il en tire |
|---|---|---|

## Écarts

Ce qu'un projet peut surcharger, et comment : un écart à la stack passe par un ADR au
statut proposé (`propose`) et remonte à l'humain ; un écart au design system se justifie dans la spec UX/UI.
```

## Côté projet : `.team/socle.md`

Chaque projet déclare ses socles dans `.team/socle.md`, rempli au cadrage par le PO. Chaque socle
est un lien relatif vers son manifeste dans `.team/socles/` :

```markdown
# Socles du projet

| Type | Socle | Version | Statut |
|---|---|---|---|
| Stack | [api-kotlin](socles/stacks/api-kotlin/socle.md) (source de l'utilisateur : dépôt git) | 3.2 | retenu G0 |
| Design system | [salles-ds](socles/design-systems/salles-ds/socle.md) (créé dans le projet) | 0.1.0 | créé en P2, validé G1 |

## Surcharges du projet

Ce qui change par rapport aux socles, avec sa source (ADR, décision de l'humain, spec UX/UI).
```

Un projet sans design system : l'UX en crée un minimal en P2 dans `.team/socles/design-systems/<nom>/`
(manifeste, `tokens.css`, `composants.md`) et le PO le déclare dans `.team/socle.md` ; l'humain le
valide à G1. Un projet sans stack fournie par l'humain : l'architecte crée le socle de stack en P3
dans `.team/socles/stacks/<nom>/`, l'humain valide la stack à G2. Exemple de design system créé dans
un projet, fictif : `team/exemples/formats/socles/design-systems/reservation-salles/`.

## Règles

- **Un livrable ne recopie pas un socle.** Il le cite (`socle salles-ds, composant Tableau`) et ne
  décrit que l'écart ou le complément propre au produit.
- **Le socle prime sur l'habitude de l'agent.** Une convention lue dans le socle l'emporte sur une
  pratique générale du rôle ; un agent qui veut s'en écarter le dit dans son rapport.
- **On ne parcourt pas une source de sa propre initiative au-delà du besoin** : un agent lit dans le
  socle ce que son ticket ou son livrable demande.
- **Un clone ou un lien symbolique va dans `source/`** et ne se commite pas (`init-projet.sh` ignore
  `.team/socles/*/*/source` dans le projet). Le manifeste dit comment le recréer.
- **Numérotation des invariants** : `CF-01` à `CF-49` pour le socle de stack (back, puis front),
  `CF-50` à `CF-59` pour les invariants transverses du framework, `CF-60` à `CF-69` pour le projet,
  `CF-70` à `CF-79` pour le design system.
- **Le projet reprend les invariants du socle par référence.** Son contrat de conformité, page
  `docs/30-conception/detaillee/transverse/conformite.html`, ne recopie pas le `conformite.md` du
  socle : il y renvoie (sections `#socle-de-stack` et `#design-system`, cibles des liens vers un
  `CF-xx` de socle) et ne liste que les invariants écartés, chacun avec son ADR.
