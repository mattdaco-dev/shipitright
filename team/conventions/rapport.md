# Rapport de fin d'agent

Chaque agent termine par ce rapport, en réponse finale **et**, pour un ticket, dans sa section
`## Rapport`. C'est la seule chose que le PO lit : il doit suffire à décider de la suite sans ouvrir
un fichier.

```markdown
## Rapport <rôle-n> · <T-xxx ou livrable> · <date>

**Statut proposé** : fait | à revoir | bloqué
**Résumé** : <deux ou trois lignes : ce qui a été produit>

**Fichiers** (chemins exacts)
- <chemin> : créé | modifié, <en quelques mots>

**Décisions prises**
- <décision, et pourquoi>   (ou "aucune")

**Pour la suite** : <ce que le ticket ou l'agent suivant doit savoir : signatures produites, contrat,
piège rencontré>

**Points ouverts**
- <question, hypothèse posée, finding non résolu, sujet de forum ouvert>   (ou "aucun")

**Vérifications** : <build, tests, checker de livrable : commandes et résultat>

**Rétro** : <une ou deux lignes : ce qui a freiné, ce qui manquait dans le brief>
```

Un rapport honnête vaut mieux qu'un rapport vert : un travail inachevé se déclare `à revoir` ou
`bloqué`, avec la raison.
