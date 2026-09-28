-- Index unique fonctionnel, insensible à la casse, sur le titre des séries
CREATE UNIQUE INDEX series_titre_unique_ci ON series (LOWER(titre));