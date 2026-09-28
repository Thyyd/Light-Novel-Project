-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "StatutSerie" AS ENUM ('en_cours', 'termine', 'en_pause', 'abandonne');

-- CreateEnum
CREATE TYPE "TypeTitreAlternatif" AS ENUM ('anglais', 'romaji', 'diminutif', 'autre');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auteurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,

    CONSTRAINT "auteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "illustrateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,

    CONSTRAINT "illustrateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editeurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "site_web" TEXT,

    CONSTRAINT "editeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "statut" "StatutSerie" NOT NULL,
    "date_debut_publication_fr" DATE,
    "couverture_url" TEXT NOT NULL,
    "editeur_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titres_alternatifs" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeTitreAlternatif",

    CONSTRAINT "titres_alternatifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volumes" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "numero_volume" DECIMAL(4,1) NOT NULL,
    "titre" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "date_sortie" DATE,
    "isbn" TEXT,
    "nb_pages" INTEGER NOT NULL,
    "couverture_url" TEXT NOT NULL,

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentaires" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "volume_id" INTEGER,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "volume_id" INTEGER,
    "note" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoris" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "date_ajout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_genres" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "series_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_themes" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "theme_id" INTEGER NOT NULL,

    CONSTRAINT "series_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_auteurs" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,

    CONSTRAINT "series_auteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_illustrateurs" (
    "id" SERIAL NOT NULL,
    "serie_id" INTEGER NOT NULL,
    "illustrateur_id" INTEGER NOT NULL,

    CONSTRAINT "series_illustrateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_firebase_uid_key" ON "utilisateurs"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_pseudo_key" ON "utilisateurs"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "genres_nom_key" ON "genres"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "themes_nom_key" ON "themes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "editeurs_nom_key" ON "editeurs"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_isbn_key" ON "volumes"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_serie_id_numero_volume_key" ON "volumes"("serie_id", "numero_volume");

-- CreateIndex
CREATE UNIQUE INDEX "notes_user_id_serie_id_volume_id_key" ON "notes"("user_id", "serie_id", "volume_id");

-- CreateIndex
CREATE UNIQUE INDEX "favoris_user_id_serie_id_key" ON "favoris"("user_id", "serie_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_genres_serie_id_genre_id_key" ON "series_genres"("serie_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_themes_serie_id_theme_id_key" ON "series_themes"("serie_id", "theme_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_auteurs_serie_id_auteur_id_key" ON "series_auteurs"("serie_id", "auteur_id");

-- CreateIndex
CREATE UNIQUE INDEX "series_illustrateurs_serie_id_illustrateur_id_key" ON "series_illustrateurs"("serie_id", "illustrateur_id");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_editeur_id_fkey" FOREIGN KEY ("editeur_id") REFERENCES "editeurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titres_alternatifs" ADD CONSTRAINT "titres_alternatifs_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires" ADD CONSTRAINT "commentaires_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_themes" ADD CONSTRAINT "series_themes_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_themes" ADD CONSTRAINT "series_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_auteurs" ADD CONSTRAINT "series_auteurs_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_auteurs" ADD CONSTRAINT "series_auteurs_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "auteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_illustrateurs" ADD CONSTRAINT "series_illustrateurs_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_illustrateurs" ADD CONSTRAINT "series_illustrateurs_illustrateur_id_fkey" FOREIGN KEY ("illustrateur_id") REFERENCES "illustrateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateCheck
ALTER TABLE "notes" ADD CONSTRAINT "notes_note_check" CHECK ("note" >= 1 AND "note" <= 5);

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "notes_user_id_serie_id_unique_when_no_volume" ON "notes"("user_id", "serie_id") WHERE "volume_id" IS NULL;
