import { z } from 'zod';

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
    (val) => (val === '' ? undefined : val),
    z.string()
      .trim()
      .min(1, { error: 'Le titre diminutif ne peut pas être vide' })
      .max(50, { error: 'Le titre diminutif ne peut pas dépasser 50 caractères' })
      .optional(),
  )
});
