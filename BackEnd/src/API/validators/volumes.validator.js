import { z } from 'zod';

const emptyStringToUndefined = (val) => (val === '' ? undefined : val);

export const createVolumeBodySchema = z.object({
  numeroVolume: z.coerce
    .number({ error: 'Le numéro de volume doit être un nombre' })
    .min(0, 'Le numéro de volume ne peut pas être négatif')
    .max(999.9, 'Le numéro de volume ne peut pas dépasser 999.9')
    .refine(
      (val) => {
        const decimalPart = val.toString().split('.')[1];
        return decimalPart === undefined || decimalPart.length <= 1;
      },
      'Le numéro de volume ne peut avoir qu\'une seule décimale (ex: 1, 2.5)'
    ),

  titre: z
    .string({ required_error: 'Le titre du volume est obligatoire' })
    .min(1, 'Le titre du volume est obligatoire')
    .max(150, 'Le titre du volume ne peut pas dépasser 150 caractères'),

  synopsis: z
    .string({ required_error: 'Le synopsis est obligatoire' })
    .min(10, 'Le synopsis doit contenir au moins 10 caractères'),

  nbPages: z.coerce
    .number({ error: 'Le nombre de pages doit être un nombre' })
    .int('Le nombre de pages doit être un entier')
    .positive('Le nombre de pages doit être positif')
    .max(1000, 'Le nombre de pages ne peut pas dépasser 1000'),

  isbn: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .transform((val) => val.replace(/[- ]/g, ''))
      .refine(
        (val) => /^(?:\d{9}[\dX]|\d{13})$/i.test(val),
        'Format ISBN invalide (ISBN-10 ou ISBN-13 attendu)'
      )
      .optional()
  ),

  dateSortie: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .date({ error: 'Date de sortie invalide' })
      .optional()
  ),
});