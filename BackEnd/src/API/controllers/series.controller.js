import prisma from '../../db/client.js';
import { createSerieBodySchema } from '../validators/series.validator.js';
import { slugify } from '../../utils/slugify.js';
import { uploadImageToCloudinary } from '../../utils/uploadImage.js';
import cloudinary from '../../config/cloudinary.js';

export async function createSerie(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'La couverture de la série est obligatoire' } });
  }

  const parseResult = createSerieBodySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: {
        message: 'Données invalides',
        details: parseResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const { titre, synopsis, statut, dateDebutPublicationFr, editeurId, titreDiminutif } = parseResult.data;

  // Anti-doublon (insensible à la casse, grâce à l'index unique fonctionnel en DB,
  // mais on vérifie ici en amont pour éviter un upload Cloudinary inutile)
  const existingSerie = await prisma.serie.findFirst({
    where: { titre: { equals: titre, mode: 'insensitive' } },
  });

  if (existingSerie) {
    return res.status(409).json({ error: { message: 'Une série avec ce titre existe déjà' } });
  }

  // Vérification que l'éditeur existe bien en DB
  const editeur = await prisma.editeur.findUnique({ where: { id: editeurId } });

  if (!editeur) {
    return res.status(400).json({ error: { message: 'Éditeur introuvable' } });
  }

  const slug = slugify(titreDiminutif ?? titre);

  let uploadResult;

  try {
    uploadResult = await uploadImageToCloudinary(req.file.buffer, `Series/${slug}`);
  }
  catch (error) {
    console.error('Échec de l\'upload Cloudinary:', error);
    return next(new Error('Échec de l\'upload de la couverture'));
  }

  try {
    const serie = await prisma.$transaction(async (tx) => {
      const createdSerie = await tx.serie.create({
        data: {
          titre,
          synopsis,
          statut,
          dateDebutPublicationFr: dateDebutPublicationFr ?? null,
          couvertureUrl: uploadResult.url,
          editeurId,
        },
      });

      if (titreDiminutif) {
        await tx.titreAlternatif.create({
          data: {
            serieId: createdSerie.id,
            titre: titreDiminutif,
            type: 'diminutif',
          },
        });
      }

      return createdSerie;
    });

    return res.status(201).json({ data: serie });
  }
  catch (error) {
    try {
      await cloudinary.uploader.destroy(uploadResult.publicId);
    }
    catch (rollbackError) {
      console.error('Échec du rollback Cloudinary pour', uploadResult.publicId, rollbackError);
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: { message: 'Une série avec ce titre existe déjà' } });
    }

    console.error('Échec de la création de la série:', error);
    return next(error);
  }
}