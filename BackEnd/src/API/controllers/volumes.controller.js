import prisma from '../../db/client.js';
import { createVolumeBodySchema } from '../validators/volumes.validator.js';
import { getSerieSlug } from '../../utils/getSerieSlug.js';
import { uploadImageToCloudinary } from '../../utils/uploadImage.js';
import cloudinary from '../../config/cloudinary.js';

export async function createVolume(req, res, next) {
  const serieId = Number(req.params.id);

  if (!Number.isInteger(serieId) || serieId <= 0) {
    return res.status(400).json({ error: { message: 'Identifiant de série invalide' } });
  }

  if (!req.file) {
    return res.status(400).json({ error: { message: 'La couverture du volume est obligatoire' } });
  }

  const parseResult = createVolumeBodySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: {
        message: 'Données invalides',
        details: parseResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const { numeroVolume, titre, synopsis, nbPages, isbn, dateSortie } = parseResult.data;

  const serie = await prisma.serie.findUnique({ where: { id: serieId } });

  if (!serie) {
    return res.status(404).json({ error: { message: 'Série introuvable' } });
  }

  // Anti-doublon en amont (avant upload Cloudinary, pour éviter un upload inutile)
  const existingVolume = await prisma.volume.findFirst({
    where: { serieId, numeroVolume },
  });

  if (existingVolume) {
    return res.status(409).json({ error: { message: 'Ce numéro de volume existe déjà pour cette série' } });
  }

  if (isbn) {
    const existingIsbn = await prisma.volume.findUnique({ where: { isbn } });

    if (existingIsbn) {
      return res.status(409).json({ error: { message: 'Cet ISBN est déjà utilisé' } });
    }
  }

  const slug = await getSerieSlug(prisma, serie);

  let uploadResult;

  try {
    uploadResult = await uploadImageToCloudinary(req.file.buffer, `Series/${slug}/volumes`);
  }
  catch (error) {
    console.error("Échec de l'upload Cloudinary:", error);
    return next(new Error("Échec de l'upload de la couverture"));
  }

  try {
    const volume = await prisma.volume.create({
      data: {
        serieId,
        numeroVolume,
        titre,
        synopsis,
        nbPages,
        isbn: isbn ?? null,
        dateSortie: dateSortie ?? null,
        couvertureUrl: uploadResult.url,
      },
    });

    return res.status(201).json({ data: volume });
  }
  catch (error) {
    try {
      await cloudinary.uploader.destroy(uploadResult.publicId);
    }
    catch (rollbackError) {
      console.error('Échec du rollback Cloudinary pour', uploadResult.publicId, rollbackError);
    }

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const message = field === 'isbn'
        ? 'Cet ISBN est déjà utilisé'
        : 'Ce numéro de volume existe déjà pour cette série';

      return res.status(409).json({ error: { message } });
    }

    console.error('Échec de la création du volume:', error);
    return next(error);
  }
}