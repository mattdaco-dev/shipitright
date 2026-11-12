# Forum et questions

## Forum

Pour tout échange entre agents qui n'est pas une question métier : désaccord technique, précision d'un
contrat, signalement d'un risque. Un fichier par sujet dans `.team/forum/`, nommé
`AAAA-MM-JJ-<slug>.md`. **Posts en ajout seulement**, jamais de réécriture d'un post existant.

```markdown
---
sujet: Format des montants dans l'API
ouvert_par: dev-frontend-1
mentions: [architecte]
statut: ouvert        # ouvert | resolu
lie_a: [T-014, US-006]
---

### [dev-frontend-1] 2026-10-01 14:32
Le contrat expose les montants en `number`. Arrondis côté front ou chaîne décimale ?

### [architecte] 2026-10-01 15:10
Chaîne décimale, ADR-0004. `openapi.yaml` mis à jour.
→ résolu
```

Les agents ne tournent pas en continu : le forum est asynchrone d'une vague à l'autre. Après chaque
vague, le PO relève les sujets ouverts et les met dans le brief du prochain agent mentionné. Celui qui
clôt un sujet ajoute `→ résolu` et passe `statut: resolu`.

## Questions métier

Adressées au PO, dans `.team/questions/Q-007-<slug>.md`.
Après avoir créé une question ou écrit sa réponse, régénérer la page de lecture, vers laquelle pointent
les livrables (`questions.html#Q-007`) :

```sh
node <racine du plugin>/team/scripts/questions-page.mjs .
```

```markdown
---
id: Q-007
de: business-analyst-2  # instance qui pose la question ; nom de la personne pour un chantier mené hors de la team
statut: ouverte       # ouverte | repondue | remontee
bloquant: non         # oui | non
lie_a: [US-012, RG-08]
---

## Question
<une seule question, fermée si possible, avec la réponse pressentie>

## Contexte
<pourquoi elle se pose, ce qui dépend de la réponse>

## Hypothèse en attendant
<si non bloquante : l'hypothèse retenue pour avancer>

## Réponse
<remplie par le PO, avec la source : "humain, 2026-10-02" ou "PO, d'après le cadrage RG-04">
```

Les titres de sections s'écrivent dans la langue du projet ; leur **ordre** est fixe, c'est lui que
les scripts lisent (`team/conventions/langue.md`) : question, contexte, hypothèse, réponse. Les quatre
sections restent présentes même vides, la réponse est toujours la dernière.

Le PO répond s'il peut, à partir du cadrage et de ce que l'humain a déjà dit. Sinon il passe la question
en `remontee` et la pose à l'humain, **groupée** avec les autres, jamais une par une au fil de l'eau.
Une réponse qui crée ou modifie une règle de gestion est reportée dans le livrable concerné.
