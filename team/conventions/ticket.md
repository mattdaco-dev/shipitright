# Ticket du board

Un fichier par ticket dans `.team/board/`, nommé `T-012-<slug>.md` (ou `BUG-003-<slug>.md`).
Le board local est la **source de vérité** des agents. Le board Notion, s'il existe, en est le miroir
pour l'humain, tenu par le PO (skill `shipitright:notion-board`).

Un ticket est une **tranche verticale** : il tient dans un contexte frais, se démontre seul et vaut un
cycle complet dev + revue. Une story qui touche back et front donne en général deux tickets reliés par
une opération du contrat d'API : le back la produit, le front la consomme. Les tickets se découpent au
sprint planning (SM et architecte) à partir des pages de la conception détaillée
(`docs/30-conception/detaillee/`) : endpoints, traitements, entités, vue par écran.

Le champ `contrat` dit si le ticket touche au contrat d'API :

- **`fige`** : le ticket produit ou consomme des opérations du contrat d'API, toutes figées (rien
  n'en sera retiré ni changé). Back et front partent en parallèle, le front travaille contre un mock
  tiré du contrat d'API ; le ticket front ne dépend pas du ticket back.
- **champ laissé vide** : le ticket ne touche aucune opération du contrat d'API.

Une opération provisoire ne donne pas de ticket : l'architecte la fige au sprint planning, sinon la
story qui la touche sort du sprint.

```markdown
---
id: T-012
titre: Créer une facture
role: dev-backend
instance: dev-backend-1
statut: pret          # backlog | pret | en-cours | en-revue | en-test | fait | bloque
sprint: 1
stories: [US-004]
depend_de: []
consomme: []
produit: ["EP-03 POST /factures", "EN-02 Facture"]
contrat: fige         # fige, ou vide si le ticket ne touche aucune opération du contrat d'API
branche: t-012-creer-facture
tours_revue: 0        # revues par un Relecteur frais, revues de fermeture comprises ; +1 à chaque ligne « rapport · T-xxx ← relecteur-n » du journal
notion_url:
---

## Brief
Comportement attendu, types et signatures, critères d'acceptation repris des stories,
hors périmètre. Scénarios `US-xxx/Sn` servis et jeux de données d'exemple de la story qui les
illustrent (`US-xxx/Dn`, en lien). Pas de chemins de fichiers de code.

## Rapport
Rempli par l'auteur (format rapport.md).

## Revue
Rempli par le Relecteur : verdict (ok | bloquant), constats numérotés.

## Rétro
Une ou deux lignes.
```

**Qui écrit quoi** : le PO crée le ticket (à partir du découpage du SM et de l'architecte), remplit le
frontmatter et change le statut. L'auteur remplit `Rapport` et `Rétro`. Le Relecteur remplit `Revue`.
Personne d'autre ne modifie le brief.

**Anomalie** : `BUG-xxx`, même format, avec en plus `severite: bloquante | majeure | mineure`,
`trouve_par`, `scenario` (au format `US-xxx/Sn`, ex. `US-006/S4`), étapes de reproduction, attendu, obtenu.
À l'ouverture, le QA crée la branche de correction `bug-xxx-<slug>` depuis `sprint/N` dans
`.worktrees/bug-xxx`, y commite le test de l'anomalie, rouge, puis supprime ce worktree ; le dev
rouvre la branche existante dans son worktree et corrige ; revue et merge comme un ticket
(`team/conventions/git.md`). Une anomalie mineure laissée ouverte au verdict reste au statut
`backlog` ; à la recette, le PO la reporte en réserve `RES-xx` du PV.

**Ticket e2e** : `T-xxx`, même format, avec en plus `type: e2e` et `role: qa`. Le SM en prévoit un par
lot de stories au sprint planning, dans la liste des tickets à créer, et le PO en crée le fichier ;
il est confié à une instance QA (`qa-1`, `qa-2`…) ; plusieurs instances QA
donnent plusieurs tickets `e2e`, chacun son worktree. `stories` : le lot ; `consomme` : les stories et
leurs scénarios (`US-006/S4`) ; `produit` : les tests e2e du lot ; `contrat` et `depend_de` vides. Il suit le circuit
normal : branche, worktree, section Revue, Relecteur frais, 3 tours au maximum, merge par le PO.
DoR propre : les stories du lot ont passé G1, les opérations qu'elles consomment sont figées, la
matrice de couverture de la stratégie de test est à jour pour le lot, et son brief cite les scénarios
`US-xxx/Sn` du lot avec les jeux de données d'exemple qui les illustrent.
