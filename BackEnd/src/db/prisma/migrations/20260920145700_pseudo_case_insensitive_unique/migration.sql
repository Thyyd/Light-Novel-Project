DROP INDEX "utilisateurs_pseudo_key";

CREATE UNIQUE INDEX "utilisateurs_pseudo_key" ON "utilisateurs" (LOWER(pseudo));