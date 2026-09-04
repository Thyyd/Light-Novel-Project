# Light-Novel-Project

**Light-Novel-Project** est une application web full-stack cataloguant les séries de Light Novels disponibles sur le marché français. Le projet a pour objectif de donner une meilleure visibilité publique à ces œuvres, encore peu référencées de manière centralisée.

## Fonctionnalités principales

- Parcours et filtrage du catalogue (genres, thèmes, auteurs, éditeurs)
- Fiches détaillées par série et par tome
- Système de comptes utilisateurs (Firebase Authentication)
- Notes et commentaires sur les séries
- Gestion de favoris
- Interface d'administration pour la gestion du catalogue
- Enrichissement automatique des fiches via l'API Google Books

## Stack technique

| Domaine | Technologies |
|---|---|
| Frontend | React (JavaScript), Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Base de données | PostgreSQL, Prisma 6 |
| Authentification | Firebase Authentication |
| Stockage d'images | Cloudinary |
| API externe | Google Books API |
| Environnement de dev | Docker Compose |
| Tests | Jest, React Testing Library, Supertest |

## Structure du projet

```
Light-Novel-Project/
├── frontend/           # Application React
├── backend/            # API REST Express + Prisma
├── docs/               # Spécifications, diagrammes, documentation
├── docker-compose.yml  # PostgreSQL (dev + test)
└── .gitignore
```

## Prérequis

- Node.js ≥ 20
- Docker et Docker Compose
- Un compte Firebase (Authentication)
- Un compte Cloudinary

## Installation

1. Cloner le repo
   ```bash
   git clone https://github.com/Thyyd/Light-Novel-Project
   cd lightverse
   ```

2. Démarrer les bases de données PostgreSQL (dev + test)
   ```bash
   docker compose up -d
   ```

3. Installer et configurer le backend
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Renseigner les variables d'environnement dans .env
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

4. Installer et configurer le frontend
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Renseigner les variables d'environnement dans .env
   npm run dev
   ```

## Documentation

L'ensemble de la documentation du projet (user stories, documentation API, diagrammes ERD/UML, maquettes) est disponible dans [docs/](docs/README.md).

## Workflow Git

- `main` : version stable, utilisée pour les démonstrations
- `develop` : branche d'intégration des fonctionnalités terminées
- `feature/xxx` : une branche par fonctionnalité
- `fix/xxx` : une branche par correctif

## Auteur

Développé par Thyyd.