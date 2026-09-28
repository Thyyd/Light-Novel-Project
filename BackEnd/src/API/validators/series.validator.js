import { z } from 'zod';

const emptyStringToUndefined = (val) => (val === '' ? undefined : val);
const STATUTS = ['en_cours', 'termine', 'en_pause', 'abandonne'];

export const createSerieBodySchema = z.object({
  titre: z.string()
    .trim()
    .min(1, { error: 'Le titre est obligatoire' })
    .max(150, { error: 'Le titre ne peut pas dépasser 150 caractères' }),

  synopsis: z.string()
    .trim()
    .min(1, { error: 'Le synopsis est obligatoire' }),

  statut: z.enum(STATUTS, { error: 'Statut invalide' }),

  dateDebutPublicationFr: z.string()
    .date('Date invalide (format attendu : AAAA-MM-JJ)')
    .transform((val) => new Date(val))
    .optional(),

  editeurId: z.coerce.number()
    .int({ error: 'editeurId doit être un entier' })
    .positive({ error: 'editeurId doit être positif' }),

  titreDiminutif: z.preprocess(
    emptyStringToUndefined,
    z.string()
      .trim()
      .min(1, { error: 'Le titre diminutif ne peut pas être vide' })
      .max(50, { error: 'Le titre diminutif ne peut pas dépasser 50 caractères' })
      .optional(),
  )
});

export const getSeriesQuerySchema = z.object({
  page: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number({ error: 'page doit être un entier' })
      .int({ error: 'page doit être un entier' })
      .positive({ error: 'page doit être positif' })
      .default(1),
  ),

  limit: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number({ error: 'limit doit être un entier' })
      .int({ error: 'limit doit être un entier' })
      .positive({ error: 'limit doit être positif' })
      .max(20, { error: 'limit ne peut pas dépasser 20' })
      .default(12),
  ),
});

export const getDetailedSerieParamsSchema = z.object({
  id: z.coerce.number({ error: 'id doit être un entier' })
    .int({ error: 'id doit être un entier' })
    .positive({ error: 'id doit être positif' }),
});

export const getDetailedSerieQuerySchema = z.object({
  commentPage: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number({ error: 'commentPage doit être un entier' })
      .int({ error: 'commentPage doit être un entier' })
      .positive({ error: 'commentPage doit être positif' })
      .default(1),
  ),

  commentLimit: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number({ error: 'commentLimit doit être un entier' })
      .int({ error: 'commentLimit doit être un entier' })
      .positive({ error: 'commentLimit doit être positif' })
      .max(20, { error: 'commentLimit ne peut pas dépasser 20' })
      .default(10),
  ),
});
