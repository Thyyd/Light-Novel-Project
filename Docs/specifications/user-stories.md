# User Stories

## Tableau de synthèse

| ID | Acteur | Titre | Feature liée |
|---|---|---|---|
| US1 | Visiteur | Parcourir et filtrer le catalogue | Recherche / Filtrage |
| US2 | Visiteur | Consulter la fiche d'une série ou d'un volume | Consultation catalogue |
| US3 | Visiteur | Créer un compte | Sign Up |
| US4 | Utilisateur | Se connecter / se déconnecter | Login / Sign Out |
| US5 | Utilisateur | Modifier mon mot de passe | Password change |
| US6 | Utilisateur | Noter une série | Ratings |
| US7 | Utilisateur | Commenter une série | Comments |
| US8 | Utilisateur | Ajouter une série en favoris | Favoris / Bookmarks |
| US9 | Admin | Gérer le catalogue (CRUD) | CRUD contextuel |
| US10 | Admin | Modérer les commentaires | Content moderation |
| US11 | Admin | Enrichir une fiche série via une API externe | API externe |

---

## Visiteur (non connecté)

### US1 — Parcourir et filtrer le catalogue

En tant que Visiteur, je veux parcourir et filtrer les séries (genre, thème, auteur, éditeur...) afin de trouver facilement une nouvelle série qui m'intéresse.

**Critères d'acceptation**

- Étant donné que je suis sur la page catalogue, lorsque j'applique un filtre (ex : genre), seules les séries correspondantes s'affichent.
- Étant donné que je modifie ou j'ajoute un filtre, quand la sélection change, le résultat se met alors à jour immédiatement, sans action supplémentaire de ma part.
- Étant donné qu'aucune série ne correspond au filtre choisi, quand je valide ma recherche, un message « aucun résultat » s'affiche.

### US2 — Consulter la fiche d'une série ou d'un volume

En tant que Visiteur, je veux consulter la fiche détaillée d'une série ou d'un volume afin de me renseigner avant de m'engager dans la lecture.

**Critères d'acceptation**

- Étant donné que je consulte une série, lorsque j'accède à sa fiche, je vois alors son synopsis global, la liste de ses volumes et leurs dates de parution, sa note moyenne ainsi que d'autres informations relatives à cette série (éditeur, statut, etc...)
- Étant donné que je consulte un volume précis, quand j'accède à sa fiche, je vois alors son propre synopsis, sa date de parution, la série à laquelle il appartient ainsi que d'autres informations relatives à ce volume (numéro, couverture, ISBN, etc...)

---

## Utilisateur (connecté)

### US3 — Créer un compte

En tant que Visiteur, je veux créer un compte en renseignant un nom d'utilisateur, un email et un mot de passe afin d'accéder aux fonctionnalités réservées aux membres.

**Critères d'acceptation**

- Étant donné que je remplis le formulaire, quand je saisis un email au format invalide (vérifié par une regex), alors le système m'affiche une erreur avant validation.
- Étant donné que je choisis un nom d'utilisateur déjà utilisé, quand je valide le formulaire, alors le système m'indique qu'il est indisponible.
- Étant donné que mon formulaire est valide, quand je valide mon inscription, alors mon compte est créé et je peux me connecter immédiatement (pas de vérification par email en V1).

> **⚠ Note de justification — Vérification de compte**
>
> La consigne du projet impose une vérification de compte par email ou SMS lors de l'inscription. Dans le cadre de cette V1, et compte tenu des contraintes de temps allouées au projet, ce mécanisme de vérification a été volontairement simplifié.
>
> Plutôt qu'un envoi d'email de confirmation avec lien d'activation (nécessitant la mise en place d'un service d'envoi transactionnel, la gestion de tokens temporaires, et une page de confirmation dédiée), la vérification du format de l'email est assurée côté formulaire par une expression régulière (regex) au moment de l'inscription. Ce contrôle garantit que l'email saisi respecte une syntaxe valide, sans toutefois confirmer que l'adresse existe réellement ou appartient à l'utilisateur.
>
> Ce choix est assumé comme une réduction de scope pragmatique pour la V1. Une vraie vérification par email (via un service comme Firebase Auth, qui propose nativement cette fonctionnalité) est identifiée comme piste d'amélioration pour une version ultérieure, si le temps le permet.

### US4 — Se connecter / se déconnecter

En tant qu'Utilisateur, je veux me connecter avec mon nom d'utilisateur et mon mot de passe, et pouvoir me déconnecter, afin de sécuriser l'accès à mon compte.

**Critères d'acceptation**

- Étant donné que je saisis un nom d'utilisateur et un mot de passe tous deux valides, quand je valide le formulaire, alors j'accède à mon compte.
- Étant donné que je saisis des identifiants incorrects, quand je valide le formulaire, alors un message d'erreur s'affiche sans préciser lequel des deux champs est erroné.

### US5 — Modifier mon mot de passe

En tant qu'utilisateur, je veux pouvoir changer mon mot de passe (ou le réinitialiser en cas d'oubli) afin de garder mon compte sécurisé.

### US6 — Noter une série ou un Volume

En tant qu'utilisateur, je veux attribuer une note de 1 à 5 étoiles à une série afin de partager mon avis sans forcément rédiger de commentaire.

**Critères d'acceptation**

- Étant donné que je suis connecté et que je consulte une série ou un volume, quand je clique sur une note, alors ma note est enregistrée et la moyenne de la série est mise à jour.
- Étant donné que j'ai déjà noté cette série, quand je modifie ma note, alors l'ancienne note est remplacée (et non cumulée).

### US7 — Commenter une série ou un Volume

En tant qu'utilisateur, je veux poster et supprimer mes propres commentaires sur une série ou un volume afin d'échanger avec les autres lecteurs.

**Critères d'acceptation**

- Étant donné que je suis connecté, quand je poste un commentaire, alors il apparaît sous la série ou le volume avec mon nom d'utilisateur.
- Étant donné qu'un commentaire m'appartient, quand je clique sur « supprimer », alors il est retiré de la liste.

### US8 — Ajouter une série en favoris

En tant qu'utilisateur, je veux ajouter ou retirer une série de mes favoris afin de retrouver rapidement les séries que je suis.

---

## Admin

### US9 — Gérer le catalogue (CRUD)

En tant qu'Admin, je veux créer, modifier et gérer les séries et leurs volumes afin de maintenir le catalogue à jour.

**Critères d'acceptation**

- Étant donné que je suis Admin, quand j'ajoute un volume à une série existante, alors il apparaît immédiatement sur la fiche de la série.
- Étant donné qu'une série existe déjà, quand je tente d'en créer un doublon, alors le système m'alerte.

> **⚠ Note de justification — Absence de suppression (Delete)**
>
> Le terme CRUD (Create, Read, Update, Delete) est repris ici par convention, mais l'opération de suppression (Delete) n'est volontairement pas implémentée pour les séries et les volumes.
>
> Une série ou un volume publié constitue une donnée de référence consultée et potentiellement liée à du contenu généré par les utilisateurs (notes, commentaires, favoris). Sa suppression entraînerait soit la perte de ces données associées, soit une complexité de gestion (suppression en cascade, orphelins) disproportionnée par rapport au bénéfice pour une V1.
>
> En cas d'erreur de saisie ou de contenu obsolète, l'Admin dispose de la fonction de modification (Update) pour corriger ou dépublier une fiche, ce qui couvre les besoins réels sans nécessiter de suppression définitive. Cette gestion CRU (sans D) est donc un choix assumé, cohérent avec la règle métier déjà établie pour le catalogue.
>
> Ce choix reflète également la réalité éditoriale du secteur : une série peut cesser d'être disponible à l'achat en France (arrêt de son exploitation par l'éditeur, disparition de la maison d'édition, rupture de stock durable...) sans pour autant cesser d'exister. Elle reste donc répertoriée dans le catalogue, avec un statut approprié le cas échéant, plutôt que d'être supprimée — la disponibilité en librairie et l'existence de la série étant deux notions distinctes.

### US10 — Modérer les commentaires

En tant qu'Admin, je veux pouvoir supprimer n'importe quel commentaire afin de maintenir un espace d'échange respectueux.

### US11 — Enrichir une fiche série via une API externe

En tant qu'Admin, je veux rechercher une série via une API externe (Google Books ou équivalent) afin de pré-remplir automatiquement certaines informations (couverture, résumé, auteur) lors de la création d'une fiche.

**Critères d'acceptation**

- Étant donné que je crée une nouvelle série, quand je recherche son titre, alors le système propose les résultats correspondants issus de l'API externe.
- Étant donné que je sélectionne un résultat, quand je valide, alors les champs pré-remplis restent modifiables avant enregistrement.
