# Documentation des APIs

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
  "error": "ERROR_CODE",
  "message": "Description lisible de l'erreur."
}
```

### Codes de statut utilisés dans l'ensemble de l'API

`200 OK` · `201 Created` · `204 No Content` · `400 Bad Request` · `401 Unauthorized` · `403 Forbidden` · `404 Not Found` · `409 Conflict` · `500 Internal Server Error`

---

## 1. Utilisateurs

### 1.1 Synchroniser l'utilisateur après connexion Firebase

- **Méthode :** `POST`
- **URL :** `/api/users/sync`
- **Authentification :** Requise (token Firebase valide, utilisateur pas forcément déjà en base)
- **But :** Créer la ligne correspondante dans la table USERS lors du tout premier login, ou renvoyer l'utilisateur existant sinon (upsert basé sur `firebase_uid`).

**Corps de la requête (request body)**

```json
{
  "email": "sarah@example.com",
  "displayName": "Sarah Martin"
}
```

**Réponse en cas de succès — 200 OK (utilisateur existant) ou 201 Created (nouvel utilisateur)**

```json
{
  "id": 12,
  "email": "sarah@example.com",
  "displayName": "Sarah Martin",
  "role": "user",
  "createdAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`401 Unauthorized`
```json
{
  "error": "INVALID_TOKEN",
  "message": "Le token Firebase fourni est invalide ou expiré."
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

### 2.1 Lister les séries

- **Méthode :** `GET`
- **URL :** `/api/series`
- **Authentification :** Non requise

**Paramètres de requête (query params)**

| Paramètre | Type | Description |
|---|---|---|
| genre | string | Filtrer par genre (slug) |
| theme | string | Filtrer par thème (slug) |
| search | string | Recherche sur le titre |
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

### 2.2 Détail d'une série

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

### 2.3 Créer une série

- **Méthode :** `POST`
- **URL :** `/api/series`
- **Authentification :** Requise, rôle admin

**Corps de la requête (request body)**

```json
{
  "title": "Re:Zero",
  "synopsis": "Subaru se retrouve transporté...",
  "coverUrl": "https://res.cloudinary.com/.../rezero.jpg",
  "publisherId": 5,
  "auteurIds": [2],
  "genreIds": [1],
  "themeIds": [4]
}
```

**Réponse en cas de succès — 201 Created**

```json
{
  "id": 3,
  "title": "Re:Zero",
  "createdAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Le champ title est requis."
}
```

`403 Forbidden`
```json
{
  "error": "FORBIDDEN",
  "message": "Seul un administrateur peut créer une série."
}
```

`409 Conflict`
```json
{
  "error": "SERIES_ALREADY_EXISTS",
  "message": "Une série avec ce titre existe déjà."
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

### 3.3 Ajouter un tome

- **Méthode :** `POST`
- **URL :** `/api/series/{seriesId}/volumes`
- **Authentification :** Requise, rôle admin

**Corps de la requête (request body)**

```json
{
  "volumeNumber": 1,
  "title": "Re:Zero - Tome 1",
  "coverUrl": "https://res.cloudinary.com/.../rezero-t1.jpg",
  "releaseDate": "2016-03-15",
  "isbn": "978-2-3785-XXXX-X"
}
```

**Réponse en cas de succès — 201 Created**

```json
{
  "id": 10,
  "seriesId": 3,
  "volumeNumber": 1,
  "createdAt": "2026-08-21T10:00:00.000Z"
}
```

**Réponses d'erreur possibles**

`400 Bad Request`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Le champ volumeNumber est requis."
}
```

`403 Forbidden`
```json
{
  "error": "FORBIDDEN",
  "message": "Seul un administrateur peut ajouter un tome."
}
```

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
  "error": "VOLUME_NUMBER_ALREADY_EXISTS",
  "message": "Un tome avec ce numéro existe déjà pour cette série."
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
