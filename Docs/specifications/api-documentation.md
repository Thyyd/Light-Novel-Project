# Documentation des APIs

> **Statut** : Cette documentation décrit l'API cible du projet. Seules les routes marquées ✅ sont actuellement implémentées et testées ; les autres sont des spécifications prévisionnelles, sujettes à ajustement au moment de leur implémentation.

## Conventions générales

**Base URL :** `/api`

### Authentification

Toutes les routes protégées attendent un header `Authorization` contenant le token Firebase de l'utilisateur connecté :

```
Authorization: Bearer <firebaseIdToken>
```

Le token est vérifié par un middleware Express via le SDK Admin Firebase. Le middleware décode le token et injecte l'utilisateur (`req.user`) dans la requête, ce qui permet de résoudre les routes `/me`.

### Rôles

- **Visiteur** : non authentifié, accès lecture seule aux ressources publiques.
- **Utilisateur** : authentifié, rôle `"user"`.
- **Admin** : authentifié, rôle `"admin"`.

### Format d'erreur standard

Toutes les erreurs de l'API suivent ce format :

```json
{
  "error": {
    "message": "Description lisible de l'erreur.",
    "details": ["Détail optionnel 1", "Détail optionnel 2"]
  }
}
```

Le champ `details` n'est présent que pour les erreurs de validation (`400`), où il contient un tableau de messages précis par champ invalide. Pour les autres erreurs, seul `message` est renvoyé.

### Codes de statut utilisés dans l'ensemble de l'API

`200 OK` · `201 Created` · `204 No Content` · `400 Bad Request` · `401 Unauthorized` · `403 Forbidden` · `404 Not Found` · `409 Conflict` · `500 Internal Server Error`

---

## 1. Utilisateurs

### 1.1 Inscription — créer un utilisateur✅

- **Méthode :** `POST`
- **URL :** `/api/users`
- **Authentification :** Requise (token Firebase valide ; l'utilisateur n'est pas encore en base à ce stade)
- **But :** Créer la ligne correspondante dans la table `utilisateurs` lors de l'inscription. En cas d'échec de la création (pseudo déjà pris, erreur serveur), le compte Firebase Auth fraîchement créé est automatiquement supprimé (rollback) pour éviter tout compte orphelin entre Firebase et la base.

**Corps de la requête (request body)**

```json
{
  "pseudo": "SarahM"
}
```

*(`email` et `firebaseUid` sont extraits automatiquement du token Firebase vérifié, jamais du body — pour éviter qu'un client puisse usurper un email.)*

**Contraintes sur `pseudo`**

- 3 à 20 caractères (espaces en début/fin automatiquement retirés)
- Caractères autorisés : lettres, chiffres, espaces, `@ - _ '`

**Réponse en cas de succès — 201 Created**

```json
{
  "data": {
    "id": 12,
    "firebaseUid": "abc123...",
    "pseudo": "SarahM",
    "email": "sarah@example.com",
    "avatarUrl": "https://res.cloudinary.com/.../avatars/default.png",
    "role": "user",
    "createdAt": "2026-08-21T10:00:00.000Z"
  }
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": {
    "message": "Données invalides",
    "details": ["Le pseudo doit contenir au moins 3 caractères"]
  }
}
```

`401 Unauthorized`
```json
{
  "error": { "message": "Token manquant ou mal formé" }
}
```
ou
```json
{
  "error": { "message": "Token invalide ou expiré" }
}
```

`409 Conflict`
```json
{
  "error": { "message": "Ce pseudo est déjà utilisé" }
}
```

### 1.2 Récupérer son propre profil

- **Méthode :** `GET`
- **URL :** `/api/users/me`
- **Authentification :** Requise

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 12,
  "email": "sarah@example.com",
  "displayName": "Sarah Martin",
  "role": "user"
}
```

**Réponses d'erreur possibles**

`401 Unauthorized`
```json
{
  "error": "UNAUTHENTICATED",
  "message": "Vous devez être connecté pour accéder à cette ressource."
}
```

### 1.3 Mettre à jour son profil

- **Méthode :** `PATCH`
- **URL :** `/api/users/me`
- **Authentification :** Requise

**Corps de la requête (request body)**

```json
{
  "displayName": "Sarah M."
}
```

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 12,
  "email": "sarah@example.com",
  "displayName": "Sarah M.",
  "role": "user"
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Le champ displayName ne peut pas être vide."
}
```

---

## 2. Séries

### 2.1 Lister les séries ✅

- **Méthode :** `GET`
- **URL :** `/api/series`
- **Authentification :** Non requise

**Paramètres de requête (query params)**

| Paramètre | Type | Description |
|---|---|---|
| genre | string | Non implémenté en V1 — Filtrer par genre (slug) |
| theme | string | Non implémenté en V1 — Filtrer par thème (slug) |
| search | string | Non implémenté en V1 — Recherche sur le titre |
| page | int | Numéro de page (défaut : 1) |
| limit | int | Résultats par page (défaut : 20) |

**Réponse en cas de succès — 200 OK**

```json
{
  "data": [
    {
      "id": 3,
      "title": "Re:Zero",
      "coverUrl": "https://res.cloudinary.com/.../rezero.jpg",
      "averageRating": 4.5,
      "publisher": "Ofelbe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87
  }
}
```

### 2.2 Détail d'une série ✅

- **Méthode :** `GET`
- **URL :** `/api/series/{id}`
- **Authentification :** Non requise

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 3,
  "title": "Re:Zero",
  "synopsis": "Subaru se retrouve transporté dans un monde parallèle...",
  "coverUrl": "https://res.cloudinary.com/.../rezero.jpg",
  "publisher": { "id": 5, "name": "Ofelbe" },
  "auteurs": [{ "id": 2, "name": "Tappei Nagatsuki" }],
  "genres": [{ "id": 1, "name": "Isekai" }],
  "themes": [{ "id": 4, "name": "Voyage dans le temps" }],
  "averageRating": 4.5,
  "volumesCount": 34
}
```

**Réponses d'erreur possibles**

`404 Not Found`
```json
{
  "error": "SERIES_NOT_FOUND",
  "message": "Aucune série trouvée avec cet identifiant."
}
```

### 2.3 Créer une série ✅

- **Méthode :** `POST`
- **URL :** `/api/series`
- **Authentification :** Requise, rôle admin
- **Content-Type :** `multipart/form-data` (upload de la couverture)
- **But :** Créer une nouvelle série dans le catalogue. La couverture est uploadée sur Cloudinary dans un dossier dédié (`Series/<slug>/`, slug basé sur le titre diminutif s'il est fourni, sinon sur le titre complet). Si un titre diminutif est fourni, une entrée `TitreAlternatif` de type `diminutif` est créée dans la même transaction.

**Corps de la requête (form-data)**

| Champ | Type | Requis | Description |
|---|---|---|---|
| titre | string | Oui | 1 à 150 caractères. Doit être unique (insensible à la casse). |
| synopsis | string | Oui | — |
| statut | string (enum) | Oui | `en_cours`, `termine`, `en_pause` ou `abandonne` |
| dateDebutPublicationFr | string (date) | Non | Format `AAAA-MM-JJ` |
| editeurId | int | Oui | Doit référencer un éditeur existant |
| titreDiminutif | string | Non | 1 à 50 caractères. Utilisé pour nommer le dossier Cloudinary et créer un `TitreAlternatif` associé. |
| cover | file | Oui | JPEG, PNG ou WEBP, 5 Mo max |

**Réponse en cas de succès — 201 Created**

```json
{
  "data": {
    "id": 3,
    "titre": "Re:Zero : Re:Vivre dans un autre monde à partir de zéro",
    "synopsis": "Subaru se retrouve transporté dans un monde parallèle...",
    "statut": "en_cours",
    "dateDebutPublicationFr": null,
    "couvertureUrl": "https://res.cloudinary.com/.../Series/re-zero/xxxxx.webp",
    "editeurId": 5,
    "createdAt": "2026-09-16T10:56:20.173Z"
  }
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": {
    "message": "Données invalides",
    "details": ["Le titre est obligatoire"]
  }
}
```
ou
```json
{
  "error": { "message": "La couverture de la série est obligatoire" }
}
```
ou
```json
{
  "error": { "message": "Éditeur introuvable" }
}
```

`401 Unauthorized`
```json
{
  "error": { "message": "Utilisateur introuvable" }
}
```

`403 Forbidden`
```json
{
  "error": { "message": "Accès réservé aux administrateurs" }
}
```

`409 Conflict`
```json
{
  "error": { "message": "Une série avec ce titre existe déjà" }
}
```

### 2.4 Modifier une série

- **Méthode :** `PATCH`
- **URL :** `/api/series/{id}`
- **Authentification :** Requise, rôle admin
- **Note :** Aucune route DELETE — une série reste toujours consultable, même si elle n'est plus disponible à la vente.

**Corps de la requête (request body)**

(champs optionnels, mêmes champs que la création)

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 3,
  "title": "Re:Zero",
  "updatedAt": "2026-08-21T11:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`403 Forbidden`
```json
{
  "error": "FORBIDDEN",
  "message": "Seul un administrateur peut modifier une série."
}
```

`404 Not Found`
```json
{
  "error": "SERIES_NOT_FOUND",
  "message": "Aucune série trouvée avec cet identifiant."
}
```

---

## 3. Volumes

### 3.1 Lister les tomes d'une série

- **Méthode :** `GET`
- **URL :** `/api/series/{seriesId}/volumes`
- **Authentification :** Non requise

**Réponse en cas de succès — 200 OK**

```json
[
  {
    "id": 10,
    "volumeNumber": 1,
    "title": "Re:Zero - Tome 1",
    "coverUrl": "https://res.cloudinary.com/.../rezero-t1.jpg",
    "releaseDate": "2016-03-15"
  }
]
```

### 3.2 Détail d'un tome

- **Méthode :** `GET`
- **URL :** `/api/volumes/{id}`
- **Authentification :** Non requise

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 10,
  "seriesId": 3,
  "volumeNumber": 1,
  "title": "Re:Zero - Tome 1",
  "coverUrl": "https://res.cloudinary.com/.../rezero-t1.jpg",
  "releaseDate": "2016-03-15",
  "isbn": "978-2-3785-XXXX-X"
}
```

**Réponses d'erreur possibles**

`404 Not Found`
```json
{
  "error": "VOLUME_NOT_FOUND",
  "message": "Aucun tome trouvé avec cet identifiant."
}
```

### 3.3 Ajouter un tome ✅

- **Méthode :** `POST`
- **URL :** `/api/series/{seriesId}/volumes`
- **Authentification :** Requise, rôle admin
- **Content-Type :** `multipart/form-data` (upload de la couverture)
- **But :** Créer un nouveau tome pour une série existante. La couverture est uploadée sur Cloudinary dans le sous-dossier `volumes/` de la série concernée (`Series/<slug-série>/volumes/`, le slug étant calculé selon la même règle que pour la série : titre diminutif s'il existe, sinon titre complet).

**Corps de la requête (form-data)**

| Champ | Type | Requis | Description |
|---|---|---|---|
| numeroVolume | number | Oui | Positif ou nul (0 accepté pour les préquels/hors-séries), max 999.9, une seule décimale autorisée (ex: 1, 2.5) |
| titre | string | Oui | 1 à 150 caractères |
| synopsis | string | Oui | Au moins 10 caractères |
| nbPages | int | Oui | Entier positif, max 1000 |
| isbn | string | Non | ISBN-10 ou ISBN-13, tirets/espaces tolérés (retirés automatiquement). Doit être unique tous volumes confondus. |
| dateSortie | string (date) | Non | Format `AAAA-MM-JJ`. Une date future est acceptée (sorties à venir). |
| cover | file | Oui | JPEG, PNG ou WEBP |

**Réponse en cas de succès — 201 Created**

```json
{
  "data": {
    "id": 1,
    "serieId": 1,
    "numeroVolume": "1",
    "titre": "Classroom of the Elite",
    "synopsis": "De l'extérieur, le lycée de haut niveau de Tokyo semble être un lieu de rêve...",
    "dateSortie": "2024-02-23T00:00:00.000Z",
    "isbn": null,
    "nbPages": 320,
    "couvertureUrl": "https://res.cloudinary.com/.../Series/classroom-of-the-elite/volumes/xxxxx.webp"
  }
}
```

*(`numeroVolume` est renvoyé sous forme de string : comportement standard de Prisma lors de la sérialisation JSON d'un champ `Decimal`, pour ne pas perdre de précision.)*

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": {
    "message": "Données invalides",
    "details": ["Le titre du volume est obligatoire"]
  }
}
```
ou
```json
{
  "error": { "message": "Identifiant de série invalide" }
}
```
ou
```json
{
  "error": { "message": "La couverture du volume est obligatoire" }
}
```

`401 Unauthorized`
```json
{
  "error": { "message": "Utilisateur introuvable" }
}
```

`403 Forbidden`
```json
{
  "error": { "message": "Accès réservé aux administrateurs" }
}
```

`404 Not Found`
```json
{
  "error": { "message": "Série introuvable" }
}
```

`409 Conflict`
```json
{
  "error": { "message": "Ce numéro de volume existe déjà pour cette série" }
}
```
ou
```json
{
  "error": { "message": "Cet ISBN est déjà utilisé" }
}
```

### 3.4 Modifier un tome

- **Méthode :** `PATCH`
- **URL :** `/api/volumes/{id}`
- **Authentification :** Requise, rôle admin
- **Note :** Aucune route DELETE — les tomes ne sont jamais supprimables, pour préserver l'intégrité des données (notes, favoris, commentaires liés à la série).

**Corps de la requête (request body)**

(champs optionnels)

**Réponse en cas de succès — 200 OK**

```json
{
  "id": 10,
  "updatedAt": "2026-08-21T11:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`403 Forbidden`
```json
{
  "error": "FORBIDDEN",
  "message": "Seul un administrateur peut modifier un tome."
}
```

`404 Not Found`
```json
{
  "error": "VOLUME_NOT_FOUND",
  "message": "Aucun tome trouvé avec cet identifiant."
}
```

---

## 4. Favoris

### 4.1 Lister ses favoris

- **Méthode :** `GET`
- **URL :** `/api/users/me/favorites`
- **Authentification :** Requise

**Réponse en cas de succès — 200 OK**

```json
[
  {
    "seriesId": 3,
    "title": "Re:Zero",
    "coverUrl": "https://res.cloudinary.com/.../rezero.jpg",
    "addedAt": "2026-08-10T09:00:00.000Z"
  }
]
```

### 4.2 Ajouter une série aux favoris

- **Méthode :** `POST`
- **URL :** `/api/series/{seriesId}/favorites`
- **Authentification :** Requise

**Réponse en cas de succès — 201 Created**

```json
{
  "seriesId": 3,
  "userId": 12,
  "addedAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`404 Not Found`
```json
{
  "error": "SERIES_NOT_FOUND",
  "message": "Aucune série trouvée avec cet identifiant."
}
```

`409 Conflict`
```json
{
  "error": "ALREADY_FAVORITED",
  "message": "Cette série est déjà dans vos favoris."
}
```

### 4.3 Retirer une série des favoris

- **Méthode :** `DELETE`
- **URL :** `/api/series/{seriesId}/favorites`
- **Authentification :** Requise

**Réponse en cas de succès — 204 No Content**

(pas de contenu)

**Réponses d'erreur possibles**

`404 Not Found`
```json
{
  "error": "FAVORITE_NOT_FOUND",
  "message": "Cette série n'est pas dans vos favoris."
}
```

---

## 5. Notes

### 5.1 Noter une série

- **Méthode :** `POST`
- **URL :** `/api/series/{seriesId}/notes`
- **Authentification :** Requise
- **But :** Upsert — crée la note si l'utilisateur n'a jamais noté cette série, la met à jour sinon (contrainte `UNIQUE(user_id, series_id)` sur la table NOTES).

**Corps de la requête (request body)**

```json
{
  "rating": 4
}
```

**Réponse en cas de succès — 200 OK (mise à jour) ou 201 Created (première note)**

```json
{
  "seriesId": 3,
  "userId": 12,
  "rating": 4,
  "updatedAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "La note doit être comprise entre 1 et 5."
}
```

`404 Not Found`
```json
{
  "error": "SERIES_NOT_FOUND",
  "message": "Aucune série trouvée avec cet identifiant."
}
```

### 5.2 Récupérer sa propre note pour une série

- **Méthode :** `GET`
- **URL :** `/api/series/{seriesId}/notes/me`
- **Authentification :** Requise
- **But :** Permet de pré-remplir le composant d'étoiles avec la note déjà donnée par l'utilisateur, s'il en existe une.

**Réponse en cas de succès — 200 OK**

```json
{
  "seriesId": 3,
  "rating": 4
}
```

Si l'utilisateur n'a pas encore noté la série :

```json
{
  "seriesId": 3,
  "rating": null
}
```

---

## 6. Commentaires

### 6.1 Lister les commentaires d'une série

- **Méthode :** `GET`
- **URL :** `/api/series/{seriesId}/comments`
- **Authentification :** Non requise

**Réponse en cas de succès — 200 OK**

```json
[
  {
    "id": 21,
    "content": "Un incontournable de l'isekai !",
    "author": { "id": 12, "displayName": "Sarah M." },
    "createdAt": "2026-08-15T14:30:00.000Z"
  }
]
```

### 6.2 Poster un commentaire

- **Méthode :** `POST`
- **URL :** `/api/series/{seriesId}/comments`
- **Authentification :** Requise

**Corps de la requête (request body)**

```json
{
  "content": "Un incontournable de l'isekai !"
}
```

**Réponse en cas de succès — 201 Created**

```json
{
  "id": 21,
  "seriesId": 3,
  "content": "Un incontournable de l'isekai !",
  "authorId": 12,
  "createdAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Le commentaire ne peut pas être vide."
}
```

`404 Not Found`
```json
{
  "error": "SERIES_NOT_FOUND",
  "message": "Aucune série trouvée avec cet identifiant."
}
```

### 6.3 Supprimer un commentaire

- **Méthode :** `DELETE`
- **URL :** `/api/comments/{id}`
- **Authentification :** Requise (auteur du commentaire ou admin)
- **Note :** Un utilisateur ne peut supprimer que ses propres commentaires ; un admin peut supprimer n'importe quel commentaire.

**Réponse en cas de succès — 204 No Content**

(pas de contenu)

**Réponses d'erreur possibles**

`403 Forbidden`
```json
{
  "error": "FORBIDDEN",
  "message": "Vous ne pouvez supprimer que vos propres commentaires."
}
```

`404 Not Found`
```json
{
  "error": "COMMENT_NOT_FOUND",
  "message": "Aucun commentaire trouvé avec cet identifiant."
}
```

---

## 7. Référentiels (genres, thèmes, auteurs, éditeurs)

### 7.1 Lister un référentiel

- **Méthode :** `GET`
- **URL :** `/api/genres` · `/api/themes` · `/api/auteurs` · `/api/publishers`
- **Authentification :** Non requise
- **But :** Ces quatre endpoints suivent tous le même format, utilisés pour peupler les filtres de recherche et les formulaires admin.

**Réponse en cas de succès — 200 OK**

```json
[
  { "id": 1, "name": "Isekai", "slug": "isekai" },
  { "id": 2, "name": "Fantasy", "slug": "fantasy" }
]
```

---

## 8. API externe — Google Books (bonus)

### 8.1 Rechercher un ouvrage sur Google Books

- **Méthode :** `GET`
- **URL :** `/api/books/search`
- **Authentification :** Requise, rôle admin
- **But :** Proxy backend vers l'API Google Books, utilisé pour préremplir automatiquement une fiche série ou tome (titre, synopsis, couverture) à partir d'une recherche par titre ou ISBN. Le backend appelle `https://www.googleapis.com/books/v1/volumes?q={query}` et reformate la réponse.

**Paramètres de requête (query params)**

| Paramètre | Type | Description |
|---|---|---|
| q | string | Titre ou ISBN recherché (requis) |

**Réponse en cas de succès — 200 OK**

```json
[
  {
    "title": "Re:Zero, Vol. 1",
    "authors": ["Tappei Nagatsuki"],
    "description": "Subaru se retrouve transporté dans un monde parallèle...",
    "thumbnailUrl": "https://books.google.com/books/content?id=...",
    "isbn": "978-2-3785-XXXX-X"
  }
]
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "MISSING_QUERY",
  "message": "Le paramètre de recherche q est requis."
}
```

`502 Bad Gateway`
```json
{
  "error": "EXTERNAL_API_ERROR",
  "message": "L'API Google Books est actuellement indisponible."
}
```
