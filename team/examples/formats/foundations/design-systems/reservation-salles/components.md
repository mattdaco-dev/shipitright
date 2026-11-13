# Composants : design system reservation-salles

| Composant | Variantes | Règles |
|---|---|---|
| Bandeau de navigation | avec menu utilisateur | entrées à gauche, nom et « Se déconnecter » à droite |
| Bouton | principal, secondaire, destructif | un seul bouton principal par vue ; dans un dialogue destructif, le bouton par défaut est le secondaire |
| Champ | texte, nombre | libellé au-dessus, erreur sous le champ, liée par `aria-describedby` |
| Liste déroulante | simple | |
| Sélecteur de date | jours désactivables | saisie clavier JJ.MM.AAAA acceptée |
| Tableau | simple | en-têtes en capitales, ligne survolée surlignée |
| Dialogue | confirmation | titre, texte, deux boutons ; « Échap » ferme sans rien faire ; focus piégé |
| Bandeau de message | succès, erreur | zone live ; fermable ; erreur avec « Réessayer » quand l'action se rejoue |
| Squelette | ligne, bloc | remplace le contenu pendant le chargement |

## Grille

- ≥ 1280 px : mise en page de référence.
- 768 à 1279 px : marges réduites, tableaux défilants à l'horizontale.
- < 768 px : une colonne, actions en pied d'écran.
