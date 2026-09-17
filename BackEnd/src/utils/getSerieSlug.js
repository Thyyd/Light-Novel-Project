import { slugify } from './slugify.js';

/**
 * Calcule le slug Cloudinary d'une série, en se basant sur son titre diminutif
 * s'il existe, ou sur son titre principal sinon (même règle qu'à la création
 * de la série dans series.controller.js).
 *
 * @param {import('../db/generated/prisma').PrismaClient | import('../db/generated/prisma').Prisma.TransactionClient} client
 *   Instance Prisma (client global ou client de transaction `tx`)
 * @param {{ id: number, titre: string }} serie - Série déjà chargée par l'appelant
 * @returns {Promise<string>} Le slug à utiliser dans le chemin Cloudinary
 */
export async function getSerieSlug(client, serie) {
  const titreDiminutif = await client.titreAlternatif.findFirst({
    where: { serieId: serie.id, type: 'diminutif' },
  });

  return slugify(titreDiminutif?.titre ?? serie.titre);
}