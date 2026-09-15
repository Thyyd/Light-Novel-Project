import { z } from 'zod';

export const pseudoSchema = z.string()
  .trim()
  .min(3, { error: 'Le pseudo doit contenir au moins 3 caractères' })
  .max(20, { error: 'Le pseudo ne peut pas dépasser 20 caractères' })
  .regex(/^[A-Za-z0-9 @\-_']+$/, { error: 'Le pseudo contient des caractères non autorisés' });

export const registerBodySchema = z.object({
  pseudo: pseudoSchema,
});