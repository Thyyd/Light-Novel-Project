import prisma from '../../db/client.js';
import { createSerieBodySchema, getSeriesQuerySchema, getDetailedSerieParamsSchema, getDetailedSerieQuerySchema } from '../validators/series.validator.js';
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

export async function getSeries(req, res, next) {
  const parseResult = getSeriesQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({
      error: {
        message: 'Paramètres invalides',
        details: parseResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const { page, limit } = parseResult.data;
  const skip = (page - 1) * limit;

  try {
    const [series, totalItems] = await Promise.all([
      prisma.serie.findMany({
        skip,
        take: limit,
        orderBy: { titre: 'asc' },
        include: {
          genres: {
            take: 3,
            include: { genre: true },
          },
          auteurs: {
            take: 1,
            include: { auteur: true },
          },
        },
      }),
      prisma.serie.count(),
    ]);

    const serieIds = series.map((serie) => serie.id);

    const moyennes = await prisma.note.groupBy({
      by: ['serieId'],
      where: {
        serieId: { in: serieIds },
        volumeId: null,
      },
      _avg: { note: true },
    });

    const moyennesParSerie = new Map(
      moyennes.map((moyenne) => [moyenne.serieId, moyenne._avg.note]),
    );

    const data = series.map((serie) => {
      const moyenneBrute = moyennesParSerie.get(serie.id);

      return {
        id: serie.id,
        titre: serie.titre,
        couvertureUrl: serie.couvertureUrl,
        auteur: serie.auteurs[0]
          ? `${serie.auteurs[0].auteur.nom} ${serie.auteurs[0].auteur.prenom}`
          : null,
        genres: serie.genres.map((sg) => sg.genre.nom),
        noteMoyenne: moyenneBrute != null ? Math.round(moyenneBrute * 10) / 10 : null,
        statut: serie.statut,
      };
    });

    return res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  }
  catch (error) {
    console.error('Échec de la récupération des séries:', error);
    return next(error);
  }
}

export async function getSerieDetails(req, res, next) {
  const paramsResult = getDetailedSerieParamsSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      error: {
        message: 'Paramètres invalides',
        details: paramsResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const queryResult = getDetailedSerieQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    return res.status(400).json({
      error: {
        message: 'Paramètres invalides',
        details: queryResult.error.issues.map((issue) => issue.message),
      },
    });
  }

  const { id } = paramsResult.data;
  const { commentPage, commentLimit } = queryResult.data;
  const commentSkip = (commentPage - 1) * commentLimit;

  try {
    const serie = await prisma.serie.findUnique({
      where: { id },
      include: {
        editeur: { select: { nom: true } },
        genres: { include: { genre: true } },
        themes: { include: { theme: true } },
        auteurs: { include: { auteur: true } },
        illustrateurs: { include: { illustrateur: true } },
        titresAlternatifs: {
          where: { type: { in: ['anglais', 'romaji'] } },
        },
        volumes: {
          orderBy: { numeroVolume: 'asc' },
          select: { id: true, numeroVolume: true, couvertureUrl: true },
        },
      },
    });

    if (!serie) {
      return res.status(404).json({ error: { message: 'Série introuvable' } });
    }

    const [moyenneResult, commentaires, totalCommentaires] = await Promise.all([
      prisma.note.aggregate({
        where: { serieId: id, volumeId: null },
        _avg: { note: true },
      }),
      prisma.commentaire.findMany({
        where: { serieId: id, volumeId: null },
        orderBy: { createdAt: 'asc' },
        skip: commentSkip,
        take: commentLimit,
        include: {
          utilisateur: { select: { pseudo: true, avatarUrl: true } },
        },
      }),
      prisma.commentaire.count({
        where: { serieId: id, volumeId: null },
      }),
    ]);

    const moyenneBrute = moyenneResult._avg.note;

    const data = {
      id: serie.id,
      titre: serie.titre,
      titresAlternatifs: serie.titresAlternatifs.map((ta) => ({
        titre: ta.titre,
        type: ta.type,
      })),
      noteMoyenne: moyenneBrute != null ? Math.round(moyenneBrute * 10) / 10 : null,
      genres: serie.genres.map((sg) => sg.genre.nom),
      themes: serie.themes.map((st) => st.theme.nom),
      couvertureUrl: serie.couvertureUrl,
      auteurs: serie.auteurs.map((sa) => `${sa.auteur.nom} ${sa.auteur.prenom}`),
      illustrateurs: serie.illustrateurs.map((si) => `${si.illustrateur.nom} ${si.illustrateur.prenom}`),
      editeur: { nom: serie.editeur.nom },
      statut: serie.statut,
      synopsis: serie.synopsis,
      volumes: serie.volumes,
      commentaires: {
        data: commentaires.map((c) => ({
          id: c.id,
          contenu: c.contenu,
          utilisateur: {
            pseudo: c.utilisateur.pseudo,
            avatarUrl: c.utilisateur.avatarUrl,
          },
        })),
        pagination: {
          page: commentPage,
          limit: commentLimit,
          totalItems: totalCommentaires,
          totalPages: Math.ceil(totalCommentaires / commentLimit),
        },
      },
    };

    return res.status(200).json({ data });
  }
  catch (error) {
    console.error('Échec de la récupération des détails de la série:', error);
    return next(error);
  }
}
