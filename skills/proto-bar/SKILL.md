---
name: proto-bar
description: Ajoute à un prototype HTML d'un projet ShipItRight la barre de commande du prototype, toujours identique (fond noir, liseré jaune, étiquette PROTOTYPE, états nominal, chargement et erreur, réinitialisation, libellés dans la langue du projet), plus les réglages propres au proto (layout, profil, variante…). À utiliser quand on crée, modifie ou met à jour un prototype HTML ou une maquette cliquable, sauf si l'utilisateur a refusé la barre pour ce proto, ou quand l'utilisateur dit "prototype", "proto HTML", "proto cliquable", "barre du proto", "proto-bar". Pas pour une page de démo qui n'est pas un prototype de produit.
allowed-tools:
  - "Bash(cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js *)"
  - "Read(/${CLAUDE_PLUGIN_ROOT}/**)"
---

But : que **tous les prototypes HTML se ressemblent par leur barre de commande**, quelle que soit la
session qui les produit. Seuls les réglages propres au proto changent, le reste est figé.

La barre n'appartient pas au produit maquetté : elle sert à piloter la démo (changer de profil, de
layout, d'état). Elle doit donc se distinguer nettement de l'interface montrée, ce que garantit son
style volontairement hors de tout design system.

**Quand l'ajouter** : à un prototype de produit (écrans maquettés, parcours cliquable). Pas à une
page HTML qui n'en est pas un (rapport, site d'export, démo technique d'une lib), ni à un proto
pour lequel l'utilisateur a dit qu'il n'en voulait pas : ce refus vaut pour la suite de ce proto,
ne pas la reproposer à chaque modification.

## 1. Copier le fichier, ne jamais le réécrire

Le composant tient en un fichier autonome, CSS inclus : `${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js`,
à côté de ce `SKILL.md`. Le plugin ShipItRight en est la source.

```sh
cp ${CLAUDE_PLUGIN_ROOT}/skills/proto-bar/proto-bar.js prototype/
```

- **Le copier tel quel** dans le dossier du prototype (à la racine du proto ou dans `assets/`).
  Pas de lien vers le plugin : un proto doit rester autonome, par exemple pour être publié tel quel
  sur un hébergement statique (GitHub Pages est le cas courant).
- **Ne jamais modifier la copie**, ni surcharger ses classes `.pb-*` depuis le CSS du proto. Si la
  barre doit évoluer, on le propose au dépôt ShipItRight, qui modifie ce fichier et incrémente la
  version de son en-tête ; on la recopie ensuite dans les protos concernés.
- Pas de réimplémentation « à la main » d'une barre qui ressemble : c'est précisément ce que le
  skill évite.

## 2. Brancher la barre

Charger le script **avant** celui du proto, puis appeler `ProtoBar.mount()` au démarrage.
`mount()` a besoin de `document.body` : appelé plus tôt (script dans le `<head>`), il attend
`DOMContentLoaded` pour s'afficher.

```html
<script src="proto-bar.js"></script>
<script src="app.js"></script>
```

```js
ProtoBar.mount({
  title: 'Réservation de salles, vision cible', // nom du proto
  version: 'v1',                          // version du proto, à incrémenter à chaque livraison
  date: '2026-09-29',                     // date de la version, au format AAAA-MM-JJ
  lang: 'fr',                             // langue du projet, code BCP 47 (.team/projet.json) ; 'fr' par défaut
  labels: { mock: 'données fictives' },   // facultatif : libellés fixes fournis ou surchargés
  dateFormat: 'dd.mm.yyyy',               // facultatif : 'dd/mm/yyyy', 'dd.mm.yyyy' ou 'yyyy-mm-dd'
  storagePrefix: 'reservation.',          // clés localStorage vidées par la réinitialisation
  onState: (state) => render(),           // 'ok' | 'loading' | 'error'
  onReset: () => location.reload(),       // facultatif, c'est le défaut
  controls: [
    { type: 'seg', id: 'layout', label: 'Layout', value: 'new',
      options: [['old', 'Ancien'], ['new', 'Nouveau']], onChange: (v) => setLayout(v) },
    { type: 'select', id: 'profile', label: 'Profil', value: 'member',
      groups: [{ label: 'Interne', options: [['member', 'Collaborateur'], ['facility', 'Responsable des locaux']] },
               { label: 'Externe', options: [['guest', 'Invité']] }],
      onChange: (v) => setProfile(v) },
    { type: 'button', id: 'tour', label: 'Rejouer la démo', onClick: () => startTour() },
  ],
});
```

- `lang` est la langue du projet, lue dans `.team/projet.json` (`langue`, `fr` sans ce fichier) :
  n'importe quel code BCP 47 (`fr`, `en`, `de`, `pt-BR`). Il bascule tous les libellés fixes de la
  barre (« données fictives », « Réglages », « États » et ses trois valeurs, « Réinitialiser le
  proto », libellé d'accessibilité).
- Libellés intégrés : `fr` et `en` (une variante prend ceux de sa langue de base : `fr-LU` prend
  `fr`). `labels` fournit ou surcharge les libellés, par clé : `tag`, `mock`, `settings`, `states`,
  `ok`, `loading`, `error`, `reset`, `region`. **Pour une autre langue, `labels` est obligatoire**,
  traduit depuis `.team/libelles.json` ou par le PO ; sans lui, la barre prend les libellés anglais
  et l'écrit en avertissement dans la console, avec la liste des clés manquantes.
- `dateFormat` vaut par défaut le format court de la langue, donné par `Intl.DateTimeFormat`
  (`05/10/2026` en `fr`, `10/05/2026` en `en`). Le fixer quand le design system impose un format
  (`dd.mm.yyyy` pour les projets qui l'utilisent). Une valeur inconnue de `dateFormat` ou un code
  de langue invalide est ignoré avec un avertissement dans la console, et la valeur par défaut
  s'applique.
- `ProtoBar.set(id, value)` resynchronise un réglage quand le proto le change lui-même, sans
  appeler son `onChange`. Si `mount()` attend encore `DOMContentLoaded` (script chargé dans le
  `<head>`), les appels à `set` sont mis en file et rejoués, dans l'ordre, dès que la barre est
  montée.
- Le sélecteur d'états est un réglage comme les autres, de clé réservée `__state` :
  `ProtoBar.set('__state', 'error')` met à jour le sélecteur et `ProtoBar.state`, **sans** appeler
  `onState` (le proto qui change d'état lui-même fait son propre rendu).
- `ProtoBar.state` donne l'état courant.
- Rappeler `mount()` remplace la barre (écouteurs et observateur compris, pas de doublon) et
  remet l'état à `ok` **sans** appeler `onState` : au proto de refaire son rendu nominal s'il en a
  besoin. Les valeurs choisies dans les réglages sont conservées : la barre les écrit dans les
  `opts` passés (`def.value` est modifié), donc remonter avec les mêmes `opts` retrouve les choix
  courants. Pour repartir des valeurs initiales, passer de nouveaux `opts`.
- La barre porte l'attribut `data-proto-bar` : au montage, seule une barre précédente qui le porte
  est retirée, jamais un élément du proto qui utiliserait la classe `.pb`.
- La barre fait **toujours 56 px** de haut, à toutes les largeurs, et reste collante en haut. Elle
  expose cette hauteur dans `--proto-bar-h` : s'en servir pour décaler les éléments `sticky` du proto
  (`top: var(--proto-bar-h)`), jamais une valeur en dur.
- La barre passe au-dessus de tout (`z-index: 2147483647`, le maximum). Les **overlays du proto** (modales, panneaux
  latéraux, voiles) doivent donc **démarrer sous elle** : `inset: var(--proto-bar-h) 0 0 0` au lieu
  de `inset: 0`, sinon leur en-tête et leur bouton de fermeture passent dessous.

Chaque écran du prototype porte son identifiant `EC-xx` (id du conteneur ou route `#EC-xx`), celui
de la spec UX/UI (skill `shipitright:livrable-spec-ux-ui`).

## 3. Ce qui est figé, ce qui est libre

**Figé, présent dans toutes les barres, dans cet ordre** (libellés français ci-dessous, dans la
langue de `lang` sinon) :

1. l'étiquette **PROTOTYPE**, le titre, puis « données fictives · version · date » ;
2. les **réglages propres** au proto ;
3. le sélecteur **États : Nominal / Chargement / Erreur** ;
4. le bouton **Réinitialiser le proto**, toujours en dernier.

**Libre :** la liste des réglages propres (`seg` pour 2 à 4 choix, `select` au-delà, `button` pour
une action ponctuelle). Libellés courts, dans la langue du proto (la même que `lang`), un nom par
réglage (« Profil », « Layout », « Variante », « Alertes »).

## 4. Les trois états sont un contrat

Le sélecteur d'états est toujours là, donc **le proto doit les rendre** :

- **Chargement** : squelettes à la place et à la hauteur du contenu attendu ;
- **Erreur** : message d'erreur qui nomme la cause et propose une issue (`Réessayer`). Si l'écran
  est composé de blocs indépendants, ne faire tomber qu'une partie des blocs, pour montrer que
  l'erreur d'un bloc n'emporte pas les autres ;
- **Nominal** : l'écran normal.

Un proto qui n'a pas encore ses états les traite quand même : au minimum un squelette global et un
message d'erreur global, plutôt qu'un sélecteur qui ne fait rien.

## 5. Réinitialisation

« Réinitialiser le proto » vide les clés `localStorage` qui commencent par `storagePrefix`, puis
appelle `onReset` (rechargement de la page par défaut). **Sans `storagePrefix`, rien n'est vidé**
(la barre l'écrit en avertissement dans la console) : le donner dès que le proto stocke quelque
chose. Préfixer **toutes** les clés du proto, pour qu'une réinitialisation remette vraiment la démo
à zéro sans toucher aux autres protos servis depuis le même domaine.

## 6. Largeur réduite

La barre ne passe jamais à la ligne. Quand les réglages ne tiennent plus à côté du titre, ils
basculent un par un, **en partant de la fin**, dans un menu déroulant ouvert par le bouton
**Réglages** ; l'ordre de la section 3 est conservé entre la barre et le menu. Sous 900 px, la ligne
« données fictives · version · date » disparaît et le titre se tronque. Le menu se ferme par Échap
ou par un clic à l'extérieur. Rien à faire côté proto.

## 7. Vérifier

Avant de livrer le proto :

- la barre s'affiche en haut, identique aux autres protos (même fichier, même version), dans la
  langue du proto ;
- chaque réglage propre agit sur l'écran ;
- les trois états rendent quelque chose de visible ;
- « Réinitialiser le proto » ramène à l'état initial ;
- en 390 px, la barre fait 56 px et le bouton Réglages déplie bien les réglages.
